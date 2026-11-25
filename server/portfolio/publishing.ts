import "server-only";
import type { ClientSession } from "mongoose";
import { objectId, projectSchema, sectionKey, sectionVersion, settingsSchema, type ContentType, type ProjectContent, type Settings } from "@/data/cms-schema";
import { ContentRevision, Media, Project, Section, SiteSettings, type Version } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { projectPublication, sectionPublication } from "./spotlight";

export class ContentError extends Error {}

function checkVersion(expected: number, actual: number) {
  if (actual !== expected) throw new ContentError("This content changed in another tab. Reload before editing it again.");
}

async function checkMedia(kind: ContentType, value: Version, session: ClientSession) {
  if (kind === "section") return;
  const assets = new Map<string, "pdf" | "image">();
  if (kind === "settings") {
    const settings = value as Settings;
    if (settings.openGraphImage) assets.set(settings.openGraphImage, "image");
    if (settings.resumeAsset) assets.set(settings.resumeAsset, "pdf");
  } else {
    const project = value as ProjectContent;
    if (project.thumbnail) assets.set(project.thumbnail.id, "image");
    for (const image of project.images) assets.set(image.id, "image");
  }
  if (!assets.size) return;
  const records = await Media.find({ _id: { $in: [...assets.keys()] } }).select("type").session(session).lean();
  if (records.length !== assets.size || records.some(record => assets.get(record._id.toString()) !== record.type)) {
    throw new ContentError("A selected media asset is missing or has the wrong file type.");
  }
}

type Context = { kind: ContentType; key: string; admin: string; session: ClientSession };

function addRevision({ kind, key, admin, session }: Context, number: number, snapshot: Version | null, label: string, deleted = false, draftOnly = false) {
  return new ContentRevision({ kind, key, administrator: admin, number, snapshot, label, deleted, draftOnly }).save({ session });
}

type Write = { kind: ContentType; key: string; input: unknown; expected: number; publish: boolean; admin: string };

export async function writeContent({ kind, key, input, expected, publish, admin }: Write) {
  const connection = await mongo();
  return connection.transaction(async session => {
    if (kind === "section") {
      const section = sectionKey.parse(key);
      const value = sectionVersion(section).parse(input);
      const record = await Section.findOne({ key: section }).session(session);
      if (!record) throw new ContentError("This section has not been initialized.");
      checkVersion(expected, record.__v);
      record.draft = value;
      if (publish) {
        const date = new Date();
        const update = sectionPublication(section, record.published, value, date);
        if (update) record.spotlight = update;
        record.published = value;
        record.publishedAt = date;
        await addRevision({ kind, key, admin, session }, ++record.revision, value, "Published section");
      }
      record.increment();
      await record.save({ session });
      return { key, version: record.__v };
    }
    if (kind === "settings") {
      const value = settingsSchema.parse(input);
      await checkMedia(kind, value, session);
      const record = await SiteSettings.findOne({ key: "website" }).session(session);
      if (!record) throw new ContentError("Website settings have not been initialized.");
      checkVersion(expected, record.__v);
      record.draft = value;
      if (publish) {
        record.published = value;
        record.publishedAt = new Date();
        await addRevision({ kind, key: "website", admin, session }, ++record.revision, value, "Published settings");
      }
      record.increment();
      await record.save({ session });
      return { key: "website", version: record.__v };
    }

    const value = projectSchema.parse(input);
    await checkMedia(kind, value, session);
    const record = key === "new" ? new Project({ draft: value }) : await Project.findById(objectId.parse(key)).session(session);
    if (!record || record.deleted) throw new ContentError("This project is unavailable. It may have been archived.");
    if (!record.isNew) checkVersion(expected, record.__v);
    record.draft = value;
    if (publish) {
      const date = new Date();
      const update = projectPublication(record.published, value, date);
      if (update) record.spotlight = update;
      record.published = value;
      record.publishedAt = date;
      record.publishedSlugs = [...new Set([...record.publishedSlugs, value.slug])];
      await addRevision({ kind, key: record.id, admin, session }, ++record.revision, value, "Published project");
    }
    record.slugs = [...new Set([...record.publishedSlugs, value.slug])];
    if (!record.isNew) record.increment();
    await record.save({ session });
    return { key: record.id as string, version: record.__v };
  });
}

export async function archiveProject(key: string, expected: number, admin: string) {
  const connection = await mongo();
  await connection.transaction(async session => {
    const record = await Project.findById(objectId.parse(key)).session(session);
    if (!record || record.deleted) throw new ContentError("This project is already unavailable.");
    checkVersion(expected, record.__v);
    if (!record.published) {
      await addRevision({ kind: "project", key, admin, session }, ++record.revision, record.draft, "Archived unpublished draft", true, true);
    } else {
      await addRevision({ kind: "project", key, admin, session }, ++record.revision, record.published, "Archived project", true);
    }
    record.deleted = true;
    record.publishedAt = new Date();
    record.increment();
    await record.save({ session });
  });
}

export async function restoreRevision(id: string, admin: string) {
  const connection = await mongo();
  return connection.transaction(async session => {
    const old = await ContentRevision.findById(objectId.parse(id)).session(session).lean();
    if (!old?.snapshot) throw new ContentError("This revision is unavailable.");
    const { kind, key } = old;
    const restoredLabel = `Restored revision ${old.number}`;
    await checkMedia(kind, old.snapshot, session);
    const record = kind === "section" ? await Section.findOne({ key: sectionKey.parse(key) }).session(session)
      : kind === "settings" ? await SiteSettings.findOne({ key: "website" }).session(session)
        : await Project.findById(objectId.parse(key)).session(session);
    if (!record) throw new ContentError("This content is unavailable.");
    const snapshot = old.snapshot;
    const neverPublished = old.draftOnly === true;
    const date = new Date();
    if (!neverPublished) {
      if ("key" in record && record.key !== "website" && "content" in snapshot) {
        const update = sectionPublication(record.key, record.published, snapshot, date);
        if (update) record.spotlight = update;
      }
      if ("publishedSlugs" in record) {
        const update = projectPublication(record.published, projectSchema.parse(snapshot), date, record.deleted);
        if (update) record.spotlight = update;
      }
    }
    record.set("draft", snapshot);
    if (!neverPublished) record.set("published", snapshot);
    if ("publishedSlugs" in record) {
      const project = projectSchema.parse(snapshot);
      if (!neverPublished || !record.published) record.deleted = false;
      if (!neverPublished) record.publishedSlugs = [...new Set([...record.publishedSlugs, project.slug])];
      record.slugs = [...new Set([...record.publishedSlugs, project.slug])];
    }
    if (!neverPublished) record.publishedAt = date;
    const label = neverPublished ? "Recovered unpublished draft" : restoredLabel;
    await addRevision({ kind, key, admin, session }, ++record.revision, snapshot, label, false, neverPublished);
    record.increment();
    await record.save({ session });
  });
}
