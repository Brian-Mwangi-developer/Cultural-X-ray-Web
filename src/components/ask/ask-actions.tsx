"use client";

import { useEffect } from "react";
import { BookmarkIcon, CompassIcon, CrosshairIcon, MoveRightIcon, RotateCcwIcon } from "lucide-react";
import { ANCHORS, guideDo, type GuideDo, JOURNEYS } from "@/lib/guide";

/** Actions already carried out, so a re-render (or the same answer shown twice) never repeats one. */
const done = new Set<string>();

const PAGE_WORDS: Record<string, string> = { "": "the overview", map: "the Culture Map", audience: "Audience & places", plays: "Plays", "ad-check": "Ad check" };

/**
 * One of the assistant's hands in the conversation (go_to, point_at, walk_through): a quiet line saying
 * what it did on the page, carried out once when it arrives. Old answers only show the line, with
 * "Show me again" to repeat it on purpose.
 */
export function GuideAction({ id, tool, input, output, live }: { id: string; tool: string; input: unknown; output: unknown; live: boolean }) {
  const action = actionOf(tool, input, output);

  useEffect(() => {
    if (!action || !live || done.has(id)) return;
    done.add(id);
    guideDo(action);
  }, [action, live, id]);

  if (!action) return null;
  const { icon: Icon, words } =
    action.kind === "go"
      ? { icon: MoveRightIcon, words: `Opened ${PAGE_WORDS[action.path] ?? action.path}` }
      : action.kind === "walk"
        ? { icon: CompassIcon, words: `Walk-through: ${JOURNEYS[action.journey]?.title.toLowerCase() ?? action.journey}` }
        : { icon: CrosshairIcon, words: `Showing you: ${ANCHORS[action.part]?.title ?? action.part}` };
  return (
    <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <Icon className="size-3.5 text-ember-ink" aria-hidden />
      <span>{words}</span>
      <button type="button" onClick={() => guideDo(action)} className="ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:bg-muted hover:text-foreground">
        <RotateCcwIcon className="size-3" aria-hidden />
        Show me again
      </button>
    </p>
  );
}

/** The action, only when the server said it can be done (it checks against what's on screen). */
export function actionOf(tool: string, input: unknown, output: unknown): GuideDo | null {
  const i = (input ?? {}) as Record<string, string>;
  const o = (output ?? {}) as Record<string, unknown>;
  if (tool === "go_to" && o.opened) return { kind: "go", path: String(o.path ?? "") };
  if (tool === "point_at" && o.pointed && i.part) return { kind: "point", part: i.part, say: i.say ?? "" };
  if (tool === "walk_through" && o.started && i.journey) return { kind: "walk", journey: i.journey };
  return null;
}

export const GUIDE_TOOLS = new Set(["go_to", "point_at", "walk_through"]);

/** The assistant kept a note (the remember tool): said in the conversation, with where to manage it. */
export function Remembered({ output }: { output: unknown }) {
  const o = (output ?? {}) as { kept?: boolean; fact?: string; note?: string };
  if (!o.kept || !o.fact) return null;
  const settings = typeof window === "undefined" ? "#" : `/${location.pathname.split("/")[1]}/settings/profile#memory`;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
      <BookmarkIcon className="size-3.5 text-ember-ink" aria-hidden />
      <span>
        Remembered: <span className="text-foreground/85">{o.fact}</span>
      </span>
      <a href={settings} className="rounded-full px-1.5 py-0.5 hover:bg-muted hover:text-foreground">
        Manage
      </a>
    </p>
  );
}
