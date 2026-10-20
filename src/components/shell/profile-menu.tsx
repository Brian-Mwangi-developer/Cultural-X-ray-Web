"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CircleAlertIcon,
  CreditCardIcon,
  LanguagesIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SunIcon,
  UserPlusIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { BrandMark, initialsOf } from "@/components/app/parts";
import { FormField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { attempt } from "@/lib/feedback";
import { NEXT_TO_THEME, savePreferences } from "@/lib/preferences";
import { isManager } from "@/lib/roles";
import type { Membership, Preferences } from "@/lib/session";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "Match system", icon: MonitorIcon },
] as const;

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
] as const;

type Props = {
  user: { name: string; email: string; image: string | null; preferences: Preferences };
  org: { id: string; slug: string; name: string; role: string };
  memberships: Membership[];
};

export function ProfileMenu({ user, org, memberships }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [locale, setLocale] = useState(user.preferences.locale);
  const [reporting, setReporting] = useState(false);
  const settings = `/${org.slug}/settings`;

  async function changeTheme(value: string) {
    setTheme(value);
    await attempt(() => savePreferences({ theme: NEXT_TO_THEME[value as keyof typeof NEXT_TO_THEME] }), { where: "profile-menu.theme" });
  }

  async function changeLocale(value: string) {
    const previous = locale;
    setLocale(value);
    const result = await attempt(() => savePreferences({ locale: value }), { where: "profile-menu.locale", success: "Language saved" });
    if (!result.ok) setLocale(previous);
  }

  async function switchTo(m: Membership) {
    const result = await attempt(async () => unwrap(await authClient.organization.setActive({ organizationId: m.id })), { where: "profile-menu.switch" });
    if (result.ok) router.push(`/${m.slug}`);
  }

  async function signOut() {
    const result = await attempt(async () => unwrap(await authClient.signOut()), { where: "profile-menu.sign-out" });
    if (result.ok) {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-full items-center gap-2.5 rounded-[12px] border bg-card px-2 py-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 data-popup-open:bg-muted"
          aria-label="Account menu"
        >
          <Avatar name={user.name} image={user.image} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">{user.name}</span>
            <span className="block truncate text-[12px] text-muted-foreground">{user.email}</span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[272px] rounded-[14px] p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2">
              <Avatar name={user.name} image={user.image} size="lg" />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-foreground">{user.name}</span>
                <span className="block truncate text-[12.5px] font-normal text-muted-foreground">{user.email}</span>
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={`${settings}/profile`} />} className={item}>
              <SettingsIcon strokeWidth={1.75} />
              User settings
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={item}>
                <PaletteIcon strokeWidth={1.75} />
                Theme
                <span className="ml-auto text-[12px] text-muted-foreground">{THEMES.find((t) => t.value === theme)?.label ?? "Match system"}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 rounded-[12px] p-1.5">
                <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={changeTheme}>
                  {THEMES.map((t) => (
                    <DropdownMenuRadioItem key={t.value} value={t.value} className={item}>
                      <t.icon strokeWidth={1.75} />
                      {t.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={item}>
                <LanguagesIcon strokeWidth={1.75} />
                Language
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52 rounded-[12px] p-1.5">
                <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
                  {LANGUAGES.map((l) => (
                    <DropdownMenuRadioItem key={l.value} value={l.value} className={item}>
                      {l.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <p className="px-2 pt-1.5 pb-1 text-[11.5px] text-muted-foreground">More languages soon</p>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className={item} onClick={() => setReporting(true)}>
              <CircleAlertIcon strokeWidth={1.75} />
              Report an issue
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`${settings}/billing`} />} className={item}>
              <CreditCardIcon strokeWidth={1.75} />
              Manage billing
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={item}>
              <BrandMark name={org.name} size="xs" tone="neutral" className="rounded-[5px]" />
              <span className="truncate">{org.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-60 rounded-[12px] p-1.5">
              <DropdownMenuLabel className="px-2 text-[11.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase">Switch to</DropdownMenuLabel>
              {memberships.map((m) => (
                <DropdownMenuItem key={m.id} className={item} onClick={() => m.id !== org.id && switchTo(m)}>
                  <BrandMark name={m.name} logo={m.logo} size="xs" tone={m.kind === "AGENCY" ? "ember" : "ink"} />
                  <span className="truncate">{m.name}</span>
                  {m.id === org.id && <CheckIcon className="ml-auto" strokeWidth={2} />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/onboarding" />} className={item}>
                Set up another
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {isManager(org.role) && (
            <DropdownMenuItem render={<Link href={`${settings}/members?invite=1`} />} className={item}>
              <UserPlusIcon strokeWidth={1.75} />
              Invite teammates
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className={item} onClick={signOut}>
            <LogOutIcon strokeWidth={1.75} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReportIssue open={reporting} onOpenChange={setReporting} organizationId={org.id} />
    </>
  );
}

const item = "h-9 gap-2.5 rounded-[8px] px-2 text-[13.5px] [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function Avatar({ name, image, size = "md", className }: { name: string; image: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = { sm: "size-6 text-[10px]", md: "size-8 text-[12px]", lg: "size-9 text-[13px]" }[size];
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- avatars come from Google and other providers
    return <img src={image} alt="" referrerPolicy="no-referrer" className={cn(box, "shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span aria-hidden className={cn(box, "flex shrink-0 items-center justify-center rounded-full bg-ember font-semibold text-white", className)}>
      {initialsOf(name)}
    </span>
  );
}

function ReportIssue({ open, onOpenChange, organizationId }: { open: boolean; onOpenChange: (open: boolean) => void; organizationId: string }) {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) return setError("Tell us a little more, so we can find it.");
    setPending(true);
    const result = await attempt(() => api<{ reference: string }>("/me/feedback", { body: { message: message.trim(), page: pathname, organizationId } }), {
      where: "profile-menu.report",
      toastError: false,
    });
    setPending(false);
    if (!result.ok) return setError(result.message);
    toast.success("Thanks. We've got it.", { description: `Reference ${result.data.reference}` });
    setMessage("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[18px] sm:max-w-[480px]">
        <form onSubmit={send} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.02em]">Report an issue</DialogTitle>
            <DialogDescription>Tell us what happened and what you expected. We&rsquo;ll see which page you were on.</DialogDescription>
          </DialogHeader>
          <FormField label="What went wrong?" htmlFor="report" error={error}>
            <Textarea
              id="report"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
              rows={5}
              placeholder="The map stopped at 3 of 8 categories after I changed the market…"
              className="rounded-[10px] text-[14.5px]"
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="pill" className="h-10 px-4" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="pill" className="h-10 px-4" disabled={pending}>
              {pending && <Spinner className="size-3.5" />}
              Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
