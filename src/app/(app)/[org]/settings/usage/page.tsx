import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { UsageView } from "@/components/settings/billing-usage";
import { backendGet } from "@/lib/session";
import type { Usage } from "@/lib/usage";
export const metadata: Metadata = { title: "Qloo usage" };

export default function Page({ params }: PageProps<"/[org]/settings/usage">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/usage">["params"] }) {
  const { org, slug } = await orgPage(params);
  const { usage } = (await backendGet<{ usage: Usage }>(`/api/v1/orgs/${org.organization.id}/usage`))!;
  return (
    <SettingsPage slug={slug} title="Qloo usage" description="Every map and ad check spends Qloo queries. Here’s where they went.">
      <UsageView kind={org.organization.kind} usage={usage} />
    </SettingsPage>
  );
}
