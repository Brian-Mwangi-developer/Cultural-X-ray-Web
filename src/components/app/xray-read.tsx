import { AssistantAvatar } from "@/components/ask/assistant-mark";
import { cn } from "@/lib/utils";

/**
 * X-Ray's read of something (a map, an ad): feedback, so it sits in a card with the assistant's
 * mark, never in the page title. The title is always the thing being looked at (Figma O3b, R4).
 * The reading is body type; what it rests on and what to do next go underneath.
 */
export function XRayRead({
  of,
  aside,
  children,
  basedOn,
  footer,
  compact,
  className,
}: {
  /** "of your Culture Map" beside the label. */
  of?: string;
  /** Right of the label: a source chip or the verdict's glyph and word. */
  aside?: React.ReactNode;
  /** The reading itself, one or two plain sentences. */
  children: React.ReactNode;
  basedOn?: React.ReactNode;
  footer?: React.ReactNode;
  /** For a side column (Ad check): smaller type, the action straight under the reading. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <section aria-label="X-Ray’s read" className={cn("rounded-[16px] border bg-card", compact ? "p-[18px]" : "px-5 py-[18px] sm:px-6 sm:py-5", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <AssistantAvatar size={compact ? 26 : 28} />
        <h2 className={cn("shrink-0 font-semibold", compact ? "text-[13.5px]" : "text-[14px]")}>X-Ray’s read</h2>
        {of && <span className="hidden truncate text-[13.5px] text-muted-foreground sm:inline">{of}</span>}
        {aside && <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">{aside}</div>}
      </div>
      <div className={cn("text-pretty", compact ? "mt-3 text-[15px] leading-[1.5]" : "mt-3.5 max-w-[52rem] text-[17px] leading-[1.55] sm:text-[19px]")}>{children}</div>
      {basedOn && <div className="mt-4 flex flex-wrap items-center gap-2">{basedOn}</div>}
      {footer && <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-3", compact ? "mt-4" : "mt-5 border-t pt-4")}>{footer}</div>}
    </section>
  );
}

/** One thing the read rests on: a glyph, its name and where it stands, as a quiet pill. */
export function RestsOn({ glyph, name, standing }: { glyph: React.ReactNode; name: string; standing: string }) {
  return (
    <span className="inline-flex h-[30px] max-w-full items-center gap-2 rounded-full border bg-card px-3 text-[13px]">
      {glyph}
      <span className="truncate font-medium">{name}</span>
      <span className="hidden truncate text-muted-foreground sm:inline">{standing}</span>
    </span>
  );
}
