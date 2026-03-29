import { NouveauCompteClient } from "./nouveau-compte-client";

export default function NouveauComptePage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:py-12">
      <div className="rounded-2xl border border-[#00577a]/15 bg-card p-5 shadow-sm sm:p-7">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#00577a]">
          Nouvelle demande de compte
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Nous enverrons les instructions à l’adresse indiquée. Vous pourrez
          reprendre un brouillon à tout moment.
        </p>
        <NouveauCompteClient />
      </div>
    </main>
  );
}
