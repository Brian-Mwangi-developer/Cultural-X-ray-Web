"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, Clock3Icon, InfoIcon, PlusIcon } from "lucide-react";
import lakes from "../../../public/images/panel-lakes.jpg";
import hiker from "../../../public/images/panel-hiker.jpg";
import { BrandMark } from "@/components/app/parts";
import { PhotoAside, SplitShell, Steps } from "@/components/app/split-shell";
import { ChoiceChip, FormField, Segmented, SelectField, SlugInput, suggestSlug, TextInput, useSlugCheck } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppError, userMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";
import type { OrgContext } from "@/lib/session";

const STEPS = ["Brand", "Compare with", "Market"];

const CATEGORIES = [
  { value: "outdoor", label: "Outdoor & apparel" },
  { value: "sportswear", label: "Sportswear" },
  { value: "fashion", label: "Fashion & luxury" },
  { value: "beauty", label: "Beauty" },
  { value: "coffee", label: "Coffee & food" },
  { value: "drinks", label: "Drinks" },
  { value: "other", label: "Something else" },
] as const;
type Category = (typeof CATEGORIES)[number]["value"];

// Brands people in each category commonly also buy. Replaced by Qloo's own lookup when the engine lands.
const SUGGESTIONS: Record<Category, { seeds: string[]; rivals: string[] }> = {
  outdoor: { seeds: ["Cotopaxi", "Patagonia", "Finisterre", "Rab"], rivals: ["Fjällräven", "The North Face", "Arc'teryx"] },
  sportswear: { seeds: ["On", "Hoka", "Lululemon"], rivals: ["Nike", "Adidas", "New Balance"] },
  fashion: { seeds: ["COS", "Toteme", "Jacquemus"], rivals: ["Gucci", "Prada", "Louis Vuitton"] },
  beauty: { seeds: ["Glossier", "The Ordinary", "Rhode"], rivals: ["Fenty Beauty", "Rare Beauty", "Kylie Cosmetics"] },
  coffee: { seeds: ["Blue Bottle", "Pret A Manger", "Intelligentsia"], rivals: ["Starbucks", "Dunkin'", "Tim Hortons"] },
  drinks: { seeds: ["Liquid Death", "Olipop", "Athletic Brewing"], rivals: ["Coca-Cola", "Red Bull", "Heineken"] },
  other: { seeds: ["Patagonia", "Glossier", "Liquid Death"], rivals: ["Nike", "Apple", "Starbucks"] },
};

type Intent = { category?: Category; city?: string; seeds?: string[]; rivals?: string[] };

function readIntent(org: OrgContext | null): Intent {
  if (!org?.organization.metadata) return {};
  try {
    return JSON.parse(org.organization.metadata) as Intent;
  } catch {
    return {};
  }
}

type Props = { step: number; org: OrgContext | null };

export function BrandFlow({ step, org }: Props) {
  const current = org ? Math.min(Math.max(step, 2), 3) : 1;
  const intent = readIntent(org);
  if (current === 1 || !org) return <BrandStep />;
  if (current === 2) return <CompareStep org={org} intent={intent} />;
  return <MarketStep org={org} intent={intent} />;
}

const aside = (
  <PhotoAside
    image={lakes}
    alt="A lake below green mountains with a wooden jetty"
    eyebrow="What you'll get"
    title="Your culture, in plain English"
    points={["What your customers listen to, watch, follow and travel to", "Three plays for this month, each with its source", "A check for your next ad before you spend"]}
  />
);

/* ---------------------------------------------------------------- step 1 */

function BrandStep() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [city, setCity] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSlug = slugEdited ? slug : suggestSlug(name);
  const slugState = useSlugCheck(effectiveSlug);
  const errors = {
    name: name.trim().length < 2 ? "Enter your brand's name." : null,
    category: category ? null : "Choose the closest category.",
    slug: effectiveSlug.length < 3 ? "Use at least 3 characters." : slugState.status === "taken" ? slugState.reason ?? "That address is taken." : null,
  };
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (Object.values(errors).some(Boolean) || slugState.status === "checking") return;
    setPending(true);
    try {
      const created = unwrap(
        await authClient.organization.create({
          name: name.trim(),
          slug: effectiveSlug,
          kind: "WORKSPACE",
          metadata: { category, city: city.trim() || undefined },
        }),
      );
      router.replace(`/onboarding?kind=brand&step=2&org=${encodeURIComponent(created!.slug)}`);
      router.refresh();
    } catch (error) {
      if (!(error instanceof AppError && error.expected)) reportError(error, { where: "onboarding.brand.create" });
      setFormError(userMessage(error));
      setPending(false);
    }
  }

  return (
    <SplitShell meta="Step 1 of 3" aside={aside} footnote="You can change these later in Settings.">
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <Steps steps={STEPS} current={0} />
        <div>
          <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em]">Tell us about your brand</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">We read your culture from the brands your customers already love. First, who are you?</p>
        </div>
        {formError && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{formError}</p>}
        <FormField label="Brand name" htmlFor="brand" error={show("name")}>
          <TextInput id="brand" value={name} onChange={(e) => setName(e.target.value)} placeholder="Northline Outdoor" autoFocus invalid={Boolean(show("name"))} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="category" error={show("category")}>
            <SelectField id="category" value={category} onChange={setCategory} options={[...CATEGORIES]} placeholder="Choose a category" />
          </FormField>
          <FormField label="Home city" htmlFor="city" hint="Optional">
            <TextInput id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" autoComplete="address-level2" />
          </FormField>
        </div>
        <FormField label="Workspace URL" htmlFor="slug" error={show("slug") ?? (slugState.status === "taken" ? slugState.reason : null)}>
          <SlugInput id="slug" value={effectiveSlug} onChange={(v) => { setSlugEdited(true); setSlug(v); }} state={slugState} />
        </FormField>
        <Button type="submit" size="cta" className="w-full" disabled={pending}>
          {pending && <Spinner className="size-4" />}
          Continue
          {!pending && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </form>
    </SplitShell>
  );
}

/* ---------------------------------------------------------------- step 2 */

async function saveIntent(org: OrgContext, intent: Intent) {
  unwrap(await authClient.organization.update({ organizationId: org.organization.id, data: { metadata: intent } }));
}

function CompareStep({ org, intent }: { org: OrgContext; intent: Intent }) {
  const router = useRouter();
  const suggestions = SUGGESTIONS[intent.category ?? "other"];
  const [seeds, setSeeds] = useState<string[]>(intent.seeds ?? suggestions.seeds.slice(0, 2));
  const [rivals, setRivals] = useState<string[]>(intent.rivals ?? suggestions.rivals.slice(0, 1));
  const [extraSeeds, setExtraSeeds] = useState<string[]>([]);
  const [extraRivals, setExtraRivals] = useState<string[]>([]);
  const [adding, setAdding] = useState<"seed" | "rival" | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const category = CATEGORIES.find((c) => c.value === intent.category)?.label;

  const toggle = (list: string[], set: (v: string[]) => void, name: string, max: number) =>
    set(list.includes(name) ? list.filter((x) => x !== name) : list.length < max ? [...list, name] : list);

  function commitDraft() {
    const name = draft.trim();
    if (name && adding === "seed" && !extraSeeds.includes(name)) {
      setExtraSeeds((c) => [...c, name]);
      if (seeds.length < 3) setSeeds((c) => [...c, name]);
    }
    if (name && adding === "rival" && !extraRivals.includes(name)) {
      setExtraRivals((c) => [...c, name]);
      if (rivals.length < 3) setRivals((c) => [...c, name]);
    }
    setDraft("");
    setAdding(null);
  }

  async function onContinue() {
    if (!seeds.length) return setFormError("Pick at least one brand your customers also buy.");
    setPending(true);
    setFormError(null);
    try {
      await saveIntent(org, { ...intent, seeds, rivals });
      router.replace(`/onboarding?kind=brand&step=3&org=${encodeURIComponent(org.organization.slug)}`);
      router.refresh();
    } catch (error) {
      if (!(error instanceof AppError && error.expected)) reportError(error, { where: "onboarding.brand.compare" });
      setFormError(userMessage(error));
      setPending(false);
    }
  }

  const adder = (kind: "seed" | "rival") =>
    adding === kind ? (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          }
          if (e.key === "Escape") setAdding(null);
        }}
        aria-label={kind === "seed" ? "Add a brand your customers buy" : "Add a rival"}
        placeholder="Brand name"
        className="h-9 w-40 rounded-full border border-ember/60 bg-card px-3.5 text-[13.5px] outline-none ring-3 ring-ember/15"
      />
    ) : (
      <ChoiceChip selected={false} onClick={() => setAdding(kind)} icon={<PlusIcon className="size-3.5 text-muted-foreground" strokeWidth={2} />}>
        Add a brand
      </ChoiceChip>
    );

  return (
    <SplitShell meta="Step 2 of 3" aside={aside} footnote="You can change these later in Settings.">
      <div className="space-y-6">
        <Steps steps={STEPS} current={1} />
        <div>
          <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">Who should we compare you with?</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
            Most young brands aren&rsquo;t in Qloo&rsquo;s taste graph yet. Pick brands your customers also buy, and we&rsquo;ll read your culture through them.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-[14px] border bg-muted/60 px-4 py-3">
          <BrandMark name={org.organization.name} tone="neutral" size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-medium">{org.organization.name}</p>
            <p className="truncate text-[12.5px] text-muted-foreground">{[category, intent.city].filter(Boolean).join(" · ") || "Your brand"}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <InfoIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
            Checked when your map builds
          </span>
        </div>

        {formError && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{formError}</p>}

        <FormField label="Read your culture through" aside={`${seeds.length} of 3`}>
          <div className="flex flex-wrap gap-2">
            {[...suggestions.seeds, ...extraSeeds].map((b) => (
              <ChoiceChip key={b} selected={seeds.includes(b)} onClick={() => toggle(seeds, setSeeds, b, 3)}>
                {b}
              </ChoiceChip>
            ))}
            {adder("seed")}
          </div>
        </FormField>

        <FormField label="Compare against" aside={`${rivals.length} of 3`}>
          <div className="flex flex-wrap gap-2">
            {[...suggestions.rivals, ...extraRivals].map((b) => (
              <ChoiceChip key={b} selected={rivals.includes(b)} onClick={() => toggle(rivals, setRivals, b, 3)}>
                {b}
              </ChoiceChip>
            ))}
            {adder("rival")}
          </div>
        </FormField>

        <Button size="cta" className="w-full" onClick={onContinue} disabled={pending}>
          {pending && <Spinner className="size-4" />}
          Continue
          {!pending && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </div>
    </SplitShell>
  );
}

/* ---------------------------------------------------------------- step 3 */

function MarketStep({ org, intent }: { org: OrgContext; intent: Intent }) {
  const router = useRouter();
  const [market, setMarket] = useState<"US" | "GB">(org.organization.markets[0] ?? "US");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function build() {
    setPending(true);
    setFormError(null);
    try {
      await api(`/orgs/${org.organization.id}/profile`, { method: "PATCH", body: { markets: [market] } });
      router.replace(`/${org.organization.slug}?building=1`);
      router.refresh();
    } catch (error) {
      if (!(error instanceof AppError && error.expected)) reportError(error, { where: "onboarding.brand.market" });
      setFormError(userMessage(error));
      setPending(false);
    }
  }

  const reading = [...(intent.seeds ?? [])].join(" and ");
  const against = (intent.rivals ?? []).join(", ");

  return (
    <SplitShell
      meta="Step 3 of 3"
      aside={
        <PhotoAside
          image={hiker}
          alt="A hiker crossing open hills"
          eyebrow="About a minute"
          title="We read eight categories, then write it up."
          points={["Podcasts, films, TV, creators and artists", "Places, brands and books", "Cached, so opening it again is free"]}
        />
      }
      footnote="You can change these later in Settings."
    >
      <div className="space-y-6">
        <Steps steps={STEPS} current={2} />
        <div>
          <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em]">Where do you sell?</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
            Culture changes by market. We&rsquo;ll read {reading ? <span className="text-foreground">{reading}</span> : "your brands"}
            {against ? (
              <>
                {" "}against <span className="text-foreground">{against}</span>
              </>
            ) : null}{" "}
            in the market you choose.
          </p>
        </div>

        {formError && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{formError}</p>}

        <div className="flex items-center justify-between gap-4 rounded-[14px] border px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium">Market</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <Clock3Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
              More markets soon
            </p>
          </div>
          <Segmented label="Market" value={market} onChange={setMarket} options={[{ value: "GB", label: "UK" }, { value: "US", label: "US" }]} />
        </div>

        <div className="space-y-3">
          <Button size="cta" className="w-full" onClick={build} disabled={pending}>
            {pending && <Spinner className="size-4" />}
            Build my map
            {!pending && <ArrowRightIcon data-icon="inline-end" />}
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">About a minute. Uses roughly 200 Qloo queries, then it&rsquo;s cached.</p>
        </div>
      </div>
    </SplitShell>
  );
}
