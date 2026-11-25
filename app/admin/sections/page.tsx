import Link from "next/link";
import { Suspense } from "react";
import { sectionLabels } from "@/data/cms-schema";
import { requireAdmin } from "@/lib/auth";
import { Section } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { formatDate, hasChanges } from "@/server/portfolio/admin-queries";

async function Sections() {
  await requireAdmin();
  await mongo();
  const records = await Section.find().sort({ "draft.order": 1 }).lean();
  return <>
    <div className="admin-heading"><h1>Sections</h1></div>
    {!records.length && <p>Run the portfolio migration to initialize the section editors.</p>}
    <div className="admin-grid">{records.map(record => <section className="admin-card" key={record.key}>
      <h2>{sectionLabels[record.key]}</h2>
      <p>{record.published?.visible ? "Visible" : "Hidden"} · {hasChanges(record.draft, record.published) ? "Draft changes" : "Published"}</p>
      <small>Updated {formatDate(record.updatedAt)}</small>
      <Link className="admin-secondary" href={`/admin/sections/${record.key}`}>Edit {sectionLabels[record.key]}</Link>
    </section>)}</div>
  </>;
}

export default function SectionsPage() {
  return <Suspense fallback={<p>Loading sections…</p>}><Sections /></Suspense>;
}
