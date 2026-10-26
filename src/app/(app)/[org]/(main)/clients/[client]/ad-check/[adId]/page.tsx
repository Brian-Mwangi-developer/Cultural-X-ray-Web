import type { Metadata } from "next";
import { Suspense } from "react";
import { AdCheckDetailPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Ad check" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/ad-check/[adId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/ad-check/[adId]">["params"] }) {
  const { adId } = await params;
  return <AdCheckDetailPage view={await clientView(params)} adId={adId} />;
}
