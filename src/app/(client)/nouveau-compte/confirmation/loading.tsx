import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Skeleton className="mx-auto h-72 w-72" />
    </main>
  );
}
