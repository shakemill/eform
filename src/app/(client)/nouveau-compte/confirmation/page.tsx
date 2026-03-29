import { redirect } from "next/navigation";
import { ConfirmClient } from "./confirm-client";

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { demandeId?: string };
}) {
  if (!searchParams.demandeId) redirect("/nouveau-compte");
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 text-center">
      <div className="rounded-2xl border border-[#00577a]/10 bg-card p-5 shadow-sm sm:p-8">
        <ConfirmClient demandeId={searchParams.demandeId} />
      </div>
    </main>
  );
}
