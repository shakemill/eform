"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deviseToLabel, labelFromTypeCompte, modeToLabel } from "@/types/demande";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { TypeCompte } from "@prisma/client";

type Row = {
  id?: string;
  nom: string | null;
  prenom: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  nationalite?: string | null;
  numeroPiece?: string | null;
  typePiece?: string | null;
  dateExpiration?: string | null;
  sexe?: string | null;
  profession?: string | null;
  adresse?: string | null;
  email: string | null;
  telephone: string | null;
  pieceIdentiteUrl?: string | null;
  typeCompte: TypeCompte | null;
  devise: string | null;
  montantInitial: unknown;
  modeAlimentation: string | null;
  carteBancaire: boolean | null;
  typeCarte?: string | null;
  decouvert: boolean | null;
  servicesOptions?: unknown;
  beneficiaire?: unknown;
  kycPep?: boolean | null;
  kycSourceFonds?: string | null;
  kycObjetCompte?: string | null;
};

function fmt(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  return String(v);
}

function fmtDate(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("fr-FR");
}

const SERVICE_LABELS: Record<string, string> = {
  smsBanking: "SMS Banking",
  internetBanking: "Internet Banking",
  eStatement: "Relevé électronique (e-statement)",
};

/**
 * Affiche les services cochés en libellés (plus de JSON brut).
 */
function fmtServicesOptions(v: unknown): string {
  if (v == null || typeof v !== "object") return "—";
  const o = v as Record<string, boolean>;
  const selected = Object.entries(o)
    .filter(([, on]) => Boolean(on))
    .map(([k]) => SERVICE_LABELS[k] ?? k);
  return selected.length > 0 ? selected.join(" · ") : "Aucun service sélectionné";
}

/**
 * Affiche nom / lien / téléphone du bénéficiaire en une phrase lisible.
 */
function fmtBeneficiaire(v: unknown): string {
  if (v == null || typeof v !== "object") return "—";
  const o = v as { nom?: string; lien?: string; telephone?: string };
  const parts: string[] = [];
  if (o.nom?.trim()) parts.push(`Nom : ${o.nom.trim()}`);
  if (o.lien?.trim()) parts.push(`Lien de parenté : ${o.lien.trim()}`);
  if (o.telephone?.trim()) parts.push(`Téléphone : ${o.telephone.trim()}`);
  return parts.length > 0 ? parts.join(" — ") : "—";
}

/**
 * Read-only summary before final submission.
 */
export function RecapitulatifCard({
  data,
  loading,
  onSubmit,
  onBack,
}: {
  data: Row;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold text-[#00577a]">Récapitulatif</CardTitle>
        <CardDescription>
          Vérifiez vos informations avant d’envoyer la demande.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-base">
        <section className="rounded-xl border">
          <div className="border-b bg-[#00577a]/5 px-4 py-3">
            <h3 className="text-lg font-extrabold text-[#00577a]">Informations personnelles</h3>
          </div>
          <Table>
            <TableBody>
              <TableRow><TableCell className="font-bold">Nom</TableCell><TableCell>{fmt(data.nom)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Prénom(s)</TableCell><TableCell>{fmt(data.prenom)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Date de naissance</TableCell><TableCell>{fmtDate(data.dateNaissance)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Lieu de naissance</TableCell><TableCell>{fmt(data.lieuNaissance)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Sexe</TableCell><TableCell>{fmt(data.sexe)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Nationalité</TableCell><TableCell>{fmt(data.nationalite)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Profession</TableCell><TableCell>{fmt(data.profession)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Adresse</TableCell><TableCell>{fmt(data.adresse)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Email</TableCell><TableCell>{fmt(data.email)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Téléphone</TableCell><TableCell>{fmt(data.telephone)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </section>

        <section className="rounded-xl border">
          <div className="border-b bg-[#00577a]/5 px-4 py-3">
            <h3 className="text-lg font-extrabold text-[#00577a]">Pièce d&apos;identité</h3>
          </div>
          <Table>
            <TableBody>
              <TableRow><TableCell className="font-bold">Type de pièce</TableCell><TableCell>{fmt(data.typePiece)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Numéro de pièce</TableCell><TableCell>{fmt(data.numeroPiece)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Date d&apos;expiration</TableCell><TableCell>{fmtDate(data.dateExpiration)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Lien pièce jointe</TableCell><TableCell className="break-all">{fmt(data.pieceIdentiteUrl)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </section>

        <section className="rounded-xl border">
          <div className="border-b bg-[#00577a]/5 px-4 py-3">
            <h3 className="text-lg font-extrabold text-[#00577a]">Informations du compte</h3>
          </div>
          <Table>
            <TableBody>
              <TableRow><TableCell className="font-bold">Type de compte</TableCell><TableCell>{data.typeCompte ? labelFromTypeCompte(data.typeCompte) : "—"}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Devise</TableCell><TableCell>{data.devise ? deviseToLabel(data.devise) : "—"}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Dépôt initial</TableCell><TableCell>{fmt(data.montantInitial)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Mode d&apos;alimentation</TableCell><TableCell>{data.modeAlimentation ? modeToLabel(data.modeAlimentation) : "—"}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Carte bancaire</TableCell><TableCell>{fmt(data.carteBancaire)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Type de carte</TableCell><TableCell>{fmt(data.typeCarte)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Découvert</TableCell><TableCell>{fmt(data.decouvert)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Services</TableCell><TableCell>{fmtServicesOptions(data.servicesOptions)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Bénéficiaire</TableCell><TableCell>{fmtBeneficiaire(data.beneficiaire)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">PPE (KYC)</TableCell><TableCell>{fmt(data.kycPep)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Source des fonds</TableCell><TableCell>{fmt(data.kycSourceFonds)}</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Objet du compte</TableCell><TableCell>{fmt(data.kycObjetCompte)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </section>
        <div className="flex flex-wrap gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            Retour
          </Button>
          <Button type="button" onClick={onSubmit} disabled={loading}>
            {loading ? "Envoi…" : "Soumettre la demande"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
