import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatorsPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Partner with a creator" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/plays/creators">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/plays/creators">["params"] }) {
  return <CreatorsPage view={await clientView(params)} />;
}
