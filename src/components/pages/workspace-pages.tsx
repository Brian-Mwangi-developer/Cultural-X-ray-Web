import { AdCheckHome } from "@/components/adcheck/home";
import { AdPage } from "@/components/adcheck/ad-page";
import { RecutView } from "@/components/adcheck/recut-view";
import { TweakView } from "@/components/adcheck/tweak-view";
import { CheckView } from "@/components/adcheck/check-view";
import { AudienceView } from "@/components/views/audience";
import { CultureMapView } from "@/components/views/culture-map";
import { MapBuilding } from "@/components/views/map-building";
import { NoMapYet, OverviewView } from "@/components/views/overview";
import { CreatorView } from "@/components/plays/creator-view";
import { CreatorsView, PlayView } from "@/components/plays/play-views";
import { PlaysList } from "@/components/plays/plays-list";
import type { AdDetail, AdSummary } from "@/lib/ads";
import type { AudienceData } from "@/lib/audience";
import { type CultureMap, inProgress } from "@/lib/maps";
import type { WorkspaceView } from "@/lib/page-context";
import type { Creator, Play, PlaysList as PlaysData } from "@/lib/plays";
import type { TerritoryView } from "@/lib/territory";
import type { Basis } from "@/lib/basis";
import { applyChanges, type Cut, cutOf, type Format, FORMAT_FOR, type SavedVersion } from "@/lib/recut";
import { backendGet } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

/*
 * Every page of a brand's workspace, written once. The owner's routes (/judesicecream/…) and an
 * agency's client routes (/harborandpine/clients/judesicecream/…) both render these from a
 * WorkspaceView, against the same API: the backend checks who may see what (workspaceAccess).
 */

const api = (v: WorkspaceView, path: string) => `/api/v1/orgs/${v.orgId}${path}`;

export async function OverviewPage({ view }: { view: WorkspaceView }) {
  // The globe's places come with the audience read-out; both are cached once the map is ready.
  const [latest, read] = await Promise.all([
    backendGet<{ map: CultureMap | null }>(api(view, "/maps/latest")),
    backendGet<{ audience: AudienceData | null }>(api(view, "/maps/latest/audience")),
  ]);
  const map = latest?.map ?? null;
  // A build in progress (or stopped) shows its progress; the worker keeps going whether or not anyone watches.
  if (map && (inProgress(map.status) || map.status === "FAILED")) {
    const seeds = map.subjects.filter((s) => s.role === "SEED").map((s) => s.name);
    const self = map.subjects.some((s) => s.role === "SELF");
    const reading = self ? `${view.brand}${seeds.length ? ` (with ${seeds.join(" and ")})` : ""}` : seeds.join(" and ");
    return <MapBuilding orgId={view.orgId} initial={map} reading={reading} market={view.market} rivals={map.subjects.filter((s) => s.role === "RIVAL").map((s) => s.name)} />;
  }
  return (
    <OverviewView
      base={view.base}
      orgId={view.orgId}
      brand={view.brand}
      map={map}
      audience={read?.audience ?? null}
      market={view.market}
      canBuild={view.canWork}
      crumbs={view.crumbs({ label: "Overview" })}
      canAsk={view.canAsk}
      viaAgency={view.viaAgency}
    />
  );
}

export async function AudiencePage({ view }: { view: WorkspaceView }) {
  const { audience } = (await backendGet<{ audience: AudienceData | null }>(api(view, "/maps/latest/audience")))!;
  if (!audience) return <NoMapYet orgId={view.orgId} brand={view.brand} canBuild={view.canWork} crumb="Audience & places" />;
  return <AudienceView crumbs={view.crumbs({ label: "Audience & places" })} brand={view.brand} data={audience} base={view.base} orgId={view.orgId} canBuild={view.canWork} />;
}

/** The latest ready map, podcasts first; filters and other categories load in the page. */
export async function MapPage({ view }: { view: WorkspaceView }) {
  const data = (await backendGet<TerritoryView>(api(view, "/maps/latest/territory?category=PODCAST")))!;
  if (!data.map || !data.view) return <NoMapYet orgId={view.orgId} brand={view.brand} canBuild={view.canWork} crumb="Culture Map" />;
  return <CultureMapView orgId={view.orgId} base={view.base} crumbs={view.crumbs({ label: "Culture Map" })} brand={view.brand} viaAgency={view.viaAgency} canWork={view.canWork} initial={{ map: data.map, view: data.view }} />;
}

export async function PlaysPage({ view }: { view: WorkspaceView }) {
  const data = (await backendGet<PlaysData>(api(view, "/plays")))!;
  return <PlaysList orgId={view.orgId} base={view.base} trail={view.crumbs()} initial={data} canWork={view.canWork} brand={view.brand} viaAgency={view.viaAgency} />;
}

async function playOf(view: WorkspaceView, playId: string) {
  return (await backendGet<{ play: Play }>(api(view, `/plays/${encodeURIComponent(playId)}`)))?.play ?? null;
}

export async function PlayPage({ view, playId }: { view: WorkspaceView; playId: string }) {
  const play = await playOf(view, playId);
  if (!play) notFound();
  const found = (await backendGet<{ creators: Creator[]; basis: Basis | null }>(api(view, `/creators?play=${encodeURIComponent(play.id)}`)))!;
  const creators = play.kind === "CREATOR" ? found.creators : [];
  return <PlayView base={view.base} trail={view.crumbs()} play={play} creators={creators} brand={view.brand} viaAgency={view.viaAgency} basis={found.basis} />;
}

export async function CreatorsPage({ view, playId }: { view: WorkspaceView; playId?: string }) {
  const play = playId ? await playOf(view, playId) : null;
  const data = (await backendGet<{ creators: Creator[]; checking: boolean; basis: Basis | null }>(api(view, `/creators${play ? `?play=${encodeURIComponent(play.id)}` : ""}`)))!;
  return <CreatorsView base={view.base} trail={view.crumbs()} play={play} creators={data.creators} checking={data.checking} brand={view.brand} viaAgency={view.viaAgency} basis={data.basis} />;
}

export async function CreatorPage({ view, entityId, playId }: { view: WorkspaceView; entityId: string; playId?: string }) {
  const [found, play] = await Promise.all([backendGet<{ creator: Creator; basis: Basis | null }>(api(view, `/creators/${encodeURIComponent(entityId)}`)), playId ? playOf(view, playId) : null]);
  if (!found) notFound();
  return <CreatorView orgId={view.orgId} base={view.base} trail={view.crumbs()} creator={found.creator} play={play} canWork={view.canWork} brand={view.brand} viaAgency={view.viaAgency} basis={found.basis} />;
}

export async function AdCheckPage({ view }: { view: WorkspaceView }) {
  const [{ ads }, { map }] = await Promise.all([
    backendGet<{ ads: AdSummary[] }>(api(view, "/ads")).then((r) => r!),
    backendGet<{ map: CultureMap | null }>(api(view, "/maps/latest")).then((r) => r!),
  ]);
  return <AdCheckHome orgId={view.orgId} base={view.base} trail={view.crumbs()} initial={ads} rivals={view.rivals} canCreate={view.canWork} hasMap={map?.status === "READY"} />;
}

export async function AdCheckDetailPage({ view, adId }: { view: WorkspaceView; adId: string }) {
  const { ad, basis } = (await backendGet<{ ad: AdDetail; basis: Basis | null }>(api(view, `/ads/${encodeURIComponent(adId)}`)))!;
  return <AdPage key={ad.id} orgId={view.orgId} base={view.base} trail={view.crumbs()} initial={ad} rivals={view.rivals} canEdit={view.canWork} brand={view.brand} basis={basis} viaAgency={view.viaAgency} />;
}

/** R5: the suggested re-cuts of a read ad. Without any yet, back to the read (which can write them). */
export async function RecutPage({ view, adId }: { view: WorkspaceView; adId: string }) {
  const { ad } = (await backendGet<{ ad: AdDetail }>(api(view, `/ads/${encodeURIComponent(adId)}`)))!;
  if (ad.status !== "READY") notFound();
  if (!ad.check?.recuts.length) redirect(`${view.base}/ad-check/${ad.id}`);
  return <RecutView key={ad.id} orgId={view.orgId} base={view.base} trail={view.crumbs()} ad={ad} brand={view.brand} rivals={view.rivals} canEdit={view.canWork} />;
}

/** R6: tweak a suggested re-cut (with the changes switched off in R5) or a saved version. */
export async function TweakPage({ view, adId, from, off }: { view: WorkspaceView; adId: string; from: string | null; off: string[] }) {
  const { ad } = (await backendGet<{ ad: AdDetail }>(api(view, `/ads/${encodeURIComponent(adId)}`)))!;
  if (ad.status !== "READY" || !ad.check) notFound();
  if (!view.canWork) redirect(`${view.base}/ad-check/${ad.id}/recut`);
  const { versions } = (await backendGet<{ versions: SavedVersion[] }>(api(view, `/ads/${encodeURIComponent(adId)}/versions`)))!;
  const suggested = ad.check.recuts.find((r) => r.id === from) ?? (from ? null : ad.check.recuts[0]);
  const saved = versions.find((v) => v.id === from);
  // The shape to start in: what the ad will mostly run as, else the draft's own.
  const shape = (ad.placements.map((p) => FORMAT_FOR[p]).find(Boolean) ?? (ad.width && ad.height && ad.width < ad.height ? "9:16" : "16:9")) as Format;
  let start: Cut;
  let title: string;
  if (saved) {
    start = cutOf(saved.editList.clips, saved.editList.overlays, saved.editList, shape);
    title = saved.editList.title;
  } else if (suggested) {
    const changes = suggested.editList.changes.map((c) => ({ ...c, on: c.on && !off.includes(c.id) }));
    const edit = applyChanges(ad.shots, changes, view.brand);
    start = cutOf(edit.clips, edit.overlays, {}, shape);
    title = `${suggested.editList.title}, tweaked`;
  } else {
    start = { format: shape, sound: "original", endCard: null, clips: ad.shots.map((s) => ({ shot: s.index, inMs: s.startMs, outMs: s.endMs })) };
    title = "Your version";
  }
  return <TweakView key={`${ad.id}-${from ?? ""}`} orgId={view.orgId} base={view.base} trail={view.crumbs()} ad={ad} brand={view.brand} start={start} from={saved?.id ?? suggested?.id ?? null} title={title} />;
}

/** R7: a saved version, checked again. */
export async function VersionPage({ view, adId, versionId }: { view: WorkspaceView; adId: string; versionId: string }) {
  const [{ ad }, { versions }] = await Promise.all([
    backendGet<{ ad: AdDetail }>(api(view, `/ads/${encodeURIComponent(adId)}`)).then((r) => r!),
    backendGet<{ versions: SavedVersion[] }>(api(view, `/ads/${encodeURIComponent(adId)}/versions`)).then((r) => r!),
  ]);
  const version = versions.find((v) => v.id === versionId);
  if (!version || !ad.check) notFound();
  return <CheckView key={version.id} orgId={view.orgId} base={view.base} trail={view.crumbs()} ad={ad} brand={view.brand} version={version} />;
}
