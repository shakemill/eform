## eForm – Supabase Postgres migration (progressive)

This project now supports progressive migration from local Postgres to Supabase Postgres while keeping Prisma + NextAuth unchanged.

### Email (SMTP ou Resend)

Si `MAIL_HOST`, `MAIL_USERNAME` et `MAIL_PASSWORD` sont définis, tous les envois (magic link banquier, email QR client, notifications banquier) passent par **SMTP** (Nodemailer). Sinon, l’app retombe sur **Resend** si `RESEND_API_KEY` est défini.

Variables: voir `.env.example` (`MAIL_*`).

### 1) Configure environment variables

In `.env`:

```bash
# Runtime (can use Supabase pooler)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# Prisma migrations / pg_restore (direct DB host)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require"
```

### 2) Deploy Prisma schema to Supabase

```bash
npm run db:migrate:supabase
```

### 3) Export local data and import to Supabase

```bash
# Export current local DB
LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eform?schema=public" npm run db:export:local

# Import dump into Supabase (uses DIRECT_URL from .env)
npm run db:import:supabase
```

### 4) Validate migrated tables

```bash
npm run db:check:supabase
```

### 5) Rollback strategy

- Keep previous local `DATABASE_URL` value.
- If needed, switch `.env` back to local URL and restart app.

### 6) Production hardening checklist

- Prefer Supabase pooler for runtime `DATABASE_URL` (when region/pooler host is confirmed).
- Keep `DIRECT_URL` for Prisma migrations and restore operations only.
- Rotate secrets after migration:
  - DB password
  - `NEXTAUTH_SECRET`
  - `ANTHROPIC_API_KEY`
  - `RESEND_API_KEY`
- Keep `LOCAL_DATABASE_URL` for rollback window, then remove it when stable.
- Run app smoke checks after cutover:

```bash
# optional 2nd arg = known demandeId
npm run db:smoke:app -- http://localhost:3000 cmn4p9uj30004i45w34f20qi3
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
