import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { ownerView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Play" };

export default function Page({ params }: PageProps<"/[org]/plays/[playId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/plays/[playId]">["params"] }) {
  const { playId } = await params;
  return <PlayPage view={await ownerView(params)} playId={playId} />;
}
