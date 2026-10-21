import { api } from "@/lib/api";
import type { Pick } from "@/lib/intent";

/** A brand or place as the backend's /lookup returns it. */
export type Card = {
  id: string;
  kind: "brand" | "place";
  name: string;
  categories: string[];
  markets: string[];
  description?: string;
  image?: string;
  address?: string;
  rating?: number;
  priceLevel?: number;
  location?: { lat: number; lon: number };
};
export type Suggestion = { name: string; status: "ok" | "other_market" | "not_found"; card?: Card };
export type Category = { id: string | null; name: string };
export type Locality = { id: string; name: string; detail: string; location?: { lat: number; lon: number } };
export type SiteRead = { name: string; sells: string; productTypes: string[]; basedIn: string | null; sellsOnline: boolean | null; hasShops: boolean | null };
export type Market = "GB" | "US";

const q = (params: Record<string, string | number | undefined>) =>
  "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));

export const lookup = {
  brands: (query: string, signal?: AbortSignal) => api<{ results: Card[] }>(`/lookup/brands${q({ q: query })}`, { signal }).then((r) => r.results),
  places: (query: string, near: { lat: number; lon: number }, signal?: AbortSignal) =>
    api<{ results: Card[] }>(`/lookup/places${q({ q: query, lat: near.lat, lon: near.lon })}`, { signal }).then((r) => r.results),
  localities: (query: string, market: Market, signal?: AbortSignal) =>
    api<{ results: Locality[] }>(`/lookup/localities${q({ q: query, market })}`, { signal }).then((r) => r.results),
  suggestions: (id: string, kind: "brand" | "place", market: Market) =>
    api<{ categories: Category[]; rivals: Suggestion[]; seeds: Suggestion[] }>(`/lookup/entities/${id}/suggestions${q({ kind, market })}`),
  categories: (words: string) => api<{ results: Category[] }>(`/lookup/categories${q({ q: words })}`).then((r) => r.results),
  categoryBrands: (tag: string, market: Market) => api<{ scope: "market" | "any"; brands: Suggestion[] }>(`/lookup/category-brands${q({ tag, market })}`),
  startSite: (url: string) => api<{ jobId: string; status: "pending" | "done" | "failed"; result?: SiteRead; message?: string }>(`/lookup/site`, { method: "POST", body: { url } }),
  site: (jobId: string) => api<{ status: "pending" | "done" | "failed"; result?: SiteRead; message?: string }>(`/lookup/site/${jobId}`),
};

/** Paste detection: "pebbleandcone.co.uk", "https://x.com/shop". */
export const looksLikeUrl = (s: string) => /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(s.trim()) && !/\s/.test(s.trim());

/** Wait for a website read to finish. */
export async function readWebsite(url: string, onTick?: () => void): Promise<SiteRead> {
  const started = await lookup.startSite(url);
  if (started.status === "done" && started.result) return started.result;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    onTick?.();
    const s = await lookup.site(started.jobId);
    if (s.status === "done" && s.result) return s.result;
    if (s.status === "failed") throw new Error(s.message ?? "We couldn't open that website.");
  }
  throw new Error("Reading that website is taking too long. Search for your brand by name instead.");
}

export const toPick = (c: Card): Pick => ({ id: c.id, name: c.name, kind: c.kind, categories: c.categories, detail: c.kind === "place" ? c.address : c.markets.join(", ") });
export const newPick = (name: string): Pick => ({ name: name.trim(), kind: "new" });

/** "UK, US +2" */
export const marketsLabel = (m: string[]) => (m.length > 2 ? `${m.slice(0, 2).join(", ")} +${m.length - 2}` : m.join(", "));
