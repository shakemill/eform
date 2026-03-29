import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { EcobankLogo } from "@/components/shared/EcobankLogo";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "BANQUIER") {
    redirect("/backoffice/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-[#00577a]/15 bg-card p-6 shadow-sm sm:p-8">
        <EcobankLogo className="mb-5 w-[170px]" priority />
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#00577a]">
          Connexion banquier
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Recevez un lien sécurisé par email pour accéder au back-office.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
