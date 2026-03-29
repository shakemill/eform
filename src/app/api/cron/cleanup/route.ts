import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Statut } from "@prisma/client";
import { logger } from "@/lib/logger";

/**
 * Stub cleanup job: delete old drafts and wipe ID URLs (extend with object storage delete).
 * Protect with `CRON_SECRET` header.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const cutoffDraft = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const cutoffFiles = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  try {
    const drafts = await prisma.demandeCompte.deleteMany({
      where: {
        statut: Statut.BROUILLON,
        updatedAt: { lt: cutoffDraft },
      },
    });
    const anonymized = await prisma.demandeCompte.updateMany({
      where: {
        updatedAt: { lt: cutoffFiles },
        pieceIdentiteUrl: { not: null },
      },
      data: { pieceIdentiteUrl: null },
    });
    return NextResponse.json({
      ok: true,
      deletedDrafts: drafts.count,
      clearedIdUrls: anonymized.count,
    });
  } catch (e) {
    logger.error({ err: e }, "cron cleanup");
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
}
