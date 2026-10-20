"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { MonitorIcon, MoonIcon, SearchIcon, SunIcon, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { attempt } from "@/lib/feedback";
import { NEXT_TO_THEME, savePreferences } from "@/lib/preferences";

export type CommandLink = { label: string; href: string; icon: LucideIcon; group: string; shortcut?: string };

const OpenContext = createContext<() => void>(() => {});
export const useOpenCommandMenu = () => useContext(OpenContext);

/** ⌘K anywhere in the app: jump to a page, a client, a setting, or switch theme. */
export function CommandMenu({ links, children }: { links: CommandLink[]; children: React.ReactNode }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        const ask = links.find((l) => l.shortcut === "⌘J");
        if (ask) {
          e.preventDefault();
          router.push(ask.href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [links, router]);

  const groups = [...new Set(links.map((l) => l.group))];
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const theme = (value: "light" | "dark" | "system") => {
    setOpen(false);
    setTheme(value);
    void attempt(() => savePreferences({ theme: NEXT_TO_THEME[value] }), { where: "command-menu.theme" });
  };

  return (
    <OpenContext.Provider value={() => setOpen(true)}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a page, client or setting">
        <CommandInput placeholder="Search pages, clients and settings…" />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>Nothing matches. Try a client&rsquo;s name or a page like &ldquo;Members&rdquo;.</CommandEmpty>
          {groups.map((group, i) => (
            <div key={group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {links
                  .filter((l) => l.group === group)
                  .map((l) => (
                    <CommandItem key={l.href + l.label} value={`${group} ${l.label}`} onSelect={() => go(l.href)}>
                      <l.icon strokeWidth={1.75} />
                      {l.label}
                      {l.shortcut && <CommandShortcut>{l.shortcut}</CommandShortcut>}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </div>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem value="theme light" onSelect={() => theme("light")}>
              <SunIcon strokeWidth={1.75} /> Light
            </CommandItem>
            <CommandItem value="theme dark" onSelect={() => theme("dark")}>
              <MoonIcon strokeWidth={1.75} /> Dark
            </CommandItem>
            <CommandItem value="theme system" onSelect={() => theme("system")}>
              <MonitorIcon strokeWidth={1.75} /> Match system
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </OpenContext.Provider>
  );
}

export function SearchButton() {
  const open = useOpenCommandMenu();
  return (
    <button
      type="button"
      onClick={open}
      className="flex h-9 w-full items-center gap-2 rounded-[10px] border bg-card px-2.5 text-[13.5px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <SearchIcon className="size-4" strokeWidth={1.75} aria-hidden />
      Search
      <Kbd className="ml-auto">⌘K</Kbd>
    </button>
  );
}
