/**
 * The one place errors leave the app. Today it writes to the console; Sentry plugs in here
 * (captureException with the same context) without touching any caller.
 * Never pass passwords, tokens or full request bodies in `context`.
 */
export type ReportContext = {
  /** Where it happened, e.g. "onboarding.agency.create". */
  where: string;
  [key: string]: unknown;
};

export function reportError(error: unknown, context: ReportContext) {
  if (process.env.NODE_ENV === "test") return;
  console.error(`[${context.where}]`, error, context);
}
