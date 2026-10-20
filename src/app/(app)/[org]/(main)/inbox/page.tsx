import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { InboxView } from "@/components/views/inbox";
import { orgPage } from "@/lib/page-context";
import { agencyClients } from "@/lib/session";
export const metadata: Metadata = { title: "Inbox" };

export default function Page({ params }: PageProps<"/[org]/inbox">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/inbox">["params"] }) {
  const ctx = await orgPage(params, "AGENCY");
  const clients = await agencyClients(ctx.org.organization.id);
  return <InboxView slug={ctx.slug} clients={clients} />;
}
