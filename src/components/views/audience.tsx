import Link from "next/link";
import { DownloadIcon, InfoIcon, MapPinIcon } from "lucide-react";
import { Evidence, PageHeader, Panel, SampleBadge, TerritoryGlyph, WideOnly } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { AudienceGlobe } from "@/components/globe/audience-globe";
import { PageBody, TopBar, type Crumb } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { BuildMapButton } from "@/components/views/build-map-button";
import { type AudienceData, type AudiencePlace, leaderOf, rankWords, readOf, shadeOf, shortRank, strengthWord } from "@/lib/audience";
import { centreOf, type GlobeCity } from "@/lib/globe-data";
import { cn } from "@/lib/utils";

const TERRITORY = { YOURS: "yours", CONTESTED: "contested", THEIRS: "theirs" } as const;

/** Deeper ember means a stronger match. The word is always printed, so colour never carries it alone. */
function cellStyle(shade: number) {
  return { backgroundColor: `color-mix(in oklab, var(--ember) ${Math.round(10 + shade * 70)}%, var(--card))` };
}

function toCity(p: AudiencePlace): GlobeCity | null {
  if (p.lat == null || p.lon == null) return null;
  return { id: p.id, name: p.name, region: p.detail ?? "", lat: p.lat, lng: p.lon, territory: TERRITORY[p.label], rival: p.rival, ranks: p.ranks };
}

/**
 * a5: who each brand reaches, and where. Everything is said in words: who's strongest with which
 * group, which places are only yours, and where a rival's customers go instead.
 */
export function AudienceView({ crumbs, brand, data, sample, slug, orgId, canBuild }: { crumbs: Crumb[]; brand: string; data: AudienceData; sample?: boolean; slug?: string; orgId?: string; canBuild?: boolean }) {
  const you = data.sides[0]!;
  const cities = data.places.map(toCity).filter((c): c is GlobeCity => c !== null);
  // One market's towns sit close together: start zoomed in on them, with tighter heat.
  const start = sample ? { lat: 38, lng: -60, altitude: 1.85 } : { ...centreOf(cities), altitude: 0.8 };
  const yours = data.places.filter((p) => p.ranks.you && p.label !== "THEIRS").sort((a, b) => a.ranks.you! - b.ranks.you!);
  const onlyYours = yours.filter((p) => p.label === "YOURS").slice(0, 3);
  const shared = yours.filter((p) => p.label === "CONTESTED").slice(0, 2);
  const theirs = data.places.filter((p) => p.label === "THEIRS").sort((a, b) => Math.min(...Object.values(a.ranks)) - Math.min(...Object.values(b.ranks))).slice(0, 3);
  const sideOf = (name: string | null) => data.sides.find((s) => s.name === name);

  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            {sample && <SampleBadge className="hidden sm:inline-flex" />}
            <SoonButton variant="outline" size="pill" message="Exports arrive with briefs.">
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
            <p className="max-w-4xl text-[19px] leading-[1.45] font-medium tracking-[-0.01em]">{readOf(data, brand)}</p>
            <Evidence className="hidden shrink-0 md:inline-flex">from {data.queryCount} Qloo lookups</Evidence>
          </div>
        </section>

        {cities.length > 0 && <AudienceGlobe cities={cities} sides={data.sides.map((s) => ({ key: s.key, name: s.name }))} start={start} spread={sample ? 1.1 : 0.3} />}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Panel title="Who they are" action={<span className="rounded-full border px-2.5 py-0.5 text-[12.5px]">Market {data.market === "GB" ? "UK" : "US"}</span>}>
            {data.hasAudience ? (
              <WideOnly what="The audience grid" className="px-5 py-5">
                <table className="w-full border-separate border-spacing-1.5 text-center">
                  <thead>
                    <tr className="text-[12.5px] text-muted-foreground">
                      <th className="w-24" />
                      {data.sides.map((s) => (
                        <th key={s.key} className="px-1 pb-1 font-normal">
                          {s.key === "you" && s.readThrough ? "Your customers" : s.name}
                        </th>
                      ))}
                      <th className="px-1 pb-1 text-left font-normal">Who leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.segments.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" className="pr-3 text-left text-[13.5px] font-normal">
                          {row.label}
                        </th>
                        {data.sides.map((s) => {
                          const cell = row.cells[s.key];
                          const shade = shadeOf(cell);
                          return (
                            <td
                              key={s.key}
                              className={cn("h-11 rounded-lg text-[13px]", shade === null && "border border-dashed bg-transparent text-faint")}
                              style={shade === null ? undefined : cell?.lowConfidence ? { backgroundColor: "color-mix(in oklab, var(--ember) 12%, var(--card))" } : cellStyle(shade)}
                            >
                              <span className="flex flex-col leading-tight">
                                {strengthWord(cell)}
                                {cell?.lowConfidence && <span className="text-[10.5px] text-muted-foreground">thin data</span>}
                              </span>
                            </td>
                          );
                        })}
                        <td className="pl-2 text-left text-[13px] text-muted-foreground">{leaderOf(row, data.sides) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <InfoIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                  Each box says how much that group goes for the brand; deeper orange means more. &ldquo;Thin data&rdquo; means Qloo has little to go on for that group, so treat it as a hint. &ldquo;Not enough data&rdquo; means Qloo couldn&rsquo;t tell.
                </p>
              </WideOnly>
            ) : (
              <div className="space-y-3 px-5 py-5">
                <p className="text-[14px] leading-relaxed text-muted-foreground">This map was built before we read ages and genders. Rebuild it to see who your customers are.</p>
                {canBuild && orgId && slug ? <BuildMapButton orgId={orgId} rebuild label="Rebuild my map" then={`/${slug}`} /> : null}
              </div>
            )}
          </Panel>

          <Panel title="Places your customers pick">
            <ul className="divide-y divide-soft">
              {[...onlyYours, ...shared].map((p) => {
                const rival = sideOf(p.rival);
                return (
                  <PlaceRow
                    key={p.id}
                    place={p}
                    line={p.label === "YOURS" ? `${rankWords(p, you)}. No rival's customers list it.` : `${rankWords(p, you)}. ${theirRank(p, rival?.key)}`}
                  />
                );
              })}
              {!onlyYours.length && !shared.length && <li className="px-5 py-4 text-[14px] text-muted-foreground">No places stand out for your customers yet.</li>}
            </ul>
            {theirs.length > 0 && (
              <div className="border-t">
                <p className="px-5 pt-4 text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Where your rivals&rsquo; customers go instead</p>
                <ul className="divide-y divide-soft">
                  {theirs.map((p) => {
                    const rival = sideOf(p.rival);
                    return <PlaceRow key={p.id} place={p} line={`${rival ? rankWords(p, rival) : `Only ${p.rival}`}. Not in your top 20.`} />;
                  })}
                </ul>
              </div>
            )}
            {slug && (
              <div className="border-t px-5 py-3">
                <Link href={`/${slug}/map`} className={buttonVariants({ variant: "ghost", size: "pill" })}>
                  See every place on the Culture Map
                </Link>
              </div>
            )}
          </Panel>
        </div>
      </PageBody>
    </>
  );
}

/** "Ben & Jerry's puts it first too." / "Ben & Jerry's ranks it 5th." */
function theirRank(place: AudiencePlace, key: string | undefined) {
  const rank = key ? shortRank(place, key) : null;
  if (!rank) return `${place.rival} lists it too.`;
  return rank === "Top pick" ? `${place.rival} puts it first too.` : `${place.rival} ranks it ${rank}.`;
}

function PlaceRow({ place, line }: { place: AudiencePlace; line: string }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted">
        <MapPinIcon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{place.name}</span>
        {place.detail && <span className="block text-[12.5px] text-muted-foreground">{place.detail}</span>}
        <span className="block text-[13px]">{line}</span>
      </span>
      <TerritoryGlyph kind={TERRITORY[place.label]} />
    </li>
  );
}
