"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/forms/StepIndicator";
import { RecapitulatifCard } from "@/components/forms/RecapitulatifCard";
import { AutoSaveIndicator } from "@/components/shared/AutoSaveIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { TypeCompte } from "@prisma/client";

type Row = {
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  typeCompte: TypeCompte | null;
  devise: string | null;
  montantInitial: unknown;
  modeAlimentation: string | null;
  carteBancaire: boolean | null;
  decouvert: boolean | null;
};

export function RecapClient({ demandeId }: { demandeId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/demandes/public/${demandeId}`);
        const j = await r.json();
        if (!r.ok) throw new Error();
        setData(j.data as Row);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [demandeId]);

  async function onSubmit() {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/qrcode/${demandeId}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.error ?? "Soumission échouée");
      }
      toast.success("Demande envoyée — consultez votre email.");
      router.push(`/nouveau-compte/confirmation?demandeId=${demandeId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={3} />
      <AutoSaveIndicator demandeId={demandeId} />
      <RecapitulatifCard
        data={data}
        loading={submitting}
        onSubmit={onSubmit}
        onBack={() =>
          router.push(`/nouveau-compte/etape-2?demandeId=${demandeId}`)
        }
      />
    </>
  );
}
