import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { LogoutButton } from "./logout-button";
import { EcobankLogo } from "@/components/shared/EcobankLogo";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.BANQUIER) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3fbff] via-background to-background">
      <header className="border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/backoffice/dashboard" className="shrink-0">
              <EcobankLogo className="w-[140px] sm:w-[170px]" />
            </Link>
            <nav className="flex items-center gap-2 text-xs font-medium sm:gap-4 sm:text-sm">
              <Link
                href="/backoffice/dashboard"
                className="rounded-md px-2 py-1 text-[#00577a] hover:bg-[#00577a]/10"
              >
                Tableau de bord
              </Link>
              <Link
                href="/backoffice/scan"
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-[#00577a]/10 hover:text-[#00577a]"
              >
                Scanner QR
              </Link>
            </nav>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
              {session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
    </div>
  );
}
