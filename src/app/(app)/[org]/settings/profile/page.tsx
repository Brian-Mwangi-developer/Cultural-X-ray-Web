import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { ProfileForm } from "@/components/settings/account";
export const metadata: Metadata = { title: "Profile" };

export default function Page({ params }: PageProps<"/[org]/settings/profile">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/profile">["params"] }) {
  const { user, slug } = await orgPage(params);
  return (
    <SettingsPage slug={slug} title="Profile" description="How you appear to your team and clients.">
      <ProfileForm user={{ name: user.name, email: user.email, image: user.image, emailVerified: user.emailVerified, createdAt: user.createdAt }} />
    </SettingsPage>
  );
}
