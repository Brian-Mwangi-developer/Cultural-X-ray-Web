import type { Metadata } from "next";
import { Suspense } from "react";
import { AdPage } from "@/components/adcheck/ad-page";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import type { AdDetail } from "@/lib/ads";
import { orgPage } from "@/lib/page-context";
import { backendGet } from "@/lib/session";

export const metadata: Metadata = { title: "Ad check" };

export default function Page({ params }: PageProps<"/[org]/ad-check/[adId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/ad-check/[adId]">["params"] }) {
  const ctx = await orgPage(params, "WORKSPACE");
  const { adId } = await params;
  const orgId = ctx.org.organization.id;
  const canEdit = ["owner", "admin", "strategist"].includes(ctx.org.membership.role);
  const { ad } = (await backendGet<{ ad: AdDetail }>(`/api/v1/orgs/${orgId}/ads/${encodeURIComponent(adId)}`))!;
  return <AdPage key={ad.id} orgId={orgId} slug={ctx.slug} initial={ad} rivals={ctx.rivals} canEdit={canEdit} />;
}
