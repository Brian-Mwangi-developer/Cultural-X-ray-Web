"use client";

import { useChat } from "@ai-sdk/react";
import { isToolUIPart, getToolName } from "ai";
import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, CircleCheckIcon, CopyIcon, LoaderCircleIcon, MapIcon, MapPinIcon, MicIcon, SquareIcon, TvIcon, UsersIcon } from "lucide-react";
import { AssistantAvatar } from "@/components/ask/assistant-mark";
import { Visual } from "@/components/ask/ask-visuals";
import { Button } from "@/components/ui/button";
import { type AskMessage, type AskStatus, askTransport, STARTERS } from "@/lib/ask";
import { cn } from "@/lib/utils";

const STARTER_ICONS = { mic: MicIcon, "map-pin": MapPinIcon, tv: TvIcon, users: UsersIcon } as const;
const READS: Record<string, [string, string]> = { read_map: ["Reading your map", "Read your map"], read_audience: ["Reading who you reach", "Read who you reach"] };

type Part = AskMessage["parts"][number];

function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[14.5px] leading-[1.6] [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** The reading steps (read_map, read_audience) fold into one quiet line, as in board X1. */
function Steps({ parts }: { parts: Part[] }) {
  const [open, setOpen] = useState(false);
  const reads = parts.filter((p) => isToolUIPart(p) && getToolName(p).startsWith("read_"));
  if (!reads.length) return null;
  const working = reads.some((p) => isToolUIPart(p) && p.state !== "output-available" && p.state !== "output-error");
  const labels = reads.map((p) => (isToolUIPart(p) ? READS[getToolName(p)]?.[working ? 0 : 1] ?? getToolName(p) : ""));
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex h-8 items-center gap-2 rounded-[10px] border bg-card px-3 text-[12.5px] text-foreground/80" aria-expanded={open}>
        {working ? <LoaderCircleIcon className="size-3.5 animate-spin text-ember" strokeWidth={2} aria-hidden /> : <CircleCheckIcon className="size-3.5" strokeWidth={1.75} aria-hidden />}
        {working ? `${labels.at(-1)}…` : [...new Set(labels)].join(" · ")}
        <span className="text-faint">{reads.length} {reads.length === 1 ? "step" : "steps"}</span>
        <ChevronDownIcon className={cn("size-3.5 text-faint transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul className="mt-2 space-y-1 pl-1 text-[12.5px] text-muted-foreground">
          {reads.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckIcon className="size-3" aria-hidden />
              {isToolUIPart(p) ? (READS[getToolName(p)]?.[1] ?? getToolName(p)) : ""} from Qloo, through this workspace&rsquo;s map
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Answer({ message, streaming }: { message: AskMessage; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("\n\n").trim();
  const meta = message.metadata;
  return (
    <div className="flex gap-3">
      <AssistantAvatar size={26} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-3">
        <Steps parts={message.parts} />
        {message.parts.map((p, i) => {
          if (p.type === "text") return p.text.trim() ? <Markdown key={i} text={p.text} /> : null;
          if (isToolUIPart(p) && getToolName(p).startsWith("show_")) return <Visual key={p.toolCallId} tool={getToolName(p)} input={p.input} ready={p.state === "input-available" || p.state === "output-available"} />;
          return null;
        })}
        {!streaming && text && (
          <div className="flex items-center gap-1 text-[11.5px] text-faint">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={copied ? "Copied" : "Copy answer"}
              onClick={() => {
                void navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
            <span>{meta?.practice ? "Practice answer, written from your map" : "From your Culture Map and Qloo"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3" role="status" aria-label="Ask X-Ray is thinking">
      <AssistantAvatar size={26} />
      <span className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </div>
  );
}

export function Composer({ value, onChange, onSend, onStop, busy, disabled, mapLabel, autoFocus, compact }: { value: string; onChange: (v: string) => void; onSend: () => void; onStop: () => void; busy: boolean; disabled?: boolean; mapLabel: string | null; autoFocus?: boolean; compact?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 120 : 200)}px`;
  }, [value, compact]);
  const canSend = value.trim().length > 0 && !busy && !disabled;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
      className="rounded-[20px] border bg-card px-4 pt-3.5 pb-2.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] focus-within:border-foreground/25"
    >
      <label htmlFor="ask-input" className="sr-only">
        Ask X-Ray
      </label>
      <textarea
        id="ask-input"
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder="Ask about your customers, your rivals or where to show up…"
        className="block w-full resize-none bg-transparent text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
      />
      <div className="mt-2 flex items-center gap-2">
        {mapLabel && (
          <span className="inline-flex h-7 min-w-0 items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 text-[12px] text-foreground/80">
            <MapIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{mapLabel}</span>
          </span>
        )}
        <span className="flex-1" />
        {busy ? (
          <Button type="button" size="icon-sm" variant="outline" className="rounded-full" onClick={onStop} aria-label="Stop">
            <SquareIcon className="fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon-sm" className={cn("rounded-full", !canSend && "bg-soft text-faint hover:bg-soft")} disabled={!canSend} aria-label="Send">
            <ArrowUpIcon strokeWidth={2.25} />
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * One conversation. Used by the full page (and its focus mode) and by the launcher's panel.
 * The answer streams from the backend; only the new question goes up each time.
 */
export function AskChat({
  orgId,
  brand,
  threadId,
  initialMessages,
  status,
  mapLabel,
  variant,
  onThread,
  autoFocus,
  ask,
}: {
  orgId: string;
  brand: string;
  threadId: string | null;
  initialMessages: AskMessage[];
  status: AskStatus | null;
  mapLabel: string | null;
  variant: "page" | "panel";
  onThread?: (id: string) => void;
  autoFocus?: boolean;
  /** A question to send as soon as the chat opens ("Ask X-Ray about this"). */
  ask?: string;
}) {
  // Created once: the transport keeps the thread id it learns from the first reply.
  const [transport] = useState(() => askTransport(orgId, { current: threadId }, (id) => onThread?.(id)));
  // useChat starts a fresh chat whenever its id changes, so the id is fixed for this component's
  // life; a new thread id learned mid-answer must not reset the conversation on screen.
  const localId = useId();
  const [chatId] = useState(() => threadId ?? localId);
  const { messages, sendMessage, status: chatStatus, stop, error } = useChat<AskMessage>({ id: chatId, messages: initialMessages, transport, experimental_throttle: 40 });
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const busy = chatStatus === "submitted" || chatStatus === "streaming";
  const last = messages.at(-1);
  const waiting = chatStatus === "submitted" || (chatStatus === "streaming" && last?.role === "assistant" && !last.parts.some((p) => p.type === "text" || isToolUIPart(p)));
  const off = status?.mode === "off";
  const panel = variant === "panel";

  useEffect(() => {
    if (stick.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, waiting]);

  function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    stick.current = true;
    setDraft("");
    void sendMessage({ text: q });
  }

  // Sent once per chat, on the next tick: in development React mounts effects twice, and a message
  // sent from the first (discarded) pass never reaches the chat that stays on screen.
  const asked = useRef(false);
  useEffect(() => {
    if (!ask || asked.current) return;
    const timer = setTimeout(() => {
      asked.current = true;
      stick.current = true;
      void sendMessage({ text: ask });
    }, 0);
    return () => clearTimeout(timer);
  }, [ask, sendMessage]);

  const empty = messages.length === 0;
  const width = panel ? "px-4" : "mx-auto w-full max-w-[760px] px-4 sm:px-6";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          stick.current = bottom;
          setAtBottom(bottom);
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {empty ? (
          <div className={cn(width, panel ? "space-y-4 py-5" : "flex min-h-full flex-col items-center justify-center gap-5 py-10 text-center")}>
            {!panel && <AssistantAvatar size={44} />}
            <div className={cn("space-y-2", !panel && "max-w-xl")}>
              <h2 className={cn("font-semibold tracking-[-0.02em] text-balance", panel ? "text-[16px]" : "text-[28px] leading-tight")}>What do you want to know about your customers?</h2>
              <p className={cn("text-muted-foreground", panel ? "text-[13px]" : "text-[15px] leading-relaxed")}>
                Ask in your own words. Answers come from {brand}&rsquo;s Culture Map: what your customers watch, follow and visit, and where your rivals stand.
              </p>
            </div>
            <div className={cn("grid gap-2.5", panel ? "grid-cols-1" : "w-full max-w-[640px] grid-cols-1 sm:grid-cols-2")}>
              {STARTERS.map((s) => {
                const Icon = STARTER_ICONS[s.icon];
                return (
                  <button key={s.title} type="button" onClick={() => send(s.title)} disabled={off} className="flex flex-col items-start gap-1 rounded-[14px] border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-50">
                    <Icon className="size-4 text-ember" strokeWidth={1.75} aria-hidden />
                    <span className="text-[14px] font-medium">{s.title}</span>
                    {!panel && <span className="text-[12.5px] text-muted-foreground">{s.sub}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={cn(width, "space-y-6 py-6")}>
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-[18px] bg-soft px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap">{m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}</p>
                </div>
              ) : (
                <Answer key={m.id} message={m} streaming={busy && i === messages.length - 1} />
              ),
            )}
            {waiting && <Thinking />}
            {error && <p className="rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] text-destructive">{error.message}</p>}
          </div>
        )}
      </div>

      {!atBottom && !empty && (
        <Button size="icon-sm" variant="outline" className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full bg-card shadow-md" aria-label="Scroll to the latest answer" onClick={() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" })}>
          <ArrowDownIcon />
        </Button>
      )}

      <div className={cn(width, panel ? "pb-3" : "pb-4")}>
        <Composer value={draft} onChange={setDraft} onSend={() => send(draft)} onStop={stop} busy={busy} disabled={off} mapLabel={mapLabel} autoFocus={autoFocus} compact={panel} />
        <p className="mt-2 text-center text-[11.5px] text-faint">
          {off ? "Ask X-Ray isn't connected to a model yet." : status?.mode === "practice" ? "Practice mode: answers are scripted from your real map, at no cost." : "Answers come from your Culture Map and Qloo. Check anything you'll spend on."}
        </p>
      </div>
    </div>
  );
}
