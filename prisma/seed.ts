import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds a demo banker account for local development (magic link sign-in).
 */
async function main() {
  const email = process.env.SEED_BANQUIER_EMAIL ?? "banquier@demo.local";
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Banquier Demo",
      role: UserRole.BANQUIER,
      emailVerified: new Date(),
    },
    update: { role: UserRole.BANQUIER },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
