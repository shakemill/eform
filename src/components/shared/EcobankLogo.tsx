import Image from "next/image";
import { cn } from "@/lib/utils";

export function EcobankLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/ecobank-logo.png"
      alt="Ecobank"
      width={260}
      height={120}
      priority={priority}
      className={cn("h-auto w-[180px] sm:w-[220px]", className)}
    />
  );
}
