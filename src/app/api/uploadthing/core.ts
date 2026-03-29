import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const f = createUploadthing();

/**
 * UploadThing file router — identity document image linked to `DemandeCompte`.
 */
export const ourFileRouter = {
  pieceIdentite: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .input(z.object({ demandeId: z.string().min(1) }))
    .middleware(async ({ input }) => {
      return { demandeId: input.demandeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await prisma.demandeCompte.update({
          where: { id: metadata.demandeId },
          data: { pieceIdentiteUrl: file.url },
        });
      } catch (e) {
        logger.error({ err: e, demandeId: metadata.demandeId }, "uploadthing onUploadComplete");
      }
      return { uploadedBy: metadata.demandeId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
