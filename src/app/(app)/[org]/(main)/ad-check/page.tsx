import type { Metadata } from "next";
import { Suspense } from "react";
import { AdCheckHome } from "@/components/adcheck/home";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import type { AdSummary } from "@/lib/ads";
import type { CultureMap } from "@/lib/maps";
import { orgPage } from "@/lib/page-context";
import { backendGet } from "@/lib/session";

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
  const orgId = ctx.org.organization.id;
  const canCreate = ["owner", "admin", "strategist"].includes(ctx.org.membership.role);
  const [{ ads }, { map }] = await Promise.all([
    backendGet<{ ads: AdSummary[] }>(`/api/v1/orgs/${orgId}/ads`).then((r) => r!),
    backendGet<{ map: CultureMap | null }>(`/api/v1/orgs/${orgId}/maps/latest`).then((r) => r!),
  ]);
  return <AdCheckHome orgId={orgId} slug={ctx.slug} initial={ads} rivals={ctx.rivals} canCreate={canCreate} hasMap={map?.status === "READY"} />;
}
