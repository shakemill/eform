"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/forms/StepIndicator";
import { CompteForm } from "@/components/forms/CompteForm";
import { AutoSaveIndicator } from "@/components/shared/AutoSaveIndicator";
import { Skeleton } from "@/components/ui/skeleton";

export function Etape2Client({ demandeId }: { demandeId: string }) {
  const router = useRouter();
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/demandes/public/${demandeId}`);
        const j = await r.json();
        if (!r.ok) throw new Error();
        setRow(j.data as Record<string, unknown>);
      } catch {
        setRow({});
      } finally {
        setLoading(false);
      }
    })();
  }, [demandeId]);

  if (loading || row === null) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={2} />
      <h1 className="mb-2 text-xl font-semibold">Compte souhaité</h1>
      <AutoSaveIndicator demandeId={demandeId} />
      <CompteForm
        demandeId={demandeId}
        initialRow={row}
        onNext={() =>
          router.push(`/nouveau-compte/recapitulatif?demandeId=${demandeId}`)
        }
        onBack={() =>
          router.push(`/nouveau-compte/etape-1?demandeId=${demandeId}`)
        }
      />
    </>
  );
}
