import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AgencyHome } from "@/components/views/agency-home";
import { MapBuilding } from "@/components/views/map-building";
import { OwnerOverview } from "@/components/views/overview";
import { orgPage } from "@/lib/page-context";
import { agencyClients } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

export default function OrgHomePage({ params, searchParams }: PageProps<"/[org]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ params, searchParams }: Pick<PageProps<"/[org]">, "params" | "searchParams">) {
  const ctx = await orgPage(params);
  if (ctx.org.organization.kind === "AGENCY") {
    const clients = await agencyClients(ctx.org.organization.id);
    await connection();
    const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    return <AgencyHome org={ctx.org} clients={clients} firstName={ctx.user.name.split(" ")[0] || ctx.user.name} today={today} />;
  }
  const { building } = await searchParams;
  if (building) return <MapBuilding slug={ctx.slug} seeds={ctx.seeds} rivals={ctx.rivals} market={ctx.market} />;
  return <OwnerOverview slug={ctx.slug} brand={ctx.brand} seeds={ctx.seeds} rivals={ctx.rivals} market={ctx.market} />;
}
