import { api } from "@/lib/api";

/**
 * Who a brand's Culture Map compares with (Figma 13 · K1–K3): rivals, the brands to win customers
 * from, and read-through brands, whose customers stand in for a brand Qloo doesn't know yet (or fill
 * out a known brand's thin data). Saving rebuilds the map; plays, ad checks and Ask X-Ray read the
 * new set from it.
 */
export type ComparePick = { id: string; name: string; kind: "brand" | "place"; categories?: string[]; detail?: string };
export type CompareSet = { brand: string; known: boolean; market: string; category: string | null; rivals: ComparePick[]; seeds: ComparePick[] };

export const MAX_RIVALS = 3;
export const MAX_SEEDS = 3;

export const compare = {
  get: (orgId: string) => api<CompareSet>(`/orgs/${orgId}/compare`),
  save: (orgId: string, set: { rivals: ComparePick[]; seeds: ComparePick[] }) => api<{ map: { id: string; status: string } }>(`/orgs/${orgId}/compare`, { method: "PUT", body: set }),
};
