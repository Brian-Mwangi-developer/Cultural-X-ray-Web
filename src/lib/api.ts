import { AppError, GENERIC_MESSAGE, NETWORK_MESSAGE, fromAuthError } from "@/lib/errors";

type Body = Record<string, unknown> | unknown[];

/**
 * The user this page was rendered for (set by SessionGuard). Sent with every call so the
 * backend refuses to act if another tab has since signed in as someone else.
 */
let expectedUser: string | null = null;
export const setExpectedUser = (id: string | null) => {
  expectedUser = id;
};

/**
 * Browser calls to the backend's /api/v1, proxied through this origin so the session
 * cookie travels with them. Throws AppError with a message fit to show.
 */
export async function api<T>(path: string, init: { method?: string; body?: Body; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...(expectedUser ? { "x-xray-user": expectedUser } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      signal: init.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AppError(NETWORK_MESSAGE, "NETWORK");
  }

  if (res.status === 204) return undefined as T;
  const payload = (await res.json().catch(() => null)) as
    | { error?: { message?: string; code?: string; reference?: string } }
    | null;

  if (res.ok) return payload as T;

  const error = payload?.error;
  if (res.status === 429) throw new AppError("Too many requests. Wait a minute, then try again.", "RATE_LIMITED", 429);
  if (res.status === 401) throw new AppError("Your session ended. Log in again.", "UNAUTHORIZED", 401);
  if (res.status === 409 && error?.code === "SESSION_CHANGED") {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("xray:session-changed"));
    throw new AppError(error.message ?? "You've signed in as someone else in another tab. Reload this page.", "SESSION_CHANGED", 409);
  }
  // 4xx messages from our own API are written for people; 5xx never are.
  if (res.status < 500 && error?.message) throw new AppError(error.message, error.code ?? "REQUEST_FAILED", res.status);
  throw new AppError(GENERIC_MESSAGE, error?.code ?? "SERVER_ERROR", res.status, error?.reference);
}

/** Unwrap a Better Auth client result, throwing an AppError when it failed. */
export function unwrap<T>(result: { data: T | null; error: { code?: string; message?: string; status?: number } | null }): T {
  if (result.error) throw fromAuthError(result.error);
  return result.data as T;
}
