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

export const INBOX = [
  { icon: "check", title: "Map ready", client: 0, meta: (rival: string) => `vs ${rival} · 8 categories from 231 queries`, time: "12 min", action: "Open" },
  { icon: "flag", title: "Critic flagged 2 claims", client: 1, meta: () => "Brief “Gen Z, New York City” · one uncited, one sensitive audience", time: "1 h", action: "Review" },
  { icon: "scan", title: "Rival scan finished", client: 0, meta: (rival: string) => `14 of ${possessive(rival)} last 20 ads land in their own ground; 3 drift into yours`, time: "3 h", action: "See scan" },
  { icon: "clock", title: "Map ageing", client: 1, meta: () => "Built 34 days ago", time: "1 d", action: "Rebuild" },
] as const;
