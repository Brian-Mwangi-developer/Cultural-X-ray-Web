"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LinkIcon, MailIcon, MoreHorizontalIcon, RotateCwIcon, UserPlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { FormField, PUBLIC_EMAIL_DOMAINS, SelectField } from "@/components/forms/fields";
import { Avatar } from "@/components/shell/profile-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppError, userMessage } from "@/lib/errors";
import { attempt } from "@/lib/feedback";
import { reportError } from "@/lib/report";
import { INVITABLE_ROLES, ROLE_COPY, roleLabel, type InvitableRole } from "@/lib/roles";
import type { OrgContext } from "@/lib/session";
import { SettingsSection } from "./parts";

export type FullMember = { id: string; role: string; createdAt: string; user: { id: string; name: string; email: string; image: string | null } };
export type PendingInvite = { id: string; email: string; role: string; status: string; expiresAt: string };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function MembersManager({ org, members, invitations, me }: { org: OrgContext; members: FullMember[]; invitations: PendingInvite[]; me: { id: string; email: string } }) {
  const router = useRouter();
  const params = useSearchParams();
  const o = org.organization;
  const manager = org.membership.role === "owner" || org.membership.role === "admin";
  const [inviting, setInviting] = useState(manager && params.has("invite"));
  const [removing, setRemoving] = useState<FullMember | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const domain = me.email.split("@")[1]?.toLowerCase() ?? "";
  const canJoinByDomain = manager && Boolean(domain) && !PUBLIC_EMAIL_DOMAINS.has(domain);
  const pending = invitations.filter((i) => i.status === "pending" && new Date(i.expiresAt) > new Date());

  async function changeRole(member: FullMember, role: string) {
    setBusy(member.id);
    const result = await attempt(async () => unwrap(await authClient.organization.updateMemberRole({ memberId: member.id, role: role as InvitableRole, organizationId: o.id })), {
      where: "settings.members.role",
      success: `${member.user.name} is now ${roleLabel(role) === "Admin" ? "an" : "a"} ${roleLabel(role)}`,
    });
    setBusy(null);
    if (result.ok) router.refresh();
  }

  async function remove(member: FullMember) {
    setBusy(member.id);
    const result = await attempt(async () => unwrap(await authClient.organization.removeMember({ memberIdOrEmail: member.id, organizationId: o.id })), {
      where: "settings.members.remove",
      success: `${member.user.name} no longer has access`,
    });
    setBusy(null);
    setRemoving(null);
    if (result.ok) router.refresh();
  }

  async function resend(invite: PendingInvite) {
    setBusy(invite.id);
    await attempt(async () => unwrap(await authClient.organization.inviteMember({ email: invite.email, role: invite.role as InvitableRole, organizationId: o.id, resend: true })), {
      where: "settings.members.resend",
      success: `Sent again to ${invite.email}`,
    });
    setBusy(null);
    router.refresh();
  }

  async function cancel(invite: PendingInvite) {
    setBusy(invite.id);
    const result = await attempt(async () => unwrap(await authClient.organization.cancelInvitation({ invitationId: invite.id })), {
      where: "settings.members.cancel",
      success: "Invitation cancelled",
    });
    setBusy(null);
    if (result.ok) router.refresh();
  }

  async function toggleDomain(on: boolean) {
    const result = await attempt(() => api(`/orgs/${o.id}/profile`, { method: "PATCH", body: { joinDomain: on ? domain : null, joinRole: "viewer" } }), {
      where: "settings.members.domain",
      success: on ? `Anyone at @${domain} can join as Viewer` : "Joining by domain is off",
    });
    if (result.ok) router.refresh();
  }

  return (
    <>
      <SettingsSection
        title={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        action={
          manager && (
            <Button size="pill" className="h-9 px-4" onClick={() => setInviting(true)}>
              <UserPlusIcon data-icon="inline-start" />
              Invite people
            </Button>
          )
        }
      >
        <ul className="divide-y rounded-[14px] border bg-card">
          {members.map((m) => {
            const isMe = m.user.id === me.id;
            const editable = manager && !isMe && m.role !== "owner";
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-[var(--row-y)]">
                <Avatar name={m.user.name} image={m.user.image} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-medium">
                    {m.user.name}
                    {isMe && <span className="ml-1.5 text-[12.5px] font-normal text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-[12.5px] text-muted-foreground">{m.user.email}</p>
                </div>
                <span className="hidden text-[12.5px] text-muted-foreground md:block">Joined {dateFormat.format(new Date(m.createdAt))}</span>
                {editable ? (
                  <SelectField
                    value={m.role}
                    onChange={(role) => changeRole(m, role)}
                    options={INVITABLE_ROLES.map((r) => ({ value: r, label: ROLE_COPY[r].label }))}
                    size="sm"
                    className="w-32"
                    disabled={busy === m.id}
                  />
                ) : (
                  <span className="w-32 px-2.5 text-[13.5px]">{roleLabel(m.role)}</span>
                )}
                {editable ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More for ${m.user.name}`} />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-[12px] p-1.5">
                      <DropdownMenuItem variant="destructive" onClick={() => setRemoving(m)}>
                        Remove from {o.kind === "AGENCY" ? "agency" : "workspace"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="size-8" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      </SettingsSection>

      {pending.length > 0 && (
        <SettingsSection title="Waiting to join" description="Invitations last a week.">
          <ul className="divide-y rounded-[14px] border bg-card">
            {pending.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-3 px-5 py-[var(--row-y)]">
                <span className="flex size-8 items-center justify-center rounded-full border border-dashed">
                  <MailIcon className="size-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-medium">{invite.email}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {roleLabel(invite.role)} · expires {dateFormat.format(new Date(invite.expiresAt))}
                  </p>
                </div>
                {manager && (
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="pill" onClick={() => resend(invite)} disabled={busy === invite.id}>
                      {busy === invite.id ? <Spinner className="size-3.5" /> : <RotateCwIcon data-icon="inline-start" />}
                      Resend
                    </Button>
                    <Button variant="ghost" size="pill" onClick={() => cancel(invite)} disabled={busy === invite.id}>
                      <XIcon data-icon="inline-start" />
                      Cancel
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      {canJoinByDomain && (
        <SettingsSection title="Join by email domain">
          <label className="flex items-center gap-4 rounded-[14px] border bg-card px-5 py-4">
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-medium">Anyone at @{domain} can join as Viewer</span>
              <span className="block text-[13px] text-muted-foreground">They find you when they sign up with a confirmed @{domain} address. Admins approve upgrades.</span>
            </span>
            <Switch checked={o.joinDomain === domain} onCheckedChange={toggleDomain} />
          </label>
        </SettingsSection>
      )}

      <InviteDialog open={inviting} onOpenChange={setInviting} organizationId={o.id} onSent={() => router.refresh()} />

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent className="rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access straight away. Maps, briefs and ad checks they made stay in the {o.kind === "AGENCY" ? "agency and its clients" : "workspace"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive-solid" onClick={() => removing && remove(removing)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InviteDialog({ open, onOpenChange, organizationId, onSent }: { open: boolean; onOpenChange: (open: boolean) => void; organizationId: string; onSent: () => void }) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<InvitableRole>("strategist");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const list = [...new Set(emails.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];
    const bad = list.filter((x) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
    if (!list.length) return setError("Add at least one email address.");
    if (bad.length) return setError(`Check ${bad.length === 1 ? "this address" : "these addresses"}: ${bad.join(", ")}`);
    setPending(true);
    setError(null);
    const failed: string[] = [];
    let firstMessage: string | null = null;
    for (const email of list) {
      try {
        unwrap(await authClient.organization.inviteMember({ email, role, organizationId }));
      } catch (err) {
        if (!(err instanceof AppError && err.expected)) reportError(err, { where: "settings.members.invite" });
        failed.push(email);
        firstMessage ??= userMessage(err);
      }
    }
    setPending(false);
    const sent = list.length - failed.length;
    if (sent) toast.success(sent === 1 ? "Invitation sent" : `${sent} invitations sent`);
    if (failed.length) {
      setEmails(failed.join(", "));
      setError(`${failed.join(", ")}: ${firstMessage}`);
    } else {
      setEmails("");
      onOpenChange(false);
    }
    if (sent) onSent();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] p-7 sm:max-w-[520px]">
        <form onSubmit={send} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold tracking-[-0.02em]">Invite people</DialogTitle>
            <DialogDescription>They get an email with a link that works for a week.</DialogDescription>
          </DialogHeader>
          {error && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[13.5px] ring-1 ring-destructive/25 ring-inset">{error}</p>}
          <FormField label="Email addresses" htmlFor="emails" hint="Separate several with commas.">
            <Textarea id="emails" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="priya@agency.com, jonah@agency.com" className="rounded-[10px] text-[14.5px]" autoFocus />
          </FormField>
          <FormField label="Role" htmlFor="role" hint={ROLE_COPY[role].can}>
            <SelectField id="role" value={role} onChange={setRole} options={INVITABLE_ROLES.map((r) => ({ value: r, label: ROLE_COPY[r].label }))} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="pill" className="h-10 px-4" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="pill" className="h-10 px-4" disabled={pending}>
              {pending && <Spinner className="size-3.5" />}
              Send invitations
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
