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
