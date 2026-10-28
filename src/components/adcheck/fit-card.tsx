"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Evidence } from "@/components/app/parts";
import { CopyButton } from "@/components/plays/embeds";
import type { Fit } from "@/lib/ads";
import { cn } from "@/lib/utils";

/**
 * Figma 13 · A1: does the ad show what the business sells, under its own name, and say it plainly?
 * Shown above X-Ray's read whenever there's something to fix. The wrong product leads, in red,
 * because no cut or caption can fix it.
 */
export function FitCard({ fit, brand }: { fit: Fit; brand: string }) {
  const wrong = fit.fits === "no";
  const brief = [`Reshoot brief for ${brand}`, fit.headline, ...fit.advice.map((a, i) => `${i + 1}. ${a.what} (${a.why})`)].join("\n");
  return (
    <section aria-label="Does it show what you sell" className={cn("rounded-[16px] border p-[18px]", wrong ? "border-destructive/40 bg-destructive/5" : "bg-card")}>
      <h2 className="flex items-start gap-2.5 text-[15px] leading-snug font-semibold">
        <TriangleAlertIcon className={cn("mt-0.5 size-4 shrink-0", wrong ? "text-destructive" : "text-ember-ink")} aria-hidden />
        {fit.headline}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">{fit.why}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Evidence always>shows: {fit.adShows}</Evidence>
        {fit.otherBrands.map((b) => (
          <Evidence always key={b}>
            other brand: {b}
          </Evidence>
        ))}
        {!fit.nameShown && <Evidence always>{brand} not named</Evidence>}
        {fit.message !== "clear" && <Evidence always>{fit.message === "vague" ? "could be anyone’s ad" : "never says what you offer"}</Evidence>}
      </div>
      {fit.advice.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-[12px] border bg-card">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-4 py-2.5">
            <h3 className="text-[13px] font-semibold">What to change</h3>
            <span className="text-[12px] text-muted-foreground">{wrong ? "A reshoot, not a re-cut" : "Most important first"}</span>
          </div>
          <ol className="divide-y divide-soft">
            {fit.advice.map((a, i) => (
              <li key={a.what} className="flex gap-3 px-4 py-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ember-soft text-[11px] font-semibold text-ember-ink">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium">{a.what}</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{a.why}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="border-t px-4 py-3">
            <CopyButton text={brief} label={wrong ? "Copy as a reshoot brief" : "Copy these changes"} />
          </div>
        </div>
      )}
    </section>
  );
}

/** Worth showing: anything short of the right product, named plainly. */
export const needsFix = (fit: Fit | undefined): fit is Fit => Boolean(fit && (fit.fits !== "yes" || fit.message !== "clear" || fit.otherBrands.length > 0 || !fit.nameShown));
