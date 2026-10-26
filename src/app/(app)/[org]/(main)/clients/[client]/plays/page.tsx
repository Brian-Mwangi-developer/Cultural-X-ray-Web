import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaysPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { clientView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Plays" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/plays">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/plays">["params"] }) {
  return <PlaysPage view={await clientView(params)} />;
}
