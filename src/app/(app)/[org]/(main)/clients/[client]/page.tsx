import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { CultureMapView } from "@/components/views/culture-map";
import { clientPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Culture Map" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]">["params"] }) {
  const ctx = await clientPage(params);
  return <CultureMapView crumbs={ctx.crumbs("Culture Map")} brand={ctx.client.workspace.name} rivals={ctx.client.workspace.rivals} defaultMarket={ctx.client.workspace.markets[0] ?? "US"} />;
}
