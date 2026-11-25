import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CaseStudyView } from "@/components/case-study";
import { PortfolioSection } from "@/components/portfolio-view";
import { objectId, sectionKey, sectionLabels, type SectionKey } from "@/data/cms-schema";
import { requireAdmin } from "@/lib/auth";
import { ContentRevision, Project, Section } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { getPublishedPortfolio } from "@/server/portfolio/queries";

type Props = { params: Promise<{ kind: string; id: string }> };

async function Preview({ params }: Props) {
  await requireAdmin();
  const { kind, id } = await params;
  await mongo();
  let title = "Saved draft";
  let view;
  let back = "/admin";
  if (kind === "section") {
    const parsed = sectionKey.safeParse(id);
    if (!parsed.success) notFound();
    const section = await Section.findOne({ key: parsed.data }).lean();
    if (!section) notFound();
    const projects = section.key === "projects" ? (await getPublishedPortfolio()).projects : [];
    title = `${sectionLabels[section.key]} draft`;
    back = `/admin/sections/${section.key}`;
    view = <PortfolioSection section={section.key} version={section.draft} projects={projects} preview />;
  } else {
    if (!objectId.safeParse(id).success) notFound();
    if (kind === "project") {
      const project = await Project.findById(id).lean();
      if (!project || project.deleted) notFound();
      title = `${project.draft.name} draft`;
      back = `/admin/projects/${id}`;
      view = <CaseStudyView project={project.draft} preview />;
    } else if (kind === "revision") {
      const revision = await ContentRevision.findById(id).lean();
      if (!revision?.snapshot) notFound();
      title = `Revision ${revision.number}`;
      back = "/admin/revisions";
      if (revision.kind === "project" && "slug" in revision.snapshot) view = <CaseStudyView project={revision.snapshot} preview />;
      if (revision.kind === "section" && "content" in revision.snapshot) view = <PortfolioSection
        section={revision.key as SectionKey} version={revision.snapshot} preview />;
      if (revision.kind === "settings" && "title" in revision.snapshot) {
        const { title, description, openGraphDescription, name } = revision.snapshot;
        view = <div className="admin-card"><h2>{title}</h2><p>{name}</p><p>{description}</p><p>{openGraphDescription}</p></div>;
      }
    }
  }
  if (!view) notFound();
  return <><Link className="admin-back" href={back}>← Back to editor</Link><div className="admin-heading"><h1>{title}</h1></div>
    <div className="admin-preview-surface admin-preview-page" inert>{view}</div></>;
}

export default function PreviewPage({ params }: Props) {
  return <Suspense fallback={<p>Loading private preview…</p>}><Preview params={params} /></Suspense>;
}
