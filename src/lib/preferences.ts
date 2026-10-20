"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import type { Preferences } from "@/lib/session";

export const THEME_TO_NEXT = { LIGHT: "light", DARK: "dark", SYSTEM: "system" } as const;
export const NEXT_TO_THEME = { light: "LIGHT", dark: "DARK", system: "SYSTEM" } as const;

export function savePreferences(patch: Partial<Preferences>) {
  return api<{ preferences: Preferences }>("/me/preferences", { method: "PUT", body: patch });
}

/**
 * Applies the profile's saved appearance once per page load: theme (so it follows you
 * across devices), density and reduced motion as attributes on <html>.
 */
export function PreferencesSync({ preferences }: { preferences: Preferences }) {
  const { theme, setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || theme === undefined) return;
    applied.current = true;
    const wanted = THEME_TO_NEXT[preferences.theme];
    if (theme !== wanted) setTheme(wanted);
  }, [theme, setTheme, preferences.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = preferences.density.toLowerCase();
    if (preferences.reduceMotion) root.dataset.reduceMotion = "";
    else delete root.dataset.reduceMotion;
    root.dataset.evidence = preferences.showEvidenceInline ? "inline" : "hidden";
  }, [preferences.density, preferences.reduceMotion, preferences.showEvidenceInline]);

  return null;
}
