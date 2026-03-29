"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { labelFromTypeCompte } from "@/types/demande";
import type { BanquierAction } from "@/types/demande";
import type { DemandeCompte, Statut, TypeCompte } from "@prisma/client";
import { toast } from "sonner";

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function formatDateTime(value: unknown): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

/**
 * Banker detail view with optimistic status updates.
 */
export function DemandeDetail({ initial }: { initial: DemandeCompte }) {
  const [row, setRow] = useState(initial);
  const [motif, setMotif] = useState("");
  const [complementMsg, setComplementMsg] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showComp, setShowComp] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pieceUrl = row.pieceIdentiteUrl;

  async function act(action: BanquierAction) {
    startTransition(async () => {
      const prev = row.statut;
      const optimistic: Partial<DemandeCompte> =
        action.type === "VALIDER"
          ? { statut: "VALIDEE" as Statut }
          : action.type === "REJETER"
            ? { statut: "REJETEE" as Statut }
            : action.type === "COMPLEMENT"
              ? { statut: "COMPLEMENT_REQUIS" as Statut }
              : { statut: "EN_COURS_TRAITEMENT" as Statut };
      setRow((r) => ({ ...r, ...optimistic }));

      const r = await fetch(`/api/demandes/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const j = await r.json();
      if (!r.ok) {
        setRow((x) => ({ ...x, statut: prev }));
        toast.error(j.error ?? "Action refusée");
        return;
      }
      setRow(j.data as DemandeCompte);
      setShowReject(false);
      setShowComp(false);
      toast.success("Mise à jour enregistrée");
    });
  }

  const timeline = useMemo(
    () => [
      { label: "Création", at: row.createdAt },
      { label: "Soumission", at: row.soumisAt },
      { label: "Traité", at: row.traiteAt },
    ],
    [row.createdAt, row.soumisAt, row.traiteAt],
  );

  return (
    <div className="space-y-8 print:block">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {row.prenom} {row.nom}
          </h1>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
        <Badge variant="secondary">{row.statut}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Né(e) : {formatDate(row.dateNaissance)}</p>
            <p>Lieu : {row.lieuNaissance ?? "—"}</p>
            <p>Nationalité : {row.nationalite ?? "—"}</p>
            <p>
              Pièce : {row.typePiece ?? "—"} — {row.numeroPiece ?? "—"}
            </p>
            <p>Téléphone : {row.telephone ?? "—"}</p>
            <p className="whitespace-pre-wrap">Adresse : {row.adresse ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pièce d’identité</CardTitle>
          </CardHeader>
          <CardContent>
            {pieceUrl && pieceUrl.startsWith("http") ? (
              <div className="max-h-[480px] overflow-auto rounded-md border bg-muted p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pieceUrl}
                  alt="Pièce d’identité"
                  className="mx-auto max-h-[400px] w-auto object-contain"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun fichier</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compte souhaité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            Type :{" "}
            {row.typeCompte ? labelFromTypeCompte(row.typeCompte as TypeCompte) : "—"}
          </p>
          <p>Devise : {row.devise ?? "—"}</p>
          <p>Montant initial : {row.montantInitial?.toString() ?? "—"}</p>
          <p>Alimentation : {row.modeAlimentation ?? "—"}</p>
          <p>PPE : {row.kycPep ? "Oui" : "Non"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chronologie</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {timeline.map((t) => (
              <li key={t.label}>
                <span className="font-medium">{t.label}</span>
                {t.at ? (
                  <span className="text-muted-foreground"> — {formatDateTime(t.at)}</span>
                ) : (
                  <span className="text-muted-foreground"> — —</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Actions banquier</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            onClick={() => void act({ type: "EN_COURS" })}
          >
            En traitement
          </Button>
          <Button
            disabled={isPending}
            onClick={() => void act({ type: "VALIDER" })}
          >
            Valider
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => setShowReject(true)}
          >
            Rejeter
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setShowComp(true)}
          >
            Complément
          </Button>
          <Button variant="outline" type="button" onClick={() => window.print()}>
            Imprimer / PDF
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Motif du rejet</DialogTitle>
          </DialogHeader>
          <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={4} />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={!motif.trim() || isPending}
              onClick={() => void act({ type: "REJETER", motif })}
            >
              Confirmer rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showComp} onOpenChange={setShowComp}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Message pour le client</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="comp">Complément requis</Label>
            <Textarea
              id="comp"
              value={complementMsg}
              onChange={(e) => setComplementMsg(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!complementMsg.trim() || isPending}
              onClick={() => void act({ type: "COMPLEMENT", message: complementMsg })}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
