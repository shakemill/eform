import Link from "next/link";
import { EcobankLogo } from "@/components/shared/EcobankLogo";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3fbff] via-background to-background">
      <header className="border-b bg-card/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/" className="shrink-0">
            <EcobankLogo className="w-[140px] sm:w-[170px]" />
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[#00577a] hover:bg-[#00577a]/10 sm:text-sm"
          >
            Espace banquier
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
