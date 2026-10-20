import { z } from "zod";

const email = z.email("Enter an email address like name@brand.com");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email,
  password: z.string().min(8, "Use at least 8 characters"),
});

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function fieldErrors<T extends z.ZodType>(schema: T, values: unknown) {
  const result = schema.safeParse(values);
  if (result.success) return {} as FieldErrors<z.infer<T>>;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return errors as FieldErrors<z.infer<T>>;
}

/** Better Auth error codes, said the way a person would want to hear them. */
export function authMessage(error: { code?: string; message?: string; status?: number }) {
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match an account. Check them, or create an account.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "There's already an account with this email. Log in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters for your password.";
    default:
      if (error.status === 429) return "Too many attempts. Wait a minute, then try again.";
      return error.message || "Something went wrong on our side. Try again in a moment.";
  }
}
