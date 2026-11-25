import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UploadApiResponse } from "cloudinary";
import { currentAdmin } from "@/lib/auth";
import { cloudStorage } from "@/lib/cloudinary";
import { Media } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";

const max = 3 * 1024 * 1024;
const bodyLimit = max + 32 * 1024;

function fileFormat(bytes: Buffer, mime: string) {
  if (mime === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "jpg";
  if (mime === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (mime === "image/webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "webp";
  if (mime === "application/pdf" && bytes.subarray(0, 5).toString() === "%PDF-") return "pdf";
  return null;
}

async function readForm(request: Request) {
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (!reader) return null;
  let count = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    count += value.byteLength;
    if (count > bodyLimit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new Response(new Blob(chunks as BlobPart[]), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : new URL(request.url).origin;
  if (origin !== allowedOrigin) return Response.json({ message: "Invalid request origin." }, { status: 403 });
  if (!await currentAdmin()) return Response.json({ message: "Sign in to upload files." }, { status: 401 });
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) {
    return Response.json({ message: "Choose a file to upload." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length")) > bodyLimit) return Response.json({ message: "The upload limit is 3 MB." }, { status: 413 });
  const form = await readForm(request).catch(() => null);
  if (!form) return Response.json({ message: "The upload was invalid or exceeded 3 MB." }, { status: 400 });
  const file = form.get("file");
  const rawAlt = z.string().trim().max(180).safeParse(form.get("alt") ?? "");
  if (!(file instanceof File) || file.size === 0 || file.size > max || !rawAlt.success) {
    return Response.json({ message: "Select a file up to 3 MB and use at most 180 characters of alt text." }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const format = fileFormat(buffer, file.type);
  if (!format) return Response.json({ message: "Upload a valid PNG, JPEG, WebP, or PDF." }, { status: 415 });
  const storage = cloudStorage();
  if (!storage) return Response.json({ message: "Cloudinary is not configured." }, { status: 503 });
  const basename = file.name.split(/[\\/]/).at(-1) ?? "Asset";
  const filename = basename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 150) || "Asset";
  const publicId = `portfolio/${randomUUID()}`;
  let uploaded = false;
  let id: string;
  try {
    await mongo();
    const asset = await new Promise<UploadApiResponse>((resolve, reject) => {
      storage.uploader.upload_stream({
        public_id: publicId, type: "authenticated", resource_type: "image", allowed_formats: [format], overwrite: false, timeout: 20000,
      }, (error, result) => error || !result ? reject(error ?? new Error("Upload failed")) : resolve(result)).end(buffer);
    });
    uploaded = true;
    if (asset.format !== format) throw new Error("Unexpected format returned by storage");
    const record = await Media.create({
      publicId, type: format === "pdf" ? "pdf" : "image", format,
      bytes: asset.bytes, filename, alt: rawAlt.data,
    });
    id = record.id;
  } catch (error) {
    if (uploaded) {
      const saved = await Media.exists({ publicId }).catch(() => undefined);
      if (saved === null) await storage.uploader.destroy(publicId, { type: "authenticated", resource_type: "image" }).catch(() => {});
    }
    console.error("Portfolio media upload failed:", error instanceof Error ? error.name : "Storage error");
    return Response.json({ message: "The upload could not be saved." }, { status: 502 });
  }
  revalidatePath("/admin", "layout");
  return Response.json({ message: "Asset uploaded.", id }, { status: 201 });
}
