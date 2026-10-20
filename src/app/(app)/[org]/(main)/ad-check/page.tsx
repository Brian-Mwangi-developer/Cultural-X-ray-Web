import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AdCheckView } from "@/components/views/ad-check";
import { orgPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Ad check" };

export default function Page({ params }: PageProps<"/[org]/ad-check">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/ad-check">["params"] }) {
  const ctx = await orgPage(params, "WORKSPACE");
  return <AdCheckView crumbs={[{ label: "Ad check", href: `/${ctx.slug}/ad-check` }, { label: "draft_v3_trailhead.mp4" }]} brand={ctx.brand} rival={ctx.rivals[0] ?? "your rival"} />;
}
