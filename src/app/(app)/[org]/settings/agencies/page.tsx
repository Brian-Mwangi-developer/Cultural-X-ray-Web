import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { AgenciesManager } from "@/components/settings/agencies";
import { workspaceAgencies } from "@/lib/session";
export const metadata: Metadata = { title: "Agencies" };

export default function Page({ params }: PageProps<"/[org]/settings/agencies">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/agencies">["params"] }) {
  const { org, slug } = await orgPage(params, "WORKSPACE");
  const agencies = await workspaceAgencies(org.organization.id);
  return (
    <SettingsPage slug={slug} title="Agencies" description="Agencies work inside your workspace at the access you choose. Everything they make stays here, with you." wide>
      <AgenciesManager org={org} agencies={agencies} />
    </SettingsPage>
  );
}
