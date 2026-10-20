import Link from "next/link";
import { cn } from "@/lib/utils";

/** A lens over a cross-section: the map is what you see through it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-6", className)}>
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 15.5c2.2-1.6 4.4-1.6 6.5 0s4.3 1.6 6.5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 11c2.2-1.6 4.4-1.6 6.5 0s4.3 1.6 6.5 0" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.5" cy="7.25" r="1.6" fill="var(--ember)" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-[17px] font-semibold leading-none tracking-[-0.02em] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <LogoMark />
      <span>
        Cultural <span className="font-normal text-muted-foreground">X-Ray</span>
      </span>
    </Link>
  );
}
