import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Statut } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { banquierActionSchema } from "@/types/demande";
import { Resend } from "resend";
import { mailFromAddress, sendSmtpMail, smtpConfigured } from "@/lib/mailer";
import { UserRole } from "@prisma/client";

/**
 * GET — single demand (banker session required).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.BANQUIER) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const row = await prisma.demandeCompte.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (e) {
    logger.error({ err: e, id }, "GET /api/demandes/id");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH — banker workflow actions (validate, reject, request complement).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.BANQUIER) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = banquierActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const action = parsed.data;

  try {
    const existing = await prisma.demandeCompte.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    let update: {
      statut: Statut;
      motifRejet?: string | null;
      notes?: string | null;
      traiteAt?: Date;
      banquierId?: string;
    };

    switch (action.type) {
      case "VALIDER":
        update = { statut: Statut.VALIDEE, traiteAt: new Date(), banquierId: session.user.id };
        break;
      case "REJETER":
        update = {
          statut: Statut.REJETEE,
          motifRejet: action.motif,
          traiteAt: new Date(),
          banquierId: session.user.id,
        };
        break;
      case "COMPLEMENT":
        update = {
          statut: Statut.COMPLEMENT_REQUIS,
          notes: action.message,
          banquierId: session.user.id,
        };
        break;
      case "EN_COURS":
        update = { statut: Statut.EN_COURS_TRAITEMENT, banquierId: session.user.id };
        break;
    }

    const row = await prisma.demandeCompte.update({
      where: { id },
      data: update,
    });

    const email = existing.email;
    const resendKey = process.env.RESEND_API_KEY;
    if (
      email &&
      (action.type === "REJETER" || action.type === "COMPLEMENT")
    ) {
      const subject =
        action.type === "REJETER"
          ? "Mise à jour de votre demande — rejet"
          : "Complément requis pour votre demande";
      const html =
        action.type === "REJETER"
          ? `<p>Bonjour,</p><p>Votre demande a été rejetée.</p><p><strong>Motif :</strong> ${action.motif}</p>`
          : `<p>Bonjour,</p><p>Un complément est nécessaire pour traiter votre demande :</p><p>${action.message}</p>`;
      const from = smtpConfigured()
        ? mailFromAddress()
        : (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev");

      if (smtpConfigured()) {
        await sendSmtpMail({ from, to: email, subject, html }).catch((e) => {
          logger.error({ err: e }, "banker notification email (smtp)");
        });
      } else if (resendKey) {
        const resend = new Resend(resendKey);
        await resend.emails.send({ from, to: email, subject, html }).catch((e) => {
          logger.error({ err: e }, "banker notification email");
        });
      }
    }

    return NextResponse.json({ data: row });
  } catch (e) {
    logger.error({ err: e, id }, "PATCH /api/demandes/id");
    return NextResponse.json({ error: "Action impossible" }, { status: 400 });
  }
}
