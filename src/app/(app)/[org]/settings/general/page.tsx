import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { GeneralForm } from "@/components/settings/general-form";
import { isManager } from "@/lib/roles";
export const metadata: Metadata = { title: "General" };

export default function Page({ params }: PageProps<"/[org]/settings/general">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/general">["params"] }) {
  const { org, slug } = await orgPage(params);
  const agency = org.organization.kind === "AGENCY";
  return (
    <SettingsPage slug={slug} title="General" description={agency ? "Your agency’s name, address and defaults." : "Your brand’s name, address and markets."}>
      <GeneralForm org={org} canEdit={isManager(org.membership.role)} />
    </SettingsPage>
  );
}
