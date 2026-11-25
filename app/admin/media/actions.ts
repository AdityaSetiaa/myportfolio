"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { objectId } from "@/data/cms-schema";
import { requireAdmin } from "@/lib/auth";
import { Media } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";

export async function saveAlt(id: string, _previous: string, form: FormData) {
  await requireAdmin();
  const input = z.object({ id: objectId, alt: z.string().trim().max(180) }).safeParse({ id, alt: form.get("alt") });
  if (!input.success) return "Use at most 180 characters of alt text.";
  try {
    await mongo();
    await Media.updateOne({ _id: input.data.id }, { $set: { alt: input.data.alt } }, { runValidators: true });
    revalidatePath("/admin", "layout");
    return "Alt text saved.";
  } catch {
    return "Alt text could not be saved.";
  }
}
