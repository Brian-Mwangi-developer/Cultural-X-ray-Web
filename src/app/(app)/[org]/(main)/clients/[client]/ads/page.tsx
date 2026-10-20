import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AdCheckView } from "@/components/views/ad-check";
import { clientPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Ad checks" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/ads">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/ads">["params"] }) {
  const ctx = await clientPage(params);
  return <AdCheckView crumbs={[...ctx.crumbs("Ad checks").slice(0, 2), { label: "Ad checks", href: `${ctx.base}/ads` }, { label: "draft_v3_trailhead.mp4" }]} brand={ctx.client.workspace.name} rival={ctx.client.workspace.rivals[0] ?? "the rival"} />;
}
