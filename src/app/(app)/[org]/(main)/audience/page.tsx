import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AudienceView } from "@/components/views/audience";
import { NoMapYet } from "@/components/views/overview";
import type { AudienceData } from "@/lib/audience";
import { orgPage } from "@/lib/page-context";
import { backendGet } from "@/lib/session";

export const metadata: Metadata = { title: "Audience & places" };

export default function Page({ params }: PageProps<"/[org]/audience">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/audience">["params"] }) {
  const ctx = await orgPage(params, "WORKSPACE");
  const orgId = ctx.org.organization.id;
  const canBuild = ["owner", "admin", "strategist"].includes(ctx.org.membership.role);
  const { audience } = (await backendGet<{ audience: AudienceData | null }>(`/api/v1/orgs/${orgId}/maps/latest/audience`))!;
  if (!audience) return <NoMapYet orgId={orgId} brand={ctx.brand} canBuild={canBuild} crumb="Audience & places" />;
  return <AudienceView crumbs={[{ label: "Audience & places" }]} brand={ctx.brand} data={audience} slug={ctx.slug} orgId={orgId} canBuild={canBuild} />;
}
