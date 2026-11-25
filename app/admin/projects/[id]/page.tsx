import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Editor } from "@/components/admin/editor";
import { objectId } from "@/data/cms-schema";
import { blankProject } from "@/data/cms-seed";
import { requireAdmin } from "@/lib/auth";
import { Project } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { mediaChoices } from "@/server/portfolio/admin-queries";

type Props = { params: Promise<{ id: string }> };

async function EditProject({ params }: Props) {
  await requireAdmin();
  const { id: key } = await params;
  const creating = key === "new";
  if (!creating && !objectId.safeParse(key).success) notFound();
  await mongo();
  const [record, assets] = await Promise.all([
    creating ? null : Project.findById(key).lean(), mediaChoices(),
  ]);
  if (!creating && (!record || record.deleted)) notFound();
  return <>
    <Link className="admin-back" href="/admin/projects">← All projects</Link>
    <div className="admin-heading"><h1>{record?.draft.name ?? "New project"}</h1></div>
    <Editor key={key} identity={{ kind: "project", key }} draft={record?.draft ?? blankProject} published={record?.published}
      version={record?.__v ?? 0} assets={assets} previewLink={creating ? undefined : `/admin/preview/project/${key}`} />
  </>;
}

export default function EditProjectPage({ params }: Props) {
  return <Suspense fallback={<p>Loading editor…</p>}><EditProject params={params} /></Suspense>;
}
