import { NextResponse } from "next/server";
import { Statut } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET — read draft demand for wizard (unauthenticated; id acts as secret).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const row = await prisma.demandeCompte.findFirst({
      where: {
        id,
        statut: { in: [Statut.BROUILLON, Statut.EN_ATTENTE] },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    const data = {
      ...row,
      montantInitial: row.montantInitial?.toString() ?? null,
    };
    return NextResponse.json({ data });
  } catch (e) {
    logger.error({ err: e, id }, "GET public demande");
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
