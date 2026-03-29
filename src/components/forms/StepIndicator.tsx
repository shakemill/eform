import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Identité" },
  { n: 2, label: "Compte" },
  { n: 3, label: "Récapitulatif" },
  { n: 4, label: "Confirmation" },
];

/**
 * Multi-step progress for the account opening wizard.
 */
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 sm:gap-4" aria-label="Étapes">
      {STEPS.map((s) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <li key={s.n} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium",
                done && "border-primary bg-primary text-primary-foreground",
                active &&
                  !done &&
                  "border-primary text-primary",
                !active && !done && "border-muted-foreground/30 text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              {s.n}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
