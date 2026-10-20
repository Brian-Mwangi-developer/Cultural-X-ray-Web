"use client";

import { useState } from "react";
import { ArrowUpIcon, AtSignIcon, CircleCheckIcon, PaperclipIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Evidence } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { possessive } from "@/lib/intent";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; text: string; tools?: [string, string][]; evidence?: string[] };

export function sampleConversation(brand: string): Turn[] {
  return [
    { role: "user", text: "Make the hook work for New York City, and keep it in our territory." },
    {
      role: "assistant",
      tools: [
        ["localize", "brief → New York City"],
        ["rank_carriers", "segment 25–34, city NYC"],
        ["critic", "2 notes, 0 blocking"],
      ],
      text: `In New York City the shared climbing world still leans ${possessive(brand)} way, and 10% Happier holds its rank. Keep Moab for the hero film; cut a city version around a climbing gym at dawn.`,
      evidence: ["Rich Roll · NYC 56/44", "10% Happier · NYC rank 2"],
    },
  ];
}

/** The Ask X-Ray thread: tool calls shown, every claim cited. Sending waits for the engine. */
export function AskThread({ brand, className, compact }: { brand: string; className?: string; compact?: boolean }) {
  const [draft, setDraft] = useState("");
  const turns = sampleConversation(brand);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    toast("Ask X-Ray answers once the Culture Map engine is connected.", { description: "Your question wasn't sent; nothing was used." });
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className={cn("flex-1 space-y-5 overflow-y-auto", compact ? "px-5 py-5" : "py-2")}>
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-[16px] bg-muted px-4 py-3 text-[14.5px] leading-relaxed">
              {turn.text}
            </p>
          ) : (
            <div key={i} className="space-y-3">
              {turn.tools && (
                <ul className="space-y-1.5 rounded-[12px] border px-3.5 py-3">
                  {turn.tools.map(([tool, detail]) => (
                    <li key={tool} className="flex items-center gap-2 text-[12.5px]">
                      <CircleCheckIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                      <code className="font-mono text-[12px]">{tool}</code>
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[14.5px] leading-relaxed">{turn.text}</p>
              {turn.evidence && (
                <div className="flex flex-wrap gap-1.5">
                  {turn.evidence.map((e) => (
                    <Evidence key={e}>{e}</Evidence>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <SoonButton size="pill" message="Applying answers to a brief arrives with briefs.">
                  Apply to brief
                </SoonButton>
                <SoonButton variant="outline" size="pill" message="Sources open from the map once the engine is connected.">
                  Show sources
                </SoonButton>
              </div>
            </div>
          ),
        )}
      </div>
      <form onSubmit={send} className={cn("border-t", compact ? "p-4" : "pt-4")}>
        <div className="rounded-[14px] border bg-card px-3.5 pt-3 pb-2.5 focus-within:border-ember/60 focus-within:ring-3 focus-within:ring-ember/15">
          <label htmlFor="ask" className="sr-only">
            Ask X-Ray
          </label>
          <textarea
            id="ask"
            rows={compact ? 2 : 3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this map or brief. Type @ to cite a map item"
            className="w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-faint"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-muted-foreground">
              <AtSignIcon className="size-4" strokeWidth={1.75} aria-hidden />
              <PaperclipIcon className="size-4" strokeWidth={1.75} aria-hidden />
            </div>
            <button type="submit" aria-label="Send" className="flex size-8 items-center justify-center rounded-full bg-ember text-white transition-opacity disabled:opacity-40" disabled={!draft.trim()}>
              <ArrowUpIcon className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function AskHeader() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-medium">
      <SparklesIcon className="size-4" strokeWidth={1.75} aria-hidden />
      Ask X-Ray
    </span>
  );
}
