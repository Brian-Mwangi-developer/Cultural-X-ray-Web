import { LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import { Evidence } from "@/components/app/parts";
import type { Finding } from "@/lib/ads";
import { cn } from "@/lib/utils";

/**
 * "Before it runs": what would hold the ad back where it's going to run, from what the check measured
 * (backend adcheck.craft.ts). Things to fix first, then things worth doing; each with its evidence.
 */
export function CraftPanel({ findings, width, height }: { findings: Finding[]; width: number | null; height: number | null }) {
  if (!findings.length) return null;
  const fixes = findings.filter((f) => f.level === "fix").length;
  return (
    <section aria-label="Before it runs" className="overflow-hidden rounded-[16px] border bg-card">
      <header className="flex items-center justify-between gap-3 border-b bg-muted/60 px-[18px] py-3">
        <h2 className="text-[13.5px] font-semibold">Before it runs</h2>
        <span className="text-[12.5px] text-muted-foreground">{fixes ? `${fixes} to fix · ${findings.length - fixes} worth doing` : `${findings.length} worth doing`}</span>
      </header>
      <ul className="divide-y divide-soft">
        {findings.map((f) => (
          <li key={f.id} className="flex gap-3 px-[18px] py-3.5">
            {f.level === "fix" ? <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-ember-ink" aria-label="To fix" /> : <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Worth doing" />}
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[14px] leading-snug font-medium">{f.title}</p>
              {f.id.startsWith("shape-") && width && height && <Shapes width={width} height={height} wants={f.id.includes("9:16") ? [9, 16] : f.id.includes("16:9") ? [16, 9] : [4, 5]} />}
              <p className="text-[13px] leading-relaxed text-muted-foreground">{f.why}</p>
              <p className="text-[13px] leading-relaxed">
                <span className="font-medium">Fix: </span>
                {f.how}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {f.evidence.map((e) => (
                  <Evidence always key={e}>
                    {e}
                  </Evidence>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The ad's shape beside the one the placement shows full-size, to scale. */
function Shapes({ width, height, wants }: { width: number; height: number; wants: [number, number] }) {
  const box = (w: number, h: number) => {
    const s = 44 / Math.max(w, h);
    return { width: Math.round(w * s), height: Math.round(h * s) };
  };
  return (
    <div className="flex items-end gap-4 py-1">
      {[
        { label: "This ad", size: box(width, height), wanted: false },
        { label: `${wants[0]}:${wants[1]}`, size: box(wants[0], wants[1]), wanted: true },
      ].map((s) => (
        <span key={s.label} className="flex flex-col items-center gap-1">
          <span className={cn("rounded-[4px] border-[1.5px]", s.wanted ? "border-ember bg-ember-soft" : "border-foreground/60 bg-muted")} style={s.size} />
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
        </span>
      ))}
    </div>
  );
}
