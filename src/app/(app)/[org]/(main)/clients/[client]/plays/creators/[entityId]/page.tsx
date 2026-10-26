import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatorPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Creator" };

export default function Page({ params, searchParams }: PageProps<"/[org]/clients/[client]/plays/creators/[entityId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: { params: PageProps<"/[org]/clients/[client]/plays/creators/[entityId]">["params"]; searchParams: PageProps<"/[org]/clients/[client]/plays/creators/[entityId]">["searchParams"] }) {
  const [{ entityId }, { play }] = await Promise.all([params, searchParams]);
  return <CreatorPage view={await clientView(params)} entityId={entityId} playId={typeof play === "string" ? play : undefined} />;
}
