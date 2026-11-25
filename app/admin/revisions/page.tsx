import { Suspense } from "react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { sectionLabels, type SectionKey } from "@/data/cms-schema";
import { requireAdmin } from "@/lib/auth";
import { ContentRevision } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { formatDate } from "@/server/portfolio/admin-queries";
import { restoreContent } from "../actions";

type Props = { searchParams: Promise<{ page?: string }> };
const pageSize = 30;

async function Revisions({ searchParams }: Props) {
  await requireAdmin();
  const value = Number((await searchParams).page);
  const requested = Number.isSafeInteger(value) && value > 0 ? value : 1;
  await mongo();
  const total = await ContentRevision.countDocuments();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, pages);
  const records = await ContentRevision.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean();
  return <>
    <div className="admin-heading"><h1>Revisions</h1></div>
    <div className="admin-list">{records.map(record => {
      const project = record.kind === "project" && record.snapshot && "slug" in record.snapshot ? record.snapshot : null;
      const name = record.kind === "section" ? sectionLabels[record.key as SectionKey] : project?.name ?? "Website settings";
      return <article className="admin-card admin-list-row" key={record._id.toString()}>
        <div><h2>{name}</h2><p>Revision {record.number} · {record.label}</p>
          <small>{formatDate(record.createdAt)}{project && ` · /projects/${project.slug}`}</small></div>
        <div className="admin-inline">
          {record.snapshot && <a className="admin-secondary" target="_blank" rel="noopener" href={`/admin/preview/revision/${record._id}`}>View snapshot ↗</a>}
          {record.snapshot && <ConfirmAction label="Restore" question={record.draftOnly
            ? "Recover this unpublished project draft?" : "Publish this revision and replace the current draft?"}
            action={restoreContent.bind(null, record._id.toString())} />}
        </div>
      </article>;
    })}</div>
    {!records.length && <p>No publications yet.</p>}
    {pages > 1 && <nav className="admin-inline admin-pagination" aria-label="Revision pages">
      {page > 1 && <a href={`?page=${page - 1}`}>← Newer</a>}<span>Page {page} of {pages}</span>
      {page < pages && <a href={`?page=${page + 1}`}>Older →</a>}
    </nav>}
  </>;
}

export default function RevisionsPage({ searchParams }: Props) {
  return <Suspense fallback={<p>Loading revisions…</p>}><Revisions searchParams={searchParams} /></Suspense>;
}
