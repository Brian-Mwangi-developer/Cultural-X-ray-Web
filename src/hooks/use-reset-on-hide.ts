import { useLayoutEffect, useRef } from "react";

/**
 * With Cache Components, Next keeps visited routes alive inside <Activity>.
 * Run `reset` when the route is hidden so transient state (pending spinners,
 * typed passwords) doesn't come back on the next visit.
 */
export function useResetOnHide(reset: () => void) {
  const ref = useRef(reset);
  useLayoutEffect(() => {
    ref.current = reset;
  });
  useLayoutEffect(() => () => ref.current(), []);
}
