"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type Placement, PLACEMENTS } from "@/lib/ads";
import { briefHref, briefsApi, OCCASIONS } from "@/lib/briefs";
import { AppError } from "@/lib/errors";
import { cn } from "@/lib/utils";

const STEPS = ["Reading your Culture Map", "Finding what’s only yours", "Writing the brief", "Checking every line against the map"];

/** Write a brief: what it's for and where it runs, then about 15 seconds of writing. */
export function WriteBriefDialog({ orgId, base, brand, open, onOpenChange, placements: initial = [] }: { orgId: string; base: string; brand: string; open: boolean; onOpenChange: (o: boolean) => void; placements?: Placement[] }) {
  const router = useRouter();
  const [occasion, setOccasion] = useState("");
  const [placements, setPlacements] = useState<Placement[]>(initial);
  const [writing, setWriting] = useState(false);
  const [step, setStep] = useState(0);

  // The steps move on while the brief is written, so the wait reads as work, not a freeze.
  useEffect(() => {
    if (!writing) return;
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 4000);
    return () => clearInterval(t);
  }, [writing]);

  async function write() {
    setWriting(true);
    setStep(0);
    try {
      const { brief } = await briefsApi.write(orgId, { occasion: occasion.trim(), placements });
      onOpenChange(false);
      router.push(briefHref(base, brief.id) as never);
    } catch (error) {
      toast(error instanceof AppError ? error.message : "We couldn’t write the brief. Try again.");
      setWriting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !writing && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] tracking-[-0.02em]">Write a brief</DialogTitle>
          <DialogDescription>A one-page creative brief for {brand}, written from your Culture Map. Every line about your customers points at what it rests on.</DialogDescription>
        </DialogHeader>

        {writing ? (
          <ol className="space-y-3 py-4" aria-live="polite">
            {STEPS.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-3 text-[14px]", i > step && "text-muted-foreground")}>
                <span className="flex size-5 items-center justify-center">{i < step ? <CheckIcon className="size-4 text-ember-ink" /> : i === step ? <Spinner className="size-4" /> : <span className="size-1.5 rounded-full bg-border" />}</span>
                {s}
              </li>
            ))}
            <li className="pt-1 text-[12.5px] text-muted-foreground">Usually about 15 seconds.</li>
          </ol>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="occasion" className="text-[13.5px] font-medium">
                What’s it for?
              </label>
              <Input id="occasion" autoFocus value={occasion} maxLength={120} placeholder="e.g. Our autumn menu, or opening in Leeds" onChange={(e) => setOccasion(e.target.value)} />
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((o) => (
                  <button key={o} type="button" onClick={() => setOccasion(o)} className={cn("rounded-full border px-2.5 py-1 text-[12.5px] hover:bg-muted", occasion === o && "border-ember bg-ember-soft")}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[13.5px] font-medium">Where will it run?</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Where it will run">
                {PLACEMENTS.map((p) => {
                  const on = placements.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPlacements((xs) => (on ? xs.filter((x) => x !== p.id) : [...xs, p.id]))}
                      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]", on ? "border-ember bg-ember-soft font-medium" : "hover:bg-muted")}
                    >
                      {on && <CheckIcon className="size-3.5 text-ember-ink" />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[12.5px] text-muted-foreground">Sets the must-haves for each channel: shape, sound, the first seconds.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!writing && (
            <Button variant="outline" size="pill" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button size="pill" disabled={writing || occasion.trim().length < 2} onClick={() => void write()}>
            {writing ? <Spinner data-icon="inline-start" /> : <FileTextIcon data-icon="inline-start" />}
            {writing ? "Writing…" : "Write the brief"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
