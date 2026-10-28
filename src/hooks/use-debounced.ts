import { useEffect, useState } from "react";

/** How long typing has to pause before a search goes out. */
export const SEARCH_PAUSE_MS = 500;
/** Searches start at this many characters; one letter matches everything and helps no one. */
export const SEARCH_MIN_CHARS = 2;

/**
 * The value once it has stopped changing for `ms`. Live searches read this instead of the raw input,
 * so typing "Harrogate" sends one search, not nine: each one to Qloo can take seconds and counts.
 */
export function useDebounced<T>(value: T, ms = SEARCH_PAUSE_MS): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}
