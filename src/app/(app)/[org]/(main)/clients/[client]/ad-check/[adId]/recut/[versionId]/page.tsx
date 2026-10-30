import type { Metadata } from "next";
import { Suspense } from "react";
import { VersionPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Checked again" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/ad-check/[adId]/recut/[versionId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/ad-check/[adId]/recut/[versionId]">["params"] }) {
  const { adId, versionId } = await params;
  return <VersionPage view={await clientView(params)} adId={adId} versionId={versionId} />;
}
