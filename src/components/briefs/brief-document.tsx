"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { BrandMark, TerritoryGlyph } from "@/components/app/parts";
import { LogoMark } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLACEMENTS } from "@/lib/ads";
import { type Brief, type BriefItem, type BriefRef, type Section, SECTION_HINT, SECTION_TITLE, SECTIONS } from "@/lib/briefs";
import { cn } from "@/lib/utils";

const GLYPH = { YOURS: "yours", CONTESTED: "contested", THEIRS: "theirs" } as const;
const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const channel = (id: string) => PLACEMENTS.find((p) => p.id === id)?.label ?? id;

export type Editing = {
  items: (Omit<BriefItem, "id"> & { id?: string; key: string })[];
  change: (key: string, text: string) => void;
  remove: (key: string) => void;
  add: (section: Section) => void;
};

/**
 * A brief as a document (Cultural X-Ray's report style): the brand and our mark at the top, the title,
 * numbered sections, and the map items each line rests on. The same component is the page, the print
 * and the share link; in print, sources become numbered notes because there are no tooltips on paper.
 */
export function BriefDocument({ brief, editing, className }: { brief: Brief; editing?: Editing; className?: string }) {
  const items = editing?.items ?? brief.items.map((i) => ({ ...i, key: i.id }));
  // Every source once, numbered in the order it's first cited, for the notes at the end.
  const sources: BriefRef[] = [];
  for (const i of items) for (const r of i.refs ?? []) if (!sources.some((s) => s.entityId === r.entityId)) sources.push(r);
  const note = (r: BriefRef) => sources.findIndex((s) => s.entityId === r.entityId) + 1;
  const agency = brief.authorOrg?.kind === "AGENCY" ? brief.authorOrg.name : null;

  return (
    <article className={cn("brief-doc mx-auto w-full max-w-[860px] rounded-[20px] border bg-card px-6 py-8 shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:px-12 sm:py-12 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none", className)}>
      <header className="flex items-start justify-between gap-6 border-b pb-6">
        <div className="flex items-center gap-3">
          <BrandMark name={brief.workspace.name} logo={brief.workspace.logo} size="lg" />
          <div>
            <p className="text-[15px] font-semibold">{brief.workspace.name}</p>
            <p className="text-[12.5px] text-muted-foreground">{agency ? `Prepared by ${agency}` : brief.author?.name ? `Prepared by ${brief.author.name}` : "Creative brief"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-[0.12em] text-ember-ink uppercase">Creative brief</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{date(brief.updatedAt)}</p>
        </div>
      </header>

      <div className="pt-8 pb-6">
        <h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">{brief.title}</h1>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
          {brief.occasion && <Meta label="For" value={brief.occasion} />}
          {brief.placements.length > 0 && <Meta label="Runs on" value={brief.placements.map(channel).join(", ")} />}
          <Meta label="Market" value={brief.market === "GB" ? "United Kingdom" : "United States"} />
        </dl>
      </div>

      <div className="divide-y">
        {SECTIONS.map((s, n) => {
          const lines = items.filter((i) => i.section === s);
          if (!lines.length && !editing) return null;
          return (
            <section key={s} className="grid gap-x-8 gap-y-3 py-6 break-inside-avoid sm:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="font-mono text-[11.5px] text-ember-ink tabular-nums">{String(n + 1).padStart(2, "0")}</p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">{SECTION_TITLE[s]}</h2>
                {editing && <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{SECTION_HINT[s]}</p>}
              </div>
              <div className="min-w-0 space-y-3">
                {lines.map((l) =>
                  editing ? (
                    <div key={l.key} className="group flex items-start gap-2">
                      <textarea
                        value={l.text}
                        onChange={(e) => editing.change(l.key, e.target.value)}
                        rows={Math.max(1, Math.ceil(l.text.length / 80))}
                        aria-label={`${SECTION_TITLE[s]} line`}
                        className="min-h-9 flex-1 resize-y rounded-[10px] border bg-background px-3 py-2 text-[15px] leading-relaxed outline-none focus-visible:border-ember focus-visible:ring-3 focus-visible:ring-ember/20"
                      />
                      <button type="button" onClick={() => editing.remove(l.key)} aria-label="Remove this line" className="mt-1.5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div key={l.key}>
                      <p className={cn("leading-relaxed text-pretty", s === "proposition" && !l.text.startsWith("Tone:") ? "text-[20px] font-medium tracking-[-0.01em]" : "text-[15px]")}>{l.text}</p>
                      {!!l.refs?.length && (
                        <p className="mt-1.5 flex flex-wrap gap-1.5">
                          {l.refs.map((r) => (
                            <Source key={r.entityId} r={r} n={note(r)} />
                          ))}
                        </p>
                      )}
                    </div>
                  ),
                )}
                {editing && (
                  <button type="button" onClick={() => editing.add(s)} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
                    <PlusIcon className="size-3.5" /> Add a line
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {sources.length > 0 && (
        <section className="mt-2 border-t pt-6 break-inside-avoid">
          <h2 className="text-[12px] font-medium tracking-[0.1em] text-muted-foreground uppercase">What it rests on</h2>
          <ol className="mt-3 grid gap-x-8 gap-y-2 text-[12.5px] leading-snug text-muted-foreground sm:grid-cols-2">
            {sources.map((r, i) => (
              <li key={r.entityId} className="flex gap-2">
                <span className="font-mono text-ember-ink tabular-nums">{i + 1}</span>
                <span>
                  <span className="font-medium text-foreground">{r.name}.</span> {r.proof}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="mt-10 flex items-center justify-between gap-4 border-t pt-5 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <LogoMark className="size-4 text-ember" />
          Written from {brief.workspace.name}’s Culture Map on Cultural X-Ray
        </span>
        <span>Culture data from Qloo</span>
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/** A cited map item: glyph and name, the sentence behind it on hover, a note number in print. */
function Source({ r, n }: { r: BriefRef; n: number }) {
  const chip = (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border bg-muted/60 px-2 text-[12px] text-foreground/85 print:border-0 print:bg-transparent print:px-0">
      <TerritoryGlyph kind={GLYPH[r.label]} decorative className="size-2.5" />
      {r.name}
      <sup className="hidden font-mono text-[9px] text-ember-ink print:inline">{n}</sup>
    </span>
  );
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}>{chip}</TooltipTrigger>
      <TooltipContent className="max-w-[300px] text-left leading-relaxed">{r.proof}</TooltipContent>
    </Tooltip>
  );
}
