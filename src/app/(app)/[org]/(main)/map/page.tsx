import type { Metadata } from "next";
import { Suspense } from "react";
import { MapPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { ownerView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Culture Map" };

export default function Page({ params }: PageProps<"/[org]/map">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/map">["params"] }) {
  return <MapPage view={await ownerView(params)} />;
}
