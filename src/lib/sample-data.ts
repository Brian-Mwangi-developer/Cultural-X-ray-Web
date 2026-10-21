/**
 * Sample content for the screens the Culture Map engine will fill. Shaped like the
 * real API responses so pages swap to live data without layout changes. Every page
 * that renders this shows a "Sample data" label.
 */
import type { StaticImageData } from "next/image";
import climber from "../../public/images/culture-climber.jpg";
import court from "../../public/images/culture-court.jpg";
import street from "../../public/images/culture-street.jpg";
import dusk from "../../public/images/panel-dusk.jpg";
import forest from "../../public/images/panel-forest.jpg";
import hiker from "../../public/images/panel-hiker.jpg";
import host from "../../public/images/panel-host.jpg";
import lakes from "../../public/images/panel-lakes.jpg";
import mic from "../../public/images/panel-mic.jpg";
import misty from "../../public/images/panel-misty.jpg";
import type { Territory } from "@/components/app/parts";
import type { AudienceData } from "@/lib/audience";
import { sampleCities } from "@/lib/globe-data";
import { possessive } from "@/lib/intent";

export const PHOTOS = { climber, court, street, dusk, forest, hiker, host, lakes, mic, misty } satisfies Record<string, StaticImageData>;

export type MapItem = {
  id: string;
  name: string;
  kind: string;
  tier: "mainstream" | "niche";
  territory: Territory;
  affinity?: number;
  /** Lean for contested items: your share out of 100. */
  lean?: number;
  image?: StaticImageData;
};

export const CATEGORIES = [
  { id: "all", label: "All", count: 124 },
  { id: "podcasts", label: "Podcasts", count: 18 },
  { id: "films", label: "Films", count: 14 },
  { id: "tv", label: "TV", count: 12 },
  { id: "creators", label: "Creators", count: 20 },
  { id: "artists", label: "Artists", count: 16 },
  { id: "places", label: "Places", count: 15 },
  { id: "brands", label: "Brands", count: 20 },
] as const;

export const PODCASTS: MapItem[] = [
  { id: "p1", name: "10% Happier", kind: "Podcast", tier: "mainstream", territory: "yours", affinity: 0.91, image: mic },
  { id: "p2", name: "The Peter Attia Drive", kind: "Podcast", tier: "mainstream", territory: "yours", affinity: 0.88 },
  { id: "p3", name: "On Being", kind: "Podcast", tier: "niche", territory: "yours", affinity: 0.83 },
  { id: "p4", name: "The Great Outdoors", kind: "Podcast", tier: "niche", territory: "yours", affinity: 0.79 },
  { id: "p5", name: "Finding Mastery", kind: "Podcast", tier: "mainstream", territory: "yours", affinity: 0.77 },
  { id: "c1", name: "Rich Roll Podcast", kind: "Podcast", tier: "mainstream", territory: "contested", lean: 54, image: host },
  { id: "c2", name: "The Tim Ferriss Show", kind: "Podcast", tier: "mainstream", territory: "contested", lean: 51 },
  { id: "c3", name: "Huberman Lab", kind: "Podcast", tier: "mainstream", territory: "contested", lean: 47 },
  { id: "c4", name: "Outside Podcast", kind: "Podcast", tier: "niche", territory: "contested", lean: 58 },
  { id: "t1", name: "Jocko Podcast", kind: "Podcast", tier: "mainstream", territory: "theirs", affinity: 0.89 },
  { id: "t2", name: "The Mark Divine Show", kind: "Podcast", tier: "niche", territory: "theirs", affinity: 0.84 },
  { id: "t3", name: "The Art of Manliness", kind: "Podcast", tier: "mainstream", territory: "theirs", affinity: 0.8 },
  { id: "t4", name: "SOFREP Radio", kind: "Podcast", tier: "niche", territory: "theirs", affinity: 0.74 },
];

export const FILMS: MapItem[] = [
  { id: "f1", name: "A Life on Our Planet", kind: "Film", tier: "mainstream", territory: "yours", affinity: 0.9, image: forest },
  { id: "f2", name: "The Dawn Wall", kind: "Film", tier: "niche", territory: "yours", affinity: 0.86 },
  { id: "f3", name: "Kiss the Ground", kind: "Film", tier: "niche", territory: "yours", affinity: 0.81 },
  { id: "f4", name: "Free Solo", kind: "Film", tier: "mainstream", territory: "contested", lean: 55, image: climber },
  { id: "f5", name: "14 Peaks", kind: "Film", tier: "mainstream", territory: "contested", lean: 44 },
  { id: "f6", name: "Running Wild", kind: "TV", tier: "mainstream", territory: "theirs", affinity: 0.87 },
  { id: "f7", name: "Man vs. Wild", kind: "TV", tier: "mainstream", territory: "theirs", affinity: 0.85 },
];

/** Who-and-where for views not connected to a map yet (the agency's client pages). Same shape as the live API. */
export function sampleAudience(brand: string, rivals: string[]): AudienceData {
  const rival = rivals[0] ?? "Your rival";
  const cell = (value: number | null, lowConfidence = false) => ({ value, masked: value === null, lowConfidence });
  const rows: [string, string, (number | null)[], boolean[]?][] = [
    ["age:24_and_younger", "Under 25", [0.58, 0.71]],
    ["age:25_to_29", "25–29", [0.74, 0.77]],
    ["age:30_to_34", "30–34", [0.81, 0.73]],
    ["age:35_to_44", "35–44", [0.79, 0.62]],
    ["age:45_to_54", "45–54", [0.72, null]],
    ["age:55_and_older", "55 and over", [0.84, 0.61], [false, true]],
    ["gender:female", "Women", [0.69, 0.55]],
    ["gender:male", "Men", [0.66, 0.74]],
  ];
  return {
    id: "sample",
    market: "US",
    builtAt: null,
    queryCount: 32,
    hasAudience: true,
    sides: [
      { key: "you", name: brand, readThrough: false },
      { key: "rival", name: rival, readThrough: false },
    ],
    segments: rows.map(([key, label, [you, them], low]) => ({ key, label, cells: { you: cell(you ?? null, low?.[0]), rival: cell(them ?? null, low?.[1]) } })),
    places: sampleCities(rival).map((c) => ({ id: c.id, name: c.name, detail: c.region, lat: c.lat, lon: c.lng, label: c.territory === "yours" ? "YOURS" : c.territory === "contested" ? "CONTESTED" : "THEIRS", rival: c.rival, ranks: c.ranks })),
  };
}

export const PLAYS = [
  {
    id: "creators",
    kind: "Creator",
    icon: "user",
    title: "Partner with a mid-size climbing creator",
    body: (rival: string) => `The climbing world is shared with ${rival} but leans your way. Mid-size creators cost less and land closer.`,
    evidence: "lean 58/42",
    action: "See 6 creators",
  },
  {
    id: "podcast",
    kind: "Podcast",
    icon: "mic",
    title: "Sponsor a host-read on Finding Mastery",
    body: () => "Only your side of the map has it, and it holds in the UK cut.",
    evidence: "UK rank 3",
    action: "Draft the read",
  },
  {
    id: "brief",
    kind: "Brief",
    icon: "file",
    title: "Shoot the autumn film in the Lake District",
    body: (rival: string) => `Your strongest UK destination; ${rival} ranks it ninth.`,
    evidence: "destinations",
    action: "Open brief",
  },
] as const;

export const CREATORS = [
  { initials: "NG", name: "Northern Grit", platform: "YouTube · bouldering", tier: "Mid", territory: "contested", fit: 0.82, reaches: "Sheffield, Manchester" },
  { initials: "SR", name: "Sasha on Rock", platform: "Instagram · trad climbing", tier: "Niche", territory: "yours", fit: 0.79, reaches: "London, Bristol" },
  { initials: "PH", name: "Peak Hour Films", platform: "YouTube · short films", tier: "Mid", territory: "yours", fit: 0.77, reaches: "London" },
  { initials: "WM", name: "Wild Margins", platform: "Instagram · wild camping", tier: "Niche", territory: "yours", fit: 0.74, reaches: "Edinburgh, Lake District" },
  { initials: "BB", name: "Boulder & Brew", platform: "TikTok · climbing gyms", tier: "Mid", territory: "contested", fit: 0.71, reaches: "London, Leeds" },
  { initials: "UE", name: "Ultra Endure", platform: "YouTube · ultra running", tier: "Mid", territory: "theirs", fit: 0.69, reaches: "Chamonix" },
] as const;

export const AD_TRACKS = [
  { lane: "Setting", spans: [{ from: 0, to: 12, label: "Foggy ridge", territory: "theirs" }, { from: 12.4, to: 30, label: "Summit cairn", territory: "contested" }] },
  { lane: "Styling", spans: [{ from: 0, to: 30, label: "Tactical shell, gaiters", territory: "theirs" }] },
  { lane: "Script", spans: [{ from: 2, to: 10, label: "“Push past your limits”", territory: "theirs" }, { from: 15, to: 23, label: "“Find your quiet”", territory: "yours" }] },
  { lane: "On-screen", spans: [{ from: 25, to: 30, label: "BUILT FOR THE WORST", territory: "theirs" }] },
  { lane: "Sound", spans: [{ from: 0, to: 30, label: "Low brass, drums · no commercial track", territory: "theirs" }] },
] as const;

export const AD_PULLS = [
  { title: "Tactical shell, gaiters", meta: "Styling · Matches survival TV", weight: "High" },
  { title: "“Push past your limits”", meta: "Script · Endurance language", weight: "Medium" },
  { title: "“Built for the worst”", meta: "On-screen · Toughness claim", weight: "Medium" },
];

export const AD_FIXES = [
  { area: "Styling", fix: "Trail-worn layers; the tone of Free Solo, not survival TV" },
  { area: "Script", fix: "Swap the endurance line for one about feeling better outside" },
  { area: "On-screen", fix: "Drop the toughness claim; end on the place" },
];

export const INBOX = [
  { icon: "check", title: "Map ready", client: 0, meta: (rival: string) => `vs ${rival} · 8 categories from 231 queries`, time: "12 min", action: "Open" },
  { icon: "flag", title: "Critic flagged 2 claims", client: 1, meta: () => "Brief “Gen Z, New York City” · one uncited, one sensitive audience", time: "1 h", action: "Review" },
  { icon: "scan", title: "Rival scan finished", client: 0, meta: (rival: string) => `14 of ${possessive(rival)} last 20 ads land in their own ground; 3 drift into yours`, time: "3 h", action: "See scan" },
  { icon: "clock", title: "Map ageing", client: 1, meta: () => "Built 34 days ago", time: "1 d", action: "Rebuild" },
] as const;

export const BRIEF = {
  title: "Trail, not survival",
  subtitle: (brand: string) => `A brief for ${possessive(brand)} 25–34 audience in New York City and Los Angeles.`,
  angle: (brand: string, rival: string) =>
    `Show the outdoors as somewhere you go to feel better, not somewhere you go to prove something. That is ground ${brand} already owns: long-form wellbeing podcasts and conservation films, while survival TV and tactical styling belong to ${rival}.`,
  carriers: [
    { kind: "Creator", title: "A climber from the shared climbing world", note: "Contested ground that leans yours", evidence: "lean 54/46" },
    { kind: "Podcast", title: "Host-read on 10% Happier", note: "Only you have it; mainstream reach", evidence: "0.91" },
    { kind: "Setting", title: "Moab at first light", note: "Where the brand over-indexes", evidence: "heatmap" },
    { kind: "Sound", title: "Warm acoustic folk, mid-tempo, no vocals", note: "From artist taste; fill from a commercial music library", evidence: "genre tags" },
  ],
};
