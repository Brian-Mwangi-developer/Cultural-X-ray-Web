import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CircleCheckIcon, DownloadIcon, FlagIcon, type LucideIcon, MicIcon, Share2Icon, UploadIcon, UserIcon } from "lucide-react";
import { Evidence, TerritoryGlyph, TextLink } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { AudienceGlobe } from "@/components/globe/audience-globe";
import { BuildMapButton } from "@/components/views/build-map-button";
import { type AudienceData, globeOf } from "@/lib/audience";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { possessive } from "@/lib/intent";
import { type CultureMap, categoryOf, type MapItem, type MapKind, ownedIn, shortName, standingOf, territoryOf } from "@/lib/maps";
import { PHOTOS } from "@/lib/sample-data";

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

/** The headline: one plain sentence from the top of each list. */
function headlineOf(map: CultureMap) {
  const first = (kind: MapKind) => {
    const name = ownedIn(categoryOf(map, kind))[0]?.name;
    return name && shortName(name);
  };
  const parts = [
    first("PODCAST") && `listen to ${first("PODCAST")}`,
    (first("TV_SHOW") ?? first("MOVIE")) && `watch ${first("TV_SHOW") ?? first("MOVIE")}`,
    first("DESTINATION") && `spend weekends in places like ${first("DESTINATION")}`,
  ].filter(Boolean) as string[];
  return parts.length ? `Your customers ${list(parts)}.` : "Qloo knows little about your customers yet.";
}

type Play = { id: string; kind: string; icon: LucideIcon; title: string; body: string; source: string };

/** Up to three plays, each straight from one item on the map. Nothing here is invented. */
function playsOf(map: CultureMap): Play[] {
  const plays: Play[] = [];
  const podcast = categoryOf(map, "PODCAST")?.items.find((i) => i.label === "YOURS");
  if (podcast) {
    plays.push({ id: "podcast", kind: "Podcast", icon: MicIcon, title: `Sponsor ${shortName(podcast.name)}`, body: `It's one of your customers' top podcasts, and none of your rivals' customers rank it. A host-read ad there speaks to people like yours.`, source: "Only yours · Podcasts" });
  }
  const person = categoryOf(map, "PERSON")?.items.find((i) => i.label === "YOURS");
  if (person) {
    plays.push({ id: "creator", kind: "Creator", icon: UserIcon, title: `Work with ${person.name}`, body: `${person.name} is one of the people your customers follow most, and no rival's customers share them.`, source: "Only yours · Creators" });
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
    });
  }
  return plays.slice(0, 3);
}

const builtWhen = (iso: string | null) => {
  if (!iso) return "Built";
  return `Built ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(new Date(iso))}`;
};

/** o3: the owner's home, from their latest Culture Map. */
export function OwnerOverview({ slug, orgId, brand, map, audience, market, canBuild }: { slug: string; orgId: string; brand: string; map: CultureMap | null; audience: AudienceData | null; market: string; canBuild: boolean }) {
  if (!map) return <NoMapYet orgId={orgId} brand={brand} canBuild={canBuild} />;
  const seeds = map.subjects.filter((s) => s.role === "SEED").map((s) => s.name);
  const rivals = map.subjects.filter((s) => s.role === "RIVAL").map((s) => s.name);
  const readFor = map.subjects.some((s) => s.role === "SELF") ? `read for ${brand}${seeds.length ? ` with ${list(seeds)}` : ""}` : `read through ${list(seeds)}`;
  const plays = playsOf(map);
  const globe = audience ? globeOf(audience) : null;

  return (
    <>
      <TopBar
        crumbs={[{ label: "Overview" }]}
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
        <div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            <CircleCheckIcon className="size-4" strokeWidth={1.75} aria-hidden />
            {builtWhen(map.builtAt)} · {market} · {readFor}
            {rivals.length > 0 && `, against ${list(rivals)}`}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="max-w-[28ch] text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance lg:text-[38px]">{headlineOf(map)}</h1>
            <Evidence>from {map.queryCount} Qloo lookups</Evidence>
          </div>
          {map.thinData && <p className="mt-3 max-w-2xl text-[13.5px] text-muted-foreground">Qloo knows less about this brand than most, so some lists are short. Adding a brand your customers also buy will fill it out.</p>}
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
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[24px] font-semibold tracking-[-0.025em]">{plays.length === 1 ? "One play for this month" : `${plays.length === 2 ? "Two" : "Three"} plays for this month`}</h2>
              <TextLink href={`/${slug}/map`}>Open the Culture Map</TextLink>
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
                    <Evidence>{play.source}</Evidence>
                    <Link href={`/${slug}/map`} className={buttonVariants({ variant: "outline", size: "pill" })}>
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
          <Link href={`/${slug}/ad-check`} className={buttonVariants({ size: "pill" })}>
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
