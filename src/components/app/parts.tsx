import Link from "next/link";
import { LinkIcon, MonitorIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ header */

/** Eyebrow, title, one line of context, and the page's actions. One filled button at most. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-2 text-[11.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance lg:text-[32px]">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- panel */

/** The one card. Header band separated by a rule; body is flush so lists can run edge to edge. */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-[14px] border bg-card", className)}>
      {title && (
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b bg-muted/60 px-[18px] py-2.5">
          <h2 className="shrink-0 text-[13.5px] font-medium">{title}</h2>
          {action && <div className="flex items-center gap-2 text-[13px] text-muted-foreground">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Rows inside a Panel, divided by hairlines. */
export function PanelRows({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-soft", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ status */

/** A state is a glyph plus a word. Only states that need the person's action use ember text. */
export function Status({
  icon: Icon,
  children,
  attention,
  className,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  attention?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap", attention ? "text-ember-ink" : "text-foreground", className)}>
      <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- territory */

export type Territory = "yours" | "contested" | "theirs";

const TERRITORY_LABEL: Record<Territory, string> = { yours: "Yours", contested: "Contested", theirs: "Theirs" };

/** Filled = yours, half = contested, ring = theirs. Shape carries it; ember only fills "yours". */
export function TerritoryGlyph({ kind, className, decorative }: { kind: Territory; className?: string; /** Set when the word is already next to it. */ decorative?: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": TERRITORY_LABEL[kind] })}
      className={cn("size-2.5 shrink-0", className)}
    >
      {kind === "yours" && <circle cx="6" cy="6" r="5" fill="var(--ember)" />}
      {kind === "contested" && (
        <>
          <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 1.6a4.4 4.4 0 0 1 0 8.8Z" fill="currentColor" />
        </>
      )}
      {kind === "theirs" && <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.3" />}
    </svg>
  );
}

/* -------------------------------------------------------------------- chip */

/** A quiet outline pill for categories and filters. Never filled with colour. */
export function Chip({ children, className, icon: Icon }: { children: React.ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-1 rounded-full border bg-card px-2 text-[12px] font-medium whitespace-nowrap", className)}>
      {Icon && <Icon className="size-3 text-muted-foreground" strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}

/** Where a claim comes from. Every number on a map links back to one of these. */
export function Evidence({ children, mono, className, always }: { children: React.ReactNode; mono?: boolean; className?: string; /** Briefs keep their sources even when inline chips are turned off. */ always?: boolean }) {
  return (
    <span data-evidence={always ? undefined : ""} className={cn("inline-flex h-5 items-center gap-1 rounded-md border bg-muted px-1.5 text-[11px] whitespace-nowrap text-foreground/80", mono && "font-mono", className)}>
      <LinkIcon className="size-[11px] text-muted-foreground" strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- marks */

/** An organisation's mark: its logo, or its initial on a tile. Agencies get ember, clients stay neutral. */
export function BrandMark({
  name,
  logo,
  tone = "neutral",
  size = "sm",
  className,
}: {
  name: string;
  logo?: string | null;
  tone?: "ember" | "ink" | "neutral";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const box = { xs: "size-5 rounded-[5px] text-[10px]", sm: "size-6 rounded-md text-[12px]", md: "size-8 rounded-lg text-[14px]", lg: "size-11 rounded-xl text-lg", xl: "size-16 rounded-2xl text-2xl" }[size];
  const colour = {
    ember: "bg-ember text-white",
    ink: "bg-foreground text-background",
    neutral: "border bg-muted text-foreground/80",
  }[tone];
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- user-supplied logo from any host
    return <img src={logo} alt="" className={cn(box, "shrink-0 object-cover", className)} />;
  }
  return (
    <span aria-hidden className={cn(box, colour, "flex shrink-0 items-center justify-center font-semibold", className)}>
      {initialOf(name)}
    </span>
  );
}

export function initialOf(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const parts = words.length > 1 ? words.filter((w) => !/^(the|a|an|of|and|&)$/i.test(w)) : words;
  if (!parts.length) return "?";
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

/* ------------------------------------------------------------------- notes */

/** Labels sample content so nobody mistakes a mockup for their data. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      title="This screen shows sample data until the Culture Map engine is connected."
      className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border border-dashed px-2.5 text-[12px] text-muted-foreground", className)}
    >
      <span className="size-1.5 rounded-full bg-faint" aria-hidden />
      Sample data
    </span>
  );
}

/**
 * Dense views (three-column maps, ad timelines) don't survive a phone. Below `md`
 * this says so plainly instead of squashing the content.
 */
export function WideOnly({ children, what = "This view", className }: { children: React.ReactNode; what?: string; className?: string }) {
  return (
    <>
      <div className={cn("hidden md:block", className)}>{children}</div>
      <div className="flex flex-col items-center rounded-[14px] border border-dashed bg-muted/40 px-6 py-10 text-center md:hidden">
        <MonitorIcon className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <p className="mt-3 text-[15px] font-medium">{what} needs a wider screen</p>
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Open it on a tablet or laptop to see every column side by side.
        </p>
      </div>
    </>
  );
}

/** A label/value pair for detail strips ("Access · Edit"). */
export function Meta({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-[13.5px] font-medium">{children}</div>
    </div>
  );
}

/** A quiet "see all" style link. */
export function TextLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-[13px] font-medium underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground", className)}>
      {children}
    </Link>
  );
}

/** Two-tone bar: ember share against ink. Used for lean and usage. */
export function LeanBar({ left, className }: { left: number; className?: string }) {
  const l = Math.max(0, Math.min(100, left));
  return (
    <span className={cn("flex h-1.5 w-[72px] gap-0.5 overflow-hidden rounded-full", className)} aria-label={`${l} to ${100 - l}`} role="img">
      <span className="h-full rounded-l-full bg-ember" style={{ width: `${l}%` }} />
      <span className="h-full flex-1 rounded-r-full bg-foreground/80" />
    </span>
  );
}
