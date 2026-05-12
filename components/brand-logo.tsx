import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverted?: boolean;
};

export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  inverted = false,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/cheap-cars-us-logo.png"
        alt="Cheap Cars US"
        width={1024}
        height={1024}
        priority
        className={cn(
          "h-14 w-48 rounded-xl object-cover",
          inverted && "bg-white ring-1 ring-white/10",
          !showWordmark && "w-14",
          markClassName,
        )}
      />
    </span>
  );
}
