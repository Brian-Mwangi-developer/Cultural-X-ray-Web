import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AgencyHome } from "@/components/views/agency-home";
import { OverviewPage } from "@/components/pages/workspace-pages";
import { orgPage, ownerView } from "@/lib/page-context";
import { agencyClients } from "@/lib/session";

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
  return <OverviewPage view={await ownerView(params)} />;
}
