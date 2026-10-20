"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Segmented, SelectField } from "@/components/forms/fields";
import { Switch } from "@/components/ui/switch";
import { attempt } from "@/lib/feedback";
import { NEXT_TO_THEME, savePreferences } from "@/lib/preferences";
import type { Preferences } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SettingRow, SettingsSection } from "./parts";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match system" },
] as const;

/** Applies a preference to the page straight away, before the server answers. */
function applyLocally(patch: Partial<Preferences>) {
  const root = document.documentElement;
  if (patch.density) root.dataset.density = patch.density.toLowerCase();
  if (patch.reduceMotion !== undefined) {
    if (patch.reduceMotion) root.dataset.reduceMotion = "";
    else delete root.dataset.reduceMotion;
  }
  if (patch.showEvidenceInline !== undefined) root.dataset.evidence = patch.showEvidenceInline ? "inline" : "hidden";
}

export function AppearanceForm({ preferences }: { preferences: Preferences }) {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(preferences);

  async function update(patch: Partial<Preferences>) {
    const previous = prefs;
    setPrefs((p) => ({ ...p, ...patch }));
    applyLocally(patch);
    const result = await attempt(() => savePreferences(patch), { where: "settings.appearance" });
    if (result.ok) toast.success("Saved to your profile", { id: "appearance-saved" });
    else {
      setPrefs(previous);
      applyLocally(previous);
    }
  }

  function chooseTheme(value: (typeof THEMES)[number]["value"]) {
    setTheme(value);
    void update({ theme: NEXT_TO_THEME[value] });
  }

  const sample = new Intl.DateTimeFormat(prefs.region === "GB" ? "en-GB" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(2026, 9, 20));
  const number = new Intl.NumberFormat(prefs.region === "GB" ? "en-GB" : "en-US").format(1234.5);

  return (
    <>
      <SettingsSection title="Theme">
        <div role="radiogroup" aria-label="Theme" className="grid gap-4 sm:grid-cols-3">
          {THEMES.map((t) => {
            const selected = (theme ?? "system") === t.value;
            return (
              <button key={t.value} type="button" role="radio" aria-checked={selected} onClick={() => chooseTheme(t.value)} className="group text-left outline-none">
                <span
                  className={cn(
                    "block rounded-[16px] border-2 p-2.5 transition-colors group-focus-visible:ring-3 group-focus-visible:ring-ring/40",
                    selected ? "border-ember" : "border-border hover:border-foreground/25",
                  )}
                >
                  <ThemePreview kind={t.value} />
                </span>
                <span className="mt-3 flex items-center gap-2.5 text-[14.5px]">
                  <span aria-hidden className={cn("flex size-[18px] items-center justify-center rounded-full border-[1.5px]", selected ? "border-ember" : "border-faint")}>
                    {selected && <span className="size-2.5 rounded-full bg-ember" />}
                  </span>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Layout">
        <div className="border-t">
          <SettingRow label="Density" description="Compact fits more rows on territory and client lists.">
            <Segmented
              label="Density"
              value={prefs.density}
              onChange={(density) => update({ density })}
              options={[
                { value: "COMFORTABLE", label: "Comfortable" },
                { value: "COMPACT", label: "Compact" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Reduce motion" description="Turns off streaming animations and carousel movement." htmlFor="reduce-motion">
            <Switch id="reduce-motion" checked={prefs.reduceMotion} onCheckedChange={(reduceMotion) => update({ reduceMotion })} />
          </SettingRow>
          <SettingRow label="Show evidence chips inline" description="Off hides sources until you open a row. Briefs always keep them." htmlFor="evidence">
            <Switch id="evidence" checked={prefs.showEvidenceInline} onCheckedChange={(showEvidenceInline) => update({ showEvidenceInline })} />
          </SettingRow>
        </div>
      </SettingsSection>

      <SettingsSection title="Language and region">
        <div className="border-t">
          <SettingRow label="Language" description="More languages soon.">
            <SelectField
              value={prefs.locale}
              onChange={(locale) => update({ locale })}
              options={[
                { value: "en-US", label: "English (US)" },
                { value: "en-GB", label: "English (UK)" },
              ]}
              size="sm"
              className="w-44"
            />
          </SettingRow>
          <SettingRow label="Dates and numbers" description={`${sample} · ${number}`}>
            <SelectField
              value={prefs.region}
              onChange={(region) => update({ region })}
              options={[
                { value: "US", label: "United States" },
                { value: "GB", label: "United Kingdom" },
              ]}
              size="sm"
              className="w-44"
            />
          </SettingRow>
          <SettingRow label="Default market for new maps">
            <SelectField
              value={prefs.defaultMarket}
              onChange={(defaultMarket) => update({ defaultMarket })}
              options={[
                { value: "US", label: "United States" },
                { value: "GB", label: "United Kingdom" },
              ]}
              size="sm"
              className="w-44"
            />
          </SettingRow>
        </div>
      </SettingsSection>
    </>
  );
}

/** A miniature of the app in each theme, drawn with the real palette rather than a screenshot. */
function ThemePreview({ kind }: { kind: "light" | "dark" | "system" }) {
  const pane = (dark: boolean, className?: string) => (
    <span className={cn("flex h-full", dark ? "bg-[#0b0b0c]" : "bg-white", className)}>
      <span className={cn("flex w-[30%] flex-col gap-1.5 border-r p-2", dark ? "border-[#27272a] bg-[#111113]" : "border-[#e4e4e7] bg-[#fafafa]")}>
        <span className="size-2.5 rounded-[3px] bg-[#ff6719]" />
        <span className={cn("mt-1 h-1 w-4/5 rounded-full", dark ? "bg-[#27272a]" : "bg-[#e4e4e7]")} />
        <span className={cn("h-1 w-3/5 rounded-full", dark ? "bg-[#27272a]" : "bg-[#e4e4e7]")} />
        <span className={cn("h-1 w-2/3 rounded-full", dark ? "bg-[#27272a]" : "bg-[#e4e4e7]")} />
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-2.5">
        <span className={cn("h-1.5 w-3/4 rounded-full", dark ? "bg-[#3f3f46]" : "bg-[#e4e4e7]")} />
        <span className={cn("h-1 w-1/2 rounded-full", dark ? "bg-[#27272a]" : "bg-[#f1f1f3]")} />
        <span className="mt-1 h-3 w-10 rounded-full bg-[#ff6719]" />
      </span>
    </span>
  );
  return (
    <span aria-hidden className="block aspect-[16/10] overflow-hidden rounded-[10px] border border-[#e4e4e7]">
      {kind === "light" && pane(false)}
      {kind === "dark" && pane(true)}
      {kind === "system" && (
        <span className="grid h-full grid-cols-2">
          {pane(false, "overflow-hidden")}
          {pane(true, "overflow-hidden")}
        </span>
      )}
    </span>
  );
}
