import "server-only";
import { isDeepStrictEqual } from "node:util";
import { cacheLife, cacheTag } from "next/cache";
import { sectionKeys, sectionLabels, type ProjectContent, type SectionKey, type SectionVersion } from "@/data/cms-schema";
import { activeSpotlight, type MarioSpotlight, type SpotlightFeed } from "@/data/mario-spotlight";
import { Project, Section, type SpotlightPublication } from "@/lib/cms-models";
import { mongo, mongoUri } from "@/lib/mongodb";
import { portfolioTag } from "./queries";

function setting(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function configuration() {
  const eligibleHours = setting("MARIO_SPOTLIGHT_HOURS", 72, 1, 168);
  const freshHours = setting("MARIO_SPOTLIGHT_FRESH_HOURS", 24, 1, 168);
  const visitMin = setting("MARIO_SPOTLIGHT_VISIT_MIN_SECONDS", 20, 8, 45);
  return {
    eligibleFor: eligibleHours * 3600000,
    freshFor: Math.min(eligibleHours, freshHours) * 3600000,
    visitMin: visitMin * 1000,
    visitMax: Math.max(visitMin, setting("MARIO_SPOTLIGHT_VISIT_MAX_SECONDS", 35, 8, 45)) * 1000,
    pollEvery: setting("MARIO_SPOTLIGHT_POLL_SECONDS", 45, 10, 180) * 1000,
  };
}

function publication(date: Date, summary: string): SpotlightPublication {
  return { publishedAt: date, until: new Date(date.getTime() + configuration().eligibleFor), summary };
}

export function sectionPublication(key: SectionKey, before: SectionVersion | null, after: SectionVersion, date: Date) {
  if (isDeepStrictEqual(before, after)) return undefined;
  const subject = sectionLabels[key];
  const summary = before?.visible !== after.visible
    ? after.visible ? `Made the ${subject} section visible.` : `Hid the ${subject} section.`
    : isDeepStrictEqual(before.content, after.content)
      ? `Changed the display order of the ${subject} section.`
      : `Updated the ${subject} section content.`;
  return publication(date, summary);
}

const projectChanges = {
  name: "title", slug: "address", description: "description", fullDescription: "overview",
  highlights: "features", stack: "technologies", architecture: "architecture", images: "screenshots",
  security: "security details", outcome: "outcomes",
} as const;

export function projectPublication(before: ProjectContent | null, after: ProjectContent, date: Date, restored = false) {
  if (restored) return publication(date, "Restored a project to the published portfolio.");
  if (isDeepStrictEqual(before, after)) return undefined;
  if (!before) return publication(date, "Published a new project.");
  const changed = Object.entries(projectChanges)
    .filter(([key]) => !isDeepStrictEqual(before[key as keyof typeof projectChanges], after[key as keyof typeof projectChanges]))
    .map(([, label]) => label).slice(0, 3);
  return publication(date, changed.length ? `Updated project ${changed.join(", ")}.` : "Updated the published project.");
}

type DashboardPublication = {
  spotlight?: SpotlightPublication; publishedAt?: Date;
};
type DashboardSection = DashboardPublication & { key: SectionKey; published: SectionVersion | null };
type DashboardProject = DashboardPublication & { published: ProjectContent | null };

export function dashboardSpotlights(sections: DashboardSection[], projects: DashboardProject[]) {
  const now = Date.now();
  return sectionKeys.map(section => {
    const current = sections.find(item => item.key === section);
    const work = section === "projects" ? projects.filter(item => item.published) : [];
    const all = current ? [current, ...work] : work;
    const publishedAt = Math.max(0, ...all.map(item => item.publishedAt?.getTime() ?? 0));
    const candidates = current?.published?.visible ? all : work;
    const sort = (items: DashboardPublication[]) => items.flatMap(item => item.spotlight ? [item.spotlight] : [])
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    const eligible = sort(candidates).find(item => item.until.getTime() > now);
    const latest = eligible ?? sort(all)[0];
    return {
      section, publishedAt: publishedAt ? new Date(publishedAt) : null,
      status: eligible ? "Eligible" : latest && latest.until.getTime() <= now ? "Expired" : "Inactive",
      until: latest?.until,
    };
  });
}

type SpotlightDetail = MarioSpotlight & { summary: string; title?: string };

function entry(section: SectionKey, spotlight: SpotlightPublication, project?: { slug: string; name: string }): SpotlightDetail {
  return {
    section, publishedAt: spotlight.publishedAt.getTime(), until: spotlight.until.getTime(),
    summary: spotlight.summary,
    ...(project ? { project: project.slug, title: project.name } : {}),
  };
}

async function readSpotlights(): Promise<SpotlightDetail[]> {
  "use cache";
  cacheTag(portfolioTag);
  cacheLife({ revalidate: 45, expire: 300 });
  if (!mongoUri()) return [];
  await mongo();
  const sections = await Section.find({ "published.visible": true }).select("key spotlight").lean();
  const updates = sections.flatMap(item => item.spotlight ? [entry(item.key, item.spotlight)] : []);
  const projects = await Project.find({ deleted: false, published: { $ne: null }, "spotlight.until": { $gt: new Date() } })
    .select("spotlight published.slug published.name")
    .sort({ "spotlight.publishedAt": -1 }).limit(8).lean();
  for (const project of projects) {
    if (project.spotlight && project.published) updates.push(entry("projects", project.spotlight, project.published));
  }
  return updates.sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function activeSpotlights() {
  const now = Date.now();
  return (await readSpotlights()).filter(item => activeSpotlight(item, now));
}

export async function spotlightFeed(): Promise<SpotlightFeed> {
  const { freshFor, visitMin, visitMax, pollEvery } = configuration();
  const updates = (await activeSpotlights()).map(({ section, project, publishedAt, until }) => ({ section, project, publishedAt, until }));
  return { updates, freshFor, visitMin, visitMax, pollEvery };
}
