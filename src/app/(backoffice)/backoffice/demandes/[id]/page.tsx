import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DemandeDetail } from "@/components/backoffice/DemandeDetail";

export const dynamic = "force-dynamic";

export default async function DemandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.demandeCompte.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/backoffice/dashboard"
        className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground"
      >
        ← Retour au tableau de bord
      </Link>
      <DemandeDetail initial={row} />
    </div>
  );
}
