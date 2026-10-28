"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Maximize2Icon, SquarePenIcon, XIcon } from "lucide-react";
import { AskChat } from "@/components/ask/ask-chat";
import { AssistantAvatar, AssistantGlyph } from "@/components/ask/assistant-mark";
import { Button } from "@/components/ui/button";
import { type AskStatus, askApi } from "@/lib/ask";
import { maps } from "@/lib/maps";
import { cn } from "@/lib/utils";

const SEEN = "xray.ask.launcher-seen";
const seen = () => {
  try {
    return localStorage.getItem(SEEN) === "1";
  } catch {
    return true;
  }
};

/** Tells the feedback tab to step aside while the chat panel is open (board X5). */
const announce = (open: boolean) => window.dispatchEvent(new CustomEvent("xray:ask-panel", { detail: open }));

/**
 * The launcher on every workspace page (boards X4–X5): an ember button bottom right, labelled on
 * a first visit. It opens a compact chat over the page; the expand button carries the same chat
 * to the full Ask X-Ray page. The panel stays mounted while closed so an answer keeps streaming.
 */
export function AskLauncher({ orgId, slug, brand, docked = false }: { orgId: string; slug: string; brand: string; /** The guide bar is on the page and opens the chat itself. */ docked?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState(false);
  const [chat, setChat] = useState({ key: "first", id: null as string | null, ask: undefined as string | undefined });
  const [status, setStatus] = useState<AskStatus | null>(null);
  const [mapLabel, setMapLabel] = useState<string | null>(null);
  const onAskPage = pathname === `/${slug}/ask`;

  useEffect(() => {
    const timer = setTimeout(() => setLabel(!seen()), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && toggle(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // "Ask X-Ray about this" anywhere on the page: a fresh chat that starts with that question.
  useEffect(() => {
    const onAsk = (e: Event) => {
      const question = (e as CustomEvent<{ question?: string }>).detail?.question?.trim();
      // No question (the guide bar's mark): just open the chat as it was.
      if (question) setChat({ key: crypto.randomUUID(), id: null, ask: question });
      toggle(true);
    };
    window.addEventListener("xray:ask", onAsk);
    return () => window.removeEventListener("xray:ask", onAsk);
  });

  function toggle(next: boolean) {
    setOpen(next);
    announce(next);
    if (!next) return;
    setLabel(false);
    try {
      localStorage.setItem(SEEN, "1");
    } catch {
      // Private windows: the label just shows again next time.
    }
    if (!mounted) {
      setMounted(true);
      void askApi.status().then(setStatus, () => setStatus(null));
      void maps.latest(orgId).then(
        ({ map }) => map?.status === "READY" && map.builtAt && setMapLabel(`${brand} map · ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(map.builtAt))}`),
        () => undefined,
      );
    }
  }

  if (onAskPage) return null;

  return (
    <>
      {mounted && (
        <section
          aria-label="Ask X-Ray"
          className={cn(
            "fixed z-40 flex flex-col overflow-hidden border bg-background shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]",
            "inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100svh-48px))] sm:w-[420px] sm:rounded-[18px]",
            !open && "hidden",
          )}
        >
          <header className="flex h-[52px] shrink-0 items-center gap-2.5 border-b pr-2 pl-4">
            <AssistantAvatar size={22} />
            <h2 className="flex-1 text-[14px] font-semibold">Ask X-Ray</h2>
            <Button variant="ghost" size="icon-sm" aria-label="New chat" onClick={() => setChat({ key: crypto.randomUUID(), id: null, ask: undefined })}>
              <SquarePenIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open the full page"
              onClick={() => {
                toggle(false);
                router.push(chat.id ? `/${slug}/ask#t=${chat.id}` : `/${slug}/ask`);
              }}
            >
              <Maximize2Icon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => toggle(false)}>
              <XIcon />
            </Button>
          </header>
          <AskChat key={chat.key} orgId={orgId} brand={brand} threadId={chat.id} initialMessages={[]} status={status} mapLabel={mapLabel} variant="panel" autoFocus ask={chat.ask} onThread={(id) => setChat((c) => ({ ...c, id }))} />
        </section>
      )}

      {!open && !docked && (
        <div className="fixed right-5 bottom-5 z-40 flex items-center gap-3 sm:right-8 sm:bottom-8">
          {label && (
            <button type="button" onClick={() => toggle(true)} className="hidden items-center gap-2 rounded-full bg-foreground py-2 pr-2.5 pl-3.5 text-[13px] font-medium text-background shadow-lg sm:flex">
              Ask about your customers
              <kbd className="rounded-[5px] border border-background/30 px-1.5 text-[11px] font-normal opacity-70">⌘J</kbd>
            </button>
          )}
          <button type="button" onClick={() => toggle(true)} aria-label="Ask X-Ray" className="group relative flex size-14 items-center justify-center rounded-full bg-ember text-white shadow-[0_10px_30px_-8px_rgba(255,103,25,0.6)] transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-ember/30 focus-visible:outline-none">
            <span className="absolute -inset-2 rounded-full bg-ember/15" aria-hidden />
            <AssistantGlyph className="relative size-7" />
          </button>
        </div>
      )}
    </>
  );
}
