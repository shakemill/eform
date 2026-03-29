import { NextRequest, NextResponse } from "next/server";
import { extractIdBodySchema } from "@/types/demande";
import { extractIdFromImage } from "@/lib/claude";
import { logger } from "@/lib/logger";
import type { OcrExtraction } from "@/types/demande";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

/**
 * POST — Claude Vision OCR on ID document image (rate limited per IP).
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const rl = rateLimit.get(ip);

  if (rl && now < rl.resetAt && rl.count >= 5) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  rateLimit.set(ip, {
    count: (rl && now < rl.resetAt ? rl.count : 0) + 1,
    resetAt: rl && now < rl.resetAt ? rl.resetAt : now + 60_000,
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = extractIdBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const images =
      parsed.data.images ??
      [
        {
          imageBase64: parsed.data.imageBase64!,
          mediaType: parsed.data.mediaType!,
        },
      ];

    const results = await Promise.all(
      images.map((img) => extractIdFromImage(img.imageBase64, img.mediaType)),
    );
    const data = mergeOcrResults(results);
    return NextResponse.json({ data });
  } catch (e) {
    logger.error({ err: e }, "extract-id");
    const message = e instanceof Error ? e.message : "Erreur OCR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mergeOcrResults(results: OcrExtraction[]): OcrExtraction {
  const merged: OcrExtraction = {};

  const pick = <K extends keyof OcrExtraction>(key: K): OcrExtraction[K] => {
    const values = results
      .map((r) => r[key])
      .filter((v): v is NonNullable<OcrExtraction[K]> => v != null && v !== "");
    if (!values.length) return null as OcrExtraction[K];

    if (key === "prenom") {
      const best = [...values]
        .map((v) => String(v))
        .sort((a, b) => scorePrenom(b) - scorePrenom(a))[0];
      return best as OcrExtraction[K];
    }

    if (key === "dateNaissance") {
      const best = [...values]
        .map((v) => String(v))
        .sort((a, b) => scoreBirthDate(b) - scoreBirthDate(a))[0];
      return best as OcrExtraction[K];
    }

    return values[0] as OcrExtraction[K];
  };

  const keys: Array<keyof OcrExtraction> = [
    "nom",
    "prenom",
    "dateNaissance",
    "lieuNaissance",
    "nationalite",
    "numeroPiece",
    "typePiece",
    "dateExpiration",
    "sexe",
    "profession",
    "adresse",
  ];

  for (const key of keys) {
    (merged as Record<keyof OcrExtraction, OcrExtraction[keyof OcrExtraction]>)[key] =
      pick(key);
  }

  return sanitizeSignerNoise(merged);
}

function sanitizeSignerNoise(data: OcrExtraction): OcrExtraction {
  const cleaned: OcrExtraction = { ...data };
  if (isLikelySignerValue(cleaned.nom)) cleaned.nom = null;
  if (isLikelySignerValue(cleaned.prenom)) cleaned.prenom = null;
  return cleaned;
}

function isLikelySignerValue(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const signerKeywords = [
    "SIGNATAIRE",
    "SIGNATURE",
    "AUTORITE",
    "OFFICIER",
    "DIRECTEUR",
    "PREFET",
    "PREFECTURE",
    "MINISTRE",
    "COMMISSAIRE",
    "MAIRE",
    "GOUVERNEUR",
    "DELEGUE",
    "CHEF DE",
    "LE DIRECTEUR",
    "LE PREFET",
    "LE MAIRE",
  ];
  return signerKeywords.some((k) => normalized.includes(k));
}

function scorePrenom(value: string): number {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return -1;
  const hasHyphen = normalized.includes("-") ? 3 : 0;
  const hasSpace = normalized.includes(" ") ? 2 : 0;
  const alphaLen = normalized.replace(/[^A-Z]/g, "").length;
  return alphaLen + hasHyphen + hasSpace;
}

function scoreBirthDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return -10;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const currentYear = new Date().getFullYear();

  let score = 0;
  if (year >= 1900 && year <= currentYear - 18) score += 5;
  if (month >= 1 && month <= 12) score += 2;
  if (day >= 1 && day <= 31) score += 2;
  return score;
}
