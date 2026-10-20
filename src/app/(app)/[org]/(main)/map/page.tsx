import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { CultureMapView } from "@/components/views/culture-map";
import { orgPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Culture Map" };

export default function Page({ params }: PageProps<"/[org]/map">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/map">["params"] }) {
  const ctx = await orgPage(params, "WORKSPACE");
  return <CultureMapView crumbs={[{ label: "Culture Map" }]} brand={ctx.brand} rivals={ctx.rivals} defaultMarket={ctx.marketCode} />;
}
