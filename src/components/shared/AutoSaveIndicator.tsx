"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff } from "lucide-react";

/**
 * Shows last autosave tick (local clock) for user reassurance.
 */
export function AutoSaveIndicator({ demandeId }: { demandeId: string | null }) {
  const [last, setLast] = useState<Date | null>(null);

  useEffect(() => {
    if (!demandeId) return;
    const t = setInterval(() => setLast(new Date()), 30_000);
    return () => clearInterval(t);
  }, [demandeId]);

  if (!demandeId) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
        Brouillon non initialisé
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Sauvegarde automatique toutes les 30s
      {last ? ` — dernier pointage ${last.toLocaleTimeString("fr-FR")}` : ""}
    </p>
  );
}
