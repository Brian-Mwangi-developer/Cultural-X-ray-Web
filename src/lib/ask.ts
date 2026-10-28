import { DefaultChatTransport, type UIMessage } from "ai";
import { api, userHeaders } from "@/lib/api";

/** Ask X-Ray, as the backend speaks it (backend src/modules/ask). */
export type AskMetadata = { model?: string; practice?: boolean; inputTokens?: number; outputTokens?: number; createdAt?: string };
export type AskMessage = UIMessage<AskMetadata>;
export type AskThread = { id: string; title: string | null; updatedAt: string };
export type AskStatus = { mode: "live" | "practice" | "off"; model: string | null; dailyLimit: number };

export const askApi = {
  status: () => api<AskStatus>("/ask/status"),
  threads: (orgId: string) => api<{ threads: AskThread[] }>(`/orgs/${orgId}/ask/threads`),
  thread: (orgId: string, id: string) => api<{ thread: AskThread; messages: AskMessage[] }>(`/orgs/${orgId}/ask/threads/${id}`),
  remove: (orgId: string, id: string) => api<void>(`/orgs/${orgId}/ask/threads/${id}`, { method: "DELETE" }),
};

/**
 * What the person has on screen as they ask: the page inside the workspace and the guide parts on it,
 * so the assistant can point at what's really there (backend guide tools).
 */
export function screenNow() {
  if (typeof document === "undefined") return undefined;
  const page = location.pathname.split("/").slice(2).join("/");
  const parts = [...new Set([...document.querySelectorAll<HTMLElement>("[data-guide]")].map((el) => el.dataset.guide!))].slice(0, 40);
  return { page, parts };
}

/**
 * The chat transport: sends only the new question (the server keeps the history), carries the
 * session-owner header, learns the thread id from the reply, and turns error replies into
 * plain messages instead of raw JSON.
 */
export function askTransport(orgId: string, thread: { current: string | null }, onThread: (id: string) => void) {
  return new DefaultChatTransport<AskMessage>({
    api: `/api/v1/orgs/${orgId}/ask`,
    credentials: "same-origin",
    headers: () => userHeaders(),
    prepareSendMessagesRequest: ({ messages }) => ({ body: { threadId: thread.current ?? undefined, message: messages.at(-1), screen: screenNow() } }),
    fetch: async (input, init) => {
      const res = await fetch(input, init);
      const id = res.headers.get("x-ask-thread");
      if (id && id !== thread.current) {
        thread.current = id;
        onThread(id);
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
        if (res.status === 409 && body?.error?.code === "SESSION_CHANGED") window.dispatchEvent(new Event("xray:session-changed"));
        throw new Error(res.status < 500 && body?.error?.message ? body.error.message : "Ask X-Ray couldn't answer just now. Try again.");
      }
      return res;
    },
  });
}

/** Questions to start from, written for a brand's own map. */
export const STARTERS = [
  { icon: "mic", title: "Which podcast should we sponsor first?", sub: "From your podcasts, yours and shared" },
  { icon: "map-pin", title: "Where should our pop-up go?", sub: "From the places your customers pick" },
  { icon: "tv", title: "What do our rivals' fans watch that ours don't?", sub: "From their ground on the map" },
  { icon: "users", title: "Who are we missing?", sub: "From who each brand reaches" },
] as const;
