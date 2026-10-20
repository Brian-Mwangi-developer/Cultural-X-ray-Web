"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, BellIcon, CircleCheckIcon, CircleDashedIcon, LoaderCircleIcon } from "lucide-react";
import { SampleBadge, TerritoryGlyph } from "@/components/app/parts";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { PHOTOS } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Podcasts", found: 20 },
  { name: "Films", found: 14 },
  { name: "TV", found: 20 },
  { name: "Creators", found: 18 },
  { name: "Artists", found: 16 },
  { name: "Places", found: 15 },
  { name: "Brands", found: 20 },
  { name: "Books", found: 11 },
];

const READINGS = [
  { eyebrow: "Podcasts", image: PHOTOS.mic, title: "Your people listen to wellbeing shows more than adventure ones.", chips: [["10% Happier", "yours"], ["Rich Roll", "contested"], ["Finding Mastery", "yours"]] },
  { eyebrow: "Films", image: PHOTOS.climber, title: "Conservation and climbing documentaries, not survival TV.", chips: [["A Life on Our Planet", "yours"], ["Free Solo", "contested"], ["The Dawn Wall", "yours"]] },
] as const;

const STEP_MS = 1800;

/** o2: the first build, category by category. A simulation until the engine streams real progress. */
export function MapBuilding({ slug, seeds, rivals, market }: { slug: string; seeds: string[]; rivals: string[]; market: string }) {
  const [tick, setTick] = useState(0);
  const total = CATEGORIES.length;
  const done = Math.min(total, Math.floor(tick / 2));
  const finished = done >= total;

  useEffect(() => {
    if (finished) return;
    const timer = setTimeout(() => setTick((t) => t + 1), STEP_MS / 2);
    return () => clearTimeout(timer);
  }, [tick, finished]);

  const reading = seeds.length ? seeds.join(" and ") : "your brands";
  const left = Math.max(0, Math.round(((total - done) * STEP_MS) / 1000));

  return (
    <>
      <TopBar crumbs={[{ label: "Overview" }]} actions={<SampleBadge />} />
      <PageBody>
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-live="polite">
            <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{finished ? "Your map is ready" : "Building your map"}</p>
            <p className="mt-4 flex items-baseline gap-4">
              <span className="text-[88px] leading-none font-semibold tracking-[-0.05em] tabular-nums">{done}</span>
              <span className="text-[26px] font-semibold tracking-[-0.02em] text-muted-foreground">of {total} categories</span>
            </p>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-foreground/85">
              Reading the culture around {reading} in the {market}
              {rivals.length ? `, against ${rivals.join(", ")}` : ""}. {finished ? "Done." : `About ${left} seconds left.`}
            </p>
            <div className="mt-5 h-1 max-w-lg overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Categories read">
              <div className="h-full rounded-full bg-ember transition-[width] duration-700" style={{ width: `${(done / total) * 100}%` }} />
            </div>

            <ul className="mt-7 max-w-lg divide-y rounded-[14px] border bg-card">
              {CATEGORIES.map((c, i) => {
                const state = i < done ? "done" : i === done && !finished ? "running" : "queued";
                return (
                  <li key={c.name} className="flex items-center gap-3 px-4 py-3">
                    {state === "done" && <CircleCheckIcon className="size-[18px]" strokeWidth={1.75} aria-hidden />}
                    {state === "running" && <LoaderCircleIcon className="size-[18px] animate-spin text-ember" strokeWidth={2} aria-hidden />}
                    {state === "queued" && <CircleDashedIcon className="size-[18px] text-faint" strokeWidth={1.75} aria-hidden />}
                    <span className={cn("flex-1 text-[14.5px]", state === "queued" ? "text-muted-foreground" : "font-medium")}>{c.name}</span>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                      {state === "done" ? `${c.found} found` : state === "running" ? `${Math.ceil(c.found / 2)} of ${c.found}` : "Queued"}
                    </span>
                  </li>
                );
              })}
            </ul>

            {finished ? (
              <Link href={`/${slug}`} replace className={cn(buttonVariants({ size: "cta" }), "mt-6")}>
                See your overview
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            ) : (
              <p className="mt-5 flex items-center gap-2 text-[13.5px] text-muted-foreground">
                <BellIcon className="size-4" strokeWidth={1.75} aria-hidden />
                You can leave. We&rsquo;ll email you when it&rsquo;s ready.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-[13.5px] text-muted-foreground">Already in</h2>
            {READINGS.map((r, i) => {
              const visible = done > i * 2;
              return visible ? (
                <article key={r.eyebrow} className="flex gap-5 rounded-[14px] border bg-card p-4">
                  <div className="relative hidden size-24 shrink-0 overflow-hidden rounded-xl sm:block">
                    <Image src={r.image} alt="" fill sizes="96px" className="object-cover" placeholder="blur" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{r.eyebrow}</p>
                    <p className="mt-1.5 text-[19px] leading-snug font-medium tracking-[-0.015em]">{r.title}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.chips.map(([name, territory]) => (
                        <span key={name} className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px]">
                          <TerritoryGlyph kind={territory} />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ) : (
                <Placeholder key={r.eyebrow} label={`${r.eyebrow} · arriving`} />
              );
            })}
            {!finished && <Placeholder label="Creators · queued" faint />}
          </section>
        </div>
      </PageBody>
    </>
  );
}

function Placeholder({ label, faint }: { label: string; faint?: boolean }) {
  return (
    <div className={cn("flex gap-5 rounded-[14px] border bg-card p-4", faint && "opacity-60")} aria-hidden>
      <div className="hidden size-24 shrink-0 rounded-xl bg-muted sm:block" />
      <div className="flex-1 space-y-2.5 pt-1">
        <p className="text-[11.5px] font-medium tracking-[0.1em] text-faint uppercase">{label}</p>
        <div className="h-2 w-11/12 rounded-full bg-soft" />
        <div className="h-2 w-2/3 rounded-full bg-soft" />
      </div>
    </div>
  );
}
