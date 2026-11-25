import { objectId } from "@/data/cms-schema";
import { currentAdmin } from "@/lib/auth";
import { cloudStorage } from "@/lib/cloudinary";
import { Media } from "@/lib/cms-models";
import { isMongoUnavailable, mongo } from "@/lib/mongodb";
import { getPublishedPortfolio, publishedMedia } from "@/server/portfolio/queries";

export async function GET(_request: Request, { params }: RouteContext<"/media/[id]">) {
  const { id } = await params;
  const missing = new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  if (!objectId.safeParse(id).success) return missing;
  const storage = cloudStorage();
  if (!storage) return missing;
  const unavailable = () => new Response(null, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  try {
    const portfolio = await getPublishedPortfolio();
    if (portfolio.databaseUnavailable) return unavailable();
    if (!publishedMedia(portfolio).has(id) && !await currentAdmin()) return missing;

    await mongo();
    const asset = await Media.findById(id).lean();
    if (!asset) return missing;
    const url = storage.url(asset.publicId, { sign_url: true, secure: true, type: "authenticated", resource_type: "image", format: asset.format });
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok || !response.body) return missing;
    const contentTypes = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
    const mime = contentTypes[asset.format as keyof typeof contentTypes];
    if (!mime) return missing;
    const headers = {
      "Content-Type": mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      ...(asset.type === "pdf" ? { "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(asset.filename) } : {}),
    };
    return new Response(response.body, { headers });
  } catch (error) {
    return isMongoUnavailable(error) ? unavailable() : missing;
  }
}
