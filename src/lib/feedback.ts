"use client";

import { toast } from "sonner";
import { AppError, userMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";

type Options = {
  /** Where this ran, for the error report. */
  where: string;
  /** Toast shown when it works. Leave out when the UI already shows the result. */
  success?: string;
  /** Show the failure as a toast. Turn off when the form shows it inline. */
  toastError?: boolean;
};

export type Outcome<T> = { ok: true; data: T } | { ok: false; message: string; error: unknown };

/**
 * Run a user action. Failures become a short message (toast and/or returned); anything
 * unexpected is reported. Never throws, so a click can't take the page down.
 */
export async function attempt<T>(action: () => Promise<T>, { where, success, toastError = true }: Options): Promise<Outcome<T>> {
  try {
    const data = await action();
    if (success) toast.success(success);
    return { ok: true, data };
  } catch (error) {
    const message = userMessage(error);
    if (!(error instanceof AppError && error.expected)) reportError(error, { where });
    if (toastError) {
      const reference = error instanceof AppError ? error.reference : undefined;
      toast.error(message, reference ? { description: `Reference ${reference}` } : undefined);
    }
    return { ok: false, message, error };
  }
}
