import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { BillingView } from "@/components/settings/billing-usage";
import { agencyClients } from "@/lib/session";
export const metadata: Metadata = { title: "Billing" };

export default function Page({ params }: PageProps<"/[org]/settings/billing">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/billing">["params"] }) {
  const { org, slug } = await orgPage(params);
  const clients = org.organization.kind === "AGENCY" ? await agencyClients(org.organization.id) : [];
  return (
    <SettingsPage slug={slug} title="Billing" description="Your plan, payment and invoices.">
      <BillingView kind={org.organization.kind} clients={clients} />
    </SettingsPage>
  );
}
