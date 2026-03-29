"use client";

import { useEffect, useRef } from "react";

export type AutoSavePayload = Record<string, unknown>;

/**
 * PATCH `/api/demandes` every 30s and mirror to `localStorage` for offline resilience.
 */
export function useAutoSave(
  demandeId: string | null,
  data: AutoSavePayload,
  enabled = true,
) {
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!demandeId || !enabled) return;

    const tick = async () => {
      const payload = { id: demandeId, ...dataRef.current, statut: "BROUILLON" };
      try {
        await fetch("/api/demandes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "demande_draft",
            JSON.stringify({ demandeId, ...dataRef.current }),
          );
        }
      } catch {
        /* ignore network errors; next interval retries */
      }
    };

    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [demandeId, enabled]);
}
