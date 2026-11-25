"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { contentTypes, objectId } from "@/data/cms-schema";
import { requireAdmin, signOut } from "@/lib/auth";
import { archiveProject, ContentError, restoreRevision, writeContent } from "@/server/portfolio/publishing";
import { portfolioTag } from "@/server/portfolio/queries";

const identity = z.object({ kind: z.enum(contentTypes), key: z.string().max(32), expected: z.number().int().min(0) });
const writeSchema = identity.extend({ input: z.unknown(), publish: z.boolean() });

function refreshPublic() {
  updateTag(portfolioTag);
  revalidatePath("/", "layout");
}

function explain(error: unknown) {
  if (error instanceof ContentError) return error.message;
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    return [first?.path.join(" › "), first?.message ?? "Check the form fields."].filter(Boolean).join(". ");
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return "That slug is already reserved by another project.";
  }
  if (error instanceof Error && error.name === "VersionError") return "This content changed in another tab. Reload and try again.";
  console.error("Portfolio content operation failed:", error instanceof Error ? error.name : "Unknown error");
  return "The update could not be saved. Try again.";
}

export async function saveContent(payload: unknown) {
  const admin = await requireAdmin();
  try {
    const update = writeSchema.parse(payload);
    const result = await writeContent({ ...update, admin: admin.id });
    if (update.publish) refreshPublic();
    else revalidatePath("/admin", "layout");
    return { ok: true as const, ...result, message: update.publish ? "Published successfully." : "Draft saved." };
  } catch (error) {
    return { ok: false as const, message: explain(error) };
  }
}

export async function archiveContent(payload: unknown) {
  const admin = await requireAdmin();
  try {
    const { key, expected } = identity.pick({ key: true, expected: true }).parse(payload);
    await archiveProject(key, expected, admin.id);
    refreshPublic();
    return { ok: true as const, message: "Project archived. It can be recovered from Revisions." };
  } catch (error) {
    return { ok: false as const, message: explain(error) };
  }
}

export async function restoreContent(payload: unknown) {
  const admin = await requireAdmin();
  try {
    await restoreRevision(objectId.parse(payload), admin.id);
    refreshPublic();
    return { ok: true as const, message: "Revision restored." };
  } catch (error) {
    return { ok: false as const, message: explain(error) };
  }
}

export async function logout() {
  await requireAdmin();
  await signOut({ redirectTo: "/login" });
}
