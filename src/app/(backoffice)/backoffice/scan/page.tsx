import { QRScanner } from "@/components/backoffice/QRScanner";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-[#00577a]/15 bg-card p-5 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-[#00577a]">Scanner QR en agence</h1>
      <p className="text-sm text-muted-foreground">
        Scannez le QR du client pour ouvrir instantanément son dossier et vérifier
        le jeton en base.
      </p>
      <QRScanner />
    </div>
  );
}
