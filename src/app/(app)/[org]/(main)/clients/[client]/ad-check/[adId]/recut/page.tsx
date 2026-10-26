import type { Metadata } from "next";
import { Suspense } from "react";
import { RecutPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Suggested re-cut" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/ad-check/[adId]/recut">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/ad-check/[adId]/recut">["params"] }) {
  const { adId } = await params;
  return <RecutPage view={await clientView(params)} adId={adId} />;
}
