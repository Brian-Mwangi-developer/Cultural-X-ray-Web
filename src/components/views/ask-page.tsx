import { SampleBadge } from "@/components/app/parts";
import { TopBar } from "@/components/shell/top-bar";
import { AskThread } from "./ask";

/** Ask X-Ray on its own page: one conversation, centred and readable. */
export function AskPage({ brand }: { brand: string }) {
  return (
    <>
      <TopBar crumbs={[{ label: "Ask X-Ray" }]} actions={<SampleBadge />} />
      <div className="mx-auto flex h-[calc(100svh-52px)] w-full max-w-[760px] flex-col px-4 py-6 md:px-8">
        <div className="mb-4">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Ask X-Ray</h1>
          <p className="mt-1 text-[14.5px] text-muted-foreground">Questions about your maps, briefs and ads. Every answer shows the calls it made and cites its sources.</p>
        </div>
        <AskThread brand={brand} className="min-h-0 flex-1" />
      </div>
    </>
  );
}
