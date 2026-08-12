import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("That email address doesn't look right")
  .max(255, "Email must be less than 255 characters");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password").max(72, "Password is too long"),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Enter your first name").max(50, "First name is too long"),
    lastName: z.string().trim().min(2, "Enter your last name").max(50, "Last name is too long"),
    email: emailField,
    password: passwordField
      .regex(/[A-Za-z]/, "Password must include at least one letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    ref: z.string().trim().max(20, "Referral code is too long").optional(),
    agreed: z.literal(true, { message: "Accept the Terms & Privacy Policy to continue" }),
  })
  .strip();

export const forgotSchema = z.object({ email: emailField });

export const resetSchema = z
  .object({
    password: passwordField
      .regex(/[A-Za-z]/, "Password must include at least one letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    confirm: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Both passwords must match",
    path: ["confirm"],
  });

const TITLES: Record<string, string> = {
  email: "Check your email address",
  password: "Check your password",
  confirm: "Passwords don't match",
  firstName: "Check your first name",
  lastName: "Check your last name",
  ref: "Check your referral code",
  agreed: "One more thing",
};

export function firstIssue(error: z.ZodError): { title: string; description: string } {
  const issue = error.issues[0];
  const key = typeof issue?.path?.[0] === "string" ? (issue.path[0] as string) : "";
  return {
    title: TITLES[key] ?? "Please review the form",
    description: issue?.message ?? "Some details are missing or invalid.",
  };
}
