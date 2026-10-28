import { api } from "@/lib/api";

/**
 * The guide (plan-guide.md, Figma 16–25). Steps are ticked by the backend from real data; this file
 * holds what the browser needs: the API, the named parts of each page the guide can point at
 * (anchors), and the scripted walk-throughs (journeys) that "Show me" runs. Nothing here needs a
 * model, so the guide keeps working when the assistant is off.
 */

export type Goal = "customers" | "places" | "ads" | "creators" | "rival" | "client" | "team" | "sample";
export type Step = { id: string; title: string; hint: string; minutes: number; page: string; journey: string | null; done: boolean; by: string | null; busy?: boolean };
export type News = { since: string; items: { id: string; text: string; page: string }[] };
export type Guide = { steps: Step[]; next: Step | null; goal: Goal | null; marks: string[]; news: News | null };

export const guideApi = {
  get: (orgId: string) => api<{ guide: Guide }>(`/orgs/${orgId}/guide`),
  marks: (orgId: string, body: { add?: string[]; remove?: string[] }) => api<void>(`/orgs/${orgId}/guide/marks`, { method: "PUT", body }),
  person: () => api<{ welcomed: boolean; goal: Goal | null }>("/me/guide"),
  welcome: (goal: Goal | null) => api<{ welcomed: boolean; goal: Goal | null }>("/me/guide", { method: "PUT", body: { goal } }),
};

/**
 * Something the person did that a "your turn" step waits for (picked a filter, uploaded an ad,
 * opened a play). Pages call this; the guide listens. Costs nothing when no journey is running.
 */
export type GuideEvent = "map.filter" | "ad.uploaded" | "play.open";
/** The assistant's hands: open a page, ring a part, start a walk-through. The guide carries them out. */
export type GuideDo = { kind: "go"; path: string } | { kind: "point"; part: string; say: string } | { kind: "walk"; journey: string };
export const guideDo = (action: GuideDo) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("xray:guide-do", { detail: action }));
};

export const guideDid = (what: GuideEvent) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("xray:guide", { detail: what }));
};

/**
 * Every part of a page the guide may point at or X-ray. `page` is where it lives (relative to the
 * workspace), so pointing at it can open that page first; null when it's on an ad's own page or
 * everywhere (the sidebar). Components put `data-guide="<id>"` on the
 * element, and may add `data-guide-say` with a sentence in this brand's own words, which then
 * replaces `body`. Keep ids stable: journeys and, later, the assistant's page cards use them.
 */
export const ANCHORS: Record<string, { title: string; body: string; page?: string | null }> = {
  "map.compare": { page: "map", title: "Who you’re compared with", body: "Your rivals on this map. Change them, or add brands to read through; saving rebuilds the map." },
  "map.read": { page: "map", title: "The short version", body: "One sentence on the category you’re looking at. It changes with the tab." },
  "map.tabs": { page: "map", title: "Categories", body: "Podcasts, films, TV, creators, artists, places, brands and books. Each has its own three piles." },
  "map.filters": { page: "map", title: "Narrow it down", body: "By age band, or niche picks only. Each view is read from Qloo once, kept, and counted on your meter." },
  "map.yours": { page: "map", title: "Yours", body: "Only your customers have these. The easiest places to stand out." },
  "map.shared": { page: "map", title: "Shared", body: "Both sides have these. The bar says whose list each sits higher on." },
  "map.theirs": { page: "map", title: "Theirs", body: "Only rivals’ customers have these. Ground you’d have to win." },
  "overview.read": { page: "", title: "X-Ray’s read", body: "Your Culture Map in a few sentences: what your customers love and where they go." },
  "plays.first": { page: "plays", title: "A play", body: "A move your Culture Map backs, with why. Open it for who to work with and a first message." },
  "plays.source": { page: "plays", title: "What it rests on", body: "The map item behind the play. Hover it to see where it ranks for your customers and rivals’." },
  "adcheck.upload": { page: "ad-check", title: "Drop a draft here", body: "A video up to 60 seconds. It’s read shot by shot against your Culture Map; nothing is posted anywhere." },
  "adcheck.list": { page: "ad-check", title: "Ads you’ve checked", body: "Every ad read so far, with what it speaks to and what to fix." },
  "adcheck.video": { page: null, title: "Your ad", body: "Play it here. Findings jump to the moment they’re about." },
  "adcheck.fit": { page: null, title: "Does it sell what you sell?", body: "Checked first: whether the ad shows your product and says your name." },
  "adcheck.read": { page: null, title: "Whose culture it speaks to", body: "The ad’s pull, in your Culture Map’s words: towards your customers, or a rival’s." },
  "adcheck.before": { page: null, title: "Fix before you spend", body: "What would hold it back where it runs: shape, first seconds, sound, and a next step. Each with its evidence." },
  "audience.read": { page: "audience", title: "Who your customers are, in short", body: "A sentence on the age groups and places your Culture Map says your customers lean to." },
  "audience.globe": { page: "audience", title: "Where the culture lives", body: "The towns and cities your customers pick, on a globe. Click a city; Open map shows every place." },
  "audience.who": { page: "audience", title: "Who they are", body: "Age groups and women and men, for you and each rival, in words like “strong” and “weak”." },
  "audience.places": { page: "audience", title: "Places your customers pick", body: "Ranked, with who else has each one. Good for pop-ups and where to advertise." },
  "sidebar.compare": { page: null, title: "Compared with", body: "Rivals and the brands your culture is read through. The + adds more." },
  "sidebar.usage": { page: null, title: "Qloo queries", body: "What this month’s maps and checks have used. Answers already fetched are free." },
};

export type JourneyStep = {
  anchor: string;
  title: string;
  say: string;
  /** Waits for the person to do something before it moves on ("your turn"). */
  wait?: GuideEvent;
  /** Leave out a step whose part isn't on this page (e.g. the fit card only shows when it fails). */
  optional?: boolean;
};
export type Journey = { id: string; title: string; minutes: number; page: string | null; done: string; steps: JourneyStep[] };

/** "Show me" for each step and each page's first visit. `page` is relative to the workspace; null means "here". */
export const JOURNEYS: Record<string, Journey> = {
  map: {
    id: "map",
    title: "Reading your map",
    minutes: 2,
    page: "map",
    done: "seen:map",
    steps: [
      { anchor: "map.yours", title: "Three piles", say: "Everything your customers like sits in one of three columns: only yours, shared with a rival, or only a rival’s. Yours is where you can stand out without a fight." },
      { anchor: "map.filters", title: "Narrow it down", say: "Pick an age band to see what that group loves. Each view is read from Qloo once and kept.", wait: "map.filter" },
      { anchor: "map.shared", title: "Who it leans to", say: "In Shared, the bar says whose list it sits higher on. Hover it for the sentence behind it; click a row for the Qloo lists it came from." },
      { anchor: "map.compare", title: "Who you compare with", say: "Change your rivals, or add brands to read through. Saving rebuilds the map and rewrites your plays." },
    ],
  },
  plays: {
    id: "plays",
    title: "Your plays",
    minutes: 2,
    page: "plays",
    done: "seen:plays",
    steps: [
      { anchor: "plays.first", title: "A move your map backs", say: "Each play is something to do, with one line on why your Culture Map backs it." },
      { anchor: "plays.source", title: "What it rests on", say: "This says which map item the play rests on. Hover it: it ranks for your customers and not for your rivals’, so nothing here is made up." },
      { anchor: "plays.first", title: "Your turn", say: "Open a play to see who to work with and a first message you can send.", wait: "play.open" },
    ],
  },
  ad: {
    id: "ad",
    title: "Checking an ad",
    minutes: 4,
    page: "ad-check",
    done: "tour:ad",
    steps: [
      { anchor: "adcheck.upload", title: "Drop your draft here", say: "Choose a video, then say where it will run: TikTok and Reels change what’s checked (its shape, its first seconds, its sound). Reading takes about two minutes and uses no Qloo queries.", wait: "ad.uploaded" },
    ],
  },
  "ad-read": {
    id: "ad-read",
    title: "Reading an ad check",
    minutes: 1,
    page: null,
    done: "tour:ad-read",
    steps: [
      { anchor: "adcheck.fit", title: "Does it sell what you sell?", say: "Checked first. When an ad shows someone else’s product, this says so and gives you a reshoot brief.", optional: true },
      { anchor: "adcheck.read", title: "Whose culture it speaks to", say: "The ad’s pull, in your Culture Map’s words: towards your customers, or towards a rival’s." },
      { anchor: "adcheck.before", title: "Fix before you spend", say: "What would hold it back where it runs, each with the evidence and the fix.", optional: true },
    ],
  },
};

/** Which journey a page offers on a person's first visit, by the path after the workspace. */
export function journeyForPath(rest: string): Journey | null {
  if (rest === "map") return JOURNEYS.map;
  if (rest === "plays") return JOURNEYS.plays;
  if (rest === "ad-check") return JOURNEYS.ad;
  if (/^ad-check\/[^/]+$/.test(rest)) return JOURNEYS["ad-read"];
  return null;
}

export const GOAL_CHOICES: { goal: Goal; title: string; sub: string; agency?: boolean }[] = [
  { goal: "customers", title: "Know who my customers are", sub: "What they watch, listen to and follow" },
  { goal: "places", title: "Pick where to show up", sub: "Towns and places your crowd goes" },
  { goal: "ads", title: "Make ads that land", sub: "Check a draft before you pay for it" },
  { goal: "creators", title: "Find creators to work with", sub: "People your customers already follow" },
  { goal: "rival", title: "Take ground from a rival", sub: "What they have that you could win" },
  { goal: "client", title: "Add my first client", sub: "Create it, or connect with their code", agency: true },
  { goal: "team", title: "Bring in my team", sub: "Invite people and choose who sees which client", agency: true },
  { goal: "sample", title: "See what a client gets", sub: "Open a client’s finished map", agency: true },
];
