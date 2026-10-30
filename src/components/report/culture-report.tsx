import { BrandMark, TerritoryGlyph } from "@/components/app/parts";
import { LogoMark } from "@/components/brand/logo";
import type { AdSummary } from "@/lib/ads";
import { type AudienceData, shadeOf, strengthWord } from "@/lib/audience";
import { type Basis, wordsFor } from "@/lib/basis";
import { type CultureMap, holderOf, type MapCategory, territoryOf } from "@/lib/maps";
import { KIND_WORD, type Play } from "@/lib/plays";
import { cn } from "@/lib/utils";

/**
 * The culture report (Share and Export PDF on the overview): a brand's Culture Map as a document in
 * Cultural X-Ray's own style. A cover, then the read, a chart of who holds what in each category, the
 * highlights, who the customers are and where they go, the plays and the latest ad checks. On paper it
 * prints as A4 pages (globals.css), with charts drawn as SVG so they stay sharp in the PDF.
 */
export type Report = {
  brand: { id: string; name: string; logo: string | null; market: string };
  map: CultureMap | null;
  audience: AudienceData | null;
  plays: Play[];
  ads: AdSummary[];
  basis: Basis | null;
  generatedAt: string;
};

const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const COLOURS = { yours: "var(--ember)", contested: "#a1a1aa", theirs: "#3f3f46" };

export function CultureReport({ report }: { report: Report }) {
  const { brand, map, audience } = report;
  const words = wordsFor(report.basis, brand.name, false);
  const rivals = map?.subjects.filter((s) => s.role === "RIVAL").map((s) => s.name) ?? [];
  const seeds = map?.subjects.filter((s) => s.role === "SEED").map((s) => s.name) ?? [];
  // Stand-ins only when Qloo doesn't know the brand; otherwise read-through brands just add to it.
  const known = map?.subjects.some((s) => s.role === "SELF") ?? true;
  const through = known ? [] : seeds;
  const cats = (map?.categories ?? []).filter((c) => c.done && c.items.length);
  const top = cats.flatMap((c) => c.items.filter((i) => i.label === "YOURS").slice(0, 1).map((i) => ({ c, i }))).slice(0, 4);

  return (
    <div className="report mx-auto w-full max-w-[860px] space-y-6 print:max-w-none print:space-y-0">
      {/* Cover */}
      <Page className="flex min-h-[900px] flex-col justify-between bg-[#111113] text-white print:min-h-[262mm]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] text-white/70">
            <LogoMark className="size-5 text-ember" />
            Cultural X-Ray
          </span>
          <span className="text-[12.5px] text-white/60">{date(report.generatedAt)}</span>
        </div>
        <div>
          <BrandMark name={brand.name} logo={brand.logo} size="xl" tone="ember" className="size-20 rounded-[22px] text-[32px]" />
          <p className="mt-8 text-[12px] font-medium tracking-[0.16em] text-ember uppercase">Culture report</p>
          <h1 className="mt-3 text-[52px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">{brand.name}</h1>
          <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-white/75">
            What {words.who} watch, listen to, follow and visit{rivals.length ? `, and how it compares with ${rivals.join(", ")}` : ""}.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-6 border-t border-white/15 pt-6 text-[13px] sm:grid-cols-4">
          <CoverFact label="Market" value={brand.market === "US" ? "United States" : "United Kingdom"} />
          <CoverFact label="Compared with" value={rivals.join(", ") || "No rivals yet"} />
          {seeds.length > 0 && <CoverFact label="Read through" value={seeds.join(", ")} />}
          <CoverFact label="Built from" value={map ? `${map.queryCount} Qloo lookups` : "No map yet"} />
        </dl>
      </Page>

      {!map ? (
        <Page>
          <p className="text-[15px] text-muted-foreground">{brand.name} has no Culture Map yet, so there’s nothing to report. Build it from the overview.</p>
        </Page>
      ) : (
        <>
          <Page>
            <Kicker n="01">At a glance</Kicker>
            {through.length > 0 && (
              <p className="mb-4 rounded-[12px] border bg-muted/60 px-4 py-3 text-[13.5px] leading-relaxed">
                Qloo doesn’t know {brand.name} yet, so this reads {through.join(", ")} customers instead. They stand in for the customers you’re after.
              </p>
            )}
            <p className="text-[24px] leading-[1.35] font-medium tracking-[-0.015em] text-pretty">
              {top.length
                ? `${capital(words.who)} love ${top.map((t) => t.i.name).join(", ")}: each high on their list and on no rival’s.`
                : `${capital(words.who)} share most of their culture with rivals’ customers. The categories below show where you can stand apart.`}
            </p>
            <h3 className="mt-10 mb-1 text-[14px] font-semibold">Who holds what, by category</h3>
            <p className="mb-4 text-[13px] text-muted-foreground">Out of the top items for {words.who} and their rivals’ customers on Qloo.</p>
            <TerritoryChart cats={cats} own={words.ownColumn} />
          </Page>

          <Page>
            <Kicker n="02">What {words.who} love</Kicker>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {cats.map((c) => (
                <section key={c.kind} className="break-inside-avoid">
                  <h3 className="text-[15px] font-semibold">{c.label}</h3>
                  {c.reading && <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{c.reading}</p>}
                  <ul className="mt-2.5 space-y-1.5">
                    {c.items.slice(0, 4).map((i) => (
                      <li key={i.id} className="flex items-center gap-2 text-[13.5px]">
                        <TerritoryGlyph kind={territoryOf(i.label)} decorative className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                        <span className="shrink-0 text-[12px] text-muted-foreground">{holderOf(i)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <Legend own={words.ownColumn} />
          </Page>

          {audience && (
            <Page>
              <Kicker n="03">Who they are, and where they go</Kicker>
              {audience.hasAudience && <AudienceChart data={audience} />}
              <h3 className="mt-10 mb-3 text-[14px] font-semibold">Places {words.who} pick</h3>
              <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {audience.places
                  .filter((p) => p.ranks.you)
                  .sort((a, b) => a.ranks.you! - b.ranks.you!)
                  .slice(0, 10)
                  .map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 border-b py-2 text-[13.5px]">
                      <span className="w-5 font-mono text-[12px] text-ember-ink tabular-nums">{i + 1}</span>
                      <TerritoryGlyph kind={territoryOf(p.label)} decorative className="shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        {p.detail && <span className="block truncate text-[12px] text-muted-foreground">{p.detail}</span>}
                      </span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">{p.label === "YOURS" ? "Only yours" : `Shared with ${p.rival}`}</span>
                    </li>
                  ))}
              </ol>
            </Page>
          )}

          {(report.plays.length > 0 || report.ads.length > 0) && (
            <Page>
              {report.plays.length > 0 && (
                <>
                  <Kicker n="04">What to do next</Kicker>
                  <ol className="space-y-4">
                    {report.plays.slice(0, 6).map((p, i) => (
                      <li key={p.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 break-inside-avoid">
                        <span className="font-mono text-[12px] text-ember-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{KIND_WORD[p.kind]}</p>
                          <p className="text-[16px] font-semibold tracking-[-0.01em]">{p.title}</p>
                          {p.why && <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/80">{p.why}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {report.ads.length > 0 && (
                <>
                  <Kicker n={report.plays.length ? "05" : "04"} className="mt-12">
                    Latest ad checks
                  </Kicker>
                  <ul className="divide-y rounded-[14px] border">
                    {report.ads.map((a) => (
                      <li key={a.id} className="px-4 py-3 break-inside-avoid">
                        <p className="text-[14.5px] font-semibold">{a.title}</p>
                        {a.headline && <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">{a.headline}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Page>
          )}
        </>
      )}

      <footer className="flex items-center justify-between gap-4 px-2 pb-6 text-[12px] text-muted-foreground print:fixed print:inset-x-0 print:bottom-0 print:hidden">
        <span className="flex items-center gap-2">
          <LogoMark className="size-4 text-ember" />
          Cultural X-Ray · {brand.name}
        </span>
        <span>Culture data from Qloo · {date(report.generatedAt)}</span>
      </footer>
    </div>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-[20px] border bg-card px-6 py-10 sm:px-12 print:break-after-page print:rounded-none print:border-0 print:px-0 print:py-0", className)}>{children}</section>;
}

function Kicker({ n, children, className }: { n: string; children: React.ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 flex items-baseline gap-3 border-b pb-3", className)}>
      <span className="font-mono text-[12px] text-ember-ink tabular-nums">{n}</span>
      <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{children}</h2>
    </header>
  );
}

function CoverFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/50">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Legend({ own }: { own: string }) {
  return (
    <p className="mt-8 flex flex-wrap gap-x-5 gap-y-1 border-t pt-4 text-[12px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <TerritoryGlyph kind="yours" decorative /> {own}: only your customers rank it
      </span>
      <span className="flex items-center gap-1.5">
        <TerritoryGlyph kind="contested" decorative /> Shared with a rival
      </span>
      <span className="flex items-center gap-1.5">
        <TerritoryGlyph kind="theirs" decorative /> Only a rival’s
      </span>
    </p>
  );
}

/** One bar per category: how many of its top items are only yours, shared, or a rival's. Counts, not scores. */
function TerritoryChart({ cats, own }: { cats: MapCategory[]; own: string }) {
  const W = 640, row = 30, label = 96, H = cats.length * row;
  const max = Math.max(1, ...cats.map((c) => c.counts.yours + c.counts.contested + c.counts.theirs));
  const scale = (n: number) => (n / max) * (W - label - 40);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Items only yours, shared and only a rival's, by category" className="overflow-visible">
        {cats.map((c, i) => {
          const y = i * row;
          const parts = [
            ["yours", c.counts.yours],
            ["contested", c.counts.contested],
            ["theirs", c.counts.theirs],
          ] as const;
          let x = label;
          return (
            <g key={c.kind}>
              <text x={0} y={y + 18} fontSize="12.5" fill="currentColor">
                {c.label}
              </text>
              {parts.map(([k, n]) => {
                const w = scale(n);
                const el = (
                  <g key={k}>
                    <rect x={x} y={y + 6} width={Math.max(0, w - 2)} height={16} rx={3} fill={COLOURS[k]} />
                    {w > 22 && (
                      <text x={x + w / 2 - 1} y={y + 18} fontSize="10.5" textAnchor="middle" fill={k === "contested" ? "#111113" : "#ffffff"}>
                        {n}
                      </text>
                    )}
                  </g>
                );
                x += w;
                return el;
              })}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
        <Swatch c={COLOURS.yours}>{own}</Swatch>
        <Swatch c={COLOURS.contested}>Shared</Swatch>
        <Swatch c={COLOURS.theirs}>Only a rival’s</Swatch>
      </figcaption>
    </figure>
  );
}

function Swatch({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-[3px]" style={{ background: c }} />
      {children}
    </span>
  );
}

/** Each group, for the brand and each rival: a bar as strong as the pull, and the word for it. */
function AudienceChart({ data }: { data: AudienceData }) {
  const sides = data.sides.slice(0, 3);
  const segs = data.segments.filter((s) => sides.some((side) => s.cells[side.key]?.value != null));
  return (
    <figure>
      <h3 className="mb-1 text-[14px] font-semibold">How strongly each group goes for each brand</h3>
      <p className="mb-4 text-[13px] text-muted-foreground">Longer means a stronger pull. Words, not scores: very strong, strong, good, some, weak.</p>
      <div className="overflow-hidden rounded-[14px] border">
        <table className="w-full text-[12.5px]">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Group</th>
              {sides.map((s) => (
                <th key={s.key} className="px-3 py-2 font-medium">
                  {s.key === "you" ? (s.readThrough ? "Brands like yours" : "Your customers") : s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {segs.map((seg) => (
              <tr key={seg.key} className="break-inside-avoid">
                <td className="px-3 py-2 font-medium">{seg.label}</td>
                {sides.map((s) => {
                  const cell = seg.cells[s.key];
                  const shade = shadeOf(cell);
                  return (
                    <td key={s.key} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-20 overflow-hidden rounded-full bg-soft">
                          {shade != null && <span className="block h-full rounded-full" style={{ width: `${Math.max(6, shade * 100)}%`, background: s.key === "you" ? COLOURS.yours : COLOURS.theirs }} />}
                        </span>
                        <span className={cn(cell?.lowConfidence && "text-muted-foreground")}>{strengthWord(cell)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

