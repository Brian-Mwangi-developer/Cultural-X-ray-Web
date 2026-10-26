import type { Metadata } from "next";
import { Suspense } from "react";
import { AudiencePage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Audience & places" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/audience">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/audience">["params"] }) {
  return <AudiencePage view={await clientView(params)} />;
}
