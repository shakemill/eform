import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Skeleton className="h-72 w-full" />
    </main>
  );
}
