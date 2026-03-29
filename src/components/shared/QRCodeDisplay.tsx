"use client";

import { Button } from "@/components/ui/button";

type Props = {
  dataUrl: string;
  label?: string;
};

/**
 * Displays QR code from a data URL with download action.
 */
export function QRCodeDisplay({ dataUrl, label = "Télécharger le QR" }: Props) {
  function download() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-demande.png";
    a.click();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="QR code agence" className="h-64 w-64 object-contain" />
      </div>
      <Button type="button" variant="outline" onClick={download}>
        {label}
      </Button>
    </div>
  );
}
