import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { CreatorsPlay } from "@/components/views/plays";
import { orgPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Creator play" };

export default function Page({ params }: PageProps<"/[org]/plays/creators">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/plays/creators">["params"] }) {
  const ctx = await orgPage(params, "WORKSPACE");
  return <CreatorsPlay slug={ctx.slug} market={ctx.market} />;
}
