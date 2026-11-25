import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { sectionLabels } from "@/data/cms-schema";
import { ContentRevision, Project, Section, SiteSettings } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { dashboardSpotlights } from "@/server/portfolio/spotlight";
import { formatDate, hasChanges } from "@/server/portfolio/admin-queries";

async function Dashboard() {
  await requireAdmin();
  await mongo();
  const [projects, sections, settings, revisions] = await Promise.all([
    Project.find({ deleted: false }).select("draft published publishedAt spotlight").lean(),
    Section.find().select("key draft published publishedAt spotlight").lean(),
    SiteSettings.findOne({ key: "website" }).select("draft published").lean(),
    ContentRevision.find().sort({ createdAt: -1 }).limit(8).select("createdAt label snapshot kind key").lean(),
  ]);
  const spotlights = dashboardSpotlights(sections, projects);
  const stats = [
    ["Published projects", projects.filter(project => project.published).length],
    ["Portfolio sections", sections.length],
    ["Unpublished changes", [...projects, ...sections, ...(settings ? [settings] : [])].filter(item => hasChanges(item.draft, item.published)).length],
    ["Last publication", formatDate(revisions[0]?.createdAt)],
  ];
  return <>
    <div className="admin-heading"><h1>Dashboard</h1><Link href="/admin/sections" className="admin-secondary">Manage sections</Link></div>
    <div className="admin-stats">{stats.map(([label, value]) => <div className="admin-card" key={label}>
      <span>{label}</span><strong>{value}</strong>
    </div>)}</div>
    <section className="admin-card admin-spotlight-status">
      <div className="admin-heading"><h2>Mario Spotlight</h2></div>
      <div className="admin-feed">
        {spotlights.map(item => <div key={item.section}>
          <span>{sectionLabels[item.section]} <small>{item.status}</small></span>
          <small>Published {formatDate(item.publishedAt)} · Spotlight ends {formatDate(item.until)}</small>
        </div>)}
      </div>
    </section>
    <section className="admin-card">
      <div className="admin-heading"><h2>Recent publications</h2><Link href="/admin/revisions" className="admin-back">View revisions</Link></div>
      <div className="admin-feed">{revisions.map(revision => <div key={revision._id.toString()}>
        <span>{revision.label} <small>{revision.kind === "project" && revision.snapshot && "name" in revision.snapshot ? revision.snapshot.name : revision.key}</small></span>
        <time dateTime={revision.createdAt.toISOString()}>{formatDate(revision.createdAt)}</time>
      </div>)}</div>
    </section>
  </>;
}

export default function DashboardPage() {
  return <Suspense fallback={<p>Loading dashboard…</p>}><Dashboard /></Suspense>;
}
