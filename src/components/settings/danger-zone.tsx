"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckIcon, CircleAlertIcon, Clock3Icon, SendIcon, XIcon } from "lucide-react";
import { FormField, SelectField, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { attempt } from "@/lib/feedback";
import { roleLabel } from "@/lib/roles";
import type { AgencyConnection, ClientSummary, OrgContext } from "@/lib/session";
import type { FullMember } from "./members";

type Target = { id: string; name: string; who: string | null; team: number; heldInTrust: boolean };

export function DangerZone({
  org,
  clients = [],
  agencies = [],
  members,
  me,
}: {
  org: OrgContext;
  clients?: ClientSummary[];
  agencies?: AgencyConnection[];
  members: FullMember[];
  me: { id: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const o = org.organization;
  const agency = o.kind === "AGENCY";
  const role = org.membership.role;
  const owner = role === "owner";
  const manager = owner || role === "admin";
  const noun = agency ? "agency" : "workspace";

  const targets: Target[] = agency
    ? clients.filter((c) => c.status !== "DECLINED").map((c) => ({ id: c.id, name: c.workspace.name, who: c.owner ? `${c.owner.name} (owner)` : (c.claim?.email ?? null), team: c.team, heldInTrust: c.heldInTrust }))
    : agencies.map((a) => ({ id: a.id, name: a.agency.name, who: a.requestedBy?.name ?? null, team: a.people.length, heldInTrust: false }));
  const preselected = params.get(agency ? "disconnect" : "remove");
  const [ending, setEnding] = useState<Target | null>(targets.find((t) => t.id === preselected) ?? null);
  const [picking, setPicking] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const rows = [
    manager && {
      title: agency ? "Disconnect a client" : "Remove an agency",
      body: agency ? "Removes the client from your agency. They keep their workspace, maps, briefs and ad checks." : "Ends an agency's access. Everything they made stays here with you.",
      action: agency ? "Disconnect…" : "Remove…",
      disabled: targets.length === 0,
      onClick: () => setPicking(true),
    },
    owner && {
      title: `Transfer ${noun}`,
      body: "Make another member the owner. You become an Admin.",
      action: "Transfer…",
      disabled: members.filter((m) => m.user.id !== me.id).length === 0,
      onClick: () => setTransferring(true),
    },
    owner && {
      title: `Delete ${o.name}`,
      body: agency
        ? "Disconnects every client and removes your team. Clients keep their workspaces, untouched."
        : "Deletes this workspace, its maps, briefs and ad checks for everyone. This can't be undone.",
      action: `Delete ${noun}…`,
      onClick: () => setDeleting(true),
    },
    !owner && {
      title: `Leave ${o.name}`,
      body: `You lose access straight away. An owner or admin can invite you back.`,
      action: "Leave…",
      onClick: () => setLeaving(true),
    },
  ].filter(Boolean) as { title: string; body: string; action: string; disabled?: boolean; onClick: () => void }[];

  return (
    <>
      <div className="divide-y divide-destructive/20 overflow-hidden rounded-[16px] border border-destructive/40 bg-card">
        {rows.map((row) => (
          <div key={row.title} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{row.title}</p>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">{row.body}</p>
            </div>
            <Button variant="outline-destructive" size="pill" className="h-9 px-4" onClick={row.onClick} disabled={row.disabled}>
              {row.action}
            </Button>
          </div>
        ))}
      </div>

      <PickTarget
        open={picking}
        onOpenChange={setPicking}
        title={agency ? "Which client?" : "Which agency?"}
        targets={targets}
        onPick={(t) => {
          setPicking(false);
          setEnding(t);
        }}
      />
      {ending && <EndConnection target={ending} agency={agency} onClose={() => setEnding(null)} onDone={() => router.refresh()} />}
      <TransferOwnership open={transferring} onOpenChange={setTransferring} org={org} members={members.filter((m) => m.user.id !== me.id)} myMemberId={org.membership.id} />
      <ConfirmByName
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${o.name}?`}
        name={o.name}
        cta={`Delete ${noun}`}
        points={
          agency
            ? [
                { icon: "check", text: "Clients keep their workspaces and everything in them." },
                { icon: "x", text: "Your team loses access, and the agency's members and settings are deleted." },
                { icon: "clock", text: "If a client hasn't claimed their workspace yet, you'll be asked to wait until they do." },
              ]
            : [
                { icon: "x", text: "Maps, briefs, ad checks and members are deleted for everyone." },
                { icon: "x", text: "Connected agencies lose access straight away." },
              ]
        }
        action={async () => {
          unwrap(await authClient.organization.delete({ organizationId: o.id }));
        }}
        onDone={() => {
          router.replace("/dashboard");
          router.refresh();
        }}
        where="settings.danger.delete"
      />
      <ConfirmByName
        open={leaving}
        onOpenChange={setLeaving}
        title={`Leave ${o.name}?`}
        name={o.name}
        cta={`Leave ${noun}`}
        points={[{ icon: "x", text: "You lose access straight away. An owner or admin can invite you back." }]}
        action={async () => {
          unwrap(await authClient.organization.leave({ organizationId: o.id }));
        }}
        onDone={() => {
          router.replace("/dashboard");
          router.refresh();
        }}
        where="settings.danger.leave"
      />
    </>
  );
}

function PickTarget({ open, onOpenChange, title, targets, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; targets: Target[]; onPick: (t: Target) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] p-6 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold tracking-[-0.02em]">{title}</DialogTitle>
        </DialogHeader>
        <ul className="mt-2 divide-y rounded-[14px] border">
          {targets.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => onPick(t)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[14.5px] hover:bg-muted">
                {t.name}
                <span className="text-[12.5px] text-muted-foreground">{t.who}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

const POINT_ICON = { check: CheckIcon, x: XIcon, clock: Clock3Icon, send: SendIcon } as const;

/** c6: what ending a connection does, said plainly, then type the name to confirm. */
function EndConnection({ target, agency, onClose, onDone }: { target: Target; agency: boolean; onClose: () => void; onDone: () => void }) {
  const [typed, setTyped] = useState("");
  const [keepPdf, setKeepPdf] = useState(true);
  const [pending, setPending] = useState(false);
  const matches = typed.trim().toLowerCase() === target.name.toLowerCase();

  const points = agency
    ? [
        { icon: "check" as const, text: `${target.name} keeps its workspace and everything in it, including the briefs your team wrote.` },
        { icon: "x" as const, text: `Your ${target.team === 1 ? "team member loses" : target.team ? `${target.team} team members lose` : "team loses"} access straight away. Pinned items and drafts in progress go with it.` },
        ...(target.heldInTrust ? [{ icon: "clock" as const, text: `${target.name} hasn't been claimed yet. Their claim link keeps working, so the owner can still take it over.` }] : []),
        ...(target.who ? [{ icon: "send" as const, text: `We email ${target.who} so nothing is a surprise.` }] : []),
      ]
    : [
        { icon: "check" as const, text: "Everything the agency made stays in your workspace." },
        { icon: "x" as const, text: `${target.name}'s people lose access straight away.` },
        { icon: "send" as const, text: "We email the agency's owners so nothing is a surprise." },
      ];

  async function confirm() {
    setPending(true);
    const result = await attempt(() => api(`/connections/${target.id}/end`, { body: { keepPdf: agency ? keepPdf : undefined } }), {
      where: "settings.danger.end-connection",
      success: agency ? `${target.name} is disconnected` : `${target.name} no longer has access`,
    });
    setPending(false);
    if (result.ok) {
      onClose();
      onDone();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[20px] p-7 sm:max-w-[540px]">
        <DialogHeader className="flex-row items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlertIcon className="size-5 text-destructive" strokeWidth={1.75} aria-hidden />
          </span>
          <DialogTitle className="text-[22px] font-semibold tracking-[-0.02em]">
            {agency ? "Disconnect" : "Remove"} {target.name}?
          </DialogTitle>
        </DialogHeader>
        <Points points={points} />
        {agency && (
          <label className="flex items-center gap-3.5 rounded-[14px] bg-muted px-4 py-3.5">
            <Switch checked={keepPdf} onCheckedChange={setKeepPdf} />
            <span>
              <span className="block text-[14px] font-medium">Keep a PDF of your delivered briefs</span>
              <span className="block text-[12.5px] text-muted-foreground">{target.name} sees this on the notice and can object.</span>
            </span>
          </label>
        )}
        <FormField label={`Type ${target.name} to confirm`} htmlFor="confirm-name">
          <TextInput id="confirm-name" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="pill" className="h-10 px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive-solid" size="pill" className="h-10 px-4" disabled={!matches || pending} onClick={confirm}>
            {pending && <Spinner className="size-3.5" />}
            {agency ? "Disconnect" : "Remove"} {target.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Points({ points }: { points: { icon: keyof typeof POINT_ICON; text: string }[] }) {
  return (
    <ul className="space-y-3">
      {points.map((p) => {
        const Icon = POINT_ICON[p.icon];
        return (
          <li key={p.text} className="flex gap-3 text-[14px] leading-relaxed">
            <Icon className={p.icon === "x" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0"} strokeWidth={2} aria-hidden />
            {p.text}
          </li>
        );
      })}
    </ul>
  );
}

function ConfirmByName({
  open,
  onOpenChange,
  title,
  name,
  cta,
  points,
  action,
  onDone,
  where,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  name: string;
  cta: string;
  points: { icon: keyof typeof POINT_ICON; text: string }[];
  action: () => Promise<void>;
  onDone: () => void;
  where: string;
}) {
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const matches = typed.trim().toLowerCase() === name.toLowerCase();

  async function confirm() {
    setPending(true);
    const result = await attempt(action, { where });
    setPending(false);
    if (result.ok) {
      onOpenChange(false);
      onDone();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] p-7 sm:max-w-[520px]">
        <DialogHeader className="flex-row items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlertIcon className="size-5 text-destructive" strokeWidth={1.75} aria-hidden />
          </span>
          <DialogTitle className="text-[22px] font-semibold tracking-[-0.02em]">{title}</DialogTitle>
        </DialogHeader>
        <Points points={points} />
        <FormField label={`Type ${name} to confirm`} htmlFor={`${where}-confirm`}>
          <TextInput id={`${where}-confirm`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="pill" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive-solid" size="pill" className="h-10 px-4" disabled={!matches || pending} onClick={confirm}>
            {pending && <Spinner className="size-3.5" />}
            {cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransferOwnership({ open, onOpenChange, org, members, myMemberId }: { open: boolean; onOpenChange: (o: boolean) => void; org: OrgContext; members: FullMember[]; myMemberId: string }) {
  const router = useRouter();
  const [to, setTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const target = members.find((m) => m.id === to);

  async function transfer() {
    if (!target) return;
    setPending(true);
    const organizationId = org.organization.id;
    const result = await attempt(
      async () => {
        unwrap(await authClient.organization.updateMemberRole({ memberId: target.id, role: "owner", organizationId }));
        unwrap(await authClient.organization.updateMemberRole({ memberId: myMemberId, role: "admin", organizationId }));
      },
      { where: "settings.danger.transfer", success: `${target.user.name} is now the owner` },
    );
    setPending(false);
    if (result.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] p-7 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-semibold tracking-[-0.02em]">Transfer ownership</DialogTitle>
        </DialogHeader>
        <p className="text-[14px] leading-relaxed text-muted-foreground">The new owner gets billing and can delete the {org.organization.kind === "AGENCY" ? "agency" : "workspace"}. You become an Admin.</p>
        <FormField label="New owner" htmlFor="new-owner">
          <SelectField
            id="new-owner"
            value={to}
            onChange={setTo}
            options={members.map((m) => ({ value: m.id, label: `${m.user.name} · ${roleLabel(m.role)}` }))}
            placeholder="Choose a member"
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="pill" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive-solid" size="pill" className="h-10 px-4" disabled={!target || pending} onClick={transfer}>
            {pending && <Spinner className="size-3.5" />}
            Transfer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
