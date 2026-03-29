import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type DemandeQrEmailProps = {
  prenom: string;
  nom: string;
  demandeId: string;
  typeCompteLabel: string;
  devise: string;
  montantInitial: string;
  qrCid?: string;
  qrSrc?: string;
};

export function DemandeQrEmail({
  prenom,
  nom,
  demandeId,
  typeCompteLabel,
  devise,
  montantInitial,
  qrCid = "qrcode",
  qrSrc,
}: DemandeQrEmailProps) {
  const preview = `Votre demande d’ouverture de compte — ${demandeId}`;
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://www.ecobank.com/images/default-source/default-album/logo-ecobank.png"
            width={180}
            height={48}
            alt="Ecobank"
            style={{ marginBottom: 16 }}
          />
          <Heading style={h1}>Demande enregistrée</Heading>
          <Text style={text}>
            Bonjour {prenom} {nom},
          </Text>
          <Text style={text}>
            Votre demande d’ouverture de compte a bien été reçue. Présentez le QR
            code ci-dessous à l’accueil de votre agence pour finaliser le
            dossier.
          </Text>
          <Section style={qrSection}>
            <Img
              src={qrSrc ?? `cid:${qrCid}`}
              width={256}
              height={256}
              alt="QR code"
              style={qrImg}
            />
          </Section>
          <Section style={box}>
            <Text style={label}>Référence</Text>
            <Text style={value}>{demandeId}</Text>
            <Text style={label}>Type de compte</Text>
            <Text style={value}>{typeCompteLabel}</Text>
            <Text style={label}>Devise</Text>
            <Text style={value}>{devise}</Text>
            <Text style={label}>Dépôt initial</Text>
            <Text style={value}>{montantInitial}</Text>
          </Section>
          <Text style={footer}>
            Ecobank — The Pan African Bank. Ce message est généré automatiquement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4fbff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #d3e5ee",
  borderRadius: "12px",
  margin: "24px auto",
  padding: "24px 20px 36px",
  maxWidth: "560px",
};

const h1 = {
  color: "#00577a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  margin: "0 0 16px",
};

const text = {
  color: "#385766",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

const qrSection = { textAlign: "center" as const, margin: "24px 0" };
const qrImg = { display: "inline-block", margin: "0 auto" };

const box = {
  backgroundColor: "#eef6fa",
  borderRadius: "10px",
  padding: "16px",
  marginTop: "24px",
};

const label = {
  ...text,
  fontSize: "12px",
  textTransform: "uppercase" as const,
  color: "#5c7d8d",
  marginBottom: "4px",
};

const value = {
  ...text,
  fontSize: "16px",
  color: "#0e2230",
  fontWeight: "500",
  marginTop: 0,
};

const footer = {
  ...text,
  fontSize: "12px",
  color: "#6f90a0",
  marginTop: "32px",
};

export default DemandeQrEmail;
