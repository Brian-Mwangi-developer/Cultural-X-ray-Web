"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CopyIcon, DownloadIcon, EllipsisIcon, FileTextIcon, LinkIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { BriefDocument, type Editing } from "@/components/briefs/brief-document";
import { WriteBriefDialog } from "@/components/briefs/write-brief-dialog";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { type Brief, briefHref, briefsApi, type BriefSummary, type Section, sharedBriefUrl } from "@/lib/briefs";
import { AppError } from "@/lib/errors";

const oops = (error: unknown, fallback: string) => toast(error instanceof AppError ? error.message : fallback);
const when = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));

/** Where the printable copy lives: a page with no app around it, which opens the browser's Save as PDF. */
export const briefPrintHref = (slug: string, orgId: string, id: string) => `/${slug}/report/briefs/${id}?org=${orgId}&print=1`;

/** One brief: read it, edit any line, share a read-only link, or save it as a PDF. */
export function BriefView({ orgId, slug, base, trail = [], initial, canEdit }: { orgId: string; slug: string; base: string; trail?: Crumb[]; initial: Brief; canEdit: boolean }) {
  const router = useRouter();
  const [brief, setBrief] = useState(initial);
  const [editing, setEditing] = useState<Editing["items"] | null>(null);
  const [title, setTitle] = useState(brief.title);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditing = () => {
    setTitle(brief.title);
    setEditing(brief.items.map((i) => ({ ...i, key: i.id })));
  };
  const edit: Editing | undefined = editing
    ? {
        items: editing,
        change: (key, text) => setEditing((xs) => xs!.map((x) => (x.key === key ? { ...x, text } : x))),
        remove: (key) => setEditing((xs) => xs!.filter((x) => x.key !== key)),
        add: (section: Section) => setEditing((xs) => [...xs!, { key: crypto.randomUUID(), section, text: "", refs: null, state: "UNCITED" }]),
      }
    : undefined;

  async function save() {
    setSaving(true);
    try {
      const { brief: saved } = await briefsApi.save(orgId, brief.id, { title: title.trim() || brief.title, items: editing!.map((i) => ({ id: i.id, section: i.section, text: i.text })) });
      setBrief(saved);
      setEditing(null);
      toast("Saved.");
    } catch (error) {
      oops(error, "That didn’t save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Briefs", href: `${base}/briefs` }, { label: brief.title }]}
        actions={
          editing ? (
            <>
              <Button variant="ghost" size="pill" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button size="pill" onClick={() => void save()} disabled={saving}>
                {saving && <Spinner data-icon="inline-start" />}
                Save
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <Button variant="ghost" size="pill" onClick={startEditing}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" size="pill" onClick={() => setSharing(true)}>
                  <LinkIcon data-icon="inline-start" />
                  Share
                </Button>
              )}
              <Button size="pill" onClick={() => window.open(briefPrintHref(slug, orgId, brief.id), "_blank", "noopener")}>
                <DownloadIcon data-icon="inline-start" />
                Download PDF
              </Button>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
                    <EllipsisIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                      <Trash2Icon />
                      Delete brief
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )
        }
      />
      <PageBody className="bg-muted/40">
        {editing && (
          <div className="mx-auto mb-4 w-full max-w-[860px] space-y-2">
            <label htmlFor="brief-title" className="text-[12.5px] text-muted-foreground">
              Title
            </label>
            <Input id="brief-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className="h-11 text-[16px] font-semibold" />
            <p className="text-[12.5px] text-muted-foreground">Lines you write yourself aren’t checked against the map; the ones X-Ray wrote keep their sources while you reword them.</p>
          </div>
        )}
        <BriefDocument brief={{ ...brief, title: editing ? title : brief.title }} editing={edit} />
      </PageBody>

      <ShareDialog orgId={orgId} brief={brief} open={sharing} onOpenChange={setSharing} onChange={(shareToken) => setBrief((b) => ({ ...b, shareToken, status: shareToken ? "SHARED" : "DRAFT" }))} />

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this brief?</AlertDialogTitle>
            <AlertDialogDescription>“{brief.title}” and its share link go for good. Your Culture Map and plays aren’t touched.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                void briefsApi.remove(orgId, brief.id).then(
                  () => {
                    toast("Brief deleted.");
                    router.push(`${base}/briefs` as never);
                    router.refresh();
                  },
                  (error: unknown) => oops(error, "That didn’t delete. Try again."),
                )
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ShareDialog({ orgId, brief, open, onOpenChange, onChange }: { orgId: string; brief: Brief; open: boolean; onOpenChange: (o: boolean) => void; onChange: (token: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const url = brief.shareToken ? sharedBriefUrl(brief.shareToken) : null;
  async function toggle(on: boolean) {
    setBusy(true);
    try {
      const { shareToken } = await briefsApi.share(orgId, brief.id, on);
      onChange(shareToken);
    } catch (error) {
      oops(error, "That didn’t change. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Share this brief</DialogTitle>
          <DialogDescription>Anyone with the link can read it: your creative team, a freelancer, a producer. They can’t edit it or see anything else in {brief.workspace.name}.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center justify-between gap-4 rounded-[12px] border px-4 py-3">
          <span>
            <span className="block text-[14px] font-medium">Read-only link</span>
            <span className="block text-[12.5px] text-muted-foreground">{url ? "On. Turning it off stops the link working." : "Off."}</span>
          </span>
          <Switch checked={Boolean(url)} disabled={busy} onCheckedChange={(on) => void toggle(on)} />
        </label>
        {url && (
          <div className="flex gap-2">
            <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" />
            <Button
              variant="outline"
              onClick={() =>
                void navigator.clipboard.writeText(url).then(
                  () => toast("Link copied."),
                  () => toast("Couldn’t copy. Select the link and copy it."),
                )
              }
            >
              <CopyIcon data-icon="inline-start" />
              Copy
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** All briefs for a workspace, newest first, and the way to write another. */
export function BriefsList({ orgId, base, trail = [], brand, briefs, canEdit, hasMap }: { orgId: string; base: string; trail?: Crumb[]; brand: string; briefs: BriefSummary[]; canEdit: boolean; hasMap: boolean }) {
  const [writing, setWriting] = useState(false);
  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Briefs" }]}
        actions={
          canEdit && hasMap ? (
            <Button size="pill" onClick={() => setWriting(true)}>
              <PlusIcon data-icon="inline-start" />
              Write a brief
            </Button>
          ) : null
        }
      />
      <PageBody>
        <div className="mx-auto max-w-[960px] space-y-6">
          <header>
            <h1 className="text-[30px] font-semibold tracking-[-0.03em]">Briefs</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">One-page creative briefs, written from {brand}’s Culture Map, for whoever makes the work.</p>
          </header>
          {briefs.length ? (
            <ul className="divide-y overflow-hidden rounded-[14px] border bg-card">
              {briefs.map((b) => (
                <li key={b.id}>
                  <Link href={briefHref(base, b.id) as never} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border bg-muted/60">
                      <FileTextIcon className="size-[18px] text-foreground/75" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{b.title}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">
                        {[b.occasion, b.author?.name, `edited ${when(b.updatedAt)}`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {b.shareToken && <span className="rounded-full border px-2 py-0.5 text-[11.5px] text-muted-foreground">Shared</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title={hasMap ? "No briefs yet" : "Briefs come from the Culture Map"}
              body={hasMap ? "Say what it’s for and where it’ll run; X-Ray writes a one-page brief from your map in about 15 seconds." : "Build your Culture Map first; briefs are written from it."}
              action={
                canEdit && hasMap ? (
                  <Button size="pill" onClick={() => setWriting(true)}>
                    <PlusIcon data-icon="inline-start" />
                    Write a brief
                  </Button>
                ) : null
              }
            />
          )}
        </div>
      </PageBody>
      <WriteBriefDialog orgId={orgId} base={base} brand={brand} open={writing} onOpenChange={setWriting} />
    </>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed bg-muted/40 px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border bg-card">
        <FileTextIcon className="size-5 text-foreground/75" strokeWidth={1.75} />
      </span>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="max-w-md text-[14px] text-muted-foreground">{body}</p>
      {action}
    </section>
  );
}
