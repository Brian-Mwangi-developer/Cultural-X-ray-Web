"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CircleCheckIcon, CircleIcon, HistoryIcon, MoreHorizontalIcon, PinIcon, PlusIcon, SearchIcon, Share2Icon, SparklesIcon, XIcon } from "lucide-react";
import { Evidence, initialsOf, LeanBar, SampleBadge, TerritoryGlyph, WideOnly, type Territory } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { Segmented } from "@/components/forms/fields";
import { PageBody, TopBar, type Crumb } from "@/components/shell/top-bar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIES, FILMS, PODCASTS, type MapItem } from "@/lib/sample-data";
import { possessive } from "@/lib/intent";
import { cn } from "@/lib/utils";

const COLUMN_COPY: Record<Territory, { title: string; sub: (brand: string, rivals: string[]) => string }> = {
  yours: { title: "Yours", sub: (brand) => `Only ${brand}` },
  contested: { title: "Contested", sub: (brand) => `Shared · bar shows lean, ${brand} left` },
  theirs: { title: "Theirs", sub: (_, rivals) => `${rivals.join(" or ") || "Your rivals"} only` },
};

export function CultureMapView({ crumbs, brand, rivals, defaultMarket }: { crumbs: Crumb[]; brand: string; rivals: string[]; defaultMarket: "US" | "GB" }) {
  const [category, setCategory] = useState<string>("podcasts");
  const [market, setMarket] = useState<"US" | "GB">(defaultMarket);
  const [selected, setSelected] = useState<MapItem | null>(null);
  const items = useMemo(() => (category === "films" || category === "tv" ? FILMS : PODCASTS), [category]);
  const shownRivals = rivals.length ? rivals : ["Your rival"];

  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            <SampleBadge className="hidden sm:inline-flex" />
            <SoonButton variant="ghost" size="pill" message="Rebuilding arrives with the Culture Map engine.">
              <HistoryIcon data-icon="inline-start" />
              Rebuild
            </SoonButton>
          </>
        }
      />
      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-[32px] leading-none font-semibold tracking-[-0.03em] lg:text-[36px]">{brand}</h1>
            <span className="text-[20px] text-muted-foreground">vs</span>
            {shownRivals.map((r) => (
              <span key={r} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium">
                <CircleIcon className="size-2.5" strokeWidth={2.5} aria-hidden />
                {r}
              </span>
            ))}
            <SoonButton variant="outline" size="pill" className="text-muted-foreground" message="Adding rivals arrives with the Culture Map engine.">
              <PlusIcon data-icon="inline-start" />
              Add rival
            </SoonButton>
          </div>
          <div className="flex items-center gap-2">
            <Segmented label="Market" value={market} onChange={setMarket} options={[{ value: "US", label: "US" }, { value: "GB", label: "UK" }]} />
            <SoonButton variant="outline" size="pill" className="h-10" message="Sharing arrives with the Culture Map engine.">
              <Share2Icon data-icon="inline-start" />
              Share
            </SoonButton>
            <SoonButton size="pill" className="h-10" message="Briefs arrive with the Culture Map engine.">
              <SparklesIcon data-icon="inline-start" />
              Write brief
            </SoonButton>
          </div>
        </div>

        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <CircleCheckIcon className="size-4 text-foreground" strokeWidth={1.75} aria-hidden />
          <span className="font-medium text-foreground">Ready</span>· Built 2 days ago from 214 Qloo queries · Cached
        </p>

        <section className="relative rounded-[14px] border bg-card px-6 py-5">
          <span aria-hidden className="absolute top-6 bottom-6 left-0 w-[3px] rounded-r-full bg-ember" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">The read</p>
              <p className="mt-2 max-w-4xl text-[19px] leading-[1.45] font-medium tracking-[-0.01em] lg:text-[21px]">
                {brand} owns environment and wellbeing. {shownRivals[0]} owns toughness and survival. The climbing world is shared ground, and it leans your way.
              </p>
            </div>
            <Evidence className="hidden shrink-0 md:inline-flex">38 associations</Evidence>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b">
          <div role="tablist" aria-label="Category" className="-mb-px flex gap-1 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[14px] whitespace-nowrap transition-colors",
                  category === c.id ? "border-ember font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
                <span className="text-[12px] text-faint tabular-nums">{c.count}</span>
              </button>
            ))}
          </div>
          <div className="hidden gap-1.5 pb-2 xl:flex">
            {[
              ["Age", "25–34"],
              ["Tier", "Mainstream"],
            ].map(([k, v]) => (
              <span key={k} className="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12.5px]">
                <span className="text-muted-foreground">{k}</span> {v}
                <XIcon className="size-3 text-muted-foreground" strokeWidth={2} aria-hidden />
              </span>
            ))}
          </div>
        </div>

        <WideOnly what="The territory map">
          <div className="grid gap-4 lg:grid-cols-3">
            {(["yours", "contested", "theirs"] as const).map((territory) => {
              const list = items.filter((i) => i.territory === territory);
              return (
                <section key={territory} className="rounded-[14px] border bg-card p-3" aria-label={COLUMN_COPY[territory].title}>
                  <header className="flex items-center justify-between px-2 pt-1.5 pb-1">
                    <h2 className="flex items-center gap-2 text-[16px] font-medium">
                      <TerritoryGlyph kind={territory} className="size-3" decorative />
                      {COLUMN_COPY[territory].title}
                      <span className="text-[13px] font-normal text-muted-foreground">{list.length}</span>
                    </h2>
                    <MoreHorizontalIcon className="size-4 text-muted-foreground" aria-hidden />
                  </header>
                  <p className="px-2 pb-2 text-[12.5px] text-muted-foreground">{COLUMN_COPY[territory].sub(brand, shownRivals)}</p>
                  <ul className="space-y-0.5">
                    {list.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[10px] px-2 py-[var(--row-y)] text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                            selected?.id === item.id && "bg-ember-soft ring-1 ring-ember/60 hover:bg-ember-soft",
                          )}
                        >
                          <Cover item={item} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium">{item.name}</span>
                            <span className="block text-[12.5px] text-muted-foreground">
                              {item.kind} · {item.tier}
                            </span>
                          </span>
                          {item.lean !== undefined ? (
                            <span className="flex items-center gap-2 text-[12px] text-muted-foreground tabular-nums">
                              {item.lean}
                              <LeanBar left={item.lean} />
                              {100 - item.lean}
                            </span>
                          ) : (
                            <span className="text-right">
                              <span className="block font-mono text-[13px] tabular-nums">{item.affinity?.toFixed(2)}</span>
                              <span className="block text-[10.5px] text-faint">affinity</span>
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </WideOnly>
      </PageBody>

      <EvidenceDrawer item={selected} brand={brand} rival={shownRivals[0]!} onClose={() => setSelected(null)} />
    </>
  );
}

function Cover({ item, size = "sm" }: { item: MapItem; size?: "sm" | "lg" }) {
  const box = size === "sm" ? "size-9 rounded-lg" : "size-12 rounded-xl";
  if (item.image) {
    return (
      <span className={cn("relative shrink-0 overflow-hidden", box)}>
        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" placeholder="blur" />
      </span>
    );
  }
  return <span className={cn("flex shrink-0 items-center justify-center border bg-muted text-[13px] font-medium text-foreground/70", box)}>{initialsOf(item.name)}</span>;
}

/** a2b: why an item sits where it does, with the exact calls behind it. */
function EvidenceDrawer({ item, brand, rival, onClose }: { item: MapItem | null; brand: string; rival: string; onClose: () => void }) {
  const lean = item?.lean ?? Math.round((item?.affinity ?? 0.8) * 60);
  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[420px]">
        {item && (
          <>
            <SheetHeader className="flex-row items-center gap-3 border-b px-6 py-5">
              <Cover item={item} size="lg" />
              <div className="min-w-0">
                <SheetTitle className="text-[19px] font-semibold tracking-[-0.02em]">{item.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-[13px]">
                  <TerritoryGlyph kind={item.territory} decorative />
                  {item.territory[0]!.toUpperCase() + item.territory.slice(1)} · {item.kind} · {item.tier}
                </SheetDescription>
              </div>
            </SheetHeader>
            <div className="space-y-7 px-6 py-6">
              <section>
                <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Lean</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{lean}</span>
                  <span className="text-[20px] text-muted-foreground tabular-nums">/ {100 - lean}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {brand} / {rival}
                  </span>
                </p>
                <LeanBar left={lean} className="mt-3 h-2 w-full" />
                <p className="mt-3 text-[14px] leading-relaxed text-foreground/85">
                  Both seeds drive it. {possessive(brand)} pull is {lean >= 50 ? "slightly stronger" : "slightly weaker"}, so a host-read here reads as {lean >= 50 ? "yours" : "theirs"}.
                </p>
              </section>
              <section>
                <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Who it reaches</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    ["25–34", 90, "High"],
                    ["35–44", 80, "High"],
                    ["45–54", 55, "Medium"],
                    ["55+", 30, "Low · low confidence"],
                  ].map(([band, w, label]) => (
                    <li key={band} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-[13px]">
                      <span className="text-muted-foreground">{band}</span>
                      <span className="h-1.5 rounded-full bg-soft">
                        <span className="block h-full rounded-full bg-foreground/80" style={{ width: `${w}%` }} />
                      </span>
                      <span className="w-36 text-foreground/85">{label}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <div className="flex items-center justify-between">
                  <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Evidence · 3 calls</p>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    [`GET /v2/insights\nfilter.type=urn:entity:podcast\nsignal.interests.entities=${brand}\ntake=20`, "Rank 1 of 20 · affinity 0.87 · no warnings"],
                    [`GET /v2/insights … = ${rival}`, "Rank 3 of 20 · affinity 0.84 · no warnings"],
                    ["GET /v2/insights … both seeds\nfeature.explainability=true", `Lean ${lean} / ${100 - lean}`],
                  ].map(([call, result]) => (
                    <div key={call} className="rounded-[10px] border bg-muted/60 px-3.5 py-3">
                      <pre className="font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-foreground/80">{call}</pre>
                      <p className="mt-2 flex items-center gap-1.5 text-[12.5px]">
                        <CircleCheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
                        {result}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="flex flex-wrap gap-2">
                <SoonButton variant="outline" size="pill" className="h-10 px-4" message="Finding alternatives arrives with the Culture Map engine.">
                  <SearchIcon data-icon="inline-start" />
                  Find niche alternatives
                </SoonButton>
                <SoonButton size="pill" className="h-10 px-4" message="Pinning arrives with briefs.">
                  <PinIcon data-icon="inline-start" />
                  Pin to brief
                </SoonButton>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
