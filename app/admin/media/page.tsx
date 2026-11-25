import Image from "next/image";
import { Suspense } from "react";
import { MediaAlt, UploadMedia } from "@/components/admin/media-controls";
import { assetUrl } from "@/data/cms-schema";
import { requireAdmin } from "@/lib/auth";
import { cloudStorage } from "@/lib/cloudinary";
import { Media } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { getPublishedPortfolio, publishedMedia } from "@/server/portfolio/queries";

async function MediaLibrary() {
  await requireAdmin();
  await mongo();
  const [assets, portfolio] = await Promise.all([Media.find().sort({ createdAt: -1 }).lean(), getPublishedPortfolio()]);
  const inUse = publishedMedia(portfolio);
  return <>
    <div className="admin-heading"><h1>Media</h1></div>
    <section className="admin-card admin-upload">
      <h2>Upload an asset</h2>
      <p>JPEG, PNG, WebP or PDF up to 3 MB. To replace a file, upload the new asset and select it in the editor. Older files remain available to revisions.</p>
      {cloudStorage() ? <UploadMedia /> : <p>Configure Cloudinary to enable uploads.</p>}
    </section>
    <div className="admin-grid">{assets.map(asset => {
      const id = asset._id.toString();
      return <article className="admin-card admin-asset" key={id}>
        {asset.type === "image" && <Image unoptimized width={320} height={180} src={assetUrl(id)} alt={asset.alt} />}
        <h2>{asset.filename}</h2>
        <p>{asset.format.toUpperCase()} · {Math.ceil(asset.bytes / 1024)} KB · {inUse.has(id) ? "Published" : "Private"}</p>
        <a className="admin-back" href={assetUrl(id)} target="_blank" rel="noopener">Open asset ↗</a>
        <MediaAlt id={id} alt={asset.alt} />
      </article>;
    })}</div>
  </>;
}

export default function MediaPage() {
  return <Suspense fallback={<p>Loading assets…</p>}><MediaLibrary /></Suspense>;
}
