/**
 * Errors the person can act on. `message` is always written for them, never the raw
 * server text; `reference` lets support find the backend log line.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string = "UNKNOWN",
    readonly status?: number,
    readonly reference?: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  /** Expected failures (bad input, permissions) are not worth reporting. */
  get expected() {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
}

export const GENERIC_MESSAGE = "Something went wrong on our side. Try again in a moment.";
export const NETWORK_MESSAGE = "We can't reach Cultural X-Ray right now. Check your connection and try again.";

const AUTH_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account. Check them, or create an account.",
  USER_ALREADY_EXISTS: "There's already an account with this email. Log in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "There's already an account with this email. Log in instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "That password is too long. Use 128 characters or fewer.",
  EMAIL_NOT_VERIFIED: "Confirm your email first. We've sent you a fresh link.",
  INVALID_TOKEN: "This link has expired or was already used. Ask for a new one.",
  TOKEN_EXPIRED: "This link has expired. Ask for a new one.",
  INVALID_PASSWORD: "That password isn't right.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "This account signs in with Google, so it has no password to change.",
  SESSION_EXPIRED: "For your security, log in again before making this change.",
  ORGANIZATION_SLUG_ALREADY_TAKEN: "That URL is taken. Try another.",
  ORGANIZATION_ALREADY_EXISTS: "That URL is taken. Try another.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION: "Only owners and admins can invite people.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: "You can't give someone a role higher than your own.",
  USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION: "That person already has an invitation waiting.",
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: "That person is already a member.",
  INVITATION_NOT_FOUND: "This invitation no longer exists. Ask for a new one.",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: "This invitation was sent to a different email. Log in with that address.",
  EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION: "Confirm your email before accepting the invitation.",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER: "You're the only owner. Make someone else owner before you leave.",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION: "Only owners and admins can change these settings.",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION: "Only the owner can delete this.",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER: "You can't remove this person.",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER: "You can't change this person's role.",
  YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION: "You can't cancel this invitation.",
};

type BetterAuthError = { code?: string; message?: string; status?: number; statusText?: string };

/** Turn a Better Auth client error into something a person can act on. */
export function fromAuthError(error: BetterAuthError): AppError {
  const code = error.code ?? "UNKNOWN";
  if (error.status === 429) return new AppError("Too many attempts. Wait a minute, then try again.", "RATE_LIMITED", 429);
  const known = AUTH_MESSAGES[code];
  if (known) return new AppError(known, code, error.status ?? 400);
  // Our own Better Auth hooks use XRAY_ codes, and their messages are written for people.
  if (code.startsWith("XRAY_") && error.message) return new AppError(error.message, code, error.status ?? 400);
  if (error.status === 0 || error.status === undefined) return new AppError(NETWORK_MESSAGE, "NETWORK");
  if (error.status === 401) return new AppError("Your session ended. Log in again.", "UNAUTHORIZED", 401);
  if (error.status === 403) return new AppError("You don't have permission to do that.", "FORBIDDEN", 403);
  return new AppError(GENERIC_MESSAGE, code, error.status);
}

export function authMessage(error: BetterAuthError) {
  return fromAuthError(error).message;
}

/** The message to show for anything thrown. Unknown errors never leak their text. */
export function userMessage(error: unknown) {
  return error instanceof AppError ? error.message : GENERIC_MESSAGE;
}
