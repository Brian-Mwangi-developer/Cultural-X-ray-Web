"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRightIcon, Building2Icon, KeyboardIcon, MapIcon, MapPinIcon, MicIcon, ScanSearchIcon, TargetIcon, UsersIcon, VideoIcon } from "lucide-react";
import { AssistantGlyph } from "@/components/ask/assistant-mark";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppError } from "@/lib/errors";
import { type Goal, GOAL_CHOICES, guideApi } from "@/lib/guide";
import { cn } from "@/lib/utils";

const ICON: Record<Goal, typeof UsersIcon> = { customers: UsersIcon, places: MapPinIcon, ads: ScanSearchIcon, creators: VideoIcon, rival: TargetIcon, client: Building2Icon, team: UsersIcon, sample: MapIcon };

/**
 * The welcome room (Figma 17 · W1, W3): the first thing after the email is confirmed. X-Ray says
 * hello, then asks what to look at first. The goal decides the guide bar's first "next step"; it
 * can be changed later. Talking arrives with voice; until then it says so and carries on typed.
 */
export function WelcomeRoom({ name, agency }: { name: string; agency: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<"hello" | "goal">("hello");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState<"goal" | "skip" | null>(null);
  const first = name.trim().split(/\s+/)[0] || "there";
  const choices = GOAL_CHOICES.filter((c) => Boolean(c.agency) === agency);

  async function finish(picked: Goal | null) {
    setSaving(picked ? "goal" : "skip");
    try {
      await guideApi.welcome(picked);
      router.refresh();
    } catch (error) {
      toast(error instanceof AppError ? error.message : "That didn’t save. Try again.");
      setSaving(null);
    }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <button type="button" onClick={() => void finish(null)} disabled={saving !== null} className="text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-60">
          {saving === "skip" ? "One moment…" : "Skip, I’ll look around myself"}
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center sm:px-8">
        {stage === "hello" ? (
          <div className="flex max-w-[660px] flex-col items-center">
            <Halo />
            <h1 className="mt-8 text-[34px] leading-tight font-semibold tracking-[-0.03em] sm:text-[42px]">Hi {first}, I’m X-Ray.</h1>
            <p className="mt-4 text-[16.5px] leading-relaxed text-foreground/80 sm:text-[17.5px]">
              {agency
                ? "I’ll help you get your agency set up and show you around as we go. It takes a few minutes, and you can stop any time."
                : "I’ll help you set up your brand and show you around as we go. It takes a few minutes, and you can stop any time."}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button
                size="cta"
                onClick={() => {
                  toast("Talking to X-Ray is coming next.", { description: "For now we’ll type. Nothing is lost: you’ll be able to talk to it from the guide bar." });
                  setStage("goal");
                }}
              >
                <MicIcon data-icon="inline-start" />
                Talk me through it
              </Button>
              <Button size="cta" variant="outline" onClick={() => setStage("goal")}>
                <KeyboardIcon data-icon="inline-start" />
                I’d rather type
              </Button>
            </div>
            <p className="mt-5 text-[13px] text-muted-foreground">You can switch between talking and typing whenever you like.</p>
          </div>
        ) : (
          <div className="flex w-full max-w-[1180px] flex-col items-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-ember text-white">
              <AssistantGlyph className="size-8" />
            </span>
            <h1 className="mt-6 text-[30px] leading-tight font-semibold tracking-[-0.03em] sm:text-[34px]">{agency ? "Where should we start?" : "What should we look at first?"}</h1>
            <p className="mt-3 max-w-[640px] text-[15.5px] leading-relaxed text-foreground/80">
              {agency ? "Pick one. The guide at the bottom of every page starts there, and the rest stays a click away." : "Pick one; we’ll get to the rest later. The guide at the bottom of every page starts there."}
            </p>
            <div role="radiogroup" aria-label="What to look at first" className={cn("mt-8 grid w-full gap-3", agency ? "max-w-[760px] sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-5")}>
              {choices.map((c) => {
                const Icon = ICON[c.goal];
                const on = goal === c.goal;
                return (
                  <button
                    key={c.goal}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setGoal(c.goal)}
                    className={cn(
                      "flex flex-col items-start gap-3 rounded-[16px] border bg-card p-4 text-left transition-colors hover:border-foreground/30 focus-visible:ring-4 focus-visible:ring-ember/25 focus-visible:outline-none",
                      on && "border-ember bg-ember-soft ring-1 ring-ember hover:border-ember",
                    )}
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-[10px]", on ? "bg-ember text-white" : "bg-muted text-foreground/80")}>
                      <Icon className="size-[18px]" strokeWidth={1.75} />
                    </span>
                    <span className="text-[15px] leading-snug font-semibold">{c.title}</span>
                    <span className="text-[13px] leading-snug text-muted-foreground">{c.sub}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <Button size="cta" disabled={!goal || saving !== null} onClick={() => void finish(goal)}>
                {saving === "goal" ? <Spinner data-icon="inline-start" /> : null}
                {agency ? "Start there" : "Start with this"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">This only decides what the guide shows you first. Change it any time.</p>
          </div>
        )}
      </div>
    </main>
  );
}

/** The lens with three quiet rings: the product's own mark, never a glowing orb. */
function Halo() {
  return (
    <span className="relative flex size-[230px] items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-full border border-ember/15" />
      <span className="absolute inset-[26px] rounded-full border border-ember/25" />
      <span className="absolute inset-[52px] rounded-full border border-ember/45 motion-safe:animate-[pulse_3.2s_ease-in-out_infinite]" />
      <span className="relative flex size-[92px] items-center justify-center rounded-full bg-ember text-white shadow-[0_18px_40px_-16px_rgba(255,103,25,0.7)]">
        <AssistantGlyph className="size-12" />
      </span>
    </span>
  );
}
