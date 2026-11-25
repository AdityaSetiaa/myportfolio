import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHmac } from "node:crypto";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { credentialEmail, credentialPassword } from "@/data/cms-schema";
import { Admin, LoginThrottle } from "./cms-models";
import { mongo, mongoUri } from "./mongodb";
import { checkPassword } from "./password";

const lifetime = 60 * 60 * 8;
const credentials = z.object({ email: credentialEmail, password: credentialPassword });

async function attempt(key: string, maximum: number) {
  const period = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / period);
  const id = `${key}:${window}`;
  const update = { $inc: { count: 1 }, $setOnInsert: { expires: new Date((window + 2) * period) } };
  const record = await LoginThrottle.findOneAndUpdate({ _id: id }, update, { upsert: true, returnDocument: "after" })
    .catch(error => {
      if (error?.code !== 11000) throw error;
      return LoginThrottle.findOneAndUpdate({ _id: id }, update, { returnDocument: "after" }).exec();
    });
  return Boolean(record && record.count <= maximum);
}

declare module "next-auth" {
  interface Session { adminId?: string; authVersion?: number }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  trustHost: process.env.NODE_ENV !== "production" || Boolean(process.env.AUTH_URL || process.env.VERCEL) ||
    process.env.AUTH_TRUST_HOST === "true",
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: lifetime },
  providers: [Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(raw, request) {
      if (!process.env.AUTH_SECRET || !mongoUri()) return null;
      const input = credentials.safeParse(raw);
      if (!input.success) return null;
      await mongo();
      const ip = request.headers.get("x-vercel-forwarded-for")?.split(",").at(-1)?.trim()
        ?? request.headers.get("x-real-ip") ?? "unknown";
      const visitor = createHmac("sha256", process.env.AUTH_SECRET).update(ip.slice(0, 120)).digest("hex");
      if (!await attempt(visitor, 8) || !await attempt("all", 30)) return null;
      const user = await Admin.findOne({ email: input.data.email, role: "admin" }).select("+passwordHash").lean();
      if (!await checkPassword(input.data.password, user?.passwordHash) || !user) return null;
      return { id: user._id.toString(), email: user.email, name: String(user.authVersion) };
    },
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.authVersion = Number(user.name);
        token.deadline = Date.now() + lifetime * 1000;
        delete token.name;
      }
      return typeof token.deadline === "number" && token.deadline > Date.now() ? token : null;
    },
    session({ session, token }) {
      session.adminId = token.sub;
      session.authVersion = typeof token.authVersion === "number" ? token.authVersion : undefined;
      return session;
    },
  },
  logger: { error(error) { console.error("Portfolio authentication failed:", error.name); } },
});

export const currentAdmin = cache(async () => {
  if (!process.env.AUTH_SECRET || !mongoUri()) return null;
  await connection();
  const session = await auth();
  if (!session?.adminId || !session.authVersion) return null;
  await mongo();
  const admin = await Admin.findOne({ _id: session.adminId, authVersion: session.authVersion, role: "admin" })
    .select("email").lean();
  return admin ? { id: admin._id.toString(), email: admin.email } : null;
});

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/login");
  return admin;
}
