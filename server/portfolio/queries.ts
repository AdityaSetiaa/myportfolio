import "server-only";
import { createHash } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { assetUrl, sectionKeys, type ProjectContent, type SectionKey, type SectionVersion, type Settings } from "@/data/cms-schema";
import { seedProjects, seedSections, seedSettings } from "@/data/cms-seed";
import { Project, Section, SiteSettings } from "@/lib/cms-models";
import { isMongoUnavailable, mongo, mongoUri } from "@/lib/mongodb";

export const portfolioTag = "published-portfolio";

export type PortfolioContent = {
  sections: Partial<Record<SectionKey, SectionVersion>>;
  projects: ProjectContent[];
  aliases: Record<string, string>;
  settings: Settings;
};

const original: PortfolioContent = { sections: seedSections, projects: seedProjects, aliases: {}, settings: seedSettings };

let lastPublished: PortfolioContent | undefined;

async function readPublishedPortfolio(): Promise<PortfolioContent> {
  await mongo();
  const [settings, sections, projects] = await Promise.all([
    SiteSettings.findOne({ key: "website" }).select("published").lean(),
    Section.find({ published: { $ne: null } }).select("published key").lean(),
    Project.find({ published: { $ne: null }, deleted: false })
      .select("published publishedSlugs").sort({ "published.order": 1, "published.name": 1 }).lean(),
  ]);
  if (!settings?.published) return original;

  return {
    settings: settings.published,
    sections: Object.fromEntries(sections.map(section => [section.key, section.published])),
    projects: projects.flatMap(project => project.published ? [project.published] : []),
    aliases: Object.fromEntries(projects.flatMap(project => project.published
      ? project.publishedSlugs.map(slug => [slug, project.published!.slug] as const)
      : [])),
  };
}

export async function getPublishedPortfolio() {
  "use cache";
  cacheTag(portfolioTag);
  let content = original;
  let databaseUnavailable = false;

  if (mongoUri()) {
    try {
      content = await readPublishedPortfolio();
      lastPublished = content;
    } catch (error) {
      if (!isMongoUnavailable(error)) throw error;
      content = lastPublished ?? original;
      databaseUnavailable = true;
      console.warn("MongoDB temporarily unavailable. Serving fallback portfolio content.", error.name);
    }
  }

  cacheLife({ stale: 300, revalidate: databaseUnavailable ? 10 : 60, expire: databaseUnavailable ? 300 : 900 });
  const generation = createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 24);
  return { ...content, generation, databaseUnavailable };
}

export function orderedSections(portfolio: PortfolioContent) {
  return sectionKeys.filter(key => portfolio.sections[key]?.visible)
    .sort((left, right) => portfolio.sections[left]!.order - portfolio.sections[right]!.order);
}

export function resumeLink(settings: Settings) {
  return settings.resumeAsset ? assetUrl(settings.resumeAsset) : settings.resumeUrl;
}

export function publishedMedia(portfolio: PortfolioContent) {
  return new Set([
    portfolio.settings.openGraphImage, portfolio.settings.resumeAsset,
    ...portfolio.projects.flatMap(project => [project.thumbnail?.id ?? "", ...project.images.map(image => image.id)]),
  ]);
}
