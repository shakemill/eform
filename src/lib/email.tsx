import { Resend } from "resend";
import { render } from "@react-email/render";
import { DemandeQrEmail, type DemandeQrEmailProps } from "@/emails/demande-qr";
import { logger } from "@/lib/logger";
import { mailFromAddress, sendSmtpMail, smtpConfigured } from "@/lib/mailer";

const resend = () =>
  new Resend(process.env.RESEND_API_KEY ?? "");

/**
 * Sends magic-link style sign-in email (SMTP preferred, else Resend).
 */
export async function sendMagicLinkEmail(params: {
  to: string;
  url: string;
  from: string;
}): Promise<void> {
  const { to, url, from } = params;
  const html = `<p>Bonjour,</p><p><a href="${url}">Cliquez ici pour vous connecter</a></p><p>Ce lien expire sous peu.</p>`;

  if (smtpConfigured()) {
    await sendSmtpMail({
      to,
      from: from || mailFromAddress(),
      subject: "Connexion — E-form banque",
      html,
    });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logger.error("Aucun transport email (SMTP ou RESEND_API_KEY)");
    throw new Error("Configuration email incomplète");
  }
  const { error } = await resend().emails.send({
    from,
    to,
    subject: "Connexion — E-form banque",
    html,
  });
  if (error) {
    logger.error({ error }, "sendMagicLinkEmail failed");
    throw new Error(error.message);
  }
}

/**
 * Sends demand confirmation with embedded QR (CID inline) to the applicant.
 */
export async function sendDemandeQrEmail(
  props: DemandeQrEmailProps & { to: string; qrDataUrl: string },
): Promise<void> {
  const { to, qrDataUrl, ...rest } = props;
  const qrCid = "demande-qr-code";
  const base64Content = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const html = await render(
    <DemandeQrEmail {...rest} qrCid={qrCid} />,
  );

  if (smtpConfigured()) {
    await sendSmtpMail({
      to,
      subject: "Votre demande d’ouverture de compte — Code de validation",
      html,
      attachments: [
        {
          filename: "qr-demande.png",
          content: Buffer.from(base64Content, "base64"),
          contentType: "image/png",
          cid: qrCid,
        },
      ],
    });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logger.error("Aucun transport email (SMTP ou RESEND_API_KEY)");
    throw new Error("Configuration email incomplète");
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const { error } = await resend().emails.send({
    from,
    to,
    subject: "Votre demande d’ouverture de compte — Code de validation",
    html,
    attachments: [
      {
        filename: "qr-demande.png",
        content: base64Content,
        contentType: "image/png",
        contentId: qrCid,
      },
    ],
  });
  if (error) {
    logger.error({ error }, "sendDemandeQrEmail failed");
    throw new Error(error.message);
  }
}
