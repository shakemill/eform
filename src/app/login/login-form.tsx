"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/backoffice/dashboard",
      });
      if (res?.error) {
        toast.error("Envoi impossible — vérifiez SMTP/Resend et l’email.");
      } else {
        toast.success("Vérifiez votre boîte mail pour le lien de connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email professionnel</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="banquier@demo.local"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Envoi…" : "Recevoir le lien"}
      </Button>
    </form>
  );
}
