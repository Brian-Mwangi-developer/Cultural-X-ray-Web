import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CircleCheckIcon, DownloadIcon, FlagIcon, type LucideIcon, MicIcon, Share2Icon, UploadIcon, UserIcon } from "lucide-react";
import { Evidence, TerritoryGlyph, TextLink } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { RestsOn, XRayRead } from "@/components/app/xray-read";
import { AskAbout } from "@/components/ask/ask-about";
import { AudienceGlobe } from "@/components/globe/audience-globe";
import { BuildMapButton } from "@/components/views/build-map-button";
import { type AudienceData, globeOf } from "@/lib/audience";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { possessive } from "@/lib/intent";
import { type CultureMap, categoryOf, type MapItem, type MapKind, ownedIn, shortName, standingOf, territoryOf } from "@/lib/maps";
import { PHOTOS } from "@/lib/sample-data";
import { basisFrom, inWords } from "@/lib/basis";
import { StandInNote } from "@/components/app/stand-in-note";
import { cn } from "@/lib/utils";

type Column = { title: string; kinds: MapKind[]; fallback: StaticImageData };

const COLUMNS: Column[] = [
  { title: "They listen to", kinds: ["PODCAST"], fallback: PHOTOS.mic },
  { title: "They watch", kinds: ["TV_SHOW", "MOVIE"], fallback: PHOTOS.forest },
  { title: "They follow", kinds: ["PERSON"], fallback: PHOTOS.host },
  { title: "They go to", kinds: ["DESTINATION"], fallback: PHOTOS.lakes },
];

/** Take turns from each list, so "They watch" mixes TV and films in Qloo's order. */
function interleave(lists: MapItem[][], n: number) {
  const out: MapItem[] = [];
  for (let i = 0; out.length < n && lists.some((l) => l[i]); i++) for (const l of lists) if (l[i] && out.length < n) out.push(l[i]!);
  return out;
}

const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

/** X-Ray's read of the map: one plain sentence from the top of each list, and the items it names. */
function readOf(map: CultureMap, whose: string) {
  const first = (kind: MapKind) => ownedIn(categoryOf(map, kind))[0];
  const podcast = first("PODCAST");
  const show = first("TV_SHOW") ?? first("MOVIE");
  const place = first("DESTINATION");
  const parts = [
    podcast && `listen to ${shortName(podcast.name)}`,
    show && `watch ${shortName(show.name)}`,
    place && `spend weekends in places like ${shortName(place.name)}`,
  ].filter(Boolean) as string[];
  return {
    sentence: parts.length ? `${whose} customers ${list(parts)}.` : `Qloo knows little about ${whose.toLowerCase() === "your" ? "your" : whose} customers yet.`,
    items: [podcast, show, place].filter((i): i is MapItem => Boolean(i)),
  };
}

/** "only yours", "shared with Ben & Jerry's · leans your way": where an item stands, mid-sentence. */
const standingWords = (item: MapItem) => {
  const s = standingOf(item);
  return s.charAt(0).toLowerCase() + s.slice(1);
};

type Play = { id: string; kind: string; icon: LucideIcon; title: string; body: string; source: string; why: string; tip: string };

/** Up to three plays, each straight from one item on the map. Nothing here is invented. */
function playsOf(map: CultureMap): Play[] {
  const plays: Play[] = [];
  const rivals = list(map.subjects.filter((s) => s.role === "RIVAL").map((s) => s.name)) || "your rivals";
  const podcast = categoryOf(map, "PODCAST")?.items.find((i) => i.label === "YOURS");
  if (podcast) {
    plays.push({ id: "podcast", kind: "Podcast", icon: MicIcon, title: `Sponsor ${shortName(podcast.name)}`, body: `It's one of your customers' top podcasts, and none of your rivals' customers rank it. A host-read ad there speaks to people like yours.`, source: "Only yours · Podcasts", why: "only your customers rank it", tip: `${podcast.name} is one of your customers’ top podcasts on Qloo, and none of ${rivals}’ customers rank it.` });
  }
  const person = categoryOf(map, "PERSON")?.items.find((i) => i.label === "YOURS");
  if (person) {
    plays.push({ id: "creator", kind: "Creator", icon: UserIcon, title: `Work with ${person.name}`, body: `${person.name} is one of the people your customers follow most, and no rival's customers share them.`, source: "Only yours · Creators", why: "no rival’s customers follow them", tip: `${person.name} is among the people your customers follow most on Qloo, and none of ${rivals}’ customers rank them.` });
  }
  const shared = (["PODCAST", "TV_SHOW", "MOVIE"] as MapKind[])
    .flatMap((k) => categoryOf(map, k)?.items.filter((i) => i.label === "CONTESTED") ?? [])
    .sort((a, b) => (b.lean ?? 0) - (a.lean ?? 0))[0];
  if (shared?.rival) {
    const leans = (shared.lean ?? 0.5) >= 0.6;
    plays.push({
      id: "shared",
      kind: "Shared ground",
      icon: FlagIcon,
      title: `Hold ${shortName(shared.name)} before ${shared.rival} does`,
      body: `Your customers and ${possessive(shared.rival)} customers both love ${shared.name}${leans ? ", and it leans your way" : ""}. Show up there first.`,
      source: `Shared with ${shared.rival}`,
      why: leans ? `shared with ${shared.rival}, and it leans your way` : `shared with ${shared.rival}`,
      tip: `Your customers and ${possessive(shared.rival)} customers both rank ${shared.name} on Qloo${leans ? ", and it sits higher on your customers’ list" : ""}.`,
    });
  }
  return plays.slice(0, 3);
}

const builtWhen = (iso: string | null) => (iso ? `Map built ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(new Date(iso))}` : "Map built");

/**
 * A brand's overview from its latest Culture Map (Figma O3b). The same view serves the owner's home
 * and an agency's client page; `base` is where its links point (`/judesicecream` or
 * `/harborandpine/clients/judesicecream`).
 */
export function OverviewView({
  base,
  orgId,
  brand,
  map,
  audience,
  market,
  canBuild,
  crumbs = [{ label: "Overview" }],
  canAsk = true,
  viaAgency = false,
}: {
  base: string;
  orgId: string;
  brand: string;
  map: CultureMap | null;
  audience: AudienceData | null;
  market: string;
  canBuild: boolean;
  crumbs?: Crumb[];
  /** Whether the Ask X-Ray panel is on this page. */
  canAsk?: boolean;
  /** An agency reads a client's map: the read names the brand instead of saying "your". */
  viaAgency?: boolean;
}) {
  if (!map) return <NoMapYet orgId={orgId} brand={brand} canBuild={canBuild} crumb={crumbs.at(-1)?.label} />;
  const seeds = map.subjects.filter((s) => s.role === "SEED").map((s) => s.name);
  const rivals = map.subjects.filter((s) => s.role === "RIVAL").map((s) => s.name);
  const facts = [`${market} market`, seeds.length ? `Read through ${list(seeds)}` : null, rivals.length ? `Against ${list(rivals)}` : null].filter(Boolean) as string[];
  const whose = viaAgency ? possessive(brand) : "Your";
  // A brand Qloo doesn't know is read through brands like it: say so, and say whose customers these are.
  const basis = basisFrom(map.subjects);
  const say = (t: string) => inWords(t, basis, brand, viaAgency);
  const read = readOf(map, whose);
  const plays = playsOf(map).map((p) => ({ ...p, body: say(p.body), why: say(p.why), tip: say(p.tip), source: say(p.source) }));
  const first = plays[0];
  const globe = audience ? globeOf(audience) : null;

  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            <SoonButton variant="outline" size="pill" message="Sharing arrives with briefs.">
              <Share2Icon data-icon="inline-start" />
              Share
            </SoonButton>
            <SoonButton variant="outline" size="pill" className="hidden md:inline-flex" message="PDF export arrives with briefs.">
              <DownloadIcon data-icon="inline-start" />
              Export PDF
            </SoonButton>
          </>
        }
      />
      <PageBody className="space-y-10">
        <div className="space-y-5">
          {/* The title is the brand; X-Ray's read of it is feedback, in its own card. */}
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div className="min-w-0">
              <h1 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.03em] lg:text-[32px]">{brand}</h1>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{facts.join(" · ")}</p>
            </div>
            <p className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
              <CircleCheckIcon className="size-4" strokeWidth={1.75} aria-hidden />
              {builtWhen(map.builtAt)}
            </p>
          </header>

          <StandInNote basis={basis} brand={brand} className="mb-4" />
          <XRayRead
            of={viaAgency ? `of ${possessive(brand)} Culture Map` : "of your Culture Map"}
            aside={
              <Evidence tip={say(`Read from ${map.queryCount} Qloo lookups: what your customers and your rivals’ customers listen to, watch, follow and visit, and who each brand reaches.`)}>
                from {map.queryCount} Qloo lookups
              </Evidence>
            }
            basedOn={
              read.items.length > 0 && (
                <>
                  <span className="text-[12.5px] text-muted-foreground">Based on</span>
                  {read.items.map((item) => (
                    <RestsOn key={item.id} glyph={<TerritoryGlyph kind={territoryOf(item.label)} decorative />} name={shortName(item.name)} standing={say(standingWords(item))} />
                  ))}
                </>
              )
            }
            footer={
              <>
                {first && (
                  <p className="min-w-0 flex-1 text-[13.5px] text-muted-foreground">
                    Start with <span className="font-semibold text-foreground">{first.title}</span> · {first.why}
                  </p>
                )}
                <div className={cn("flex flex-wrap gap-2", !first && "ml-auto")}>
                  {canAsk && <AskAbout question={`What should ${brand} do first with this Culture Map, and why?`} />}
                  {plays.length > 0 && (
                    <a href="#plays" className={buttonVariants({ variant: "outline", size: "pill" })}>
                      See the plays
                      <ArrowRightIcon data-icon="inline-end" />
                    </a>
                  )}
                </div>
              </>
            }
          >
            <p>{say(read.sentence)}</p>
            {map.thinData && <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Qloo knows less about this brand than most, so some lists are short. Adding a brand your customers also buy will fill it out.</p>}
          </XRayRead>
        </div>

        {/* Where the culture lives comes first; Google Maps will sit beside it as another view. */}
        {globe && globe.cities.length > 0 && <AudienceGlobe {...globe} />}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = interleave(col.kinds.map((k) => ownedIn(categoryOf(map, k))), 3);
            const image = items.find((i) => i.image)?.image;
            return (
              <section key={col.title} className="overflow-hidden rounded-[14px] border bg-card">
                <div className="relative h-32 bg-muted">
                  {image ? (
                    <Image src={image} alt="" fill sizes="(min-width:1280px) 25vw, 50vw" className="object-cover" />
                  ) : (
                    <Image src={col.fallback} alt="" fill sizes="(min-width:1280px) 25vw, 50vw" className="object-cover" placeholder="blur" />
                  )}
                </div>
                <div className="px-4 pt-4 pb-5">
                  <h2 className="text-[18px] font-medium tracking-[-0.01em]">{col.title}</h2>
                  {items.length ? (
                    <ul className="mt-2.5 space-y-2.5">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-start gap-2.5">
                          <TerritoryGlyph kind={territoryOf(item.label)} className="mt-[5px]" decorative />
                          <span className="min-w-0">
                            <span className="block truncate text-[14px]">{item.name}</span>
                            <span className="block text-[12.5px] text-muted-foreground">{standingOf(item)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2.5 text-[13.5px] text-muted-foreground">Nothing stands out yet.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {plays.length > 0 && (
          <section id="plays" className="scroll-mt-20 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[24px] font-semibold tracking-[-0.025em]">{plays.length === 1 ? "One play for this month" : `${plays.length === 2 ? "Two" : "Three"} plays for this month`}</h2>
              <TextLink href={`${base}/map`}>Open the Culture Map</TextLink>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {plays.map((play) => (
                <article key={play.id} className="flex flex-col rounded-[14px] border bg-card p-5">
                  <p className="flex items-center gap-2.5 text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                    <span className="flex size-8 items-center justify-center rounded-full border">
                      <play.icon className="size-4 text-foreground" strokeWidth={1.75} aria-hidden />
                    </span>
                    {play.kind}
                  </p>
                  <h3 className="mt-4 text-[17px] leading-snug font-medium">{play.title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{play.body}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Evidence tip={play.tip}>{play.source}</Evidence>
                    <Link href={`${base}/map`} className={buttonVariants({ variant: "outline", size: "pill" })}>
                      See why
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-full border">
            <UploadIcon className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">Check a draft before you spend</p>
            <p className="text-[13.5px] text-muted-foreground">Drop a video up to 60 seconds. We&rsquo;ll show where it lands and what to change.</p>
          </div>
          <Link href={`${base}/ad-check`} className={buttonVariants({ size: "pill" })}>
            <UploadIcon data-icon="inline-start" />
            Upload video
          </Link>
        </section>
      </PageBody>
    </>
  );
}

/** Shown wherever a page needs a map that hasn't been built yet. */
export function NoMapYet({ orgId, brand, canBuild, crumb = "Overview" }: { orgId: string; brand: string; canBuild: boolean; crumb?: string }) {
  return (
    <>
      <TopBar crumbs={[{ label: crumb }]} />
      <PageBody>
        <section className="max-w-xl space-y-5 rounded-[14px] border bg-card p-6">
          <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">No map yet</p>
          <h1 className="text-[28px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">See what {brand}&rsquo;s customers watch, follow and listen to</h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We read Qloo for your brand and your rivals, then show which ground is only yours, which you share, and which they hold. About a minute.
          </p>
          {canBuild ? <BuildMapButton orgId={orgId} /> : <p className="text-[13.5px] text-muted-foreground">Ask an owner, admin or strategist to build it.</p>}
        </section>
      </PageBody>
    </>
  );
}
