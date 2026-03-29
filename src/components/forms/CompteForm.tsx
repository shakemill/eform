"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  QUESTIONS_COMPTE,
  typeCompteFromLabel,
  deviseFromLabel,
  modeFromLabel,
  labelFromTypeCompte,
  deviseToLabel,
  modeToLabel,
} from "@/types/demande";
import { useAutoSave } from "@/hooks/use-auto-save";
import type { TypeCompte } from "@prisma/client";

const SERVICE_OPTIONS = [
  { key: "smsBanking" as const, label: "SMS Banking" },
  { key: "internetBanking" as const, label: "Internet Banking" },
  { key: "eStatement" as const, label: "Relevé électronique (e-statement)" },
];

export type CompteFormState = {
  typeCompte: TypeCompte | "";
  devise: "XAF" | "EUR" | "USD" | "";
  montantInitial: string;
  modeAlimentation: "VIREMENT" | "ESPECES" | "MOBILE_MONEY" | "";
  carteBancaire: boolean;
  typeCarte: string;
  decouvert: boolean;
  servicesOptions: { smsBanking: boolean; internetBanking: boolean; eStatement: boolean };
  beneficiaire: { nom: string; lien: string; telephone: string };
  kycPep: boolean;
  kycSourceFonds: string;
  kycObjetCompte: string;
};

const defaultServices = {
  smsBanking: false,
  internetBanking: false,
  eStatement: false,
};

function mapInitialFromApi(row: Record<string, unknown>): Partial<CompteFormState> {
  const tc = row.typeCompte as TypeCompte | null;
  const dev = row.devise as string | null;
  return {
    typeCompte: tc ?? "",
    devise: (dev as CompteFormState["devise"]) ?? "",
    montantInitial:
      row.montantInitial != null ? String(row.montantInitial) : "",
    modeAlimentation: (row.modeAlimentation as CompteFormState["modeAlimentation"]) ?? "",
    carteBancaire: Boolean(row.carteBancaire),
    typeCarte: (row.typeCarte as string) ?? "",
    decouvert: Boolean(row.decouvert),
    servicesOptions: {
      ...defaultServices,
      ...(typeof row.servicesOptions === "object" && row.servicesOptions
        ? (row.servicesOptions as CompteFormState["servicesOptions"])
        : {}),
    },
    beneficiaire: {
      nom: "",
      lien: "",
      telephone: "",
      ...(typeof row.beneficiaire === "object" && row.beneficiaire
        ? (row.beneficiaire as CompteFormState["beneficiaire"])
        : {}),
    },
    kycPep: Boolean(row.kycPep),
    kycSourceFonds: (row.kycSourceFonds as string) ?? "",
    kycObjetCompte: (row.kycObjetCompte as string) ?? "",
  };
}

/**
 * Step 2 — account preferences from `QUESTIONS_COMPTE`.
 */
export function CompteForm({
  demandeId,
  initialRow,
  onNext,
  onBack,
}: {
  demandeId: string;
  initialRow?: Record<string, unknown>;
  onNext: () => void;
  onBack: () => void;
}) {
  const mapped = initialRow ? mapInitialFromApi(initialRow) : {};
  const [form, setForm] = useState<CompteFormState>({
    typeCompte: "",
    devise: "",
    montantInitial: "",
    modeAlimentation: "",
    carteBancaire: false,
    typeCarte: "",
    decouvert: false,
    servicesOptions: { ...defaultServices },
    beneficiaire: { nom: "", lien: "", telephone: "" },
    kycPep: false,
    kycSourceFonds: "",
    kycObjetCompte: "",
    ...mapped,
  });

  useAutoSave(demandeId, {
    etapeCourante: 2,
    typeCompte: form.typeCompte || undefined,
    devise: form.devise || undefined,
    montantInitial: form.montantInitial ? Number(form.montantInitial) : undefined,
    modeAlimentation: form.modeAlimentation || undefined,
    carteBancaire: form.carteBancaire,
    typeCarte: form.typeCarte || undefined,
    decouvert: form.decouvert,
    servicesOptions: form.servicesOptions,
    beneficiaire: form.beneficiaire,
    kycPep: form.kycPep,
    kycSourceFonds: form.kycSourceFonds || undefined,
    kycObjetCompte: form.kycObjetCompte || undefined,
  });

  async function submit() {
    if (!form.typeCompte || !form.devise) {
      toast.error("Type de compte et devise obligatoires.");
      return;
    }
    await fetch("/api/demandes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: demandeId,
        etapeCourante: 3,
        statut: "BROUILLON",
        typeCompte: form.typeCompte,
        devise: form.devise,
        montantInitial: form.montantInitial ? Number(form.montantInitial) : null,
        modeAlimentation: form.modeAlimentation || null,
        carteBancaire: form.carteBancaire,
        typeCarte: form.typeCarte || null,
        decouvert: form.decouvert,
        servicesOptions: form.servicesOptions,
        beneficiaire: form.beneficiaire,
        kycPep: form.kycPep,
        kycSourceFonds: form.kycSourceFonds || null,
        kycObjetCompte: form.kycObjetCompte || null,
      }),
    });
    onNext();
  }

  return (
    <div className="space-y-8">
      {QUESTIONS_COMPTE.map((q) => {
        if (q.id === "typeCompte" && q.type === "select") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <Select
                value={
                  form.typeCompte ? labelFromTypeCompte(form.typeCompte) : ""
                }
                onValueChange={(v) => {
                  const label = v ?? "";
                  setForm((f) => ({
                    ...f,
                    typeCompte: (label ? typeCompteFromLabel(label) : null) ?? "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(q.options ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (q.id === "devise" && q.type === "select") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <Select
                value={form.devise ? deviseToLabel(form.devise) : ""}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    devise: deviseFromLabel(v ?? "") ?? "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(q.options ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (q.id === "montantInitial" && q.type === "number") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <Input
                type="number"
                min={q.min}
                placeholder={q.placeholder}
                value={form.montantInitial}
                onChange={(e) =>
                  setForm((f) => ({ ...f, montantInitial: e.target.value }))
                }
              />
            </div>
          );
        }
        if (q.id === "modeAlimentation" && q.type === "radio") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <RadioGroup
                value={form.modeAlimentation ? modeToLabel(form.modeAlimentation) : ""}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    modeAlimentation: modeFromLabel(v ?? "") ?? "",
                  }))
                }
                className="flex flex-col gap-2"
              >
                {(q.options ?? []).map((o) => (
                  <div key={o} className="flex items-center gap-2">
                    <RadioGroupItem value={o} id={`m-${o}`} />
                    <Label htmlFor={`m-${o}`} className="text-base font-bold">
                      {o}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        }
        if (q.id === "carteBancaire" && q.type === "boolean") {
          return (
            <div key={q.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cb"
                  checked={form.carteBancaire}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, carteBancaire: Boolean(c) }))
                  }
                />
                <Label htmlFor="cb" className="text-base font-bold">
                  {q.label}
                </Label>
              </div>
              {form.carteBancaire &&
                q.conditionalFields?.map((cf) =>
                  cf.type === "select" ? (
                    <div key={cf.id} className="space-y-2">
                      <Label>{cf.label}</Label>
                      <Select
                        value={form.typeCarte}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, typeCarte: v ?? "" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          {(cf.options ?? []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null,
                )}
            </div>
          );
        }
        if (q.id === "decouvert" && q.type === "boolean") {
          return (
            <div key={q.id} className="flex items-center gap-2">
              <Checkbox
                id="dec"
                checked={form.decouvert}
                onCheckedChange={(c) =>
                  setForm((f) => ({ ...f, decouvert: Boolean(c) }))
                }
              />
              <Label htmlFor="dec" className="text-base font-bold">
                {q.label}
              </Label>
            </div>
          );
        }
        if (q.id === "servicesOptions" && q.type === "checkbox") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <div className="space-y-2">
                {SERVICE_OPTIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={form.servicesOptions[key]}
                      onCheckedChange={(c) =>
                        setForm((f) => ({
                          ...f,
                          servicesOptions: {
                            ...f.servicesOptions,
                            [key]: Boolean(c),
                          },
                        }))
                      }
                    />
                    <Label htmlFor={key} className="text-base font-bold">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (q.id === "beneficiaire" && q.type === "group") {
          return (
            <fieldset key={q.id} className="space-y-2 rounded-md border p-4">
              <legend className="px-1 text-base font-extrabold text-[#00577a]">{q.label}</legend>
              <Input
                placeholder="Nom complet"
                value={form.beneficiaire.nom}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    beneficiaire: { ...f.beneficiaire, nom: e.target.value },
                  }))
                }
              />
              <Input
                placeholder="Lien de parenté"
                value={form.beneficiaire.lien}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    beneficiaire: { ...f.beneficiaire, lien: e.target.value },
                  }))
                }
              />
              <Input
                placeholder="Téléphone"
                value={form.beneficiaire.telephone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    beneficiaire: { ...f.beneficiaire, telephone: e.target.value },
                  }))
                }
              />
            </fieldset>
          );
        }
        if (q.id === "kycPep" && q.type === "boolean") {
          return (
            <div key={q.id} className="flex items-center gap-2">
              <Checkbox
                id="pep"
                checked={form.kycPep}
                onCheckedChange={(c) =>
                  setForm((f) => ({ ...f, kycPep: Boolean(c) }))
                }
              />
              <Label htmlFor="pep" className="text-base font-bold">
                {q.label}
              </Label>
            </div>
          );
        }
        if (q.id === "kycSourceFonds" && q.type === "select") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <Select
                value={form.kycSourceFonds}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, kycSourceFonds: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(q.options ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (q.id === "kycObjetCompte" && q.type === "select") {
          return (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              <Select
                value={form.kycObjetCompte}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, kycObjetCompte: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(q.options ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        return null;
      })}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button type="button" onClick={submit}>
          Suivant — Récapitulatif
        </Button>
      </div>
    </div>
  );
}
