/** What a brand told us at onboarding: stored as JSON in the organization's metadata. */
export type BrandIntent = { category?: string; city?: string; seeds?: string[]; rivals?: string[]; setUpBy?: string };

export function readIntent(metadata: string | null | undefined): BrandIntent {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as BrandIntent;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export const marketName = (code: string | undefined) => (code === "GB" ? "UK" : "US");

/** "Dunkin'" → "Dunkin's", "Patagonia" → "Patagonia's", "Adidas" → "Adidas'". */
export function possessive(name: string) {
  const trimmed = name.trim();
  if (/['’]$/.test(trimmed)) return `${trimmed}s`;
  if (/s$/i.test(trimmed)) return `${trimmed}’`;
  return `${trimmed}’s`;
}
