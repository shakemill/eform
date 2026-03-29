import { redirect } from "next/navigation";
import Link from "next/link";
import { RecapClient } from "./recap-client";

export default function RecapPage({
  searchParams,
}: {
  searchParams: { demandeId?: string };
}) {
  if (!searchParams.demandeId) redirect("/nouveau-compte");
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-10">
      <Link
        href={`/nouveau-compte/etape-2?demandeId=${searchParams.demandeId}`}
        className="mb-3 inline-flex text-sm text-[#00577a] hover:underline"
      >
        ← Modifier le compte
      </Link>
      <div className="rounded-2xl border border-[#00577a]/10 bg-card p-4 shadow-sm sm:p-6">
        <RecapClient demandeId={searchParams.demandeId} />
      </div>
    </main>
  );
}
