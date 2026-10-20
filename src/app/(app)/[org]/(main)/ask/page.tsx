import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AskPage } from "@/components/views/ask-page";
import { orgPage } from "@/lib/page-context";
export const metadata: Metadata = { title: "Ask X-Ray" };

export default function Page({ params }: PageProps<"/[org]/ask">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/ask">["params"] }) {
  const ctx = await orgPage(params);
  return <AskPage brand={ctx.org.organization.kind === "AGENCY" ? "your client" : ctx.brand} />;
}
