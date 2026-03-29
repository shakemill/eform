import { z } from "zod";

export const STATUT_VALUES = [
  "BROUILLON",
  "EN_ATTENTE",
  "EN_COURS_TRAITEMENT",
  "COMPLEMENT_REQUIS",
  "VALIDEE",
  "REJETEE",
] as const;

export const TYPE_PIECE_VALUES = ["CNI", "PASSPORT", "SEJOUR", "PERMIS"] as const;

export const TYPE_COMPTE_VALUES = [
  "COURANT",
  "EPARGNE",
  "ETUDIANT",
  "PROFESSIONNEL",
] as const;

export const statutSchema = z.enum(STATUT_VALUES);
export const typePieceSchema = z.enum(TYPE_PIECE_VALUES);
export const typeCompteSchema = z.enum(TYPE_COMPTE_VALUES);

export function normalizeSexe(value: unknown): "M" | "F" | null {
  if (value == null) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  if (
    raw === "m" ||
    raw === "male" ||
    raw === "masculin" ||
    raw === "homme"
  ) {
    return "M";
  }
  if (
    raw === "f" ||
    raw === "female" ||
    raw === "feminin" ||
    raw === "féminin" ||
    raw === "femme"
  ) {
    return "F";
  }
  return null;
}

/** Payload returned by Claude Vision OCR (`/api/extract-id`). */
export const ocrExtractionSchema = z.object({
  nom: z.string().nullable().optional(),
  prenom: z.string().nullable().optional(),
  dateNaissance: z.string().nullable().optional(),
  lieuNaissance: z.string().nullable().optional(),
  nationalite: z.string().nullable().optional(),
  numeroPiece: z.string().nullable().optional(),
  typePiece: typePieceSchema.nullable().optional(),
  dateExpiration: z.string().nullable().optional(),
  sexe: z.preprocess((v) => normalizeSexe(v), z.enum(["M", "F"]).nullable()).optional(),
  profession: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
});

export const extractIdBodySchema = z.object({
  imageBase64: z.string().min(1).optional(),
  mediaType: z
    .enum([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ] as const)
    .optional(),
  images: z
    .array(
      z.object({
        imageBase64: z.string().min(1),
        mediaType: z.enum([
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ] as const),
      }),
    )
    .min(1)
    .max(2)
    .optional(),
}).refine((v) => Boolean(v.images?.length) || (Boolean(v.imageBase64) && Boolean(v.mediaType)), {
  message: "imageBase64/mediaType ou images[] requis",
});

export const servicesOptionsSchema = z
  .object({
    smsBanking: z.boolean().optional(),
    internetBanking: z.boolean().optional(),
    eStatement: z.boolean().optional(),
  })
  .optional();

export const beneficiaireSchema = z
  .object({
    nom: z.string().optional(),
    lien: z.string().optional(),
    telephone: z.string().optional(),
  })
  .optional();

/** Step 1 — identity fields (API + form). */
export const identiteFieldsSchema = z.object({
  nom: z.string().optional().nullable(),
  prenom: z.string().optional().nullable(),
  dateNaissance: z.coerce.date().optional().nullable(),
  lieuNaissance: z.string().optional().nullable(),
  nationalite: z.string().optional().nullable(),
  numeroPiece: z.string().optional().nullable(),
  typePiece: typePieceSchema.optional().nullable(),
  dateExpiration: z.coerce.date().optional().nullable(),
  sexe: z.preprocess((v) => normalizeSexe(v), z.enum(["M", "F"]).nullable()).optional(),
  profession: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  pieceIdentiteUrl: z.string().url().optional().nullable(),
});

/** Step 2 — account preferences. */
export const compteFieldsSchema = z.object({
  typeCompte: typeCompteSchema.optional().nullable(),
  devise: z.enum(["XAF", "EUR", "USD"]).optional().nullable(),
  montantInitial: z.coerce.number().min(0).optional().nullable(),
  modeAlimentation: z
    .enum(["VIREMENT", "ESPECES", "MOBILE_MONEY"])
    .optional()
    .nullable(),
  carteBancaire: z.boolean().optional().nullable(),
  typeCarte: z.string().optional().nullable(),
  decouvert: z.boolean().optional().nullable(),
  servicesOptions: servicesOptionsSchema,
  beneficiaire: beneficiaireSchema,
  kycPep: z.boolean().optional().nullable(),
  kycSourceFonds: z.string().optional().nullable(),
  kycObjetCompte: z.string().optional().nullable(),
});

export const patchDemandeSchema = z
  .object({
    id: z.string().min(1),
    etapeCourante: z.number().int().min(1).max(4).optional(),
    statut: statutSchema.optional(),
  })
  .and(identiteFieldsSchema.partial())
  .and(compteFieldsSchema.partial());

export const createDemandeSchema = z.object({
  email: z.string().email(),
  statut: z.literal("BROUILLON").optional(),
});

export const listDemandesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  statut: statutSchema.optional(),
  email: z.string().email().optional(),
  typeCompte: typeCompteSchema.optional(),
  agenceId: z.string().optional(),
  sort: z.enum(["soumisAt_desc", "soumisAt_asc", "createdAt_desc"]).default("soumisAt_desc"),
});

export const submitDemandeSchema = z.object({
  id: z.string().min(1),
});

export const banquierActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("VALIDER") }),
  z.object({ type: z.literal("REJETER"), motif: z.string().min(1) }),
  z.object({ type: z.literal("COMPLEMENT"), message: z.string().min(1) }),
  z.object({ type: z.literal("EN_COURS") }),
]);

export const verifyQrSchema = z.object({
  demandeId: z.string().min(1),
  token: z.string().uuid(),
});

export type OcrExtraction = z.infer<typeof ocrExtractionSchema>;
export type PatchDemandeInput = z.infer<typeof patchDemandeSchema>;
export type ListDemandesQuery = z.infer<typeof listDemandesQuerySchema>;
export type BanquierAction = z.infer<typeof banquierActionSchema>;

export type QuestionCompte = {
  id: string;
  label: string;
  type: "select" | "number" | "radio" | "boolean" | "checkbox" | "group";
  options?: string[];
  min?: number;
  placeholder?: string;
  conditionalFields?: QuestionCompte[];
  fields?: string[];
};

/** Dynamic account questions (spec). */
export const QUESTIONS_COMPTE: QuestionCompte[] = [
  {
    id: "typeCompte",
    label: "Type de compte souhaité",
    type: "select",
    options: ["Courant", "Épargne", "Étudiant", "Professionnel"],
  },
  {
    id: "devise",
    label: "Devise du compte",
    type: "select",
    options: ["XAF (Franc CFA)", "EUR (Euro)", "USD (Dollar)"],
  },
  {
    id: "montantInitial",
    label: "Montant du dépôt initial (XAF)",
    type: "number",
    min: 0,
    placeholder: "Ex: 50000",
  },
  {
    id: "modeAlimentation",
    label: "Mode d'alimentation préféré",
    type: "radio",
    options: ["Virement bancaire", "Espèces en agence", "Mobile Money"],
  },
  {
    id: "carteBancaire",
    label: "Souhaitez-vous une carte bancaire ?",
    type: "boolean",
    conditionalFields: [
      {
        id: "typeCarte",
        label: "Type de carte",
        type: "select",
        options: ["Visa Classic", "Mastercard Standard", "Visa Gold"],
      },
    ],
  },
  {
    id: "decouvert",
    label: "Découvert autorisé souhaité ?",
    type: "boolean",
  },
  {
    id: "servicesOptions",
    label: "Services complémentaires",
    type: "checkbox",
    options: ["SMS Banking", "Internet Banking", "Relevé électronique (e-statement)"],
  },
  {
    id: "beneficiaire",
    label: "Bénéficiaire en cas de décès",
    type: "group",
    fields: ["Nom complet", "Lien de parenté", "Téléphone"],
  },
  {
    id: "kycPep",
    label: "Êtes-vous une Personne Politiquement Exposée (PPE) ?",
    type: "boolean",
  },
  {
    id: "kycSourceFonds",
    label: "Source principale des fonds",
    type: "select",
    options: [
      "Salaire",
      "Revenus commerciaux",
      "Héritage",
      "Investissements",
      "Autre",
    ],
  },
  {
    id: "kycObjetCompte",
    label: "Objet principal du compte",
    type: "select",
    options: [
      "Salaire",
      "Épargne personnelle",
      "Commerce",
      "Études",
      "Retraite",
    ],
  },
];

/** UI label → Prisma `TypeCompte`. */
export function typeCompteFromLabel(label: string): z.infer<typeof typeCompteSchema> | null {
  const map: Record<string, z.infer<typeof typeCompteSchema>> = {
    Courant: "COURANT",
    "Épargne": "EPARGNE",
    Étudiant: "ETUDIANT",
    Professionnel: "PROFESSIONNEL",
  };
  return map[label] ?? null;
}

export function labelFromTypeCompte(tc: z.infer<typeof typeCompteSchema>): string {
  const map: Record<string, string> = {
    COURANT: "Courant",
    EPARGNE: "Épargne",
    ETUDIANT: "Étudiant",
    PROFESSIONNEL: "Professionnel",
  };
  return map[tc] ?? tc;
}

export function deviseFromLabel(label: string): "XAF" | "EUR" | "USD" | null {
  if (label.startsWith("XAF")) return "XAF";
  if (label.startsWith("EUR")) return "EUR";
  if (label.startsWith("USD")) return "USD";
  return null;
}

export function modeFromLabel(label: string): "VIREMENT" | "ESPECES" | "MOBILE_MONEY" | null {
  if (label.includes("Virement")) return "VIREMENT";
  if (label.includes("Espèces")) return "ESPECES";
  if (label.includes("Mobile")) return "MOBILE_MONEY";
  return null;
}

export function modeToLabel(mode: string): string {
  const map: Record<string, string> = {
    VIREMENT: "Virement bancaire",
    ESPECES: "Espèces en agence",
    MOBILE_MONEY: "Mobile Money",
  };
  return map[mode] ?? "";
}

export function deviseToLabel(d: string): string {
  const map: Record<string, string> = {
    XAF: "XAF (Franc CFA)",
    EUR: "EUR (Euro)",
    USD: "USD (Dollar)",
  };
  return map[d] ?? "";
}
