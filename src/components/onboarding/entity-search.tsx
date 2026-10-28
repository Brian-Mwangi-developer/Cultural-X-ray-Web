"use client";

import { SEARCH_MIN_CHARS, useDebounced } from "@/hooks/use-debounced";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, GlobeIcon, LinkIcon, MapPinIcon, PlusIcon, SearchIcon, StarIcon, XIcon } from "lucide-react";
import { BrandMark } from "@/components/app/parts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { userMessage } from "@/lib/errors";
import { type Card, lookup, looksLikeUrl, marketsLabel } from "@/lib/lookup";
import { cn } from "@/lib/utils";

export function CategoryTag({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return <span className={cn("inline-flex h-5 items-center rounded-md border px-1.5 text-[11.5px] whitespace-nowrap", on ? "border-ember bg-ember-soft text-foreground" : "bg-muted text-foreground/75")}>{children}</span>;
}

/** One line under a name: where a brand sells, or where a place is and how it's rated. */
export function CardMeta({ card }: { card: Card }) {
  if (card.kind === "place") {
    return (
      <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <MapPinIcon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="truncate">{card.address ?? "Address not listed"}</span>
        {card.rating ? (
          <span className="flex shrink-0 items-center gap-0.5">
            · <StarIcon className="size-3" strokeWidth={1.75} aria-hidden /> {card.rating.toFixed(1)}
          </span>
        ) : null}
      </span>
    );
  }
  return card.markets.length ? (
    <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
      <GlobeIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
      Sells in {marketsLabel(card.markets)}
    </span>
  ) : null;
}

type Props = {
  kind: "brand" | "place";
  /** Places are searched around a point (the town the owner picked). */
  near?: { lat: number; lon: number };
  label: string;
  placeholder: string;
  /** "a new brand", "a new competitor", "a new shop". Omit to not allow adding by name. */
  addNoun?: string;
  exclude?: string[];
  autoFocus?: boolean;
  onPick: (card: Card) => void;
  onAddNew?: (name: string) => void;
  /** Called instead of searching when the owner pastes a website. */
  onWebsite?: (url: string) => void;
};

/** Search Qloo as you type. Results show what each one is, so the right one is easy to pick. */
export function EntitySearch({ kind, near, label, placeholder, addNoun, exclude = [], autoFocus, onPick, onAddNew, onWebsite }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = query.trim();
  const isUrl = Boolean(onWebsite) && looksLikeUrl(trimmed);
  const shown = (results ?? []).filter((r) => !exclude.includes(r.id));

  // One search once typing pauses; a newer one cancels the last.
  const settled = useDebounced(trimmed);
  useEffect(() => {
    if (settled.length < SEARCH_MIN_CHARS || isUrl || (kind === "place" && !near)) return;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const found = kind === "place" && near ? await lookup.places(settled, near, controller.signal) : await lookup.brands(settled, controller.signal);
        setResults(found);
        setActive(0);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setError(userMessage(e));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [settled, isUrl, kind, near]);

  const reset = () => {
    setQuery("");
    setResults(null);
    setError(null);
  };
  const choose = (card: Card) => {
    onPick(card);
    reset();
  };
  const addNew = () => {
    if (!trimmed || !onAddNew) return;
    onAddNew(trimmed);
    reset();
  };

  const open = trimmed.length >= 2;
  const listId = `${id}-results`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border bg-card px-3.5 transition-colors focus-within:border-ember/70 focus-within:ring-3 focus-within:ring-ember/15">
        {isUrl ? <LinkIcon className="size-4.5 text-muted-foreground" strokeWidth={1.75} aria-hidden /> : <SearchIcon className="size-4.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${id}-opt-${active}` : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) setResults(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, Math.max(shown.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (isUrl) onWebsite?.(trimmed);
              else if (shown[active]) choose(shown[active]);
            } else if (e.key === "Escape") reset();
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
        />
        {loading && <Spinner className="size-4 text-muted-foreground" />}
        {query && (
          <button type="button" onClick={() => { reset(); inputRef.current?.focus(); }} className="rounded-md p-1 text-faint hover:text-foreground" aria-label="Clear">
            <XIcon className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {kind === "place" && !near && <p className="text-[12.5px] text-muted-foreground">Choose your town first, so we search the right place.</p>}

      {open && (
        <div className="rounded-[14px] border bg-card p-1.5">
          {isUrl ? (
            <div className="flex items-center justify-between gap-3 px-2.5 py-2">
              <p className="text-[13.5px] text-muted-foreground">Read <span className="font-medium text-foreground">{trimmed}</span> to find out what you sell.</p>
              <Button size="pill" onClick={() => onWebsite?.(trimmed)}>
                Read website
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          ) : (
            <>
              <p className="px-2.5 pt-1.5 pb-1 text-[12px] text-muted-foreground" aria-live="polite">
                {error ? error : loading && !results ? "Searching…" : shown.length ? `${shown.length} found in Qloo` : results ? "Not found" : "Searching…"}
              </p>
              <ul id={listId} role="listbox" aria-label={label}>
                {shown.map((card, i) => (
                  <li key={card.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(card)}
                      className={cn("flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left", i === active && "bg-ember-soft")}
                    >
                      <BrandMark name={card.name} logo={card.image} size="md" />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[14.5px] font-medium">{card.name}</span>
                          {card.categories.slice(0, 2).map((c) => (
                            <CategoryTag key={c}>{c}</CategoryTag>
                          ))}
                        </span>
                        {card.description && <span className="block truncate text-[12.5px] text-muted-foreground">{card.description}</span>}
                        <CardMeta card={card} />
                      </span>
                      {i === active && <ArrowRightIcon className="mt-1 size-4 shrink-0 text-ember-ink" strokeWidth={1.75} aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
              {onAddNew && (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t px-2.5 pt-2.5 pb-1.5">
                  <p className="text-[12.5px] text-muted-foreground">{shown.length ? "Not in the list?" : "New or not listed yet?"}</p>
                  <Button size="pill" onClick={addNew}>
                    <PlusIcon data-icon="inline-start" />
                    Add &ldquo;{trimmed}&rdquo; as {addNoun}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
