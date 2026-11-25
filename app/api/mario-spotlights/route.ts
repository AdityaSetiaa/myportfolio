import { createHash } from "node:crypto";
import { spotlightFeed } from "@/server/portfolio/spotlight";

export async function GET(request: Request) {
  const previous = request.headers.get("if-none-match");
  try {
    const body = JSON.stringify(await spotlightFeed());
    const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
    const headers = { "Cache-Control": "public, max-age=8, must-revalidate", ETag: etag };
    if (previous === etag) return new Response(null, { status: 304, headers });
    return new Response(body, { headers: { ...headers, "Content-Type": "application/json" } });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
