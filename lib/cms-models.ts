import mongoose, { Schema, type Model } from "mongoose";
import {
  contentTypes, projectSchema, sectionKeys, sectionVersion, settingsSchema, slugSchema,
  type ContentType, type ProjectContent, type SectionKey, type SectionVersion, type Settings,
} from "@/data/cms-schema";

export type Version = SectionVersion | ProjectContent | Settings;
export type AdminUser = { email: string; passwordHash: string; role: "admin"; authVersion: number };
export type Versioned<T> = {
  draft: T; published: T | null; revision: number; publishedAt?: Date; createdAt: Date; updatedAt: Date; __v: number;
};
export type SpotlightPublication = { publishedAt: Date; until: Date; summary: string };
export type SectionRecord = Versioned<SectionVersion> & { key: SectionKey; spotlight?: SpotlightPublication };
export type SettingsRecord = Versioned<Settings> & { key: "website" };
export type ProjectRecord = Versioned<ProjectContent> & {
  slugs: string[]; publishedSlugs: string[]; deleted: boolean; spotlight?: SpotlightPublication;
};
export type Revision = {
  kind: ContentType; key: string; number: number; snapshot: Version | null; deleted: boolean; draftOnly?: boolean;
  createdAt: Date; administrator: string; label: string;
};
export type MediaRecord = {
  publicId: string; type: "image" | "pdf"; format: string; bytes: number;
  filename: string; alt: string; createdAt: Date;
};

const opts = { strict: "throw" as const, timestamps: true, optimisticConcurrency: true };
const kinds = { type: String, enum: contentTypes, required: true };
const versions = (valid: (value: unknown) => boolean) => ({
  draft: { type: Schema.Types.Mixed, required: true, validate: valid },
  published: { type: Schema.Types.Mixed, default: null, validate: (value: unknown) => value == null || valid(value) },
  publishedAt: Date, revision: { type: Number, default: 0, required: true, min: 0 },
});
function model<T>(name: string, schema: Schema<T>, collection: string): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema, collection);
}

const admin = new Schema<AdminUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin"], default: "admin", required: true },
  authVersion: { type: Number, default: 1, min: 1 },
}, opts);

const spotlight = new Schema<SpotlightPublication>({
  publishedAt: { type: Date, required: true },
  until: { type: Date, required: true },
  summary: { type: String, required: true, maxlength: 160 },
}, { _id: false, strict: "throw" });

const section = new Schema<SectionRecord>({
  spotlight,
  key: { type: String, enum: sectionKeys, required: true, unique: true },
  ...versions(() => true),
}, opts);

section.pre("validate", function () {
  for (const field of ["draft", "published"] as const) {
    if (this[field] != null && !sectionVersion(this.key).safeParse(this[field]).success) {
      this.invalidate(field, "Invalid section content.");
    }
  }
});

const project = new Schema<ProjectRecord>({
  spotlight,
  ...versions(value => projectSchema.safeParse(value).success),
  slugs: { type: [String], validate: (values: string[]) => values.every(value => slugSchema.safeParse(value).success) },
  publishedSlugs: { type: [String], validate: (values: string[]) => values.every(value => slugSchema.safeParse(value).success) },
  deleted: { type: Boolean, default: false },
}, opts);
project.index({ slugs: 1 }, { unique: true });

const settings = new Schema<SettingsRecord>({
  ...versions(value => settingsSchema.safeParse(value).success),
  key: { type: String, enum: ["website"], required: true, unique: true },
}, opts);

const revision = new Schema<Revision>({
  kind: kinds, key: { type: String, required: true }, number: { type: Number, min: 1, required: true },
  snapshot: { type: Schema.Types.Mixed, default: null }, deleted: { type: Boolean, default: false }, draftOnly: { type: Boolean, default: false },
  administrator: { type: String, required: true }, label: { type: String, required: true },
}, { strict: "throw", timestamps: { createdAt: true, updatedAt: false } });
revision.index({ kind: 1, key: 1, number: 1 }, { unique: true });
revision.index({ createdAt: -1 });
revision.pre("validate", function () {
  if (this.snapshot == null && this.kind === "project" && this.deleted) return;
  const valid = ({
    settings: () => settingsSchema.safeParse(this.snapshot).success,
    project: () => projectSchema.safeParse(this.snapshot).success,
    section: () => sectionKeys.includes(this.key as SectionKey) &&
      sectionVersion(this.key as SectionKey).safeParse(this.snapshot).success,
  })[this.kind]?.();
  if (!valid) this.invalidate("snapshot", "Invalid published snapshot.");
});

const media = new Schema<MediaRecord>({
  publicId: { type: String, required: true, unique: true },
  type: { type: String, enum: ["image", "pdf"], required: true },
  format: { type: String, enum: ["jpg", "png", "webp", "pdf"], required: true },
  bytes: { type: Number, required: true, min: 1, max: 3145728 },
  filename: { type: String, required: true, maxlength: 150 },
  alt: { type: String, maxlength: 180, default: "" },
}, opts);
const throttle = new Schema<{ _id: string; count: number; expires: Date }>({
  _id: String,
  count: { type: Number, min: 0, required: true },
  expires: { type: Date, expires: 0, required: true },
}, { strict: "throw" });

export const Admin = model("PortfolioAdmin", admin, "admin_users");
export const Section = model("PortfolioSection", section, "portfolio_sections");
export const Project = model("PortfolioProject", project, "projects");
export const SiteSettings = model("PortfolioSettings", settings, "portfolio_settings");
export const ContentRevision = model("PortfolioRevision", revision, "content_revisions");
export const Media = model("PortfolioMedia", media, "portfolio_media");
export const LoginThrottle = model("PortfolioLoginThrottle", throttle, "login_rate_limits");
