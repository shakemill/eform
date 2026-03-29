import Link from "next/link";
import { EcobankLogo } from "@/components/shared/EcobankLogo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center bg-gradient-to-b from-[#f3fbff] via-background to-background px-4 py-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#00577a]/20 bg-card/95 p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex justify-center sm:justify-start">
          <EcobankLogo priority />
        </div>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-[#00577a] sm:text-left sm:text-4xl">
          Digitalisation de l’ouverture de compte
        </h1>
        <p className="mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:text-left sm:text-base">
          Expérience client simple sur mobile, suivi des dossiers en temps réel et
          validation en agence via QR code.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/nouveau-compte"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Commencer une demande
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#00577a]/30 bg-background px-5 text-sm font-medium text-[#00577a] transition hover:bg-[#00577a]/5"
          >
            Espace banquier
          </Link>
        </div>
      </section>
    </main>
  );
}
