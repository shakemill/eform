"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="mb-4 text-lg font-medium">Étape 1 — erreur</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Impossible de charger le formulaire. Réessayez.
      </p>
      <Button type="button" onClick={reset}>
        Réessayer
      </Button>
    </main>
  );
}
