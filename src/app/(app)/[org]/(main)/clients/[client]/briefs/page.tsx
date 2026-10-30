import type { Metadata } from "next";
import { Suspense } from "react";
import { BriefsPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Briefs" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/briefs">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/briefs">["params"] }) {
  return <BriefsPage view={await clientView(params)} />;
}
