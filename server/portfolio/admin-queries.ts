import "server-only";
import { isDeepStrictEqual } from "node:util";
import { Media } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";

export async function mediaChoices() {
  await mongo();
  const assets = await Media.find().sort({ createdAt: -1 }).select("type filename alt").lean();
  return assets.map(asset => ({ id: asset._id.toString(), type: asset.type, filename: asset.filename, alt: asset.alt }));
}

export function hasChanges(draft: unknown, published: unknown) {
  return !isDeepStrictEqual(draft, published);
}

export function formatDate(date?: Date | null) {
  return date ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(date) : "—";
}
