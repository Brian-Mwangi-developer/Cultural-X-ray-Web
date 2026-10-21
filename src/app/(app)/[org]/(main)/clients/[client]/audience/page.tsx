import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AudienceView } from "@/components/views/audience";
import { clientPage } from "@/lib/page-context";
import { sampleAudience } from "@/lib/sample-data";
export const metadata: Metadata = { title: "Audience & places" };

export default function Page({ params }: PageProps<"/[org]/clients/[client]/audience">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/clients/[client]/audience">["params"] }) {
  const ctx = await clientPage(params);
  // Agencies can't read a client's map yet (backend Architecture.md §12), so this stays sample data.
  const brand = ctx.client.workspace.name;
  return <AudienceView crumbs={ctx.crumbs("Audience & places")} brand={brand} data={sampleAudience(brand, ctx.client.workspace.rivals)} sample />;
}
