import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { MembersManager, type FullMember, type PendingInvite } from "@/components/settings/members";
import { backendGet } from "@/lib/session";
export const metadata: Metadata = { title: "Members" };

export default function Page({ params }: PageProps<"/[org]/settings/members">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/members">["params"] }) {
  const { user, org, slug } = await orgPage(params);
  const full = await backendGet<{ members: FullMember[]; invitations: PendingInvite[] }>(`/api/auth/organization/get-full-organization?organizationId=${org.organization.id}`);
  const agency = org.organization.kind === "AGENCY";
  return (
    <SettingsPage slug={slug} title="Members" description={agency ? "Your team. Roles decide what each person can do across clients." : "People who work in this workspace."}>
      <MembersManager org={org} members={full?.members ?? []} invitations={full?.invitations ?? []} me={{ id: user.id, email: user.email }} />
    </SettingsPage>
  );
}
