import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, Statut, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authOptions } from "@/lib/auth";
import {
  createDemandeSchema,
  listDemandesQuerySchema,
  patchDemandeSchema,
} from "@/types/demande";

function prismaOrder(sort: string): Prisma.DemandeCompteOrderByWithRelationInput[] {
  switch (sort) {
    case "soumisAt_asc":
      return [{ soumisAt: "asc" }, { createdAt: "asc" }];
    case "createdAt_desc":
      return [{ createdAt: "desc" }];
    case "soumisAt_desc":
    default:
      return [{ soumisAt: "desc" }, { createdAt: "desc" }];
  }
}

/**
 * GET — list demands (back-office filters + pagination).
 */
export async function GET(req: NextRequest) {
  const qs = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listDemandesQuerySchema.safeParse(qs);
  if (!parsed.success) {
    return NextResponse.json({ error: "Query invalide", details: parsed.error.flatten() }, { status: 400 });
  }
  const { page, pageSize, statut, email, typeCompte, agenceId, sort } = parsed.data;

  const isPublicDraftLookup =
    Boolean(email) && statut === Statut.BROUILLON && page === 1 && pageSize <= 5;
  if (!isPublicDraftLookup) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.BANQUIER) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }
  const where: Prisma.DemandeCompteWhereInput = {};
  if (statut) where.statut = statut;
  if (email) where.email = email;
  if (typeCompte) where.typeCompte = typeCompte;
  if (agenceId) where.agenceId = agenceId;

  const skip = (page - 1) * pageSize;
  try {
    const [data, total] = await prisma.$transaction([
      prisma.demandeCompte.findMany({
        where,
        orderBy: prismaOrder(sort),
        skip,
        take: pageSize,
      }),
      prisma.demandeCompte.count({ where }),
    ]);
    return NextResponse.json({ data, total, page, pageSize });
  } catch (e) {
    logger.error({ err: e }, "GET /api/demandes");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST — create draft demand for an email.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const parsed = createDemandeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const row = await prisma.demandeCompte.create({
      data: {
        email: parsed.data.email,
        statut: Statut.BROUILLON,
        etapeCourante: 1,
      },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    logger.error({ err: e }, "POST /api/demandes");
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}

/**
 * PATCH — autosave draft fields (and optional status for workflow).
 */
export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const parsed = patchDemandeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const data: Prisma.DemandeCompteUpdateInput = {};

  const assign = <K extends keyof typeof rest>(key: K) => {
    const v = rest[key];
    if (v !== undefined) {
      (data as Record<string, unknown>)[key as string] = v as unknown;
    }
  };

  assign("etapeCourante");
  assign("statut");
  assign("nom");
  assign("prenom");
  assign("lieuNaissance");
  assign("nationalite");
  assign("numeroPiece");
  assign("typePiece");
  assign("sexe");
  assign("profession");
  assign("adresse");
  assign("email");
  assign("telephone");
  assign("pieceIdentiteUrl");
  assign("typeCompte");
  assign("devise");
  assign("modeAlimentation");
  assign("carteBancaire");
  assign("typeCarte");
  assign("decouvert");
  assign("servicesOptions");
  assign("beneficiaire");
  assign("kycPep");
  assign("kycSourceFonds");
  assign("kycObjetCompte");

  if (rest.dateNaissance !== undefined) data.dateNaissance = rest.dateNaissance;
  if (rest.dateExpiration !== undefined) data.dateExpiration = rest.dateExpiration;
  if (rest.montantInitial !== undefined && rest.montantInitial !== null) {
    data.montantInitial = new Prisma.Decimal(rest.montantInitial);
  }
  if (rest.montantInitial === null) data.montantInitial = null;

  try {
    const row = await prisma.demandeCompte.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    logger.error({ err: e, id }, "PATCH /api/demandes");
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 400 });
  }
}
