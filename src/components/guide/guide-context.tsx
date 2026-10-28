"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ANCHORS, type Guide, type GuideDo, type GuideEvent, guideApi, type Journey, JOURNEYS, journeyForPath } from "@/lib/guide";

/**
 * The guide's state for one workspace or agency (Figma 19–21): steps from the backend, the journey
 * "Show me" is running, and whether X-ray is on. The bar and the overlays read it; pages only tag
 * their parts (`data-guide`) and call `guideDid` when the person does something a step waits for.
 */

export type Run = { journey: Journey; index: number; status: "finding" | "showing" | "waiting" | "done" | "missing" };

type Ctx = {
  guide: Guide | null;
  base: string;
  kind: "WORKSPACE" | "AGENCY";
  /** The path after the workspace ("map", "ad-check/abc", "" for the overview). */
  rest: string;
  run: Run | null;
  start: (id: string) => void;
  next: () => void;
  back: () => void;
  stop: (finished?: boolean) => void;
  xray: boolean;
  setXray: (on: boolean) => void;
  /** The X-ray part the person clicked, explained on its own. */
  pick: string | null;
  setPick: (id: string | null) => void;
  panel: Panel;
  setPanel: (p: Panel) => void;
  mark: (add: string[], remove?: string[]) => Promise<void>;
  /** The page's first-visit journey, if the person hasn't taken or dismissed it. */
  offer: Journey | null;
};
export type Panel = "none" | "steps" | "news";

const GuideCtx = createContext<Ctx | null>(null);
export const useGuide = () => useContext(GuideCtx);

/** The element a step points at, once it's on the page. */
export const findAnchor = (id: string) =>
  // Some parts render twice, once per screen size; take the one that's showing.
  [...document.querySelectorAll<HTMLElement>(`[data-guide="${CSS.escape(id)}"]`)].find((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().height > 0) ?? null;

export function GuideProvider({ orgId, base, kind, children }: { orgId: string; base: string; kind: "WORKSPACE" | "AGENCY"; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\/|\/$/g, "") : pathname;
  const [guide, setGuide] = useState<Guide | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [xray, setXrayOn] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const setXray = useCallback((on: boolean) => {
    setXrayOn(on);
    setPick(null);
  }, []);
  const [panel, setPanel] = useState<Panel>("none");
  const visited = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const { guide: g } = await guideApi.get(orgId);
      setGuide(g);
      if (g.news && !visited.current) setPanel("news");
      // The news is read now; the next visit starts from here.
      if (!visited.current) {
        visited.current = true;
        void guideApi.marks(orgId, { add: ["visit"] }).catch(() => undefined);
      }
    } catch {
      // The guide is a helper: if it can't load, the page still works without it.
    }
  }, [orgId]);

  const mark = useCallback(
    async (add: string[], remove: string[] = []) => {
      setGuide((g) => (g ? { ...g, marks: [...g.marks.filter((m) => !remove.includes(m) && !remove.some((r) => r.endsWith(":*") && m.startsWith(r.slice(0, -1)))), ...add.filter((a) => !g.marks.includes(a))] } : g));
      await guideApi.marks(orgId, { add, remove }).catch(() => undefined);
      await refresh();
    },
    [orgId, refresh],
  );

  // Fresh steps on every page: something may have been finished on the last one.
  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh, pathname]);

  // While something runs without the person (the map building), check back so the step ticks itself.
  const busy = Boolean(guide?.next?.busy);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(t);
  }, [busy, refresh]);

  // Visiting a page is what some steps wait for: reading the map, looking at plays, opening a client's map.
  useEffect(() => {
    if (!guide) return;
    const seen =
      kind === "AGENCY" ? (/^clients\/[^/]+\/map$/.test(rest) ? "seen:client-map" : null) : rest === "map" ? "seen:map" : rest === "plays" || rest.startsWith("plays/") ? "seen:plays" : null;
    if (seen && !guide.marks.includes(seen)) void mark([seen]);
  }, [guide, rest, kind, mark]);

  const begin = useCallback(
    (journey: Journey) => {
      setXray(false);
      setPanel("none");
      setRun({ journey, index: 0, status: "finding" });
      if (journey.page !== null && rest !== journey.page) router.push(`${base}${journey.page ? `/${journey.page}` : ""}` as never);
    },
    [base, rest, router],
  );
  const start = useCallback((id: string) => JOURNEYS[id] && begin(JOURNEYS[id]), [begin]);

  // The assistant's hands (Ask X-Ray's go_to, point_at, walk_through), carried out here.
  useEffect(() => {
    const onDo = (e: Event) => {
      const a = (e as CustomEvent<GuideDo>).detail;
      if (a.kind === "go") router.push(`${base}${a.path ? `/${a.path}` : ""}` as never);
      else if (a.kind === "walk") start(a.journey);
      else {
        const anchor = ANCHORS[a.part];
        if (!anchor) return;
        begin({ id: `point:${a.part}`, title: "X-Ray is showing you", minutes: 0, page: anchor.page ?? null, done: "", steps: [{ anchor: a.part, title: anchor.title, say: a.say }] });
      }
    };
    window.addEventListener("xray:guide-do", onDo);
    return () => window.removeEventListener("xray:guide-do", onDo);
  }, [base, router, start, begin]);

  // Reads of the current run for the handlers below, so no side effect sits inside a state update.
  const runRef = useRef<Run | null>(null);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const stop = useCallback(
    (finished = false) => {
      const r = runRef.current;
      setRun(null);
      // Taken or dismissed, a page's walk-through isn't offered again (Show the tours again resets it).
      // A one-off point from the assistant leaves no mark.
      if (r && JOURNEYS[r.journey.id]) void mark([`tour:${r.journey.id}`, ...(finished ? [r.journey.done] : [])]);
    },
    [mark],
  );

  const go = useCallback(
    (delta: number) => {
      const r = runRef.current;
      if (!r) return;
      const index = r.index + delta;
      if (index < 0) return;
      if (index >= r.journey.steps.length) return stop(true);
      setRun({ ...r, index, status: "finding" });
    },
    [stop],
  );
  const next = useCallback(() => go(1), [go]);
  const back = useCallback(() => go(-1), [go]);

  // Find the step's part on the page (it may still be rendering), then show it or wait for the person.
  useEffect(() => {
    if (!run || run.status !== "finding") return;
    // Opening the page comes first; the search starts once it's there.
    if (run.journey.page !== null && rest !== run.journey.page) return;
    const step = run.journey.steps[run.index]!;
    let tries = 0;
    const timer = setInterval(() => {
      const el = findAnchor(step.anchor);
      if (el) {
        clearInterval(timer);
        // Near the top, so the panel docked at the bottom never covers what it's talking about.
        el.style.scrollMarginTop = "96px";
        el.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        setRun((r) => (r === run ? { ...r, status: step.wait ? "waiting" : "showing" } : r));
      } else if (++tries > 40) {
        clearInterval(timer);
        if (step.optional) go(1);
        else setRun((r) => (r === run ? { ...r, status: "missing" } : r));
      }
    }, 250);
    return () => clearInterval(timer);
  }, [run, go, rest]);

  // "Your turn": the step moves on when the page reports that the person did it.
  useEffect(() => {
    if (!run || run.status !== "waiting") return;
    const want = run.journey.steps[run.index]!.wait;
    const onDid = (e: Event) => {
      if ((e as CustomEvent<GuideEvent>).detail === want) setRun((r) => (r === run ? { ...r, status: "done" } : r));
    };
    window.addEventListener("xray:guide", onDid);
    return () => window.removeEventListener("xray:guide", onDid);
  }, [run]);

  // Done: a moment to see "That's it.", then on to the next step.
  useEffect(() => {
    if (run?.status !== "done") return;
    const t = setTimeout(() => go(1), 1400);
    return () => clearTimeout(t);
  }, [run, go]);

  // X: X-ray this screen. Esc leaves it (or stops a walk-through).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "Escape") {
        if (pick) setPick(null);
        else if (xray) setXray(false);
        else if (run) stop();
        else if (panel !== "none") setPanel("none");
        return;
      }
      if (e.key.toLowerCase() === "x" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setRun(null);
        setPanel("none");
        setPick(null);
        setXrayOn((on) => !on);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [xray, pick, run, panel, stop, setXray]);

  const page = journeyForPath(rest);
  const offer = guide && page && kind === "WORKSPACE" && !guide.marks.includes(`tour:${page.id}`) && !run ? page : null;

  const value = useMemo<Ctx>(
    () => ({ guide, base, kind, rest, run, start, next, back, stop, xray, setXray, pick, setPick, panel, setPanel, mark, offer }),
    [guide, base, kind, rest, run, start, next, back, stop, xray, setXray, pick, panel, mark, offer],
  );
  return <GuideCtx.Provider value={value}>{children}</GuideCtx.Provider>;
}
