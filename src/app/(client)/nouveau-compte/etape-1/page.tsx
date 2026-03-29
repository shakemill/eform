import { redirect } from "next/navigation";
import Link from "next/link";
import { Etape1Client } from "./etape-1-client";

export default function Etape1Page({
  searchParams,
}: {
  searchParams: { demandeId?: string };
}) {
  if (!searchParams.demandeId) redirect("/nouveau-compte");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <Link
        href="/nouveau-compte"
        className="mb-3 inline-flex text-sm text-[#00577a] hover:underline"
      >
        ← Changer d’email
      </Link>
      <div className="rounded-2xl border border-[#00577a]/10 bg-card p-4 shadow-sm sm:p-6">
        <Etape1Client demandeId={searchParams.demandeId} />
      </div>
    </main>
  );
}
