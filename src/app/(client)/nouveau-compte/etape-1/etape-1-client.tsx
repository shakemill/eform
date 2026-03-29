"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/forms/StepIndicator";
import { IdentiteForm, type IdentiteFormState } from "@/components/forms/IdentiteForm";
import { AutoSaveIndicator } from "@/components/shared/AutoSaveIndicator";
import { Skeleton } from "@/components/ui/skeleton";

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

export function Etape1Client({ demandeId }: { demandeId: string }) {
  const router = useRouter();
  const [initial, setInitial] = useState<Partial<IdentiteFormState> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/demandes/public/${demandeId}`);
        const j = await r.json();
        if (!r.ok) throw new Error();
        const d = j.data as Record<string, unknown>;
        setInitial({
          nom: (d.nom as string) ?? "",
          prenom: (d.prenom as string) ?? "",
          dateNaissance: isoToDateInput(d.dateNaissance as string),
          lieuNaissance: (d.lieuNaissance as string) ?? "",
          nationalite: (d.nationalite as string) ?? "",
          numeroPiece: (d.numeroPiece as string) ?? "",
          typePiece: (d.typePiece as string) ?? "",
          dateExpiration: isoToDateInput(d.dateExpiration as string),
          sexe: (d.sexe as string) ?? "",
          profession: (d.profession as string) ?? "",
          adresse: (d.adresse as string) ?? "",
          email: (d.email as string) ?? "",
          telephone: (d.telephone as string) ?? "",
          pieceIdentiteUrl: (d.pieceIdentiteUrl as string) ?? "",
        });
      } catch {
        setInitial({});
      } finally {
        setLoading(false);
      }
    })();
  }, [demandeId]);

  if (loading || !initial) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={1} />
      <AutoSaveIndicator demandeId={demandeId} />
      <IdentiteForm
        demandeId={demandeId}
        initial={initial}
        onNext={() =>
          router.push(`/nouveau-compte/etape-2?demandeId=${demandeId}`)
        }
      />
    </>
  );
}
