"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleCheckIcon, CircleHelpIcon, HistoryIcon, PlusIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { CompareDialog } from "@/components/compare/compare-dialog";
import { Evidence, initialsOf, LeanBar, TerritoryGlyph, WideOnly, type Territory } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { XRayRead } from "@/components/app/xray-read";
import { PageBody, TopBar, type Crumb } from "@/components/shell/top-bar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppError } from "@/lib/errors";
import { possessive } from "@/lib/intent";
import { maps } from "@/lib/maps";
import { type Basis, inWords, lookalike, type Words, wordsFor } from "@/lib/basis";
import { StandInNote } from "@/components/app/stand-in-note";
import { type AgeKey, AGES, builtWords, type Kind, kindOf, KINDS, leanWords, ordinal, territory, type TerritoryItem, type TerritoryView, type Tier, TIERS, whyHere } from "@/lib/territory";
import { cn } from "@/lib/utils";

type View = NonNullable<TerritoryView["view"]>;
type MapMeta = NonNullable<TerritoryView["map"]>;

const TERRITORY: Record<TerritoryItem["label"], Territory> = { YOURS: "yours", CONTESTED: "contested", THEIRS: "theirs" };

/**
 * The Culture Map: one category at a time, as what's only yours, what's shared and what's a rival's.
 * Filters (age, mainstream or niche) are real Qloo views, built the first time they're asked for and
 * kept. Every place on the map is explained in words; Qloo's raw scores stay out of sight.
 */
export function CultureMapView({ orgId, base, crumbs, brand, viaAgency, canWork, initial }: { orgId: string; base: string; crumbs: Crumb[]; brand: string; viaAgency: boolean; canWork: boolean; initial: { map: MapMeta; view: View } }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(initial.view.kind);
  const [segment, setSegment] = useState<AgeKey>(initial.view.segment);
  const [tier, setTier] = useState<Tier>(initial.view.tier);
  const [view, setView] = useState<View>(initial.view);
  const [baseCounts] = useState(initial.view.counts);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<TerritoryItem | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const asked = useRef(new Set<string>());
  const wasBuilding = useRef(false);
  const map = initial.map;
  const rivals = map.rivals;
  const k = kindOf(kind);
  const whose = viaAgency ? possessive(brand) : "your";
  const basis: Basis = { known: map.known, through: map.through };
  const words = wordsFor(basis, brand, viaAgency);
  const look = lookalike(basis);
  const filtered = segment !== "" || tier !== "MAINSTREAM";

  const load = useCallback(
    async (next: { kind: Kind; segment: AgeKey; tier: Tier }) => {
      setLoading(true);
      try {
        const got = await territory.get(orgId, next.kind, next.segment, next.tier);
        if (!got.view) return;
        const key = `${next.kind}|${next.segment}|${next.tier}`;
        // A filtered view nobody has asked for yet: ask once, then follow it while it builds.
        if (got.view.status === "missing" && !asked.current.has(key)) {
          asked.current.add(key);
          await territory.build(orgId, next.kind, next.segment, next.tier);
          got.view.status = "building";
        }
        // A view that just finished building spent queries: the sidebar meter reads them again.
        if (got.view.status === "ready" && wasBuilding.current) window.dispatchEvent(new Event("xray:usage"));
        wasBuilding.current = got.view.status === "building";
        setView(got.view);
      } catch (error) {
        toast(error instanceof AppError ? error.message : "We couldn’t load that view. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    if (view.status !== "building") return;
    const t = setTimeout(() => void load({ kind: view.kind, segment: view.segment, tier: view.tier }), 3000);
    return () => clearTimeout(t);
  }, [view, load]);

  function choose(next: Partial<{ kind: Kind; segment: AgeKey; tier: Tier }>) {
    const v = { kind: next.kind ?? kind, segment: next.segment ?? segment, tier: next.tier ?? tier };
    setKind(v.kind);
    setSegment(v.segment);
    setTier(v.tier);
    void load(v);
  }

  async function rebuild() {
    try {
      await maps.build(orgId, true);
      router.push(base as never);
    } catch (error) {
      toast(error instanceof AppError ? error.message : "We couldn’t start the rebuild. Try again.");
    }
  }

  const counts = view.counts;
  const ageLabel = AGES.find((a) => a.value === segment)!.label;
  const filterWords = [segment && ageLabel, tier === "NICHE" && "niche picks"].filter(Boolean).join(", ");
  const c = counts[kind];
  const reading =
    (view.reading && inWords(view.reading, basis, brand, viaAgency)) ??
    (c && view.status === "ready"
      ? `${filterWords ? `For ${filterWords}: ` : ""}${c.yours} ${k.noun} are ${look ? "open to you (no rival’s customers have them)" : `only ${possessive(brand)}`}, ${c.contested} are shared with rivals, and ${c.theirs} belong to rivals.`
      : null);

  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            {canWork && (
              <Button variant="ghost" size="pill" onClick={() => setRebuildOpen(true)}>
                <HistoryIcon data-icon="inline-start" />
                Rebuild
              </Button>
            )}
            <SoonButton size="pill" className="hidden sm:inline-flex" message="Briefs from the map are coming next.">
              <SparklesIcon data-icon="inline-start" />
              Write brief
            </SoonButton>
          </>
        }
      />
      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-[32px] leading-none font-semibold tracking-[-0.03em] lg:text-[36px]">{brand}</h1>
            {rivals.length > 0 && <span className="text-[20px] text-muted-foreground">vs</span>}
            {rivals.map((r) => (
              <span key={r} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium">
                <TerritoryGlyph kind="theirs" decorative />
                {r}
              </span>
            ))}
            {canWork && (
              <Button variant="outline" size="pill" className="h-8 text-muted-foreground" onClick={() => setCompareOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Change who you compare with
              </Button>
            )}
          </div>
          <span className="inline-flex h-8 items-center rounded-full border bg-muted/60 px-3 text-[13px] font-medium">{map.market === "GB" ? "UK" : "US"} market</span>
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <CircleCheckIcon className="size-4 text-foreground" strokeWidth={1.75} aria-hidden />
          <span className="font-medium text-foreground">Ready</span>· {builtWords(map.builtAt)} from {map.queryCount} Qloo queries · Filtered views are kept once built
        </p>

        <StandInNote basis={basis} brand={brand} />

        <XRayRead compact of={look ? `of ${k.noun}` : `of ${viaAgency ? `${possessive(brand)} ` : "your "}${k.noun}`} aside={<Evidence tip={`From the Qloo lists of what ${whose} customers and each rival’s customers ${k.verb}.`}>Qloo · {k.label}</Evidence>}>
          <p>{reading ?? (view.status === "ready" ? `Qloo has nothing for ${k.noun} under these filters.` : `Reading ${k.noun}${filterWords ? ` for ${filterWords}` : ""}…`)}</p>
        </XRayRead>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b">
          <div role="tablist" aria-label="Category" className="-mb-px flex max-w-full gap-1 overflow-x-auto">
            {KINDS.map((x) => {
              const n = (filtered ? counts[x.kind] : baseCounts[x.kind]) as View["counts"][Kind];
              return (
                <button
                  key={x.kind}
                  role="tab"
                  aria-selected={kind === x.kind}
                  onClick={() => choose({ kind: x.kind })}
                  className={cn("flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[14px] whitespace-nowrap transition-colors", kind === x.kind ? "border-ember font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
                >
                  {x.label}
                  {n && <span className="text-[12px] text-faint tabular-nums">{n.yours + n.contested + n.theirs}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Filter
              label="Age"
              help={`Shows what ${whose} customers in this age band, and rivals’ customers in the same band, ${k.verb}. Each band is a separate Qloo view, built the first time someone asks and kept.`}
              value={segment}
              options={AGES}
              onChange={(v) => choose({ segment: v as AgeKey })}
            />
            <Filter
              label="Reach"
              help="Mainstream is what Qloo ranks first: mostly widely known names. Niche keeps only less widely known ones, often cheaper to partner with and closer to your customers."
              value={tier}
              options={TIERS}
              onChange={(v) => choose({ tier: v as Tier })}
            />
          </div>
        </div>

        {view.status !== "ready" ? (
          <section className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed bg-muted/40 px-6 py-14 text-center">
            <Spinner className="size-5" />
            <h2 className="text-[16px] font-semibold">Reading this view from Qloo…</h2>
            <p className="max-w-md text-[13.5px] text-muted-foreground">
              {k.label}
              {filterWords ? ` for ${filterWords}` : ""}: about {view.cost} Qloo {view.cost === 1 ? "query" : "queries"}, counted on the meter. It’s kept, so asking again is free.
            </p>
          </section>
        ) : (
          <>
          {view.sameForEveryone && (
            <p className="flex items-start gap-2.5 rounded-[14px] border bg-muted/60 px-4 py-3 text-[13.5px] leading-relaxed">
              <CircleHelpIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                Under {filterWords || "these filters"}, Qloo gives nearly the same {k.noun} for every brand, so this view can’t tell {whose} customers apart from rivals’. Try another category, or {tier === "NICHE" ? "switch back to mainstream" : "widen the age band"}.
              </span>
            </p>
          )}
          <WideOnly what="The territory map" className="@container">
            <div className={cn("grid gap-4 transition-opacity @4xl:grid-cols-3", loading && "opacity-60")}>
              {(["YOURS", "CONTESTED", "THEIRS"] as const).map((label) => (
                <Column key={label} label={label} items={view.items.filter((i) => i.label === label)} brand={brand} words={words} rivals={rivals} noun={k.noun} one={k.one} selected={selected} onSelect={setSelected} />
              ))}
            </div>
          </WideOnly>
          </>
        )}
      </PageBody>

      <EvidenceDrawer
        item={selected}
        brand={brand}
        words={words}
        rivals={rivals}
        noun={k.noun}
        one={k.one}
        niche={tier === "NICHE"}
        onNiche={() => {
          setSelected(null);
          choose({ tier: "NICHE" });
        }}
        onClose={() => setSelected(null)}
      />

      <CompareDialog orgId={orgId} base={base} open={compareOpen} onOpenChange={setCompareOpen} />

      <AlertDialog open={rebuildOpen} onOpenChange={setRebuildOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rebuild the Culture Map?</AlertDialogTitle>
            <AlertDialogDescription>
              It asks Qloo again for every category, so it uses about {map.queryCount} queries unless the answers are still cached. Plays are rewritten from the new map. Filtered views are built again as people ask for them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={rebuild}>Rebuild</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Filter({ label, help, value, options, onChange }: { label: string; help: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Select items={options} value={value} onValueChange={(v) => v !== null && onChange(String(v))}>
        <SelectTrigger size="sm" className="h-8 rounded-full px-3 text-[12.5px]" aria-label={label}>
          <span className="text-muted-foreground">{label}</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value || "all"} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tooltip>
        <TooltipTrigger render={<button type="button" aria-label={`What ${label.toLowerCase()} means`} className="rounded-full p-1 text-muted-foreground hover:text-foreground" />}>
          <CircleHelpIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] text-left leading-relaxed">{help}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function Column({ label, items, brand, words, rivals, noun, one, selected, onSelect }: {
  label: TerritoryItem["label"];
  items: TerritoryItem[];
  brand: string;
  words: Words;
  rivals: string[];
  noun: string;
  one: string;
  selected: TerritoryItem | null;
  onSelect: (i: TerritoryItem) => void;
}) {
  const others = rivals.join(" or ") || "Your rivals";
  const copy = {
    YOURS: words.ownColumn === "Open to you"
      ? { title: "Open to you", sub: "Brands like yours have these; rivals don’t", help: `${noun.charAt(0).toUpperCase() + noun.slice(1)} ${words.who} rank in their top 20 on Qloo and no rival’s customers do. Openings a brand like yours could take; worth testing.` }
      : { title: words.ownColumn, sub: `Only ${brand}`, help: `${noun.charAt(0).toUpperCase() + noun.slice(1)} ${words.who} rank in their top 20 on Qloo and no rival’s customers do. Ground nobody else holds.` },
    CONTESTED: { title: "Shared", sub: `Shared · the bar shows whose list it sits higher on, ${words.ownColumn === "Open to you" ? "brands like yours" : brand} on the left`, help: `${words.who.charAt(0).toUpperCase() + words.who.slice(1)} and a rival’s customers both rank it. The bar compares where it sits on each list: the longer side is the one it leans to.` },
    THEIRS: { title: "Theirs", sub: `${others} only`, help: `Only a rival’s customers rank it; ${words.who} don’t. Their ground: useful to know, risky to borrow.` },
  }[label];
  return (
    <section className="@container rounded-[14px] border bg-card p-3" aria-label={copy.title}>
      <header className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <h2 className="flex items-center gap-2 text-[16px] font-medium">
          <TerritoryGlyph kind={TERRITORY[label]} className="size-3" decorative />
          {copy.title}
          <span className="text-[13px] font-normal text-muted-foreground">{items.length}</span>
        </h2>
        <Tooltip>
          <TooltipTrigger render={<button type="button" aria-label={`What “${copy.title}” means`} className="rounded-full p-1 text-muted-foreground hover:text-foreground" />}>
            <CircleHelpIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-left leading-relaxed">{copy.help}</TooltipContent>
        </Tooltip>
      </header>
      <p className="px-2 pb-2 text-[12.5px] text-muted-foreground">{copy.sub}</p>
      {items.length ? (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[10px] px-2 py-[var(--row-y)] text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  selected?.id === item.id && "bg-ember-soft ring-1 ring-ember/60 hover:bg-ember-soft",
                )}
              >
                <Cover item={item} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{item.name}</span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {item.detail && item.detail !== item.name ? item.detail : one} · {item.reach}
                  </span>
                </span>
                <Standing item={item} words={words} rivals={rivals} noun={noun} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-6 text-center text-[13px] text-muted-foreground">Nothing here under these filters.</p>
      )}
    </section>
  );
}

/** Where an item stands, in words, with the sentence behind it on hover. */
function Standing({ item, words, rivals, noun }: { item: TerritoryItem; words: Words; rivals: string[]; noun: string }) {
  const body =
    item.label === "CONTESTED" ? (
      <span className="flex w-[108px] flex-col items-end gap-1">
        <LeanBar left={Math.round((item.lean ?? 0.5) * 100)} className="w-full" />
        <span className="max-w-full truncate text-[11px] text-muted-foreground">{leanWords(item, words)}</span>
      </span>
    ) : (
      <span className="text-right">
        <span className="block text-[13px] font-medium tabular-nums">{ordinal((item.label === "YOURS" ? item.you?.rank : item.them?.rank) ?? 0)}</span>
        <span className="block max-w-[128px] truncate text-[10.5px] text-faint">{item.label === "YOURS" ? words.rankFor : `for ${item.them?.name ?? "a rival"}`}</span>
      </span>
    );
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="shrink-0 cursor-help" />}>{body}</TooltipTrigger>
      <TooltipContent className="max-w-[300px] text-left leading-relaxed">{whyHere(item, words, rivals, noun)}</TooltipContent>
    </Tooltip>
  );
}

function Cover({ item, size = "sm" }: { item: TerritoryItem; size?: "sm" | "lg" }) {
  const box = size === "sm" ? "size-9 rounded-lg" : "size-12 rounded-xl";
  // Some of Qloo's artwork links are dead; those fall back to initials.
  const [broken, setBroken] = useState(false);
  if (item.image && !broken) {
    // eslint-disable-next-line @next/next/no-img-element -- Qloo's own artwork
    return <img src={item.image} alt="" className={cn("shrink-0 border object-cover", box)} loading="lazy" onError={() => setBroken(true)} />;
  }
  return <span className={cn("flex shrink-0 items-center justify-center border bg-muted text-[13px] font-medium text-foreground/70", box)}>{initialsOf(item.name)}</span>;
}

const paramWords = (params: Record<string, string | number>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${String(v).length > 60 ? `${String(v).slice(0, 57)}…` : v}`)
    .join("\n");

/** Why an item sits where it does, in words, with the exact Qloo calls behind it. */
function EvidenceDrawer({ item, brand, words, rivals, noun, one, niche, onNiche, onClose }: { item: TerritoryItem | null; brand: string; words: Words; rivals: string[]; noun: string; one: string; niche: boolean; onNiche: () => void; onClose: () => void }) {
  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[440px]">
        {item && (
          <>
            <SheetHeader className="flex-row items-center gap-3 border-b px-6 py-5">
              <Cover item={item} size="lg" />
              <div className="min-w-0">
                <SheetTitle className="text-[19px] font-semibold tracking-[-0.02em]">{item.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-[13px]">
                  <TerritoryGlyph kind={TERRITORY[item.label]} decorative />
                  {item.label === "YOURS" ? (words.ownColumn === "Yours" ? `Only ${possessive(brand)}` : words.ownColumn) : item.label === "CONTESTED" ? "Shared" : `${possessive(item.them?.name ?? "A rival")}`} · {item.detail && item.detail !== item.name ? item.detail : one} · {item.reach}
                </SheetDescription>
              </div>
            </SheetHeader>
            <div className="space-y-7 px-6 py-6">
              <section>
                <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Why it’s here</p>
                <p className="mt-2.5 text-[15px] leading-relaxed">{whyHere(item, words, rivals, noun)}</p>
                {item.label === "CONTESTED" && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-[12px] text-muted-foreground">
                      <span>{brand}</span>
                      <span>{item.them?.name}</span>
                    </div>
                    <LeanBar left={Math.round((item.lean ?? 0.5) * 100)} className="h-2 w-full" />
                  </div>
                )}
              </section>
              <section>
                <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">How to read it</p>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/85">
                  Qloo lists the {noun} each brand’s customers like more than people in general (its affinity), strongest first. The map compares those lists: on one list only, it’s that brand’s ground; on both, it’s shared, leaning to whichever list has it higher.
                </p>
              </section>
              <section>
                <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Evidence · {item.calls.length} Qloo {item.calls.length === 1 ? "call" : "calls"}
                </p>
                <div className="mt-3 space-y-2">
                  {item.calls.map((call) => (
                    <div key={call.side} className="rounded-[10px] border bg-muted/60 px-3.5 py-3">
                      <p className="text-[12.5px] font-medium">{call.side}</p>
                      <pre className="mt-1.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/75">{`GET ${call.path}\n${paramWords(call.params)}`}</pre>
                      <p className="mt-2 flex items-center gap-1.5 text-[12.5px]">
                        <CircleCheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
                        {call.warnings ? `${call.warnings} warning${call.warnings === 1 ? "" : "s"} from Qloo` : "No warnings"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              {!niche && (
                <Button variant="outline" size="pill" className="h-10 px-4" onClick={onNiche}>
                  <SearchIcon data-icon="inline-start" />
                  See niche {noun} instead
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
