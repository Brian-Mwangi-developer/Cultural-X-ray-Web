"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheckIcon, LaptopIcon, LogOutIcon, SmartphoneIcon } from "lucide-react";
import { FormField, TextInput } from "@/components/forms/fields";
import { Avatar } from "@/components/shell/profile-menu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { attempt } from "@/lib/feedback";
import { ImageField } from "@/components/settings/image-field";
import { media } from "@/lib/media";
import { SettingsSection } from "./parts";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function ProfileForm({ user }: { user: { name: string; email: string; image: string | null; emailVerified: boolean; createdAt: string } }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Enter your name.");
    setPending(true);
    setError(null);
    const result = await attempt(async () => unwrap(await authClient.updateUser({ name: name.trim() })), { where: "settings.profile", success: "Saved", toastError: false });
    setPending(false);
    if (result.ok) router.refresh();
    else setError(result.message);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <ImageField
        label="Photo"
        help={user.image ? "Shown to your team and on what you write." : "A PNG, JPEG or WebP, up to 2 MB. Until then, your initials."}
        preview={<Avatar name={name || user.name} image={user.image} className="size-16! text-[20px]!" />}
        has={Boolean(user.image)}
        onSave={(file) => media.setPhoto(file)}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Full name" htmlFor="name" error={error}>
          <TextInput id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </FormField>
        <FormField label="Email" htmlFor="email" hint={`Member since ${dateFormat.format(new Date(user.createdAt))}.`}>
          <div className="relative">
            <TextInput id="email" value={user.email} readOnly className="pr-28 text-muted-foreground" />
            {user.emailVerified && (
              <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-[12.5px] font-medium">
                <CircleCheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
                Confirmed
              </span>
            )}
          </div>
        </FormField>
      </div>
      <div className="flex items-center gap-3 border-t pt-5">
        <Button type="submit" size="pill" className="h-10 px-5" disabled={pending || name.trim() === user.name}>
          {pending && <Spinner className="size-3.5" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

export type SessionRow = { id: string; token: string; createdAt: string; updatedAt: string; ipAddress: string | null; userAgent: string | null; current: boolean };

/** A readable device name from a user agent, without shipping a parser. */
function describe(ua: string | null) {
  if (!ua) return { name: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return { name: os ? `${browser} on ${os}` : browser, mobile: /iPhone|Android/.test(ua) };
}

export function SecurityPanel({ hasPassword, sessions }: { hasPassword: boolean; sessions: SessionRow[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("Use at least 8 characters for the new password.");
    if (next !== confirm) return setError("The new passwords don't match.");
    setPending("password");
    setError(null);
    const result = await attempt(
      async () => unwrap(await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: signOutOthers })),
      { where: "settings.security.password", success: signOutOthers ? "Password changed. Other devices are signed out." : "Password changed", toastError: false },
    );
    setPending(null);
    if (result.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
      router.refresh();
    } else setError(result.message);
  }

  async function revoke(session: SessionRow) {
    setPending(session.id);
    const result = await attempt(async () => unwrap(await authClient.revokeSession({ token: session.token })), { where: "settings.security.revoke", success: "Signed out of that device" });
    setPending(null);
    if (result.ok) router.refresh();
  }

  async function revokeOthers() {
    setPending("others");
    const result = await attempt(async () => unwrap(await authClient.revokeOtherSessions()), { where: "settings.security.revoke-others", success: "Signed out everywhere else" });
    setPending(null);
    if (result.ok) router.refresh();
  }

  return (
    <>
      <SettingsSection title="Password">
        {hasPassword ? (
          <form onSubmit={changePassword} className="space-y-5 rounded-[16px] border bg-card p-5">
            {error && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{error}</p>}
            <FormField label="Current password" htmlFor="current">
              <TextInput id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </FormField>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="New password" htmlFor="new" hint="At least 8 characters.">
                <TextInput id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
              </FormField>
              <FormField label="Confirm new password" htmlFor="confirm">
                <TextInput id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </FormField>
            </div>
            <label className="flex items-center gap-2.5 text-[14px]">
              <input type="checkbox" checked={signOutOthers} onChange={(e) => setSignOutOthers(e.target.checked)} className="size-4 accent-[var(--ember)]" />
              Sign out of every other device
            </label>
            <Button type="submit" size="pill" className="h-10 px-5" disabled={pending === "password"}>
              {pending === "password" && <Spinner className="size-3.5" />}
              Change password
            </Button>
          </form>
        ) : (
          <p className="rounded-[16px] border bg-card px-5 py-4 text-[14px] text-foreground/85">
            You sign in with Google, so there&rsquo;s no password here. Want one as well?{" "}
            <Link href="/forgot-password" className="font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
              Set a password by email
            </Link>
            .
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="Where you're signed in"
        action={
          sessions.length > 1 && (
            <Button variant="outline" size="pill" onClick={revokeOthers} disabled={pending === "others"}>
              {pending === "others" ? <Spinner className="size-3.5" /> : <LogOutIcon data-icon="inline-start" />}
              Sign out everywhere else
            </Button>
          )
        }
      >
        <ul className="divide-y rounded-[16px] border bg-card">
          {sessions.map((s) => {
            const device = describe(s.userAgent);
            const Icon = device.mobile ? SmartphoneIcon : LaptopIcon;
            return (
              <li key={s.id} className="flex items-center gap-4 px-5 py-[var(--row-y)]">
                <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium">
                    {device.name}
                    {s.current && <span className="ml-2 text-[12.5px] font-normal text-ember-ink">This device</span>}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">
                    Active {dateFormat.format(new Date(s.updatedAt))}
                    {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                  </p>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="pill" onClick={() => revoke(s)} disabled={pending === s.id}>
                    {pending === s.id && <Spinner className="size-3.5" />}
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </SettingsSection>
    </>
  );
}
