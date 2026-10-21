import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AgencyHome } from "@/components/views/agency-home";
import { MapBuilding } from "@/components/views/map-building";
import { OwnerOverview } from "@/components/views/overview";
import { inProgress, type CultureMap } from "@/lib/maps";
import { orgPage } from "@/lib/page-context";
import { agencyClients, backendGet } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

export default function OrgHomePage({ params }: PageProps<"/[org]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home params={params} />
    </Suspense>
  );
}

async function Home({ params }: Pick<PageProps<"/[org]">, "params">) {
  const ctx = await orgPage(params);
  if (ctx.org.organization.kind === "AGENCY") {
    const clients = await agencyClients(ctx.org.organization.id);
    await connection();
    const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    return <AgencyHome org={ctx.org} clients={clients} firstName={ctx.user.name.split(" ")[0] || ctx.user.name} today={today} />;
  }
  const orgId = ctx.org.organization.id;
  const { map } = (await backendGet<{ map: CultureMap | null }>(`/api/v1/orgs/${orgId}/maps/latest`))!;
  // A build in progress (or stopped) shows its progress; the worker keeps going whether or not anyone watches.
  if (map && (inProgress(map.status) || map.status === "FAILED")) {
    const seeds = map.subjects.filter((s) => s.role === "SEED").map((s) => s.name);
    const self = map.subjects.some((s) => s.role === "SELF");
    const reading = self ? `${ctx.brand}${seeds.length ? ` (with ${seeds.join(" and ")})` : ""}` : seeds.join(" and ");
    return <MapBuilding orgId={orgId} initial={map} reading={reading} market={ctx.market} rivals={map.subjects.filter((s) => s.role === "RIVAL").map((s) => s.name)} />;
  }
  const canBuild = ["owner", "admin", "strategist"].includes(ctx.org.membership.role);
  return <OwnerOverview slug={ctx.slug} orgId={orgId} brand={ctx.brand} map={map} market={ctx.market} canBuild={canBuild} />;
}
