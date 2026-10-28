import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { UsageView } from "@/components/settings/billing-usage";
import { backendGet } from "@/lib/session";
import type { AiSpend, Usage } from "@/lib/usage";
export const metadata: Metadata = { title: "Usage" };

export default function Page({ params }: PageProps<"/[org]/settings/usage">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/usage">["params"] }) {
  const { org, slug } = await orgPage(params);
  const [{ usage }, ai] = await Promise.all([
    backendGet<{ usage: Usage }>(`/api/v1/orgs/${org.organization.id}/usage`).then((r) => r!),
    // Gemini cost is extra: if it can't load, the Qloo numbers still show.
    backendGet<{ spend: AiSpend }>(`/api/v1/orgs/${org.organization.id}/usage/ai`).catch(() => null),
  ]);
  return (
    <SettingsPage slug={slug} title="Usage" description="Every map and ad check spends Qloo queries, and reading ads and talking to X-Ray run on Gemini. Here’s where both went.">
      <UsageView kind={org.organization.kind} usage={usage} spend={ai?.spend ?? null} />
    </SettingsPage>
  );
}
