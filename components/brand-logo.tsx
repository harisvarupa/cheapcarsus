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
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-orange-500/20",
          markClassName,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-10 w-10" role="img">
          <defs>
            <linearGradient id="cheapcarsus-logo-gradient" x1="12" y1="10" x2="52" y2="54">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="48%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          <path
            d="M13 37.5h38.2c3.3 0 6 2.7 6 6v2.2H6.8v-2.2c0-3.3 2.8-6 6.2-6Z"
            fill="url(#cheapcarsus-logo-gradient)"
          />
          <path
            d="M17.7 36.9 23 25.8c1.2-2.6 3.9-4.3 6.8-4.3h10.4c2.9 0 5.5 1.7 6.8 4.3l5.2 11.1H17.7Z"
            fill="#FFF7ED"
          />
          <path
            d="M25.7 27.8c.7-1.4 2.1-2.3 3.7-2.3h11.1c1.6 0 3.1.9 3.8 2.3l2.7 5.6H23l2.7-5.6Z"
            fill="#0F172A"
          />
          <path
            d="M13.2 36.8c1.8-5.6 6.9-9.7 13.1-9.7h14.3c6.1 0 11.4 4.1 13.1 9.7"
            fill="none"
            stroke="#FED7AA"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="18.5" cy="46" r="5.8" fill="#0F172A" stroke="#FDBA74" strokeWidth="2.5" />
          <circle cx="45.5" cy="46" r="5.8" fill="#0F172A" stroke="#FDBA74" strokeWidth="2.5" />
          <path
            d="M8.5 19.5c5.6-5.2 13.6-8 23.5-8s17.9 2.8 23.5 8"
            fill="none"
            stroke="#FDBA74"
            strokeLinecap="round"
            strokeWidth="3.6"
          />
          <path
            d="M17 20c3.9-2.9 9-4.4 15-4.4S43.1 17.1 47 20"
            fill="none"
            stroke="#FFF7ED"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
      </span>

      {showWordmark ? (
        <span>
          <span
            className={cn(
              "block text-xl font-black tracking-tight",
              inverted ? "text-white" : "text-slate-950",
            )}
          >
            cheapcarsus
          </span>
          <span
            className={cn(
              "hidden text-xs font-semibold uppercase tracking-[0.22em] sm:block",
              inverted ? "text-slate-400" : "text-slate-500",
            )}
          >
            Used cars, clear deals
          </span>
        </span>
      ) : null}
    </span>
  );
}
