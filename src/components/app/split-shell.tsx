import Image, { type StaticImageData } from "next/image";
import { CheckIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * The onboarding, invite and claim layout: the task on the left, context on the right.
 * Below `lg` the right panel steps aside so the task gets the whole screen.
 */
export function SplitShell({
  meta,
  children,
  aside,
  footnote,
}: {
  meta?: React.ReactNode;
  children: React.ReactNode;
  aside: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <main className="flex min-h-svh min-w-0 flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-4">
          <Logo href="/dashboard" />
          {meta && <div className="truncate text-[13px] text-muted-foreground">{meta}</div>}
        </header>
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="w-full max-w-[560px]">{children}</div>
        </div>
        {footnote && <footer className="text-[12.5px] text-muted-foreground">{footnote}</footer>}
      </main>
      <aside className="hidden p-3 lg:block">
        <div className="sticky top-3 h-[calc(100svh-1.5rem)] min-h-150">{aside}</div>
      </aside>
    </div>
  );
}

/** Full-bleed photo with a frosted card of what the person gets. */
export function PhotoAside({
  image,
  alt,
  eyebrow,
  title,
  points,
}: {
  image: StaticImageData;
  alt: string;
  eyebrow: string;
  title: string;
  points: string[];
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-[22px] bg-muted">
      <Image src={image} alt={alt} fill priority placeholder="blur" sizes="50vw" className="object-cover" />
      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/15 bg-black/45 p-7 text-white backdrop-blur-xl">
        <p className="flex items-center gap-2 text-[11.5px] font-medium tracking-[0.12em] uppercase">
          <span className="size-1.5 rounded-full bg-ember" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">{title}</h2>
        <ul className="mt-5 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-[15px] text-white/90">
              <CheckIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** A quiet grey panel for previews and reference tables. */
export function PanelAside({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex h-full flex-col justify-center overflow-y-auto rounded-[22px] border bg-muted/70 px-10 py-12", className)}>{children}</div>;
}

/** Step indicator: done ✓, current ◯ in ember, upcoming ◯. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]" aria-label="Progress">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li key={step} className="flex items-center gap-3" aria-current={state === "current" ? "step" : undefined}>
            <span className={cn("flex items-center gap-2", state === "upcoming" ? "text-muted-foreground" : "text-foreground", state === "current" && "font-medium")}>
              <span
                aria-hidden
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border-[1.5px]",
                  state === "done" && "border-ember bg-ember text-white",
                  state === "current" && "border-ember",
                  state === "upcoming" && "border-faint",
                )}
              >
                {state === "done" && <CheckIcon className="size-2.5" strokeWidth={3.5} />}
              </span>
              {step}
              <span className="sr-only">{state === "done" ? "(done)" : state === "current" ? "(current step)" : ""}</span>
            </span>
            {i < steps.length - 1 && <span aria-hidden className="h-px w-8 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
