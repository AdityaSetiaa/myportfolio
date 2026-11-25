import Link from "next/link";
import { Suspense } from "react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { requireAdmin } from "@/lib/auth";
import { Project } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { formatDate, hasChanges } from "@/server/portfolio/admin-queries";
import { archiveContent } from "../actions";

async function Projects() {
  await requireAdmin();
  await mongo();
  const records = await Project.find().sort({ deleted: 1, "draft.order": 1 }).lean();
  return <>
    <div className="admin-heading"><h1>Projects</h1><div className="admin-inline">
      <Link className="admin-secondary" href="/admin/sections/projects">Edit project section</Link>
      <Link className="admin-primary" href="/admin/projects/new">Add project</Link>
    </div></div>
    <div className="admin-list">
      {records.map(record => {
        const key = record._id.toString();
        const expected = record.__v;
        return <article className="admin-card admin-list-row" key={key}>
          <div><h2>{record.draft.name}</h2><p>/projects/{record.draft.slug}</p>
            <small>{record.deleted ? "Archived" : record.published
              ? hasChanges(record.draft, record.published) ? "Published with draft changes" : "Published"
              : "Draft"}{record.draft.featured && " · Featured"} · Updated {formatDate(record.updatedAt)}</small></div>
          {record.deleted ? <Link className="admin-secondary" href="/admin/revisions">Recover from revisions</Link>
            : <div className="admin-inline">
              <Link className="admin-secondary" href={`/admin/projects/${key}`}>Edit</Link>
              <Link className="admin-secondary" href={`/admin/preview/project/${key}`} target="_blank" rel="noopener">Preview ↗</Link>
              <ConfirmAction label="Archive" question="Archive this project and remove its public page?" alert
                action={archiveContent.bind(null, { key, expected })} />
            </div>}
        </article>;
      })}
      {!records.length && <p>No projects yet.</p>}
    </div>
  </>;
}

export default function ProjectsPage() {
  return <Suspense fallback={<p>Loading projects…</p>}><Projects /></Suspense>;
}
