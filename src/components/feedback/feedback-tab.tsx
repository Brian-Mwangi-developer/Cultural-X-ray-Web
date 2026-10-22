"use client";

import { useEffect, useRef, useState } from "react";
import { BugIcon, ChevronLeftIcon, CircleHelpIcon, LightbulbIcon, type LucideIcon, MessageSquareTextIcon, XIcon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type Kind = { id: string; icon: LucideIcon; label: string; sub: string; title: string; prompt: string };

const KINDS: Kind[] = [
  { id: "idea", icon: LightbulbIcon, label: "Idea", sub: "Something we could do better", title: "Share an idea", prompt: "What could we do better?" },
  { id: "feature", icon: ZapIcon, label: "Feature request", sub: "Something you need that isn't here", title: "Request a feature", prompt: "What do you need, and what would it help you do?" },
  { id: "bug", icon: BugIcon, label: "Bug", sub: "Something broke or looks wrong", title: "Report a bug", prompt: "What happened?" },
  { id: "question", icon: CircleHelpIcon, label: "Question", sub: "Something you're unsure about", title: "Ask a question", prompt: "What would you like to know?" },
  { id: "other", icon: MessageSquareTextIcon, label: "Other feedback", sub: "Anything else on your mind", title: "Send feedback", prompt: "What's on your mind?" },
];

/**
 * The feedback tab on the right edge (boards X4, X6, X7). The menu and form are built; sending is
 * wired up next, so Send says so instead of pretending, and keeps what was written.
 */
export function FeedbackTab({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [text, setText] = useState("");
  const [withPage, setWithPage] = useState(true);
  const [hidden, setHidden] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // Step aside while the Ask X-Ray panel is open.
  useEffect(() => {
    const onPanel = (e: Event) => setHidden(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("xray:ask-panel", onPanel);
    return () => window.removeEventListener("xray:ask-panel", onPanel);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      const n = Number(e.key);
      if (!kind && !typing && n >= 1 && n <= KINDS.length) setKind(KINDS[n - 1]!);
    };
    const onDown = (e: MouseEvent) => panel.current && !panel.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-feedback-tab]") && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  });

  function close() {
    setOpen(false);
    setKind(null);
  }

  function send() {
    toast("Feedback isn't connected yet", { description: "We're wiring this up next. Nothing was sent, and your note is still here." });
  }

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        data-feedback-tab
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        className="fixed top-1/3 right-0 z-30 hidden flex-col items-center gap-2.5 rounded-l-[10px] border border-r-0 bg-card px-2.5 py-3.5 text-[13px] font-medium shadow-[0_6px_20px_-10px_rgba(0,0,0,0.25)] transition-colors hover:bg-muted sm:flex"
      >
        <span className="[writing-mode:vertical-rl]">Feedback</span>
        <MessageSquareTextIcon className="size-4 text-ember" strokeWidth={1.75} aria-hidden />
      </button>

      {open && (
        <div ref={panel} role="dialog" aria-labelledby="feedback-title" className="fixed top-[calc(33%-40px)] right-14 z-40 w-[min(400px,calc(100vw-5rem))] rounded-[18px] border bg-card p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]">
          {!kind ? (
            <>
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <h2 id="feedback-title" className="text-[18px] font-semibold tracking-[-0.01em]">
                    Give us feedback
                  </h2>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">Tell us what would make Cultural X-Ray more useful to you.</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
                  <XIcon />
                </Button>
              </div>
              <ul className="mt-4 space-y-2">
                {KINDS.map((k, i) => (
                  <li key={k.id}>
                    <button type="button" onClick={() => setKind(k)} className="flex w-full items-center gap-3 rounded-[12px] border bg-card px-3.5 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-ember-soft">
                        <k.icon className="size-4 text-ember-ink" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium">{k.label}</span>
                        <span className="block text-[12px] text-muted-foreground">{k.sub}</span>
                      </span>
                      <kbd className="rounded-[5px] border px-1.5 text-[11.5px] text-muted-foreground">{i + 1}</kbd>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] text-faint">Press 1–5 to choose. We read every message.</p>
            </>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) send();
              }}
            >
              <div className="flex items-center gap-2.5">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Back" onClick={() => setKind(null)}>
                  <ChevronLeftIcon />
                </Button>
                <span className="flex size-7 items-center justify-center rounded-[8px] bg-ember-soft">
                  <kind.icon className="size-4 text-ember-ink" strokeWidth={1.75} aria-hidden />
                </span>
                <h2 id="feedback-title" className="flex-1 text-[17px] font-semibold">
                  {kind.title}
                </h2>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
                  <XIcon />
                </Button>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="feedback-text" className="text-[13px] font-medium">
                  {kind.prompt}
                </label>
                <Textarea id="feedback-text" autoFocus rows={5} value={text} onChange={(e) => setText(e.target.value)} className="resize-none text-[13.5px]" />
              </div>
              <label className="flex items-start gap-2.5 text-[13px]">
                <Checkbox checked={withPage} onCheckedChange={(v) => setWithPage(Boolean(v))} className="mt-0.5" />
                <span>
                  Include this page&rsquo;s address and your browser
                  <span className="block text-[11.5px] text-muted-foreground">Helps us find it faster. No screenshots, no data from your map.</span>
                </span>
              </label>
              <p className="text-[12px] text-muted-foreground">We&rsquo;ll reply to {email}</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="pill" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" size="pill" disabled={!text.trim()}>
                  Send
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
