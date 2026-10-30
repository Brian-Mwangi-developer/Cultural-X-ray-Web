import type { Metadata } from "next";
import { Suspense } from "react";
import { BriefPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { ownerView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Brief" };

export default function Page({ params }: PageProps<"/[org]/briefs/[briefId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/briefs/[briefId]">["params"] }) {
  const { briefId } = await params;
  return <BriefPage view={await ownerView(params)} briefId={briefId} />;
}
