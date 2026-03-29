"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Webcam QR scan: verify payload server-side then open demand detail.
 */
export function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [active, setActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      readerRef.current = null;
    };
  }, []);

  async function start() {
    if (!videoRef.current) return;
    setActive(true);
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, err) => {
          if (err) return;
          if (!result) return;
          const text = result.getText();
          let parsed: { demandeId?: string; token?: string };
          try {
            parsed = JSON.parse(text) as { demandeId?: string; token?: string };
          } catch {
            toast.error("QR non reconnu");
            return;
          }
          const verify = await fetch("/api/demandes/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
          const j = await verify.json();
          if (!verify.ok) {
            toast.error(j.error ?? "Vérification échouée");
            return;
          }
          controls.stop();
          controlsRef.current = null;
          setActive(false);
          toast.success("QR valide");
          router.push(`/backoffice/demandes/${j.demandeId}`);
        },
      );
      controlsRef.current = controls;
    } catch {
      toast.error("Caméra inaccessible");
      setActive(false);
    }
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    setActive(false);
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border bg-black">
        <video ref={videoRef} className="mx-auto h-72 w-full object-cover sm:h-80" muted playsInline />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] sm:h-56 sm:w-56">
            <div className="absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-[#00d084]" />
            <div className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-[#00d084]" />
            <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-[#00d084]" />
            <div className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-[#00d084]" />
            {active ? (
              <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 rounded bg-[#00d084] shadow-[0_0_12px_rgba(0,208,132,0.9)]" />
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => void start()} disabled={active}>
          Démarrer le scan
        </Button>
        <Button type="button" variant="outline" onClick={stop} disabled={!active}>
          Arrêter
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Autorisez la caméra puis placez le QR code à l&apos;intérieur du cadre central.
      </p>
    </div>
  );
}
