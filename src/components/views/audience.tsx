import Image from "next/image";
import { DownloadIcon, InfoIcon } from "lucide-react";
import { Evidence, PageHeader, Panel, SampleBadge, TerritoryGlyph, WideOnly } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { PageBody, TopBar, type Crumb } from "@/components/shell/top-bar";
import { AUDIENCE_INDEX, AUDIENCE_ROWS, LOW_CONFIDENCE, PLACES, TOP_CITIES } from "@/lib/sample-data";
import { possessive } from "@/lib/intent";
import { cn } from "@/lib/utils";

/** Deeper ember means a stronger match. The number is always printed, so colour never carries it alone. */
function cellStyle(value: number) {
  const strength = Math.max(0, Math.min(1, (value - 0.35) / 0.5));
  return { backgroundColor: `color-mix(in oklab, var(--ember) ${Math.round(12 + strength * 78)}%, var(--card))` };
}

/** a5: who each brand reaches, and where. */
export function AudienceView({ crumbs, brand, rivals, market }: { crumbs: Crumb[]; brand: string; rivals: string[]; market: string }) {
  const columns = [brand, ...(rivals.length ? rivals : ["Rival one", "Rival two"])].slice(0, 3);
  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            <SampleBadge className="hidden sm:inline-flex" />
            <SoonButton variant="outline" size="pill" message="Exports arrive with the Culture Map engine.">
              <DownloadIcon data-icon="inline-start" />
              Export
            </SoonButton>
          </>
        }
      />
      <PageBody className="space-y-6">
        <PageHeader title="Who each brand reaches, and where" />
        <section className="relative rounded-[14px] border bg-card px-6 py-5">
          <span aria-hidden className="absolute top-6 bottom-6 left-0 w-[3px] rounded-r-full bg-ember" />
          <div className="flex items-start justify-between gap-4">
            <p className="max-w-4xl text-[19px] leading-[1.45] font-medium tracking-[-0.01em]">
              Past 55, {brand} holds and {columns[1]} falls away. {possessive(brand)} places are slow ones: Moab, Telluride, the Lake District.
            </p>
            <Evidence className="hidden shrink-0 md:inline-flex">21 calls</Evidence>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Panel title="Audience index" action={<span className="rounded-full border px-2.5 py-0.5 text-[12.5px]">Market {market}</span>}>
            <WideOnly what="The audience grid" className="px-5 py-5">
              <table className="w-full border-separate border-spacing-1.5 text-center">
                <thead>
                  <tr className="text-[12.5px] text-muted-foreground">
                    <th className="w-20" />
                    {columns.map((c) => (
                      <th key={c} className="px-1 pb-1 font-normal">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIENCE_ROWS.map((row, r) => (
                    <tr key={row}>
                      <th scope="row" className="pr-3 text-left text-[13.5px] font-normal">
                        {row}
                      </th>
                      {columns.map((_, c) => {
                        const value = AUDIENCE_INDEX[r]?.[c] ?? null;
                        const low = LOW_CONFIDENCE.has(`${r}-${c}`);
                        return (
                          <td
                            key={c}
                            className={cn("h-11 rounded-lg font-mono text-[13px] tabular-nums", value === null && "border border-dashed bg-transparent text-faint")}
                            style={value === null ? undefined : low ? { backgroundColor: "color-mix(in oklab, var(--ember) 14%, var(--card))" } : cellStyle(value)}
                          >
                            {value === null ? (
                              <span className="flex flex-col text-[11px]">—<span>no data</span></span>
                            ) : (
                              <span className="flex flex-col leading-tight">
                                {value.toFixed(2)}
                                {low && <span className="font-sans text-[10.5px] text-muted-foreground">low confidence</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                <InfoIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                Deeper orange means a stronger match. Older bands cluster for young brands, so they carry a confidence flag; Qloo&rsquo;s fill value is masked as no data.
              </p>
            </WideOnly>
          </Panel>

          <Panel title={`Where ${brand} over-indexes`}>
            <ul className="divide-y divide-soft">
              {PLACES.map((p) => (
                <li key={p.name} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={p.image} alt="" fill sizes="64px" className="object-cover" placeholder="blur" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{p.name}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{p.region}</span>
                    <span className="block text-[13px]">{p.note}</span>
                  </span>
                  <TerritoryGlyph kind="yours" />
                </li>
              ))}
            </ul>
            <div className="border-t px-5 py-4">
              <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Top cities</p>
              <ul className="mt-3 space-y-2.5">
                {TOP_CITIES.map((c) => (
                  <li key={c.city} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-[13.5px]">
                    {c.city}
                    <span className="h-1.5 rounded-full bg-soft">
                      <span className="block h-full rounded-full bg-ember" style={{ width: `${c.score * 100}%` }} />
                    </span>
                    <span className="font-mono text-[12.5px] text-muted-foreground tabular-nums">{c.score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
