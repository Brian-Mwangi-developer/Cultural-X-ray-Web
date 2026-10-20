import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { AppearanceForm } from "@/components/settings/appearance-form";
export const metadata: Metadata = { title: "Appearance" };

export default function Page({ params }: PageProps<"/[org]/settings/appearance">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/appearance">["params"] }) {
  const { user, slug } = await orgPage(params);
  return (
    <SettingsPage slug={slug} title="Appearance" description="How Cultural X-Ray looks for you. Saved to your profile, on every device.">
      <AppearanceForm preferences={user.preferences} />
    </SettingsPage>
  );
}
