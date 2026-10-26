import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatorsPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Creators" };

export default function Page({ params, searchParams }: PageProps<"/[org]/clients/[client]/plays/creators">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: { params: PageProps<"/[org]/clients/[client]/plays/creators">["params"]; searchParams: PageProps<"/[org]/clients/[client]/plays/creators">["searchParams"] }) {
  const { play } = await searchParams;
  return <CreatorsPage view={await clientView(params)} playId={typeof play === "string" ? play : undefined} />;
}
