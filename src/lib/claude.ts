import Anthropic from "@anthropic-ai/sdk";
import { ocrExtractionSchema, type OcrExtraction } from "@/types/demande";
import { logger } from "@/lib/logger";

const OCR_SYSTEM_PROMPT = `Tu es un agent OCR bancaire expert. Analyse cette image de pièce d'identité
et extrais les informations en JSON strict selon ce schéma exact :

{
  "nom": string | null,
  "prenom": string | null,
  "dateNaissance": "YYYY-MM-DD" | null,
  "lieuNaissance": string | null,
  "nationalite": string | null,
  "numeroPiece": string | null,
  "typePiece": "CNI" | "PASSPORT" | "SEJOUR" | "PERMIS" | null,
  "dateExpiration": "YYYY-MM-DD" | null,
  "sexe": "M" | "F" | null,
  "profession": string | null,
  "adresse": string | null
}

Règles :
- Retourne UNIQUEMENT le JSON, sans markdown, sans commentaires
- Si un champ est illisible ou absent, retourne null
- Les dates doivent être au format ISO 8601 (YYYY-MM-DD)
- Le nom et prénom doivent être en majuscules
- Le prénom doit contenir TOUS les prénoms du titulaire exactement comme sur la pièce (garder tirets, espaces et apostrophes)
- Ne jamais tronquer le prénom (ex: "HENRI-MILL" ne doit pas devenir "HENRI")
- La date de naissance doit être celle du titulaire uniquement (pas la date d'émission/expiration/signature)
- Vérifie attentivement l'année de naissance chiffre par chiffre; si doute, retourne null
- N'extrais QUE l'identité du titulaire de la pièce
- Ignore strictement les noms/fonctions du signataire, de l'autorité émettrice, de l'officier, du préfet, du directeur
- Ne jamais utiliser la ligne de signature, cachet, tampon ou mention d'autorité pour remplir nom/prenom`;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Calls Claude Vision and returns parsed identity fields.
 */
export async function extractIdFromImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
): Promise<OcrExtraction> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant");
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extrais les données du TITULAIRE uniquement en JSON strict selon les instructions (pas de signataire, prénom complet non tronqué, date de naissance exacte).",
          },
        ],
      },
    ],
    system: OCR_SYSTEM_PROMPT,
  });

  const block = response.content[0];
  const text = block?.type === "text" ? block.text : "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    logger.error({ err: e, cleaned }, "claude OCR JSON parse failed");
    throw new Error("Réponse OCR invalide");
  }

  const result = ocrExtractionSchema.safeParse(parsed);
  if (!result.success) {
    logger.warn({ issues: result.error.flatten() }, "claude OCR zod validation");
    return ocrExtractionSchema.parse({});
  }
  return result.data;
}
