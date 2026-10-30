import type { Metadata } from "next";
import { Suspense } from "react";
import { BriefDocument } from "@/components/briefs/brief-document";
import { PrintBar } from "@/components/report/print-bar";
import type { Brief } from "@/lib/briefs";
import { backendGet } from "@/lib/session";

export const metadata: Metadata = { title: "Shared brief", robots: { index: false, follow: false } };

/** A brief someone shared: read-only, for anyone with the link, no account needed. */
export default function Page({ params }: PageProps<"/b/[token]">) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/b/[token]">["params"] }) {
  const { token } = await params;
  const { brief } = (await backendGet<{ brief: Brief }>(`/api/v1/shared/briefs/${encodeURIComponent(token)}`, { allowAnonymous: true }))!;
  return (
    <main className="paper min-h-svh">
      <PrintBar label={`Shared brief from ${brief.workspace.name}`} />
      <div className="px-4 py-8 print:p-0">
        <BriefDocument brief={brief} />
      </div>
    </main>
  );
}
