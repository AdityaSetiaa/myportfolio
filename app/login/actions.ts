"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { credentialEmail, credentialPassword } from "@/data/cms-schema";
import { signIn } from "@/lib/auth";
import { mongoUri } from "@/lib/mongodb";

export async function login(_state: string, form: FormData) {
  if (!process.env.AUTH_SECRET || !mongoUri()) return "Administrator login is not configured.";
  const email = credentialEmail.safeParse(form.get("email"));
  const password = credentialPassword.safeParse(form.get("password"));
  const fail = "Sign-in failed. Check your credentials or try again later.";
  if (!email.success || !password.success) return fail;
  try {
    await signIn("credentials", { email: email.data, password: password.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return fail;
    throw error;
  }
  redirect("/admin");
}
