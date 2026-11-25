import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Editor } from "@/components/admin/editor";
import { sectionKey, sectionLabels } from "@/data/cms-schema";
import { requireAdmin } from "@/lib/auth";
import { Section } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { getPublishedPortfolio } from "@/server/portfolio/queries";

type Props = { params: Promise<{ section: string }> };

async function EditSection({ params }: Props) {
  await requireAdmin();
  const parsed = sectionKey.safeParse((await params).section);
  if (!parsed.success) notFound();
  const key = parsed.data;
  await mongo();
  const record = await Section.findOne({ key }).lean();
  if (!record) notFound();
  const portfolio = key === "projects" ? await getPublishedPortfolio() : null;
  return <>
    <Link className="admin-back" href="/admin/sections">← All sections</Link>
    <div className="admin-heading"><h1>{sectionLabels[key]}</h1></div>
    <Editor key={key} identity={{ kind: "section", key }} draft={record.draft} published={record.published}
      version={record.__v} assets={[]} previewProjects={portfolio?.projects} previewLink={`/admin/preview/section/${key}`} />
  </>;
}

export default function EditSectionPage({ params }: Props) {
  return <Suspense fallback={<p>Loading section…</p>}><EditSection params={params} /></Suspense>;
}
