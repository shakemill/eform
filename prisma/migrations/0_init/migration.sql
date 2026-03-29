-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'BANQUIER');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'EN_COURS_TRAITEMENT', 'COMPLEMENT_REQUIS', 'VALIDEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "TypePiece" AS ENUM ('CNI', 'PASSPORT', 'SEJOUR', 'PERMIS');

-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('COURANT', 'EPARGNE', 'ETUDIANT', 'PROFESSIONNEL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "DemandeCompte" (
    "id" TEXT NOT NULL,
    "statut" "Statut" NOT NULL DEFAULT 'BROUILLON',
    "etapeCourante" INTEGER NOT NULL DEFAULT 1,
    "nom" TEXT,
    "prenom" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "numeroPiece" TEXT,
    "typePiece" "TypePiece",
    "dateExpiration" TIMESTAMP(3),
    "sexe" TEXT,
    "profession" TEXT,
    "adresse" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "pieceIdentiteUrl" TEXT,
    "typeCompte" "TypeCompte",
    "devise" TEXT,
    "montantInitial" DECIMAL(18,2),
    "modeAlimentation" TEXT,
    "carteBancaire" BOOLEAN,
    "typeCarte" TEXT,
    "decouvert" BOOLEAN,
    "servicesOptions" JSONB,
    "beneficiaire" JSONB,
    "kycPep" BOOLEAN,
    "kycSourceFonds" TEXT,
    "kycObjetCompte" TEXT,
    "qrCodeToken" TEXT,
    "qrCodeUrl" TEXT,
    "emailEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "agenceId" TEXT,
    "banquierId" TEXT,
    "motifRejet" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soumisAt" TIMESTAMP(3),
    "traiteAt" TIMESTAMP(3),

    CONSTRAINT "DemandeCompte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "DemandeCompte_qrCodeToken_key" ON "DemandeCompte"("qrCodeToken");

-- CreateIndex
CREATE INDEX "DemandeCompte_statut_idx" ON "DemandeCompte"("statut");

-- CreateIndex
CREATE INDEX "DemandeCompte_email_idx" ON "DemandeCompte"("email");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
