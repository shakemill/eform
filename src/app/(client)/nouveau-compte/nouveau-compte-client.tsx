"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type DraftRow = { id: string; updatedAt: string };

/**
 * Email entry + brouillon resume modal.
 */
export function NouveauCompteClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function go() {
    if (!email.trim()) {
      toast.error("Indiquez votre email.");
      return;
    }
    setLoading(true);
    try {
      const list = await fetch(
        `/api/demandes?email=${encodeURIComponent(email)}&statut=BROUILLON&pageSize=1`,
      );
      const lj = await list.json();
      const first = lj.data?.[0] as DraftRow | undefined;
      if (first) {
        setDraft(first);
        setDialogOpen(true);
        return;
      }
      const c = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const cj = await c.json();
      if (!c.ok) throw new Error(cj.error ?? "Erreur");
      router.push(`/nouveau-compte/etape-1?demandeId=${cj.data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de continuer");
    } finally {
      setLoading(false);
    }
  }

  function resume() {
    if (!draft) return;
    setDialogOpen(false);
    router.push(`/nouveau-compte/etape-1?demandeId=${draft.id}`);
  }

  function startFresh() {
    if (!draft) return;
    setDialogOpen(false);
    void (async () => {
      setLoading(true);
      try {
        const c = await fetch("/api/demandes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const cj = await c.json();
        if (!c.ok) throw new Error(cj.error ?? "Erreur");
        router.push(`/nouveau-compte/etape-1?demandeId=${cj.data.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="cemail">Email</Label>
          <Input
            id="cemail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            autoComplete="email"
          />
        </div>
        <Button className="w-full" onClick={go} disabled={loading}>
          {loading ? "Veuillez patienter…" : "Commencer"}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Reprendre votre demande ?</DialogTitle>
            <DialogDescription>
              Un brouillon existe pour cet email
              {draft?.updatedAt
                ? ` (dernière mise à jour : ${new Date(draft.updatedAt).toLocaleString("fr-FR")})`
                : ""}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={startFresh}>
              Nouvelle demande
            </Button>
            <Button onClick={resume}>Reprendre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
