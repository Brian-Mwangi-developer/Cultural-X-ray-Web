"use client";

import { useEffect, useState } from "react";
import { HistoryIcon, Maximize2Icon, Minimize2Icon, SquarePenIcon, Trash2Icon } from "lucide-react";
import { AskChat } from "@/components/ask/ask-chat";
import { AssistantAvatar } from "@/components/ask/assistant-mark";
import { TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { type AskMessage, type AskStatus, type AskThread, askApi } from "@/lib/ask";
import { userMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Open = { key: string; id: string | null; messages: AskMessage[] };

const day = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  return diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? "This week" : "Earlier";
};

/**
 * a7: Ask X-Ray on its own page (boards X1–X3). Past chats on the left, the conversation in the
 * middle. Focus (board X2) keeps the same conversation mounted and only changes the layout,
 * so an answer that's streaming carries on.
 */
export function AskWorkspace({ orgId, slug, brand, status, mapLabel, threads: initialThreads, initial }: { orgId: string; slug: string; brand: string; status: AskStatus | null; mapLabel: string | null; threads: AskThread[]; initial: Open }) {
  const [threads, setThreads] = useState(initialThreads);
  const [open, setOpen] = useState<Open>(initial);
  const [focus, setFocus] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const title = threads.find((t) => t.id === open.id)?.title ?? (open.id ? "Conversation" : "New chat");

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  // The open chat lives in the hash (#t=…): changing the query would make Next refetch the page
  // and remount the chat mid-answer. Links in (the launcher's expand) use the same hash.
  const setAddress = (id: string | null) => window.history.replaceState(window.history.state, "", id ? `/${slug}/ask#t=${id}` : `/${slug}/ask`);

  useEffect(() => {
    const id = new URLSearchParams(window.location.hash.slice(1)).get("t");
    if (id) void pick(id);
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshThreads() {
    try {
      setThreads((await askApi.threads(orgId)).threads);
    } catch {
      // The list catches up on the next visit.
    }
  }

  function newChat() {
    setOpen({ key: crypto.randomUUID(), id: null, messages: [] });
    setAddress(null);
    setRailOpen(false);
  }

  async function pick(id: string) {
    if (id === open.id) return setRailOpen(false);
    try {
      const { messages } = await askApi.thread(orgId, id);
      setOpen({ key: id, id, messages });
      setAddress(id);
      setRailOpen(false);
    } catch (e) {
      toast.error(userMessage(e));
    }
  }

  async function remove(id: string) {
    try {
      await askApi.remove(orgId, id);
      setThreads((t) => t.filter((x) => x.id !== id));
      if (id === open.id) newChat();
    } catch (e) {
      toast.error(userMessage(e));
    }
  }

  const groups = threads.reduce<Record<string, AskThread[]>>((acc, t) => ((acc[day(t.updatedAt)] ??= []).push(t), acc), {});

  const rail = (
    <nav aria-label="Past chats" className="flex h-full w-[236px] shrink-0 flex-col gap-1 overflow-y-auto border-r px-3 py-3.5">
      <Button variant="outline" size="pill" className="w-full justify-center" onClick={newChat}>
        <SquarePenIcon data-icon="inline-start" />
        New chat
      </Button>
      {threads.length === 0 && <p className="px-2 pt-4 text-[12.5px] text-muted-foreground">Your chats appear here.</p>}
      {Object.entries(groups).map(([label, list]) => (
        <div key={label} className="pt-3">
          <p className="px-2 pb-1 text-[10.5px] font-medium tracking-[0.1em] text-faint uppercase">{label}</p>
          {list.map((t) => (
            <div key={t.id} className={cn("group flex items-center rounded-lg", t.id === open.id ? "bg-card shadow-[0_0_0_1px_var(--border)]" : "hover:bg-muted/60")}>
              <button type="button" onClick={() => void pick(t.id)} className="min-w-0 flex-1 px-2.5 py-2 text-left text-[13px]" aria-current={t.id === open.id}>
                <span className={cn("block truncate", t.id === open.id && "font-medium")}>{t.title ?? "New chat"}</span>
              </button>
              <Button variant="ghost" size="icon-xs" className="mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Delete "${t.title ?? "chat"}"`} onClick={() => void remove(t.id)}>
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );

  const chat = (
    <AskChat
      key={open.key}
      orgId={orgId}
      brand={brand}
      threadId={open.id}
      initialMessages={open.messages}
      status={status}
      mapLabel={mapLabel}
      variant="page"
      autoFocus
      onThread={(id) => {
        setOpen((o) => ({ ...o, id }));
        setAddress(id);
        void refreshThreads();
      }}
    />
  );

  return (
    <div className={cn(focus ? "fixed inset-0 z-50 flex flex-col bg-background" : "flex h-svh min-h-0 flex-col")}>
      {focus ? (
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6">
          <AssistantAvatar size={22} />
          <span className="text-[14px] font-semibold">Ask X-Ray</span>
          <span className="hidden min-w-0 truncate text-[13.5px] text-muted-foreground sm:block">· {title}</span>
          <span className="flex-1" />
          <Button variant="outline" size="pill" onClick={newChat}>
            <SquarePenIcon data-icon="inline-start" />
            New chat
          </Button>
          <Button variant="outline" size="pill" onClick={() => setFocus(false)}>
            <Minimize2Icon data-icon="inline-start" />
            Exit focus
          </Button>
        </header>
      ) : (
        <TopBar
          crumbs={[{ label: "Ask X-Ray" }]}
          actions={
            <>
              <Button variant="outline" size="pill" className="md:hidden" onClick={() => setRailOpen((o) => !o)} aria-expanded={railOpen}>
                <HistoryIcon data-icon="inline-start" />
                Chats
              </Button>
              <Button variant="outline" size="pill" onClick={() => setFocus(true)}>
                <Maximize2Icon data-icon="inline-start" />
                Focus
              </Button>
              <Button variant="outline" size="pill" className="max-sm:hidden" onClick={newChat}>
                <SquarePenIcon data-icon="inline-start" />
                New chat
              </Button>
            </>
          }
        />
      )}
      <div className="relative flex min-h-0 flex-1">
        {!focus && <div className={cn("max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-20 max-md:bg-background max-md:shadow-xl", !railOpen && "max-md:hidden")}>{rail}</div>}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{chat}</div>
      </div>
      {focus && <p className="pb-2 text-center text-[11.5px] text-faint">Esc to exit focus</p>}
    </div>
  );
}
