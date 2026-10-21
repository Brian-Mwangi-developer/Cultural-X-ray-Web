/**
 * What onboarding found about a brand, stored as JSON in the organization's metadata (version 2).
 * Brands and places carry their Qloo id; "new" ones were added by name because Qloo doesn't know them.
 */
export type PickKind = "brand" | "place" | "new";
export type Pick = { id?: string; name: string; kind: PickKind; categories?: string[]; detail?: string };

export type BrandIntent = {
  version?: 2;
  brand?: Pick & { website?: string; sells?: string; basedIn?: string; location?: { lat: number; lon: number }; locality?: { id: string; name: string; detail?: string } };
  category?: { id?: string | null; name: string } | null;
  seeds?: Pick[];
  rivals?: Pick[];
  city?: string;
  setUpBy?: string;
};

export function readIntent(metadata: string | null | undefined): BrandIntent {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as BrandIntent;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export const seedNames = (intent: BrandIntent) => (intent.seeds ?? []).map((p) => p.name);
export const rivalNames = (intent: BrandIntent) => (intent.rivals ?? []).map((p) => p.name);

export const marketName = (code: string | undefined) => (code === "GB" ? "UK" : "US");

/** "Dunkin'" → "Dunkin's", "Patagonia" → "Patagonia's", "Adidas" → "Adidas'". */
export function possessive(name: string) {
  const trimmed = name.trim();
  if (/['’]$/.test(trimmed)) return `${trimmed}s`;
  if (/s$/i.test(trimmed)) return `${trimmed}’`;
  return `${trimmed}’s`;
}
