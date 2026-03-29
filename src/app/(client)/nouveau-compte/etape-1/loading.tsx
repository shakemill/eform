import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Skeleton className="mb-8 h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
