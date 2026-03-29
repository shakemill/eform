import { NextRequest, NextResponse } from "next/server";
import { Statut } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateQRCode } from "@/lib/qrcode";
import { sendDemandeQrEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { labelFromTypeCompte } from "@/types/demande";

function assertReadyForSubmit(d: {
  nom: string | null;
  prenom: string | null;
  email: string | null;
  typeCompte: unknown;
  devise: string | null;
}): string | null {
  if (!d.email) return "Email requis";
  if (!d.nom || !d.prenom) return "Identité incomplète";
  if (!d.typeCompte) return "Type de compte requis";
  if (!d.devise) return "Devise requise";
  return null;
}

/**
 * POST — finalize submission: set pending status, generate QR, email applicant.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const demande = await prisma.demandeCompte.findUnique({ where: { id } });
    if (!demande) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const err = assertReadyForSubmit(demande);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }

    if (demande.statut !== Statut.BROUILLON && demande.statut !== Statut.EN_ATTENTE) {
      return NextResponse.json({ error: "Statut incompatible avec la soumission" }, { status: 400 });
    }

    const nom = demande.nom ?? "";
    const prenom = demande.prenom ?? "";
    const email = demande.email ?? "";

    const { token, qrDataUrl } = await generateQRCode(id, nom, prenom, email);

    const row = await prisma.demandeCompte.update({
      where: { id },
      data: {
        statut: Statut.EN_ATTENTE,
        soumisAt: new Date(),
        qrCodeToken: token,
        qrCodeUrl: qrDataUrl,
        emailEnvoye: false,
      },
    });

    try {
      await sendDemandeQrEmail({
        to: email,
        qrDataUrl,
        prenom,
        nom,
        demandeId: id,
        typeCompteLabel: demande.typeCompte ? labelFromTypeCompte(demande.typeCompte) : "—",
        devise: demande.devise ?? "—",
        montantInitial: demande.montantInitial?.toString() ?? "—",
      });
      await prisma.demandeCompte.update({
        where: { id },
        data: { emailEnvoye: true },
      });
    } catch (e) {
      logger.error({ err: e }, "qrcode email failed");
      return NextResponse.json(
        { error: "QR généré mais envoi email échoué — vérifiez RESEND_API_KEY", data: row },
        { status: 502 },
      );
    }

    const updated = await prisma.demandeCompte.findUnique({ where: { id } });
    return NextResponse.json({ data: updated });
  } catch (e) {
    logger.error({ err: e, id }, "POST /api/qrcode/id");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
