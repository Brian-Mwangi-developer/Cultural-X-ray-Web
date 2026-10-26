import { AdCheckHome } from "@/components/adcheck/home";
import { AdPage } from "@/components/adcheck/ad-page";
import { AudienceView } from "@/components/views/audience";
import { CultureMapView } from "@/components/views/culture-map";
import { MapBuilding } from "@/components/views/map-building";
import { NoMapYet, OverviewView } from "@/components/views/overview";
import { CreatorsPlay, PlaysList } from "@/components/views/plays";
import type { AdDetail, AdSummary } from "@/lib/ads";
import type { AudienceData } from "@/lib/audience";
import { type CultureMap, inProgress } from "@/lib/maps";
import type { WorkspaceView } from "@/lib/page-context";
import { backendGet } from "@/lib/session";

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

/** Still sample data on both sides (Architecture.md §12), labelled as such. */
export function MapPage({ view }: { view: WorkspaceView }) {
  return <CultureMapView crumbs={view.crumbs({ label: "Culture Map" })} brand={view.brand} rivals={view.rivals} defaultMarket={view.marketCode} />;
}

export function PlaysPage({ view }: { view: WorkspaceView }) {
  return <PlaysList base={view.base} rival={view.rivals[0] ?? "your rival"} trail={view.crumbs()} />;
}

export function CreatorsPage({ view }: { view: WorkspaceView }) {
  return <CreatorsPlay base={view.base} market={view.market} trail={view.crumbs()} />;
}

export async function AdCheckPage({ view }: { view: WorkspaceView }) {
  const [{ ads }, { map }] = await Promise.all([
    backendGet<{ ads: AdSummary[] }>(api(view, "/ads")).then((r) => r!),
    backendGet<{ map: CultureMap | null }>(api(view, "/maps/latest")).then((r) => r!),
  ]);
  return <AdCheckHome orgId={view.orgId} base={view.base} trail={view.crumbs()} initial={ads} rivals={view.rivals} canCreate={view.canWork} hasMap={map?.status === "READY"} />;
}

export async function AdCheckDetailPage({ view, adId }: { view: WorkspaceView; adId: string }) {
  const { ad } = (await backendGet<{ ad: AdDetail }>(api(view, `/ads/${encodeURIComponent(adId)}`)))!;
  return <AdPage key={ad.id} orgId={view.orgId} base={view.base} trail={view.crumbs()} initial={ad} rivals={view.rivals} canEdit={view.canWork} />;
}
