import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Play" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/plays/[playId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/plays/[playId]">["params"] }) {
  const { playId } = await params;
  return <PlayPage view={await clientView(params)} playId={playId} />;
}
