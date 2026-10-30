"use client";

import { SEARCH_MIN_CHARS, useDebounced } from "@/hooks/use-debounced";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, CircleCheckIcon, MapPinIcon, PencilIcon, PlusIcon, SearchIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import lakes from "../../../public/images/panel-lakes.jpg";
import hiker from "../../../public/images/panel-hiker.jpg";
import { BrandMark } from "@/components/app/parts";
import { PanelAside, PhotoAside, SplitShell, Steps } from "@/components/app/split-shell";
import { FormField, Segmented, SlugInput, suggestSlug, TextInput, useSlugCheck } from "@/components/forms/fields";
import { CardMeta, CategoryTag, EntitySearch } from "@/components/onboarding/entity-search";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppError, userMessage } from "@/lib/errors";
import { type BrandIntent, type Pick, possessive, readIntent } from "@/lib/intent";
import { type Card, type Category, type Locality, lookup, type Market, marketsLabel, newPick, readWebsite, type Suggestion, toPick } from "@/lib/lookup";
import { maps } from "@/lib/maps";
import { reportError } from "@/lib/report";
import type { OrgContext } from "@/lib/session";
import { cn } from "@/lib/utils";

const STEPS = ["Your brand", "Compare with", "Review"];
const MARKETS = [{ value: "GB" as const, label: "UK" }, { value: "US" as const, label: "US" }];
const MAX = 3;

type Props = { step: number; org: OrgContext | null };

export function BrandFlow({ step, org }: Props) {
  const intent = readIntent(org?.organization.metadata);
  if (!org || !intent.brand) return <FindStep />;
  if (step <= 2) return <CompareStep org={org} intent={intent} />;
  return <ReviewStep org={org} intent={intent} />;
}

const Alert = ({ children }: { children: React.ReactNode }) => (
  <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">
    {children}
  </p>
);

const Heading = ({ title, sub }: { title: string; sub: string }) => (
  <div>
    <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">{title}</h1>
    <p className="mt-2.5 text-[15px] leading-relaxed text-pretty text-muted-foreground">{sub}</p>
  </div>
);

async function saveSetup(orgId: string, body: Record<string, unknown>) {
  await api(`/orgs/${orgId}/brand-setup`, { method: "POST", body });
}

function fail(error: unknown, where: string, set: (m: string) => void) {
  if (!(error instanceof AppError && error.expected)) reportError(error, { where });
  set(userMessage(error));
}

/* ================================================================ step 1: find your brand */

type Found = Pick & { website?: string; sells?: string; basedIn?: string; locality?: Locality; card?: Card };

function FindStep() {
  const router = useRouter();
  const [market, setMarket] = useState<Market>("GB");
  const [kind, setKind] = useState<"brand" | "place">("brand");
  const [town, setTown] = useState<Locality | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSlug = slugEdited ? slug : suggestSlug(found?.name ?? "");
  const slugState = useSlugCheck(effectiveSlug, { skip: !found });

  async function onWebsite(url: string) {
    setReading(url);
    setFormError(null);
    try {
      const site = await readWebsite(url);
      setFound({ ...newPick(site.name || url.replace(/^https?:\/\//, "").split(/[./]/)[0]!), website: url, sells: site.sells || undefined, basedIn: site.basedIn ?? undefined, categories: site.productTypes });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : userMessage(e));
    } finally {
      setReading(null);
    }
  }

  async function onContinue() {
    if (!found) return;
    setFormError(null);
    if (effectiveSlug.length < 3) return setFormError("Your workspace address needs at least 3 characters.");
    if (slugState.status === "taken") return setFormError(slugState.reason ?? "That workspace address is taken.");
    setPending(true);
    try {
      const created = unwrap(await authClient.organization.create({ name: found.name, slug: effectiveSlug, kind: "WORKSPACE" }));
      const { card, locality, ...brand } = found;
      const location = card?.location ?? locality?.location;
      await saveSetup(created!.id, {
        market,
        brand: { ...brand, location, locality: locality ? { id: locality.id, name: locality.name, detail: locality.detail } : undefined },
        complete: false,
      });
      router.replace(`/onboarding?kind=brand&step=2&org=${encodeURIComponent(created!.slug)}`);
      router.refresh();
    } catch (error) {
      fail(error, "onboarding.brand.find", setFormError);
      setPending(false);
    }
  }

  return (
    <SplitShell
      meta="Step 1 of 3"
      aside={
        <PhotoAside
          image={lakes}
          alt="A lake below green mountains with a wooden jetty"
          eyebrow="How we find you"
          title="Your brand, in Qloo’s taste graph"
          points={["We search as you type, and show what each match sells", "Not listed yet? Add yourself as new; your competitors fill in the rest", "Got a website? Paste it and we’ll read what you sell"]}
        />
      }
      footnote="You can change all of this later in Settings."
    >
      <div className="space-y-6">
        <Steps steps={STEPS} current={0} />
        <Heading title="Find your brand" sub="Search for your brand or shop, or paste your website. New businesses can add themselves." />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label="What are you?" value={kind} onChange={(v) => { setKind(v); setFound(null); }} options={[{ value: "brand", label: "A brand" }, { value: "place", label: "A shop or venue" }]} />
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            Market <Segmented label="Market" value={market} onChange={(v) => { setMarket(v); setTown(null); setFound(null); }} options={MARKETS} />
          </span>
        </div>

        {formError && <Alert>{formError}</Alert>}

        {found ? (
          <FoundCard found={found} onChange={() => setFound(null)} onEdit={(patch) => setFound((f) => (f ? { ...f, ...patch } : f))} />
        ) : reading ? (
          <div className="flex items-center gap-3 rounded-[14px] border bg-card px-4 py-4">
            <Spinner className="size-4" />
            <div>
              <p className="text-[14.5px] font-medium">Reading {reading}</p>
              <p className="text-[12.5px] text-muted-foreground">Usually 5 to 20 seconds.</p>
            </div>
          </div>
        ) : kind === "brand" ? (
          <EntitySearch
            kind="brand"
            label="Your brand"
            placeholder="Brand name, or paste your website"
            addNoun="a new brand"
            autoFocus
            onPick={(card) => setFound({ ...toPick(card), card })}
            onAddNew={(name) => setFound(newPick(name))}
            onWebsite={onWebsite}
          />
        ) : (
          <div className="space-y-4">
            <TownField market={market} town={town} onTown={setTown} />
            <EntitySearch
              kind="place"
              near={town?.location}
              label="Your shop"
              placeholder="Shop, café or restaurant name"
              addNoun="a new shop"
              onPick={(card) => setFound({ ...toPick(card), card, locality: town ?? undefined })}
              onAddNew={(name) => setFound({ ...newPick(name), locality: town ?? undefined })}
            />
          </div>
        )}

        {found && (
          <>
            <FormField label="Workspace address" htmlFor="slug" error={slugState.status === "taken" ? slugState.reason : null}>
              <SlugInput id="slug" value={effectiveSlug} onChange={(v) => { setSlugEdited(true); setSlug(v); }} state={slugState} />
            </FormField>
            <Button size="cta" className="w-full" onClick={onContinue} disabled={pending || slugState.status === "checking"}>
              {pending && <Spinner className="size-4" />}
              Continue
              {!pending && <ArrowRightIcon data-icon="inline-end" />}
            </Button>
          </>
        )}
      </div>
    </SplitShell>
  );
}

function TownField({ market, town, onTown }: { market: Market; town: Locality | null; onTown: (l: Locality | null) => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(false);
  const trimmed = query.trim();

  const settled = useDebounced(trimmed);
  useEffect(() => {
    if (settled.length < SEARCH_MIN_CHARS || town) return;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        setResults(await lookup.localities(settled, market, controller.signal));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [settled, market, town]);

  if (town) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-muted/50 px-3.5 py-2.5">
        <MapPinIcon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[14px]">{town.detail || town.name}</span>
        <Button variant="ghost" size="pill" onClick={() => { onTown(null); setQuery(""); }}>Change</Button>
      </div>
    );
  }
  return (
    <FormField label="Town or city" htmlFor={id}>
      <TextInput id={id} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={market === "GB" ? "Brighton" : "Austin"} autoComplete="off" autoFocus />
      {trimmed.length >= 2 && (
        <ul className="mt-2 rounded-[12px] border bg-card p-1" aria-label="Towns">
          {(loading || settled !== trimmed) && !results.length && <li className="px-3 py-2 text-[13px] text-muted-foreground">Searching…</li>}
          {!loading && settled === trimmed && !results.length && <li className="px-3 py-2 text-[13px] text-muted-foreground">Not found. Try a nearby town.</li>}
          {results.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onTown(l)} className="w-full rounded-[8px] px-3 py-2 text-left text-[13.5px] hover:bg-muted">
                {l.detail || l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </FormField>
  );
}

function FoundCard({ found, onChange, onEdit }: { found: Found; onChange: () => void; onEdit: (patch: Partial<Found>) => void }) {
  const [editing, setEditing] = useState(false);
  const isNew = found.kind === "new";
  return (
    <div className="space-y-3 rounded-[14px] border bg-card p-4">
      <div className="flex items-start gap-3">
        <BrandMark name={found.name} logo={found.card?.image} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[16px] font-semibold">{found.name}</p>
          {found.card ? <CardMeta card={found.card} /> : found.website ? <p className="text-[12.5px] text-muted-foreground">{found.website}</p> : null}
          <div className="flex flex-wrap gap-1.5">
            {(found.categories ?? []).slice(0, 3).map((c) => (
              <CategoryTag key={c}>{c}</CategoryTag>
            ))}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-muted-foreground">
          {isNew ? <PlusIcon className="size-3.5" strokeWidth={2} aria-hidden /> : <CircleCheckIcon className="size-3.5" strokeWidth={1.75} aria-hidden />}
          {isNew ? "New" : "In Qloo"}
        </span>
      </div>
      {isNew && (found.sells || found.basedIn || editing) && (
        <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 border-t pt-3 text-[13.5px]">
          {editing ? (
            <>
              <dt className="pt-2 text-muted-foreground">Name</dt>
              <dd><TextInput value={found.name} onChange={(e) => onEdit({ name: e.target.value })} /></dd>
              <dt className="pt-2 text-muted-foreground">Sells</dt>
              <dd><TextInput value={found.sells ?? ""} onChange={(e) => onEdit({ sells: e.target.value })} placeholder="Small-batch ice cream" /></dd>
              <dt className="pt-2 text-muted-foreground">Based in</dt>
              <dd><TextInput value={found.basedIn ?? ""} onChange={(e) => onEdit({ basedIn: e.target.value })} placeholder="Brighton, UK" /></dd>
            </>
          ) : (
            <>
              {found.sells && (<><dt className="text-muted-foreground">Sells</dt><dd>{found.sells}</dd></>)}
              {found.basedIn && (<><dt className="text-muted-foreground">Based in</dt><dd>{found.basedIn}</dd></>)}
            </>
          )}
        </dl>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="pill" onClick={onChange}>Change</Button>
        {isNew && !editing && (
          <Button variant="ghost" size="pill" onClick={() => setEditing(true)}>
            <PencilIcon data-icon="inline-start" />
            Edit details
          </Button>
        )}
      </div>
    </div>
  );
}

/* ================================================================ step 2: compare with */

type Row = Pick & { status: Suggestion["status"]; card?: Card };
const fromSuggestion = (s: Suggestion): Row => (s.card ? { ...toPick(s.card), status: s.status, card: s.card } : { name: s.name, kind: "new", status: "not_found" });
const keyOf = (p: Pick) => p.id ?? `new:${p.name.toLowerCase()}`;

function CompareStep({ org, intent }: { org: OrgContext; intent: BrandIntent }) {
  const router = useRouter();
  const brand = intent.brand!;
  const market = (org.organization.markets[0] ?? "GB") as Market;
  const known = brand.kind !== "new" && Boolean(brand.id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(intent.category ? { id: intent.category.id ?? null, name: intent.category.name } : null);
  const [rivalOptions, setRivalOptions] = useState<Row[]>([]);
  const [seedOptions, setSeedOptions] = useState<Row[]>([]);
  const [rivals, setRivals] = useState<Pick[]>(intent.rivals ?? []);
  const [seeds, setSeeds] = useState<Pick[]>(intent.seeds ?? []);
  const [words, setWords] = useState(brand.sells ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [scope, setScope] = useState<"market" | "any" | null>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // A known brand or place: everything comes from its own record.
  useEffect(() => {
    if (!known || !brand.id) return;
    let live = true;
    (async () => {
      setLoading("Finding your competitors…");
      try {
        const s = await lookup.suggestions(brand.id!, brand.kind === "place" ? "place" : "brand", market);
        if (!live) return;
        setCategories(s.categories);
        setCategory((c) => c ?? s.categories[0] ?? null);
        const rivalRows = s.rivals.map(fromSuggestion);
        const seedRows = s.seeds.filter((x) => x.card).map(fromSuggestion);
        setRivalOptions(rivalRows);
        setSeedOptions(seedRows);
        // Start with the strongest two of each ticked, as long as the owner hasn't chosen yet.
        const top = (rows: Row[]) => rows.filter((r) => r.status === "ok").slice(0, 2).map((r): Pick => ({ id: r.id, name: r.name, kind: r.kind, categories: r.categories, detail: r.detail }));
        setRivals((cur) => (cur.length ? cur : top(rivalRows)));
        setSeeds((cur) => (cur.length ? cur : top(seedRows)));
      } catch (e) {
        if (live) setFormError(userMessage(e));
      } finally {
        if (live) setLoading(null);
      }
    })();
    return () => {
      live = false;
    };
  }, [known, brand.id, brand.kind, market]);

  // A new brand: match what it sells to Qloo's categories.
  async function findCategories(text: string) {
    if (text.trim().length < 3) return;
    setLoading("Matching what you sell…");
    setFormError(null);
    try {
      const found = await lookup.categories(text.trim());
      setCategories(found);
      if (found[0]) await pickCategory(found[0]);
      else setFormError("We couldn't match that to a category. Try describing it differently, or search for a competitor below.");
    } catch (e) {
      setFormError(userMessage(e));
    } finally {
      setLoading(null);
    }
  }

  // A brand read from its website arrives knowing what it sells: match it straight away, once.
  useEffect(() => {
    if (known || !brand.sells) return;
    const timer = setTimeout(() => void findCategories(brand.sells!), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickCategory(c: Category) {
    setCategory(c);
    if (known || !c.id) return;
    setLoading(`Finding big ${c.name.toLowerCase()} brands…`);
    try {
      const big = await lookup.categoryBrands(c.id, market);
      setScope(big.scope);
      setRivalOptions(big.brands.map(fromSuggestion));
    } catch (e) {
      setFormError(userMessage(e));
    } finally {
      setLoading(null);
    }
  }

  // For a new brand, read-through suggestions come from the competitors Qloo knows, merged.
  const anchorIds = rivals.filter((r) => r.kind === "brand" && r.id).map((r) => r.id!).join(",");
  const [seedsFor, setSeedsFor] = useState("");
  useEffect(() => {
    if (known || !anchorIds) return;
    let live = true;
    Promise.all(anchorIds.split(",").map((id) => lookup.suggestions(id, "brand", market).catch(() => null)))
      .then((all) => {
        if (!live) return;
        const taken = new Set(anchorIds.split(","));
        const seen = new Set<string>();
        const merged = all
          .flatMap((s) => s?.seeds ?? [])
          .filter((x) => x.card && !taken.has(x.card.id) && !seen.has(x.card.id) && seen.add(x.card.id))
          .sort((a, b) => Number(a.status !== "ok") - Number(b.status !== "ok"));
        setSeedOptions(merged.map(fromSuggestion));
        setSeedsFor(anchorIds);
      });
    return () => {
      live = false;
    };
  }, [known, anchorIds, market]);
  const seedsLoading = !known && Boolean(anchorIds) && seedsFor !== anchorIds;

  const toggle = (list: Pick[], set: (v: Pick[]) => void, p: Pick) => {
    const k = keyOf(p);
    set(list.some((x) => keyOf(x) === k) ? list.filter((x) => keyOf(x) !== k) : list.length < MAX ? [...list, p] : list);
  };
  const add = (list: Pick[], set: (v: Pick[]) => void, options: Row[], setOptions: (v: Row[]) => void, row: Row) => {
    if (!options.some((o) => keyOf(o) === keyOf(row))) setOptions([row, ...options]);
    if (!list.some((x) => keyOf(x) === keyOf(row)) && list.length < MAX) set([...list, row]);
  };

  const needsSeed = !known && !seeds.length;

  async function onContinue() {
    setFormError(null);
    if (needsSeed) return setFormError("Pick at least one brand your customers also buy, so we have a culture to read.");
    setPending(true);
    try {
      const clean = (p: Pick) => ({ id: p.id, name: p.name, kind: p.kind, categories: p.categories, detail: p.detail });
      await saveSetup(org.organization.id, {
        market,
        brand,
        category,
        rivals: rivals.map(clean),
        seeds: seeds.filter((s) => s.kind !== "new").map(clean),
        complete: true,
      });
      router.replace(`/onboarding?kind=brand&step=3&org=${encodeURIComponent(org.organization.slug)}`);
      router.refresh();
    } catch (error) {
      fail(error, "onboarding.brand.compare", setFormError);
      setPending(false);
    }
  }

  const place = brand.kind === "place";
  return (
    <SplitShell
      meta="Step 2 of 3"
      aside={<MapSoFar brand={brand} category={category} seeds={seeds} rivals={rivals} market={market} />}
      footnote="You can change all of this later in Settings."
    >
      <div className="space-y-7">
        <Steps steps={STEPS} current={1} />
        <Heading
          title="Who should we compare you with?"
          sub={known ? (place ? "Places near you that share your customers, and brands they like. Untick anything that isn’t right." : "Suggested from your Qloo record. Untick anything that isn’t a real competitor.") : "Tell us what you sell. We’ll find your category and the big brands in it."}
        />
        {formError && <Alert>{formError}</Alert>}

        {!known && (
          <FormField label="What do you sell?" htmlFor="sells" hint="A few words, like “small-batch ice cream and sorbets”.">
            <div className="flex gap-2">
              <TextInput id="sells" value={words} onChange={(e) => setWords(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findCategories(words)} placeholder="Small-batch ice cream" />
              <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => findCategories(words)} disabled={words.trim().length < 3 || Boolean(loading)}>
                <SearchIcon data-icon="inline-start" />
                Match
              </Button>
            </div>
          </FormField>
        )}

        {categories.length > 0 && (
          <FormField label="Your category" aside={known ? "From your Qloo record" : "From what you sell"}>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c.name} type="button" onClick={() => pickCategory(c)} aria-pressed={category?.name === c.name} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium", category?.name === c.name ? "border-ember bg-ember-soft" : "bg-card hover:border-foreground/25")}>
                  {category?.name === c.name && <CheckIcon className="size-3.5 text-ember-ink" strokeWidth={2.5} aria-hidden />}
                  {c.name}
                </button>
              ))}
            </div>
          </FormField>
        )}

        {loading && (
          <p className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
            <Spinner className="size-4" />
            {loading}
          </p>
        )}

        <PickList
          title={known ? "Compare against" : category ? `Big ${category.name.toLowerCase()} brands${scope === "any" ? "" : market === "GB" ? " in the UK" : " in the US"}` : "Compare against"}
          count={`${rivals.length} of ${MAX}`}
          options={rivalOptions}
          picked={rivals}
          onToggle={(p) => toggle(rivals, setRivals, p)}
          market={market}
          empty={known ? "No suggestions. Search for your competitors below." : "Match what you sell, or search for a competitor below."}
        >
          <EntitySearch
            kind={place ? "place" : "brand"}
            near={place ? brand.location : undefined}
            label="Search for a competitor"
            placeholder={place ? "Search for a nearby competitor" : "Search for a competitor"}
            addNoun="a new competitor"
            exclude={rivals.map((r) => r.id ?? "")}
            onPick={(card) => add(rivals, setRivals, rivalOptions, setRivalOptions, { ...toPick(card), status: "ok", card })}
            onAddNew={(name) => add(rivals, setRivals, rivalOptions, setRivalOptions, { ...newPick(name), status: "not_found" })}
          />
        </PickList>

        <PickList
          title="Read your culture through"
          hint="Brands your customers also buy. We read your culture through them."
          count={`${seeds.length} of ${MAX}`}
          options={seedOptions}
          picked={seeds}
          onToggle={(p) => toggle(seeds, setSeeds, p)}
          market={market}
          empty={
            seedsLoading
              ? "Finding brands like your competitors…"
              : known || anchorIds
                ? `None of the suggestions sell in the ${market === "GB" ? "UK" : "US"}. Search for brands your customers buy.`
                : "Pick a competitor from the list, or search for brands your customers buy."
          }
        >
          <EntitySearch
            kind="brand"
            label="Search for a brand your customers buy"
            placeholder="Search for a brand your customers buy"
            exclude={seeds.map((s) => s.id ?? "")}
            onPick={(card) => add(seeds, setSeeds, seedOptions, setSeedOptions, { ...toPick(card), status: "ok", card })}
          />
        </PickList>

        <Button size="cta" className="w-full" onClick={onContinue} disabled={pending}>
          {pending && <Spinner className="size-4" />}
          Continue
          {!pending && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </div>
    </SplitShell>
  );
}

function PickList({
  title,
  hint,
  count,
  options,
  picked,
  onToggle,
  market,
  empty,
  children,
}: {
  title: string;
  hint?: string;
  count: string;
  options: Row[];
  picked: Pick[];
  onToggle: (p: Pick) => void;
  market: Market;
  empty: string;
  children: React.ReactNode;
}) {
  const [showAside, setShowAside] = useState(false);
  const main = options.filter((o) => o.status !== "other_market");
  const elsewhere = options.filter((o) => o.status === "other_market");
  const isOn = (o: Row) => picked.some((p) => keyOf(p) === keyOf(o));
  const row = (o: Row) => (
    <li key={keyOf(o)}>
      <button
        type="button"
        aria-pressed={isOn(o)}
        onClick={() => onToggle({ id: o.id, name: o.name, kind: o.kind, categories: o.categories, detail: o.detail })}
        className={cn("flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors", isOn(o) ? "border-ember bg-ember-soft" : "bg-card hover:border-foreground/25")}
      >
        <span aria-hidden className={cn("flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border", isOn(o) && "border-ember bg-ember text-white")}>
          {isOn(o) && <CheckIcon className="size-3" strokeWidth={3} />}
        </span>
        <BrandMark name={o.name} logo={o.card?.image} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium">{o.name}</span>
          <span className="block truncate text-[12.5px] text-muted-foreground">
            {o.status === "not_found" ? "Not found · added as new" : o.card ? [o.card.categories[0], o.card.kind === "place" ? o.card.address : o.card.markets.length ? `sells in ${marketsLabel(o.card.markets)}` : null].filter(Boolean).join(" · ") : o.detail}
          </span>
        </span>
        {o.status !== "not_found" && (
          <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
            <CircleCheckIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
            In Qloo
          </span>
        )}
      </button>
    </li>
  );
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[14px] font-medium">{title}</h2>
        <span className="text-[12.5px] text-muted-foreground">{count}</span>
      </div>
      {hint && <p className="-mt-2 text-[13px] text-muted-foreground">{hint}</p>}
      {main.length ? <ul className="space-y-2">{main.map(row)}</ul> : <p className="text-[13px] text-muted-foreground">{empty}</p>}
      {elsewhere.length > 0 && (
        <div className="rounded-[10px] bg-muted/60">
          <button type="button" onClick={() => setShowAside((v) => !v)} aria-expanded={showAside} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-muted-foreground">
            <ChevronDownIcon className={cn("size-3.5 transition-transform", !showAside && "-rotate-90")} strokeWidth={2} aria-hidden />
            Not sold in the {market === "GB" ? "UK" : "US"} ({elsewhere.length}): {elsewhere.map((e) => e.name).join(", ")}
          </button>
          {showAside && <ul className="space-y-2 px-2 pb-2">{elsewhere.map(row)}</ul>}
        </div>
      )}
      {children}
    </section>
  );
}

function MapSoFar({ brand, category, seeds, rivals, market }: { brand: NonNullable<BrandIntent["brand"]>; category: Category | null; seeds: Pick[]; rivals: Pick[]; market: Market }) {
  const chips = (list: Pick[]) =>
    list.length ? (
      <div className="flex flex-wrap gap-2">
        {list.map((p) => (
          <span key={keyOf(p)} className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-[13px]">
            {p.kind !== "new" ? <CircleCheckIcon className="size-3.5 text-foreground/70" strokeWidth={1.75} aria-hidden /> : <PlusIcon className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden />}
            {p.name}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-[13.5px] text-faint">Not chosen yet</p>
    );
  const inQloo = [...seeds, ...rivals].filter((p) => p.kind !== "new").length + (brand.kind !== "new" ? 1 : 0);
  const added = rivals.filter((p) => p.kind === "new").length;
  return (
    <PanelAside className="justify-start gap-7">
      <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Your map so far</p>
      <div className="flex items-center gap-3.5 rounded-[14px] border bg-card p-4">
        <BrandMark name={brand.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{brand.name}</p>
          <p className="truncate text-[12.5px] text-muted-foreground">{[brand.sells ?? brand.categories?.[0], brand.locality?.name ?? brand.basedIn].filter(Boolean).join(" · ") || (brand.kind === "place" ? "Shop or venue" : "Brand")}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-muted-foreground">
          {brand.kind !== "new" ? <CircleCheckIcon className="size-3.5" strokeWidth={1.75} aria-hidden /> : <PlusIcon className="size-3.5" strokeWidth={2} aria-hidden />}
          {brand.kind !== "new" ? "In Qloo" : "New"}
        </span>
      </div>
      {[
        ["Category", category ? chips([{ name: category.name, kind: "brand", id: category.id ?? category.name }]) : chips([])],
        ["Read your culture through", chips(seeds)],
        ["Compared with", chips(rivals)],
        ["Market", <p key="m" className="text-[14px]">{market === "GB" ? "UK" : "US"}</p>],
      ].map(([label, body]) => (
        <div key={label as string} className="space-y-2.5">
          <p className="text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{label}</p>
          {body}
        </div>
      ))}
      <div className="mt-auto flex items-start gap-2.5 rounded-[12px] border bg-card px-4 py-3 text-[13px] leading-relaxed text-foreground/85">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {inQloo
          ? `${inQloo} ${inQloo === 1 ? "brand is" : "brands are"} in Qloo and will be read for your map${added ? `; ${added} added as new ${added === 1 ? "is" : "are"} kept for your records` : ""}.`
          : "Pick brands from the lists so we have a culture to read."}
      </div>
    </PanelAside>
  );
}

/* ================================================================ step 3: review */

function Line({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className="flex items-center gap-4 border-b py-3 last:border-b-0">
      <span className="w-36 shrink-0 text-[13px] text-muted-foreground">{k}</span>
      <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium">{v || "—"}</span>
      {note && <span className="shrink-0 text-[12px] text-muted-foreground">{note}</span>}
    </div>
  );
}

function ReviewStep({ org, intent }: { org: OrgContext; intent: BrandIntent }) {
  const router = useRouter();
  const brand = intent.brand!;
  const market = org.organization.markets[0] ?? "GB";
  const seeds = intent.seeds ?? [];
  const rivals = intent.rivals ?? [];
  const inQloo = [...seeds, ...rivals].filter((p) => p.kind !== "new").length + (brand.kind !== "new" ? 1 : 0);
  const sides = 1 + rivals.filter((p) => p.kind !== "new").length;
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function build() {
    setPending(true);
    setFormError(null);
    try {
      await maps.build(org.organization.id);
      // The build runs on our servers; the overview shows its progress and survives leaving.
      router.push(`/${org.organization.slug}`);
    } catch (error) {
      fail(error, "onboarding.brand.build", setFormError);
      setPending(false);
    }
  }

  return (
    <SplitShell
      meta="Step 3 of 3"
      aside={
        <PhotoAside
          image={hiker}
          alt="A hiker crossing open hills"
          eyebrow="What you'll get"
          title={`The culture around ${brand.name}`}
          points={["What your customers watch, follow, listen to and visit", `Which ground ${rivals[0]?.name ?? "your competitors"} already hold`, "Three plays for this month, each with its source"]}
        />
      }
      footnote="You can change all of this later in Settings."
    >
      <div className="space-y-6">
        <Steps steps={STEPS} current={2} />
        <Heading title="Ready to build your map" sub={`Check what we’ll read for ${possessive(brand.name)} map.`} />
        <div className="rounded-[14px] border bg-card px-4">
          <Line k="Your brand" v={brand.name} note={brand.kind === "new" ? (brand.website ? "from your website" : "added as new") : "in Qloo"} />
          <Line k="Category" v={intent.category?.name ?? ""} />
          <Line k="Read through" v={seeds.map((s) => s.name).join(", ")} note={`${seeds.length} in Qloo`} />
          <Line k="Compared with" v={rivals.map((s) => s.name).join(", ")} note={`${rivals.filter((r) => r.kind !== "new").length} in Qloo`} />
          <Line k="Market" v={market === "GB" ? "UK" : "US"} />
        </div>
        <p className="flex items-start gap-2.5 rounded-xl border bg-muted/50 px-4 py-3 text-[13.5px] leading-relaxed">
          <SparklesIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {inQloo} {inQloo === 1 ? "brand is" : "brands are"} in Qloo, so none will be dropped from your map.
        </p>
        {formError && <Alert>{formError}</Alert>}
        <div className="space-y-3">
          <Button size="cta" className="w-full" onClick={build} disabled={pending}>
            {pending && <Spinner className="size-4" />}
            Build my map
            {!pending && <ArrowRightIcon data-icon="inline-end" />}
          </Button>
          <Button variant="ghost" size="pill" className="mx-auto flex" onClick={() => router.push(`/onboarding?kind=brand&step=2&org=${encodeURIComponent(org.organization.slug)}`)}>
            Change something
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">About a minute, using {sides * 8} Qloo queries. You can leave while it builds.</p>
        </div>
      </div>
    </SplitShell>
  );
}

