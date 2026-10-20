import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { BriefView } from "@/components/views/brief";
import { clientPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Plays & briefs" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/plays">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/plays">["params"] }) {
  const ctx = await clientPage(params);
  return <BriefView crumbs={[...ctx.crumbs("Plays & briefs").slice(0, 2), { label: "Plays & briefs", href: `${ctx.base}/plays` }, { label: "Trail, not survival" }]} brand={ctx.client.workspace.name} rival={ctx.client.workspace.rivals[0] ?? "the rival"} market={ctx.client.workspace.markets[0] === "GB" ? "UK" : "US"} />;
}
