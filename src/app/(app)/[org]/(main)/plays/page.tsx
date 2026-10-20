import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { PlaysList } from "@/components/views/plays";
import { orgPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Plays" };

export default function Page({ params }: PageProps<"/[org]/plays">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/plays">["params"] }) {
  const ctx = await orgPage(params, "WORKSPACE");
  return <PlaysList slug={ctx.slug} rival={ctx.rivals[0] ?? "your rival"} />;
}
