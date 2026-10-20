import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AudienceView } from "@/components/views/audience";
import { clientPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Audience & places" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/audience">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/audience">["params"] }) {
  const ctx = await clientPage(params);
  return <AudienceView crumbs={ctx.crumbs("Audience & places")} brand={ctx.client.workspace.name} rivals={ctx.client.workspace.rivals} market={ctx.client.workspace.markets[0] === "GB" ? "UK" : "US"} />;
}
