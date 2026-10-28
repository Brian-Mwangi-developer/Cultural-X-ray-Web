import { possessive } from "@/lib/intent";

/**
 * Whose customers a map describes (backend maps/map.basis.ts). When Qloo knows the brand they are its
 * own customers. When it doesn't (a new or small brand), the map is read through the customers of the
 * brands chosen as like it, and every page says so: they are a stand-in, not the brand's customers.
 * Saying "your customers" for a brand nobody has heard of reads as made up.
 */
export type Basis = { known: boolean; through: string[] };

const names = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export const basisFrom = (subjects: { role: string; name: string }[]): Basis => ({
  known: subjects.some((s) => s.role === "SELF"),
  through: subjects.filter((s) => s.role === "SEED").map((s) => s.name),
});

/** True when the map stands in for customers the brand doesn't have on record yet. */
export const lookalike = (b: Basis | null | undefined): b is Basis => Boolean(b && !b.known && b.through.length);

export type Words = {
  /** "your customers", "Jude’s Ice Cream’s customers", or "McDonald’s, KFC and Burger King customers". */
  who: string;
  /** The column of what only this side has: "Yours", "Only Jude’s Ice Cream’s", or "Open to you". */
  ownColumn: string;
  /** Under a rank on that side: "for you", "for Jude’s Ice Cream", or "for brands like yours". */
  rankFor: string;
  /** A chip for a source on that side: "Only yours", or "Open to you". */
  ownChip: string;
};

export function wordsFor(b: Basis | null | undefined, brand: string, viaAgency: boolean): Words {
  if (lookalike(b)) return { who: `${names(b.through)} customers`, ownColumn: "Open to you", rankFor: "for brands like yours", ownChip: "Open to you" };
  if (viaAgency) return { who: `${possessive(brand)} customers`, ownColumn: `Only ${possessive(brand)}`, rankFor: `for ${brand}`, ownChip: `Only ${possessive(brand)}` };
  return { who: "your customers", ownColumn: "Yours", rankFor: "for you", ownChip: "Only yours" };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Text the backend wrote for the brand ("your customers", "leans your way") said for who is reading
 * and what the map rests on. Used on stored readings, plays and their sources.
 */
export function inWords(text: string, b: Basis | null | undefined, brand: string, viaAgency: boolean) {
  const look = lookalike(b);
  if (!look && !viaAgency) return text;
  const { who } = wordsFor(b, brand, viaAgency);
  const whose = `${who}’`;
  return text
    .replace(/\bYour customers’/g, cap(whose))
    .replace(/\byour customers’/gi, whose)
    .replace(/\bYour customers\b/g, cap(who))
    .replace(/\byour customers\b/gi, who)
    .replace(/\bthan yours\b/gi, look ? "than theirs" : `than ${possessive(brand)}`)
    .replace(/\byour way\b/gi, look ? "toward brands like yours" : `${possessive(brand)} way`)
    .replace(/\bonly yours\b/gi, look ? "open to you" : `only ${possessive(brand)}`);
}
