"use client";

import { useEffect, useState } from "react";
import { StepIndicator } from "@/components/forms/StepIndicator";
import { QRCodeDisplay } from "@/components/shared/QRCodeDisplay";
import { Skeleton } from "@/components/ui/skeleton";

export function ConfirmClient({ demandeId }: { demandeId: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/demandes/public/${demandeId}`);
        const j = await r.json();
        const url = j.data?.qrCodeUrl as string | null;
        setQrUrl(url ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [demandeId]);

  return (
    <>
      <StepIndicator current={4} />
      <h1 className="mb-2 text-2xl font-semibold">Demande transmise</h1>
      <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
        Un email avec le même QR code vous a été envoyé. Présentez ce code à
        l’accueil de votre agence pour finaliser le dossier. Référence :{" "}
        <span className="font-mono text-foreground">{demandeId}</span>
      </p>
      {loading ? (
        <Skeleton className="mx-auto h-72 w-72" />
      ) : qrUrl ? (
        <QRCodeDisplay dataUrl={qrUrl} />
      ) : (
        <p className="text-sm text-muted-foreground">
          QR indisponible — ouvrez l’email de confirmation.
        </p>
      )}
    </>
  );
}
