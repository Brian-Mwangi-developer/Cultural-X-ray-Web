import Image from "next/image";
import { ArrowRightIcon, PlayIcon, ShieldCheckIcon, UploadIcon } from "lucide-react";
import { Panel, SampleBadge, TerritoryGlyph, WideOnly, type Territory } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { PageBody, TopBar, type Crumb } from "@/components/shell/top-bar";
import { AD_FIXES, AD_PULLS, AD_TRACKS, PHOTOS } from "@/lib/sample-data";
import { possessive } from "@/lib/intent";
import { cn } from "@/lib/utils";

const DURATION = 30;

/** a4: where a draft ad lands on the map, and what to change. */
export function AdCheckView({ crumbs, brand, rival }: { crumbs: Crumb[]; brand: string; rival: string }) {
  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            <SampleBadge className="hidden sm:inline-flex" />
            <SoonButton variant="outline" size="pill" className="hidden md:inline-flex" message="Uploading ads arrives with the ad-check engine.">
              <UploadIcon data-icon="inline-start" />
              Check another
            </SoonButton>
            <SoonButton size="pill" message="Sending fixes to a brief arrives with briefs.">
              <ArrowRightIcon data-icon="inline-start" />
              Send fixes to brief
            </SoonButton>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-4">
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.03em] lg:text-[34px]">Draft · Trailhead 30s</h1>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">Uploaded 2 h ago · read in 74 s · 31 elements found</p>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-[14px] bg-muted">
              <Image src={PHOTOS.misty} alt="Frame from the draft: a hiker on a foggy ridge" fill sizes="(min-width:1280px) 60vw, 100vw" className="object-cover" placeholder="blur" />
              <Tag className="top-[34%] left-[46%]" territory="theirs">
                Tactical shell · theirs
              </Tag>
              <Tag className="bottom-[16%] left-[8%]" territory="theirs">
                Foggy ridge · theirs
              </Tag>
              <span className="absolute bottom-4 left-4 inline-flex h-9 items-center gap-2 rounded-full bg-black/55 px-3.5 font-mono text-[13px] text-white backdrop-blur">
                <PlayIcon className="size-3.5 fill-white" aria-hidden />
                0:07 / 0:30
              </span>
            </div>

            <WideOnly what="The ad timeline">
              <section className="rounded-[14px] border bg-card px-4 py-4" aria-label="Timeline of what the ad shows and says">
                <div className="grid grid-cols-[88px_1fr] items-end gap-3 pb-2">
                  <span />
                  <div className="flex justify-between font-mono text-[11px] text-faint">
                    {[0, 5, 10, 15, 20, 25, 30].map((s) => (
                      <span key={s}>0:{String(s).padStart(2, "0")}</span>
                    ))}
                  </div>
                </div>
                <div className="relative space-y-2">
                  <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-ember" style={{ left: `calc(88px + 0.75rem + (100% - 88px - 0.75rem) * ${7 / DURATION})` }} />
                  {AD_TRACKS.map((track) => (
                    <div key={track.lane} className="grid grid-cols-[88px_1fr] items-center gap-3">
                      <span className="text-[13px] text-muted-foreground">{track.lane}</span>
                      <div className="relative h-8 rounded-lg bg-muted/60">
                        {track.spans.map((span) => (
                          <span
                            key={span.label}
                            className={cn(
                              "absolute inset-y-0.5 flex items-center gap-1.5 overflow-hidden rounded-md border bg-card px-2 text-[12px] whitespace-nowrap",
                              span.territory === "yours" && "border-ember/70 bg-ember-soft",
                            )}
                            style={{ left: `${(span.from / DURATION) * 100}%`, width: `${((span.to - span.from) / DURATION) * 100}%` }}
                            title={span.label}
                          >
                            <TerritoryGlyph kind={span.territory} />
                            <span className="truncate">{span.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </WideOnly>
          </div>

          <aside className="space-y-4">
            <Panel title="Where it lands" action={<span>vs {possessive(brand)} map</span>}>
              <div className="px-5 py-5">
                <p className="flex items-baseline gap-3">
                  <span className="text-[52px] leading-none font-semibold tracking-[-0.04em]">80%</span>
                  <span className="text-[14.5px] leading-snug text-foreground/85">of its signals sit in {possessive(rival)} territory</span>
                </p>
                <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                  <span className="h-full w-[80%] bg-foreground/80" />
                  <span className="h-full w-[12%] bg-faint" />
                  <span className="h-full w-[8%] bg-ember" />
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                  <li className="flex items-center gap-1.5"><TerritoryGlyph kind="theirs" decorative />Theirs 80%</li>
                  <li className="flex items-center gap-1.5"><TerritoryGlyph kind="contested" decorative />Contested 12%</li>
                  <li className="flex items-center gap-1.5"><TerritoryGlyph kind="yours" decorative />Yours 8%</li>
                </ul>
              </div>
            </Panel>
            <Panel title="What pulls it there">
              <ul className="divide-y divide-soft">
                {AD_PULLS.map((p) => (
                  <li key={p.title} className="flex gap-3 px-5 py-3.5">
                    <TerritoryGlyph kind="theirs" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">{p.title}</p>
                      <p className="text-[12.5px] text-muted-foreground">{p.meta}</p>
                    </div>
                    <span className="text-[13px]">{p.weight}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Fixes from your territory" action={<span className="tabular-nums">3</span>}>
              <ul className="divide-y divide-soft">
                {AD_FIXES.map((f) => (
                  <li key={f.area} className="flex gap-3 px-5 py-3.5">
                    <TerritoryGlyph kind="yours" className="mt-1" />
                    <div>
                      <p className="text-[12.5px] text-muted-foreground">{f.area}</p>
                      <p className="text-[14px] leading-snug">{f.fix}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
            <p className="flex items-center gap-2.5 rounded-[14px] border bg-muted/60 px-4 py-3 text-[13.5px]">
              <ShieldCheckIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              No recognised commercial track. Safe to run on sound.
            </p>
          </aside>
        </div>
      </PageBody>
    </>
  );
}

function Tag({ children, className, territory }: { children: React.ReactNode; className: string; territory: Territory }) {
  return (
    <span className={cn("absolute inline-flex h-7 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[12.5px] text-white backdrop-blur", className)}>
      <TerritoryGlyph kind={territory} className="text-white" />
      {children}
    </span>
  );
}
