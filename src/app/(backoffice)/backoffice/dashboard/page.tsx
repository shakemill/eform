import { prisma } from "@/lib/prisma";
import { Statut } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, FileX2, FolderKanban } from "lucide-react";

export const dynamic = "force-dynamic";
import { DemandesTable } from "@/components/backoffice/DemandesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function kpi() {
  const [total, enAttente, validee, rejetee, enCours] = await Promise.all([
    prisma.demandeCompte.count(),
    prisma.demandeCompte.count({ where: { statut: Statut.EN_ATTENTE } }),
    prisma.demandeCompte.count({ where: { statut: Statut.VALIDEE } }),
    prisma.demandeCompte.count({ where: { statut: Statut.REJETEE } }),
    prisma.demandeCompte.count({
      where: { statut: Statut.EN_COURS_TRAITEMENT },
    }),
  ]);
  return { total, enAttente, validee, rejetee, enCours };
}

export default async function DashboardPage() {
  const { total, enAttente, validee, rejetee, enCours } = await kpi();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#00577a]/20 bg-gradient-to-r from-[#00577a]/10 via-[#00577a]/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#00577a]/80">
              Backoffice Ecobank
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#00577a]">Tableau de bord</h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Suivi des demandes clients, priorisation des dossiers et traitement rapide.
            </p>
          </div>
          <Link
            href="/backoffice/scan"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Scanner un QR code
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-[#00577a]/20 bg-[#00577a]/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-muted-foreground">
              <FolderKanban className="h-4 w-4 text-[#00577a]" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold text-[#00577a]">{total}</CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-amber-900">
              <Clock3 className="h-4 w-4 text-amber-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold text-amber-700">{enAttente}</CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-sky-900">
              <FileCheck2 className="h-4 w-4 text-sky-600" />
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold text-sky-700">{enCours}</CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Validées
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold text-emerald-700">{validee}</CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-rose-900">
              <FileX2 className="h-4 w-4 text-rose-600" />
              Rejetées
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold text-rose-700">{rejetee}</CardContent>
        </Card>
      </div>

      <section className="rounded-2xl border border-[#00577a]/15 bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[#00577a]">Demandes</h2>
          <span className="rounded-full bg-[#00577a]/10 px-3 py-1 text-sm font-bold text-[#00577a]">
            {total} dossiers
          </span>
        </div>
        <DemandesTable />
      </section>
    </div>
  );
}
