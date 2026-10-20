import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { DangerZone } from "@/components/settings/danger-zone";
import type { FullMember } from "@/components/settings/members";
import { agencyClients, backendGet, workspaceAgencies } from "@/lib/session";
export const metadata: Metadata = { title: "Danger zone" };

export default function Page({ params }: PageProps<"/[org]/settings/danger">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/danger">["params"] }) {
  const { user, org, slug } = await orgPage(params);
  const agency = org.organization.kind === "AGENCY";
  const [full, clients, agencies] = await Promise.all([
    backendGet<{ members: FullMember[] }>(`/api/auth/organization/get-full-organization?organizationId=${org.organization.id}`),
    agency ? agencyClients(org.organization.id) : Promise.resolve([]),
    agency ? Promise.resolve([]) : workspaceAgencies(org.organization.id),
  ]);
  return (
    <SettingsPage slug={slug} title="Danger zone" description={agency ? "Actions here can’t be undone from your side. Clients never lose their data because of them." : "Actions here can’t be undone. Think twice."}>
      <DangerZone org={org} clients={clients} agencies={agencies} members={full?.members ?? []} me={{ id: user.id }} />
    </SettingsPage>
  );
}
