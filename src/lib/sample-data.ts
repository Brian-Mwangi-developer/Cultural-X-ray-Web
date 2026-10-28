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
import { possessive } from "@/lib/intent";

export const PHOTOS = { climber, court, street, dusk, forest, hiker, host, lakes, mic, misty } satisfies Record<string, StaticImageData>;

export const INBOX = [
  { icon: "check", title: "Map ready", client: 0, meta: (rival: string) => `vs ${rival} · 8 categories from 231 queries`, time: "12 min", action: "Open" },
  { icon: "flag", title: "Critic flagged 2 claims", client: 1, meta: () => "Brief “Gen Z, New York City” · one uncited, one sensitive audience", time: "1 h", action: "Review" },
  { icon: "scan", title: "Rival scan finished", client: 0, meta: (rival: string) => `14 of ${possessive(rival)} last 20 ads land in their own ground; 3 drift into yours`, time: "3 h", action: "See scan" },
  { icon: "clock", title: "Map ageing", client: 1, meta: () => "Built 34 days ago", time: "1 d", action: "Rebuild" },
] as const;
