"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUT_VALUES, labelFromTypeCompte } from "@/types/demande";
import type { DemandeCompte, TypeCompte } from "@prisma/client";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Row = DemandeCompte;

function statutBadgeClass(statut: string): string {
  if (statut === "EN_ATTENTE") return "bg-amber-100 text-amber-900 border-amber-200";
  if (statut === "EN_COURS_TRAITEMENT") return "bg-sky-100 text-sky-900 border-sky-200";
  if (statut === "VALIDEE") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (statut === "REJETEE") return "bg-rose-100 text-rose-900 border-rose-200";
  if (statut === "COMPLEMENT_REQUIS") return "bg-violet-100 text-violet-900 border-violet-200";
  return "bg-muted text-foreground border-border";
}

function toCsv(rows: Row[]): string {
  const headers = [
    "id",
    "nom",
    "prenom",
    "email",
    "statut",
    "typeCompte",
    "soumisAt",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h as keyof Row];
          const s = v == null ? "" : String(v).replaceAll('"', '""');
          return `"${s}"`;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

/**
 * Paginated demand list with filters and CSV export.
 */
export function DemandesTable() {
  const [data, setData] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [statut, setStatut] = useState<string>("");
  const [typeCompte, setTypeCompte] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: "soumisAt_desc",
      });
      if (statut) sp.set("statut", statut);
      if (typeCompte) sp.set("typeCompte", typeCompte);
      const r = await fetch(`/api/demandes?${sp}`);
      if (!r.ok) throw new Error("Chargement impossible");
      const j = await r.json();
      setData(j.data as Row[]);
      setTotal(j.total as number);
    } catch {
      toast.error("Liste non chargée");
    } finally {
      setLoading(false);
    }
  }, [page, statut, typeCompte]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demandes-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#00577a]/10 bg-[#00577a]/5 p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-[#00577a]">Statut</label>
          <Select
            value={statut || "__all"}
            onValueChange={(v) => {
              setStatut(v === "__all" || v == null ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tous</SelectItem>
              {STATUT_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-[#00577a]">Type compte</label>
          <Select
            value={typeCompte || "__all"}
            onValueChange={(v) => {
              setTypeCompte(v === "__all" || v == null ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tous</SelectItem>
              <SelectItem value="COURANT">Courant</SelectItem>
              <SelectItem value="EPARGNE">Épargne</SelectItem>
              <SelectItem value="ETUDIANT">Étudiant</SelectItem>
              <SelectItem value="PROFESSIONNEL">Professionnel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!data.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV (page)
        </Button>
      </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-extrabold">Réf.</TableHead>
              <TableHead className="font-extrabold">Nom</TableHead>
              <TableHead className="font-extrabold">Pièce</TableHead>
              <TableHead className="font-extrabold">Compte</TableHead>
              <TableHead className="font-extrabold">Soumission</TableHead>
              <TableHead className="font-extrabold">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucune demande
                </TableCell>
              </TableRow>
            ) : (
              data.map((r) => (
                <TableRow key={r.id} className="hover:bg-[#00577a]/5">
                  <TableCell className="font-mono text-sm font-bold">{r.id.slice(0, 8)}…</TableCell>
                  <TableCell className="font-semibold">
                    {r.prenom} {r.nom}
                  </TableCell>
                  <TableCell>{r.typePiece ?? "—"}</TableCell>
                  <TableCell>
                    {r.typeCompte ? labelFromTypeCompte(r.typeCompte as TypeCompte) : "—"}
                  </TableCell>
                  <TableCell>
                    {r.soumisAt
                      ? new Date(r.soumisAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-bold", statutBadgeClass(r.statut))}>
                      {r.statut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/backoffice/demandes/${r.id}`}
                      className={cn(buttonVariants({ variant: "link" }), "font-extrabold text-[#00577a]")}
                    >
                      Ouvrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-base">
        <span className="font-semibold text-muted-foreground">
          {total} demande(s) — page {page} / {pages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
