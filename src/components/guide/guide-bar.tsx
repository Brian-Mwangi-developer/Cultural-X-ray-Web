"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, CompassIcon, HistoryIcon, ListIcon, MicIcon, ScanIcon, XIcon } from "lucide-react";
import { AssistantGlyph } from "@/components/ask/assistant-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ANCHORS, journeyForPath, type Step } from "@/lib/guide";
import { cn } from "@/lib/utils";
import { findAnchor, type Run, useGuide } from "./guide-context";

/**
 * The guide bar (Figma 19): docked at the foot of every workspace page, one line until it's opened.
 * It shows the one next step, offers a page's walk-through on a first visit, runs "Show me", turns
 * X-ray on, and opens the steps and "since you were last here". Its mark opens Ask X-Ray.
 */
export function GuideDock() {
  const g = useGuide();
  // The Ask chat panel opens bottom right; the bar moves left and narrows so neither covers the other.
  const [chat, setChat] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setChat(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("xray:ask-panel", on);
    return () => window.removeEventListener("xray:ask-panel", on);
  }, []);
  if (!g?.guide) return null;
  // The Ask page and the re-cut editor have their own controls along the bottom.
  if (/(^|\/)ask$|\/recut$/.test(g.rest)) return null;
  return (
    <>
      {/* mt-auto: on a short page (or while it loads) the bar still sits at the bottom of the screen. */}
      <div className="mt-auto h-24 shrink-0" aria-hidden />
      <div className="pointer-events-none sticky bottom-0 z-[48] h-0">
        <div className={cn("absolute inset-x-0 bottom-5 flex px-3 sm:px-6", chat ? "justify-start lg:pr-[460px]" : "justify-center")}>
          <Bar />
        </div>
      </div>
      <Layers />
    </>
  );
}

const pct = (steps: Step[]) => `${steps.filter((s) => s.done).length} of ${steps.length}`;

function Bar() {
  const g = useGuide()!;
  const guide = g.guide!;
  const folded = guide.marks.includes("bar:folded");
  const doneCount = guide.steps.filter((s) => s.done).length;
  const parts = useXrayParts(g.xray);

  // Folded: the mark still opens Ask X-Ray; the rest unfolds the bar.
  if (folded && !g.run && !g.xray)
    return (
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-card p-1.5 text-[12.5px] font-medium text-muted-foreground shadow-[0_12px_32px_-14px_rgba(0,0,0,0.3)]">
        <AskMark />
        <button type="button" onClick={() => void g.mark([], ["bar:folded"])} className="flex h-9 items-center gap-1.5 rounded-full px-2.5 hover:bg-muted hover:text-foreground" aria-label="Open the guide">
          {guide.next ? `${doneCount} of ${guide.steps.length}` : "Guide"}
          <ChevronUpIcon className="size-3.5" />
        </button>
      </div>
    );

  let line: React.ReactNode;
  let action: React.ReactNode = null;
  if (g.run) {
    const step = g.run.journey.steps[g.run.index]!;
    line = <Line kicker={`${g.run.journey.title} · ${g.run.index + 1} of ${g.run.journey.steps.length}`} text={g.run.status === "waiting" ? `Your turn: ${step.title.toLowerCase()}` : step.title} />;
  } else if (g.xray) {
    line = <Line kicker="X-ray is on" text="Click any lit part to hear what it’s for" />;
    action = <kbd className="hidden rounded-[5px] border px-1.5 text-[11px] text-muted-foreground sm:inline">Esc</kbd>;
  } else if (g.offer) {
    line = <Line kicker="New here?" text={`${g.offer.title} · ${g.offer.minutes} min`} />;
    action = (
      <>
        <Button variant="ghost" size="sm" className="hidden h-8 rounded-full text-muted-foreground sm:inline-flex" onClick={() => void g.mark([`tour:${g.offer!.id}`])}>
          Not now
        </Button>
        <Button size="sm" className="h-8 rounded-full px-3.5" onClick={() => g.start(g.offer!.id)}>
          Show me
        </Button>
      </>
    );
  } else if (guide.next) {
    const n = guide.next;
    line = <Line kicker={n.busy ? "Under way · about a minute" : `Next step · ${n.minutes} min`} text={n.title} />;
    action = n.busy ? <Spinner className="mr-1 size-4 text-ember-ink" /> : <StepAction step={n} />;
  } else {
    line = <Line kicker="You’re set up" text="Press X on any page to see what’s what" />;
  }

  return (
    <div className="pointer-events-auto relative w-full max-w-[680px]">
      {g.run ? <RunPanel run={g.run} /> : g.xray ? <XrayPanel parts={parts} /> : g.panel === "steps" ? <StepsPanel /> : g.panel === "news" && guide.news ? <NewsPanel /> : null}
      <div className={cn("flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-[0_14px_36px_-14px_rgba(0,0,0,0.32)]", (g.run || g.xray) && "border-ember/60")} data-guide-bar>
        <AskMark />
        <div className="min-w-0 flex-1">{line}</div>
        {/* With the steps or news open, their buttons are the actions. */}
        {g.panel === "none" || g.run || g.xray ? action : null}
        <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Talk to X-Ray"
                onClick={() => toast("Talking to X-Ray is coming next.", { description: "Voice needs Gemini’s live model switched on. Type to Ask X-Ray for now, or press X to X-ray this page." })}
                className="hidden size-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground sm:flex"
              />
            }
          >
            <MicIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Talk to X-Ray</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-pressed={g.xray}
                onClick={() => {
                  if (g.run) g.stop();
                  g.setPanel("none");
                  g.setXray(!g.xray);
                }}
                aria-label="X-ray this page"
                className={cn("flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium sm:px-3", g.xray ? "bg-ember text-white" : "bg-muted text-foreground/80 hover:text-foreground")}
              />
            }
          >
            <ScanIcon className="size-4" />
            <span className="hidden sm:inline">X-ray</span>
          </TooltipTrigger>
          <TooltipContent>See what every part of this page is for · X</TooltipContent>
        </Tooltip>
        {guide.next && (
          <button
            type="button"
            aria-expanded={g.panel === "steps"}
            aria-label={`Getting started: ${pct(guide.steps)} done`}
            onClick={() => {
              g.setXray(false);
              g.setPanel(g.panel === "steps" ? "none" : "steps");
            }}
            className="flex h-9 items-center gap-1.5 rounded-full bg-muted pr-2.5 pl-1.5 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <span className="flex size-6 items-center justify-center rounded-full border-2 border-ember text-[11px] font-semibold text-ember-ink">{doneCount}</span>
            <span className="hidden sm:inline">of {guide.steps.length}</span>
            {g.panel === "steps" ? <ChevronDownIcon className="size-3.5" /> : <ChevronUpIcon className="size-3.5" />}
          </button>
        )}
        {g.run || g.xray ? (
          <button type="button" aria-label={g.run ? "Stop the walk-through" : "Leave X-ray"} onClick={() => (g.run ? g.stop() : g.setXray(false))} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger render={<button type="button" aria-label="Fold the guide" onClick={() => void g.mark(["bar:folded"])} className="hidden size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:flex" />}>
              <ChevronDownIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Fold the guide</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

const Mark = ({ className }: { className?: string }) => (
  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-ember text-white", className)}>
    <AssistantGlyph className="size-5" />
  </span>
);

/** The bar's mark: Ask X-Ray (the chat on a brand's pages, the Ask page for an agency). */
function AskMark() {
  const g = useGuide()!;
  if (g.kind === "AGENCY")
    return (
      <Link href={`${g.base}/ask` as never} aria-label="Ask X-Ray" className="rounded-full focus-visible:ring-4 focus-visible:ring-ember/30 focus-visible:outline-none">
        <Mark />
      </Link>
    );
  return (
    <Tooltip>
      <TooltipTrigger render={<button type="button" aria-label="Ask X-Ray" onClick={() => window.dispatchEvent(new CustomEvent("xray:ask", { detail: {} }))} className="rounded-full focus-visible:ring-4 focus-visible:ring-ember/30 focus-visible:outline-none" />}>
        <Mark />
      </TooltipTrigger>
      <TooltipContent>Ask X-Ray · ⌘J</TooltipContent>
    </Tooltip>
  );
}

const Line = ({ kicker, text }: { kicker: string; text: string }) => (
  <div className="min-w-0 px-1">
    <p className="truncate text-[11.5px] font-medium text-ember-ink">{kicker}</p>
    <p className="truncate text-[13.5px] font-medium">{text}</p>
  </div>
);

/** Show me runs the step's walk-through; a step without one opens its page. */
function StepAction({ step, small }: { step: Step; small?: boolean }) {
  const g = useGuide()!;
  const cls = cn("h-8 rounded-full px-3.5", small && "h-7 px-3 text-[12px]");
  if (step.journey)
    return (
      <Button size="sm" className={cls} onClick={() => g.start(step.journey!)}>
        Show me
      </Button>
    );
  const href = `${g.base}${step.page ? `/${step.page}` : ""}`;
  return (
    <Link href={href as never} onClick={() => g.setPanel("none")} className={cn(buttonVariants({ size: "sm" }), cls)}>
      Go there
      <ArrowRightIcon data-icon="inline-end" />
    </Link>
  );
}

function PanelShell({ icon, title, aside, onClose, children }: { icon: React.ReactNode; title: string; aside?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <section role="dialog" aria-label={title} className="absolute inset-x-0 bottom-full mb-2.5 max-h-[min(60svh,520px)] overflow-y-auto rounded-[18px] border bg-card p-4 shadow-[0_24px_56px_-22px_rgba(0,0,0,0.38)] sm:p-5">
      <header className="mb-3 flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground">
        <span className="text-ember-ink [&_svg]:size-4">{icon}</span>
        <span className="flex-1">{title}</span>
        {aside}
        <button type="button" onClick={onClose} aria-label="Close" className="-m-1 rounded-full p-1 hover:bg-muted hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </header>
      {children}
    </section>
  );
}

function Dots({ at, total }: { at: number; total: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-1.5 rounded-full", i === at ? "w-4 bg-ember" : i < at ? "w-1.5 bg-ember" : "w-1.5 bg-border")} />
      ))}
    </span>
  );
}

function RunPanel({ run }: { run: Run }) {
  const g = useGuide()!;
  const step = run.journey.steps[run.index]!;
  const [here, setHere] = useState<string | null>(null);
  // The part's own sentence, in this brand's words, when the page gives one.
  useEffect(() => {
    const t = setTimeout(() => setHere(findAnchor(step.anchor)?.dataset.guideSay ?? null), 0);
    return () => clearTimeout(t);
  }, [step.anchor, run.status]);
  const last = run.index === run.journey.steps.length - 1;
  return (
    <PanelShell
      icon={<CompassIcon />}
      title={run.journey.title}
      aside={
        <span className="flex items-center gap-2">
          <Dots at={run.index} total={run.journey.steps.length} />
          <span className="tabular-nums">
            {run.index + 1} of {run.journey.steps.length}
          </span>
        </span>
      }
      onClose={() => g.stop()}
    >
      <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{step.title}</h3>
      {run.status === "missing" ? (
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-foreground/85">This part isn’t on the page yet. If your Culture Map is still building, it appears once the map is ready; come back to this step then.</p>
      ) : (
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-foreground/85">{step.say}</p>
      )}
      {here && run.status !== "missing" && <p className="mt-3 rounded-[12px] bg-ember-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed">{here}</p>}
      <footer className="mt-4 flex items-center gap-2">
        {run.status === "waiting" && (
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Spinner className="size-3.5" /> Your turn. Nothing happens until you do it.
          </span>
        )}
        {run.status === "done" && (
          <span className="flex items-center gap-2 text-[13px] font-medium text-ember-ink">
            <CheckIcon className="size-4" /> That’s it.
          </span>
        )}
        {run.status === "finding" && (
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Spinner className="size-3.5" /> Finding it on the page…
          </span>
        )}
        <span className="flex-1" />
        {run.index > 0 && (
          <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={g.back}>
            Back
          </Button>
        )}
        {run.status === "waiting" || run.status === "missing" ? (
          <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={g.next}>
            {last ? "Finish" : "Skip this step"}
          </Button>
        ) : (
          <Button size="sm" className="h-8 rounded-full px-4" onClick={g.next} disabled={run.status !== "showing"}>
            {last ? "Done" : "Next"}
          </Button>
        )}
      </footer>
    </PanelShell>
  );
}

function StepsPanel() {
  const g = useGuide()!;
  const guide = g.guide!;
  return (
    <PanelShell icon={<ListIcon />} title={`Getting started · ${pct(guide.steps)}`} onClose={() => g.setPanel("none")}>
      <ol className="space-y-1">
        {guide.steps.map((s) => {
          const next = guide.next?.id === s.id;
          return (
            <li key={s.id} className={cn("flex items-start gap-3 rounded-[12px] px-3 py-2.5", next && "bg-ember-soft")}>
              <span className={cn("mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]", s.done ? "border-ember bg-ember text-white" : next ? "border-ember" : "border-border")}>{s.done && <CheckIcon className="size-3" strokeWidth={3} />}</span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[14px]", s.done ? "text-muted-foreground line-through" : next ? "font-semibold" : "font-medium")}>{s.title}</span>
                {next && <span className="mt-0.5 block text-[13px] leading-relaxed text-foreground/80">{s.hint}</span>}
              </span>
              {s.by && <span className="shrink-0 rounded-full border bg-muted px-2 py-0.5 text-[11.5px] text-foreground/80">{s.by}</span>}
              {next && !s.busy && (
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">{s.minutes} min</span>
                  <StepAction step={s} small />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-[12.5px] text-muted-foreground">
        <span className="flex-1">Ticked by what you’ve really done, not by clicking here.</span>
        <button type="button" className="font-medium text-ember-ink hover:underline" onClick={() => void g.mark([], ["tour:*"]).then(() => toast("Each page’s walk-through will be offered again."))}>
          Show the tours again
        </button>
      </footer>
    </PanelShell>
  );
}

function NewsPanel() {
  const g = useGuide()!;
  const news = g.guide!.news!;
  const since = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date(news.since));
  return (
    <PanelShell icon={<HistoryIcon />} title={`Since ${since}`} onClose={() => g.setPanel("none")}>
      <ul className="divide-y">
        {news.items.map((n) => (
          <li key={n.id}>
            <Link href={`${g.base}/${n.page}` as never} onClick={() => g.setPanel("none")} className="flex items-center gap-3 py-2.5 text-[14px] hover:text-ember-ink">
              <span className="flex-1">{n.text}</span>
              <ArrowRightIcon className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ X-ray and the ring */

type Part = { id: string; n: number; title: string; body: string; rect: DOMRect };

/** The tagged parts on screen right now, numbered top to bottom, kept in step with scrolling. */
function useXrayParts(on: boolean): Part[] {
  const [parts, setParts] = useState<Part[]>([]);
  useEffect(() => {
    if (!on) {
      const t = setTimeout(() => setParts([]), 0);
      return () => clearTimeout(t);
    }
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const seen = new Set<string>();
        const found = [...document.querySelectorAll<HTMLElement>("[data-guide]")]
          .map((el) => ({ el, rect: el.getBoundingClientRect() }))
          .filter(({ el, rect }) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight - 90 && !seen.has(el.dataset.guide!) && seen.add(el.dataset.guide!))
          .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)
          .slice(0, 9)
          .map(({ el, rect }, i) => {
            const id = el.dataset.guide!;
            return { id, n: i + 1, title: ANCHORS[id]?.title ?? id, body: el.dataset.guideSay ?? ANCHORS[id]?.body ?? "", rect };
          });
        setParts(found);
      });
    };
    read();
    addEventListener("scroll", read, true);
    addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", read, true);
      removeEventListener("resize", read);
    };
  }, [on]);
  return parts;
}

function XrayPanel({ parts }: { parts: Part[] }) {
  const g = useGuide()!;
  const journey = journeyForPath(g.rest);
  const picked = parts.find((p) => p.id === g.pick);
  const teaches = picked && journey?.steps.some((s) => s.anchor === picked.id);
  if (picked)
    return (
      <PanelShell icon={<ScanIcon />} title="On this page" onClose={() => g.setPick(null)}>
        <div className="flex items-start gap-3">
          <Num n={picked.n} />
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold">{picked.title}</h3>
            <p className="mt-1 text-[14.5px] leading-relaxed text-foreground/85">{picked.body}</p>
          </div>
        </div>
        <footer className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <button type="button" className="text-[13px] text-muted-foreground hover:text-foreground" onClick={() => g.setPick(null)}>
            Back to every part
          </button>
          <span className="flex-1" />
          {g.kind === "WORKSPACE" && (
            <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={() => window.dispatchEvent(new CustomEvent("xray:ask", { detail: { question: `On the ${g.rest || "overview"} page, what is “${picked.title}” telling me about my brand, and what should I do with it?` } }))}>
              Ask about this
            </Button>
          )}
          {teaches && (
            <Button size="sm" className="h-8 rounded-full" onClick={() => g.start(journey!.id)}>
              <CompassIcon data-icon="inline-start" />
              Show me how
            </Button>
          )}
        </footer>
      </PanelShell>
    );
  return (
    <PanelShell icon={<ScanIcon />} title="On this page · click a number for more" onClose={() => g.setXray(false)}>
      {parts.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Nothing on this part of the page is labelled yet. Scroll, or try the Culture Map, Plays or an ad check.</p>
      ) : (
        <ol className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
          {parts.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => g.setPick(p.id)} className="flex w-full items-start gap-2.5 rounded-[10px] p-1.5 text-left hover:bg-muted">
                <Num n={p.n} />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">{p.title}</span>
                  <span className="line-clamp-2 text-[12.5px] leading-snug text-foreground/75">{p.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {journey && (
        <footer className="mt-4 flex items-center gap-2 border-t pt-3">
          <span className="flex-1 text-[12.5px] text-muted-foreground">Press X or Esc to leave.</span>
          <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={() => g.start(journey.id)}>
            <CompassIcon data-icon="inline-start" />
            Walk me through this page
          </Button>
        </footer>
      )}
    </PanelShell>
  );
}

const Num = ({ n }: { n: number }) => <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ember text-[11px] font-semibold text-white">{n}</span>;

/** What sits over the page: X-ray's dim, rings and numbers, or the walk-through's ring. */
function Layers() {
  const g = useGuide()!;
  const parts = useXrayParts(g.xray);
  const [ring, setRing] = useState<DOMRect | null>(null);
  const anchor = g.run && g.run.status !== "finding" && g.run.status !== "missing" ? g.run.journey.steps[g.run.index]!.anchor : null;

  useEffect(() => {
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRing(anchor ? (findAnchor(anchor)?.getBoundingClientRect() ?? null) : null));
    };
    read();
    // Smooth scrolling and late layout move the part for a moment; follow it.
    const settle = setInterval(read, 400);
    addEventListener("scroll", read, true);
    addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(settle);
      removeEventListener("scroll", read, true);
      removeEventListener("resize", read);
    };
  }, [anchor]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      {g.xray && <div className="pointer-events-none fixed inset-0 z-[45] bg-black/35 dark:bg-black/55" aria-hidden />}
      {g.xray &&
        parts.map((p) => (
          <div key={p.id}>
            <div aria-hidden className={cn("pointer-events-none fixed z-[46] rounded-[14px] border-2 border-ember", g.pick === p.id ? "bg-ember/[0.12]" : "bg-ember/[0.06]", g.pick && g.pick !== p.id && "opacity-40")} style={{ left: p.rect.left - 5, top: p.rect.top - 5, width: p.rect.width + 10, height: p.rect.height + 10 }} />
            <button
              type="button"
              onClick={() => g.setPick(p.id)}
              className={cn("pointer-events-auto fixed z-[47] flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-[12px] font-semibold shadow-lg", g.pick === p.id ? "bg-ember text-white" : "bg-foreground text-background hover:bg-ember hover:text-white")}
              style={{ left: p.rect.left + 4, top: Math.max(p.rect.top - 15, 4) }}
            >
              <Num n={p.n} />
              {p.title}
            </button>
          </div>
        ))}
      {ring && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[46] rounded-[14px] border-2 border-ember shadow-[0_0_0_6px_rgba(255,103,25,0.16)] transition-all duration-300 motion-reduce:transition-none"
          style={{ left: ring.left - 6, top: ring.top - 6, width: ring.width + 12, height: ring.height + 12 }}
        />
      )}
    </>,
    document.body,
  );
}
