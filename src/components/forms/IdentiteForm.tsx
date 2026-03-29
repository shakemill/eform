"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Camera, ImagePlus, UploadCloud } from "lucide-react";
import {
  TYPE_PIECE_VALUES,
  normalizeSexe,
  type typePieceSchema,
} from "@/types/demande";
import { useAutoSave } from "@/hooks/use-auto-save";
import type { z } from "zod";

type Piece = z.infer<typeof typePieceSchema>;

type OcrMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const OCR_ALLOWED_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Downscale + JPEG for OCR: mobile photos are often 10–40MB as base64 and hit
 * serverless body limits; HEIC from iOS often fails Zod/Claude unless decoded first.
 */
async function prepareImageForOcr(file: File): Promise<{
  imageBase64: string;
  mediaType: OcrMediaType;
}> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const maxEdge = 1920;
      const { width, height } = bitmap;
      const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");
      ctx.drawImage(bitmap, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const [, data] = dataUrl.split(",");
      if (!data?.length) throw new Error("Encodage image échoué");
      return { imageBase64: data, mediaType: "image/jpeg" };
    } finally {
      bitmap.close?.();
    }
  } catch {
    const { base64, mediaType } = await fileToBase64(file);
    if (!OCR_ALLOWED_TYPES.includes(mediaType)) {
      throw new Error(
        "Format d’image non pris en charge. Sur iPhone : Réglages → Caméra → Formats → « Le plus compatible », ou choisissez une photo JPEG depuis la galerie.",
      );
    }
    if (!base64.length) throw new Error("Lecture du fichier impossible.");
    return { imageBase64: base64, mediaType: mediaType as OcrMediaType };
  }
}

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      const [header, data] = r.split(",");
      const m = header?.match(/data:([^;]+)/);
      const mediaType = (m?.[1] ?? file.type ?? "image/jpeg").toLowerCase();
      resolve({ base64: data ?? "", mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export type IdentiteFormState = {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  numeroPiece: string;
  typePiece: string;
  dateExpiration: string;
  sexe: string;
  profession: string;
  adresse: string;
  email: string;
  telephone: string;
  pieceIdentiteUrl: string;
};

const empty: IdentiteFormState = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "",
  numeroPiece: "",
  typePiece: "",
  dateExpiration: "",
  sexe: "",
  profession: "",
  adresse: "",
  email: "",
  telephone: "",
  pieceIdentiteUrl: "",
};

/**
 * Step 1 — ID upload, OCR, and editable identity fields.
 */
export function IdentiteForm({
  demandeId,
  initial,
  onNext,
}: {
  demandeId: string;
  initial?: Partial<IdentiteFormState>;
  onNext: () => void;
}) {
  const [form, setForm] = useState<IdentiteFormState>({ ...empty, ...initial });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrDone, setOcrDone] = useState(false);
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const formStartRef = useRef<HTMLDivElement | null>(null);

  useAutoSave(demandeId, {
    ...form,
    etapeCourante: 1,
    typePiece: form.typePiece || undefined,
  });

  useEffect(() => {
    if (!ocrLoading) return;
    setOcrProgress(8);
    const interval = window.setInterval(() => {
      setOcrProgress((prev) => {
        if (prev >= 90) return prev;
        const step = prev < 40 ? 7 : prev < 70 ? 4 : 2;
        return Math.min(90, prev + step);
      });
    }, 280);
    return () => window.clearInterval(interval);
  }, [ocrLoading]);

  async function runOcr() {
    if (!rectoFile && !versoFile) {
      toast.error("Ajoutez au moins un fichier (recto ou verso).");
      return;
    }
    setOcrLoading(true);
    try {
      const images = await Promise.all(
        [rectoFile, versoFile]
          .filter((f): f is File => Boolean(f))
          .map((f) => prepareImageForOcr(f)),
      );
      const res = await fetch("/api/extract-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      let json: { error?: string; data?: Record<string, string | null | undefined> };
      try {
        json = (await res.json()) as typeof json;
      } catch {
        throw new Error(
          "Réponse serveur invalide — souvent des photos trop lourdes. Réessayez avec moins de zoom ou une seule image.",
        );
      }
      if (!res.ok) {
        throw new Error(json.error ?? "OCR échoué");
      }
      const d = json.data as Record<string, string | null | undefined>;
      setOcrProgress(100);
      setForm((f) => ({
        ...f,
        nom: d.nom ?? f.nom,
        prenom: d.prenom ?? f.prenom,
        dateNaissance: d.dateNaissance ?? f.dateNaissance,
        lieuNaissance: d.lieuNaissance ?? f.lieuNaissance,
        nationalite: d.nationalite ?? f.nationalite,
        numeroPiece: d.numeroPiece ?? f.numeroPiece,
        typePiece: (d.typePiece as string) ?? f.typePiece,
        dateExpiration: d.dateExpiration ?? f.dateExpiration,
        sexe: normalizeSexe(d.sexe) ?? f.sexe,
        profession: d.profession ?? f.profession,
        adresse: d.adresse ?? f.adresse,
      }));
      setOcrDone(true);
      toast.success("Données extraites depuis recto/verso — vérifiez et complétez.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "OCR impossible");
    } finally {
      window.setTimeout(() => setOcrProgress(0), 500);
      setOcrLoading(false);
    }
  }

  function scrollToPrefilledForm() {
    formStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function goNext() {
    if (!form.email?.trim()) {
      toast.error("L’email est obligatoire.");
      return;
    }
    await fetch("/api/demandes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: demandeId,
        etapeCourante: 2,
        statut: "BROUILLON",
        nom: form.nom || null,
        prenom: form.prenom || null,
        dateNaissance: form.dateNaissance || null,
        lieuNaissance: form.lieuNaissance || null,
        nationalite: form.nationalite || null,
        numeroPiece: form.numeroPiece || null,
        typePiece: (form.typePiece as Piece) || null,
        dateExpiration: form.dateExpiration || null,
        sexe: form.sexe === "M" || form.sexe === "F" ? form.sexe : null,
        profession: form.profession || null,
        adresse: form.adresse || null,
        email: form.email,
        telephone: form.telephone || null,
        pieceIdentiteUrl: form.pieceIdentiteUrl || null,
      }),
    });
    onNext();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-extrabold text-[#00577a]">Pièce d’identité</h2>
        <p className="text-base text-muted-foreground">
          Choisissez un fichier ou utilisez l’appareil photo de votre téléphone pour photographier
          votre pièce d’identité — recto et verso si applicable — afin d’obtenir une extraction plus
          fiable et un dossier complet.
        </p>
        <div className="flex flex-wrap gap-3">
          <UploadButton
            endpoint="pieceIdentite"
            input={{ demandeId }}
            content={{
              button: "Téléverser la pièce",
              allowedContent: "Image (max. 8 Mo)",
            }}
            onClientUploadComplete={(res) => {
              const url = res?.[0]?.url ?? "";
              toast.success("Fichier envoyé.");
              if (url) setForm((f) => ({ ...f, pieceIdentiteUrl: url }));
            }}
            onUploadError={(e) => {
              toast.error(e.message);
            }}
          />
          <div className="w-full max-w-xl space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-[#00577a]/25 bg-[#00577a]/5 p-3 transition hover:bg-[#00577a]/10 active:scale-[0.99]">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00577a]/15">
                  <Camera className="h-5 w-5 text-[#00577a]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[#00577a]">Photo recto</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {rectoFile?.name ?? "Touchez pour choisir une image"}
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Recto pour analyse OCR"
                  onChange={(e) => setRectoFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <label className="relative flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-[#00577a]/25 bg-[#00577a]/5 p-3 transition hover:bg-[#00577a]/10 active:scale-[0.99]">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00577a]/15">
                  <ImagePlus className="h-5 w-5 text-[#00577a]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[#00577a]">Photo verso</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {versoFile?.name ?? "Touchez pour choisir une image"}
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Verso pour analyse OCR"
                  onChange={(e) => setVersoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={runOcr} disabled={ocrLoading}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {ocrLoading ? "Analyse OCR..." : "Extraire depuis recto/verso"}
              </Button>
              {ocrDone ? (
                <Button type="button" onClick={scrollToPrefilledForm}>
                  Suivant : voir le formulaire prérempli
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              OCR local (sans stockage automatique) — ajoutez recto et verso quand c’est possible.
            </p>
          </div>
        </div>
        {ocrLoading ? (
          <div className="space-y-2">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ocrProgress}
              aria-label="Progression de l'analyse OCR"
            >
              <div
                className="h-full rounded-full bg-[#00577a] transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <p className="text-base font-semibold text-muted-foreground">
              Analyse en cours… {ocrProgress}%
            </p>
          </div>
        ) : null}
      </section>

      <div ref={formStartRef} className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={form.prenom}
            onChange={(e) =>
              setForm((f) => ({ ...f, prenom: e.target.value.toUpperCase() }))
            }
          />
        </div>
        <div>
          <Label htmlFor="dn">Date de naissance</Label>
          <Input
            id="dn"
            type="date"
            value={form.dateNaissance}
            onChange={(e) =>
              setForm((f) => ({ ...f, dateNaissance: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="lieu">Lieu de naissance</Label>
          <Input
            id="lieu"
            value={form.lieuNaissance}
            onChange={(e) => setForm((f) => ({ ...f, lieuNaissance: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="nat">Nationalité</Label>
          <Input
            id="nat"
            value={form.nationalite}
            onChange={(e) => setForm((f) => ({ ...f, nationalite: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="np">N° pièce</Label>
          <Input
            id="np"
            value={form.numeroPiece}
            onChange={(e) => setForm((f) => ({ ...f, numeroPiece: e.target.value }))}
          />
        </div>
        <div>
          <Label>Type de pièce</Label>
          <Select
            value={form.typePiece}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, typePiece: v ?? "" }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_PIECE_VALUES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="de">Date d’expiration</Label>
          <Input
            id="de"
            type="date"
            value={form.dateExpiration}
            onChange={(e) => setForm((f) => ({ ...f, dateExpiration: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Sexe</Label>
          <RadioGroup
            name="sexe"
            value={form.sexe}
            onValueChange={(v) => setForm((f) => ({ ...f, sexe: String(v ?? "") }))}
            className="flex gap-4 pt-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="M" id="m" />
              <Label htmlFor="m" className="text-base font-extrabold">
                M
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="F" id="f" />
              <Label htmlFor="f" className="text-base font-extrabold">
                F
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="prof">Profession</Label>
          <Input
            id="prof"
            value={form.profession}
            onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="adr">Adresse</Label>
          <Textarea
            id="adr"
            value={form.adresse}
            onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="em">Email (contact)</Label>
          <Input
            id="em"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="tel">Téléphone</Label>
          <Input
            id="tel"
            type="tel"
            value={form.telephone}
            onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
          />
        </div>
      </div>

      <Button type="button" onClick={goNext}>
        Suivant — Compte
      </Button>
    </div>
  );
}
