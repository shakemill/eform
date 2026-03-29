import QRCode from "qrcode";
import { randomUUID } from "crypto";

export type QrPayload = {
  demandeId: string;
  token: string;
  nom: string;
  prenom: string;
  email: string;
  timestamp: number;
};

/**
 * Generates a high-correction QR code data URL and a unique token for agency verification.
 */
export async function generateQRCode(
  demandeId: string,
  nom: string,
  prenom: string,
  email: string,
): Promise<{ token: string; qrDataUrl: string; payload: string }> {
  const token = randomUUID();
  const payloadObj: QrPayload = {
    demandeId,
    token,
    nom,
    prenom,
    email,
    timestamp: Date.now(),
  };
  const payload = JSON.stringify(payloadObj);
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    width: 512,
  });
  return { token, qrDataUrl, payload };
}
