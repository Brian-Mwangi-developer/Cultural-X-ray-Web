"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleHelpIcon, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import { BrandMark } from "@/components/app/parts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { compare, type ComparePick, type CompareSet, MAX_RIVALS, MAX_SEEDS } from "@/lib/compare";
import { AppError } from "@/lib/errors";
import { type Card, lookup } from "@/lib/lookup";
import { cn } from "@/lib/utils";
import { SEARCH_MIN_CHARS, useDebounced } from "@/hooks/use-debounced";

type Role = "rivals" | "seeds";

/**
 * Figma 13 · K2: who the brand is compared with. One dialog, two roles: rivals (who to win customers
 * from) and read-through brands (whose customers stand in for yours while Qloo doesn't know you, or
 * fill out thin data when it does). Search is Qloo's brand search; saving rebuilds the map.
 */
export function CompareDialog({ orgId, base, open, onOpenChange, removing }: { orgId: string; base: string; open: boolean; onOpenChange: (o: boolean) => void; /** Opened from a row's Remove: that brand starts taken out, so saving is one click. */ removing?: string | null }) {
  const router = useRouter();
  const [set, setSet] = useState<CompareSet | null>(null);
  const [rivals, setRivals] = useState<ComparePick[]>([]);
  const [seeds, setSeeds] = useState<ComparePick[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // The current set, each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    let live = true;
    compare
      .get(orgId)
      .then((s) => {
        if (!live) return;
        setSet(s);
        setRivals(s.rivals.filter((p) => p.name !== removing));
        setSeeds(s.seeds.filter((p) => p.name !== removing));
      })
      .catch(() => toast("We couldn’t load who you compare with. Try again."));
    return () => {
      live = false;
    };
  }, [open, orgId, removing]);

  // Qloo's brand search, once typing pauses; a newer search cancels the last.
  const settled = useDebounced(query.trim());
  useEffect(() => {
    if (settled.length < SEARCH_MIN_CHARS) return;
    const ctrl = new AbortController();
    void (async () => {
      setSearching(true);
      try {
        const found = await lookup.brands(settled, ctrl.signal);
        setResults(found.filter((c) => c.kind === "brand").slice(0, 6));
      } catch {
        /* cancelled or failed: the last results stay */
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    })();
    return () => ctrl.abort();
  }, [settled]);

  const chosen = new Set([...rivals, ...seeds].map((p) => p.id));
  const add = (card: Card, role: Role) => {
    const pick: ComparePick = { id: card.id, name: card.name, kind: card.kind, categories: card.categories.slice(0, 5), detail: card.description?.slice(0, 200) };
    (role === "rivals" ? setRivals : setSeeds)((xs) => [...xs, pick]);
    setQuery("");
    setResults([]);
  };
  const remove = (id: string) => {
    setRivals((xs) => xs.filter((p) => p.id !== id));
    setSeeds((xs) => xs.filter((p) => p.id !== id));
  };

  const same = (a: ComparePick[], b: ComparePick[]) => a.length === b.length && a.every((p) => b.some((q) => q.id === p.id));
  const changed = Boolean(set && (!same(rivals, set.rivals) || !same(seeds, set.seeds)));
  const needsSeed = Boolean(set && !set.known && !seeds.length);
  const added = [...rivals, ...seeds].filter((p) => set && ![...set.rivals, ...set.seeds].some((q) => q.id === p.id)).map((p) => p.name);

  async function save() {
    setSaving(true);
    try {
      await compare.save(orgId, { rivals, seeds });
      toast(`Rebuilding the map${added.length ? ` with ${added.join(" and ")}` : ""}.`, { description: "Plays are rewritten, and ad checks and Ask X-Ray use the new set once it’s ready." });
      onOpenChange(false);
      router.push(base as never);
      router.refresh();
    } catch (error) {
      toast(error instanceof AppError ? error.message : "We couldn’t save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const brand = set?.brand ?? "your brand";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Who {brand} is compared with</DialogTitle>
          <DialogDescription>{removing ? `${removing} is taken out below. Save to rebuild the map without it, or add it back by searching.` : "Search Qloo for a brand, then add it as a rival or as a brand to read through."}</DialogDescription>
        </DialogHeader>

        {!set ? (
          <p className="flex items-center gap-2 py-10 text-[14px] text-muted-foreground">
            <Spinner />
            Loading…
          </p>
        ) : (
          <div className="space-y-6">
            <div className={cn("overflow-hidden rounded-[12px] border", query && "border-ember/70")}>
              <label className="flex items-center gap-2.5 px-3">
                <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brands, e.g. Franco Manca" className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent" aria-label="Search brands" />
                {searching && <Spinner className="size-4" />}
              </label>
              {query.trim().length >= 2 && results.length > 0 && (
                <ul className="border-t p-1.5">
                  {results.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-[9px] px-2.5 py-2 hover:bg-muted/60">
                      <BrandMark name={c.name} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">{c.name}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">{[c.categories.slice(0, 2).join(" · "), c.markets.join(" · ")].filter(Boolean).join(" · ")}</span>
                      </span>
                      {chosen.has(c.id) ? (
                        <span className="text-[12px] text-muted-foreground">Added</span>
                      ) : (
                        <span className="flex shrink-0 gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-[12px]" disabled={seeds.length >= MAX_SEEDS} onClick={() => add(c, "seeds")}>
                            Read through
                          </Button>
                          <Button size="sm" className="h-7 rounded-full px-2.5 text-[12px]" disabled={rivals.length >= MAX_RIVALS} onClick={() => add(c, "rivals")}>
                            Rival
                          </Button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && !searching && results.length === 0 && <p className="border-t px-3 py-3 text-[13px] text-muted-foreground">Qloo has no brand by that name. Try its full name.</p>}
            </div>

            <Section
              title="Rivals"
              count={`${rivals.length} of ${MAX_RIVALS}`}
              help="The map shows what only you have, what you share with each rival, and what’s theirs. Ad checks say when an ad leans their way."
              sub="The brands you want to win customers from."
              picks={rivals}
              initial={set.rivals}
              onRemove={remove}
            />
            <Section
              title="Read through"
              count={`${seeds.length} of ${MAX_SEEDS}`}
              help={set.known ? "Qloo knows your brand, so the map reads your own customers; these fill out thin data." : "Qloo doesn’t know your brand yet, so the map reads these brands’ customers instead, as a stand-in for yours."}
              sub={set.known ? "Brands your customers also buy; they fill out what Qloo knows about them." : `Brands like ${brand} whose customers stand in for yours while Qloo doesn’t know ${brand} yet. Pick brands your customers would also buy.`}
              picks={seeds}
              initial={set.seeds}
              onRemove={remove}
            />
            {needsSeed && <p className="text-[13px] text-destructive">Keep at least one brand to read through: without one there’s no culture to read.</p>}

            <p className="flex items-start gap-2.5 rounded-[12px] border border-ember/50 bg-ember-soft px-3.5 py-3 text-[13px] leading-relaxed">
              <RefreshCwIcon className="mt-0.5 size-4 shrink-0 text-ember-ink" aria-hidden />
              Saving rebuilds the Culture Map: about {(rivals.length + 1) * 8} Qloo queries, counted on your meter. Plays are rewritten; ad checks and Ask X-Ray use the new set once it’s ready.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="pill" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="pill" onClick={save} disabled={!changed || needsSeed || saving}>
            {saving ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
            Save and rebuild
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, count, help, sub, picks, initial, onRemove }: { title: string; count: string; help: string; sub: string; picks: ComparePick[]; initial: ComparePick[]; onRemove: (id: string) => void }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <h3 className="text-[14.5px] font-semibold">{title}</h3>
        <Tooltip>
          <TooltipTrigger render={<button type="button" aria-label={`About ${title.toLowerCase()}`} className="rounded-full p-0.5 text-muted-foreground hover:text-foreground" />}>
            <CircleHelpIcon className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-left leading-relaxed">{help}</TooltipContent>
        </Tooltip>
        <span className="ml-auto text-[12.5px] text-muted-foreground tabular-nums">{count}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{sub}</p>
      <div className="flex flex-wrap gap-2">
        {picks.map((p) => {
          const isNew = !initial.some((q) => q.id === p.id);
          return (
            <span key={p.id} className={cn("inline-flex h-8 items-center gap-2 rounded-full border pr-1 pl-2", isNew ? "border-ember bg-ember-soft" : "bg-card")}>
              <BrandMark name={p.name} size="xs" />
              <span className={cn("text-[13px] font-medium", isNew && "text-ember-ink")}>{p.name}</span>
              {isNew && <span className="text-[11px] text-ember-ink">new</span>}
              <button type="button" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.name}`} className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                <XIcon className="size-3.5" />
              </button>
            </span>
          );
        })}
        {!picks.length && <span className="text-[13px] text-muted-foreground">None yet.</span>}
      </div>
    </section>
  );
}
