import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyQrSchema } from "@/types/demande";
import { logger } from "@/lib/logger";

/**
 * POST — verify QR payload `{ demandeId, token }` matches stored token.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const rawPayload =
    typeof body === "object" && body !== null && "raw" in body
      ? String((body as { raw: unknown }).raw)
      : null;

  let demandeId: string;
  let token: string;
  if (rawPayload) {
    try {
      const parsed = JSON.parse(rawPayload) as { demandeId?: string; token?: string };
      const v = verifyQrSchema.safeParse(parsed);
      if (!v.success) {
        return NextResponse.json({ error: "QR invalide" }, { status: 400 });
      }
      demandeId = v.data.demandeId;
      token = v.data.token;
    } catch {
      return NextResponse.json({ error: "QR illisible" }, { status: 400 });
    }
  } else {
    const v = verifyQrSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json({ error: "Validation" }, { status: 400 });
    }
    demandeId = v.data.demandeId;
    token = v.data.token;
  }

  try {
    const row = await prisma.demandeCompte.findUnique({
      where: { id: demandeId },
    });
    if (!row || row.qrCodeToken !== token) {
      return NextResponse.json({ error: "Jeton invalide" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, demandeId: row.id });
  } catch (e) {
    logger.error({ err: e }, "verify QR");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
