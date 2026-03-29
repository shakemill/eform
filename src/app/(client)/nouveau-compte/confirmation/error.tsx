"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="mb-4 text-lg font-medium">Confirmation — erreur</h1>
      <Button type="button" onClick={reset}>
        Réessayer
      </Button>
    </main>
  );
}
