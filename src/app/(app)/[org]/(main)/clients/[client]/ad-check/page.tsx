import type { Metadata } from "next";
import { Suspense } from "react";
import { AdCheckPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Ad check" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/ad-check">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/ad-check">["params"] }) {
  return <AdCheckPage view={await clientView(params)} />;
}
