import type { Metadata } from "next";
import { Suspense } from "react";
import { CultureReport, type Report } from "@/components/report/culture-report";
import { PrintBar } from "@/components/report/print-bar";
import { backendGet } from "@/lib/session";

export const metadata: Metadata = { title: "Shared culture report", robots: { index: false, follow: false } };

/** A brand's culture report someone shared: read-only, always the latest, no account needed. */
export default function Page({ params }: PageProps<"/r/[token]">) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/r/[token]">["params"] }) {
  const { token } = await params;
  const { report } = (await backendGet<{ report: Report }>(`/api/v1/shared/reports/${encodeURIComponent(token)}`, { allowAnonymous: true }))!;
  return (
    <main className="paper min-h-svh bg-muted/40 print:bg-white">
      <PrintBar label={`Culture report · ${report.brand.name}`} />
      <div className="px-4 py-8 print:p-0">
        <CultureReport report={report} />
      </div>
    </main>
  );
}
