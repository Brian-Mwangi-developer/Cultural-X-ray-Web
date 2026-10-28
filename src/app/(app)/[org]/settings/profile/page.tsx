import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { ProfileForm } from "@/components/settings/account";
import { MemorySettings } from "@/components/settings/memory";
export const metadata: Metadata = { title: "Profile" };

export default function Page({ params }: PageProps<"/[org]/settings/profile">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/profile">["params"] }) {
  const { user, slug, org, brand } = await orgPage(params);
  return (
    <SettingsPage slug={slug} title="Profile" description="How you appear to your team and clients.">
      <ProfileForm user={{ name: user.name, email: user.email, image: user.image, emailVerified: user.emailVerified, createdAt: user.createdAt }} />
      {/* Ask X-Ray is on a brand's own workspace; agencies don't have it there yet. */}
      {org.organization.kind === "WORKSPACE" && <MemorySettings orgId={org.organization.id} brand={brand} />}
    </SettingsPage>
  );
}
