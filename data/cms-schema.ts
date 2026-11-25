import { z } from "zod";

const short = z.string().trim().min(1).max(180);
const optional = z.string().trim().max(180);
const text = z.string().trim().max(6000);
const list = (max = 30) => z.array(short).max(max);
const external = z.url({ protocol: /^https?$/ }).max(2048);
const target = z.union([z.string().regex(/^(?:\/(?!\/)[\w./%#?&=+-]*|#[\w-]+)$/), external]);
const blankLink = z.union([z.literal(""), external]);
export const objectId = z.string().regex(/^[a-f0-9]{24}$/);
export const slugSchema = z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");
export const orderSchema = z.coerce.number().int().min(0).max(9999);

const heading = { label: short, heading: short, highlight: optional };
const fact = z.strictObject({ label: short, value: short, detail: optional });
const job = z.strictObject({
  title: short, company: short, kind: optional, location: optional, start: short, end: optional, current: z.boolean(),
  intro: text, responsibilities: z.array(text.min(1)).max(30), achievements: z.array(text.min(1)).max(30), stack: list(),
});
const skillGroup = z.strictObject({ name: short, visible: z.boolean(), items: list(60) });
const degree = z.strictObject({ degree: short, school: short, dates: short, coursework: list() });
const socials = z.strictObject({ github: blankLink, linkedin: blankLink, links: z.array(z.strictObject({ label: short, href: external })).max(12) });
const contactDetails = { email: z.email().max(254), location: short, social: socials };

export const sectionSchemas = {
  hero: z.strictObject({
    metadata: short, heading: short, secondLine: optional, highlight: optional, description: text,
    ctaLabel: short, ctaHref: target, scrollLabel: short,
  }),
  about: z.strictObject({ ...heading, intro: text, biography: text, facts: z.array(fact).max(18) }),
  experience: z.strictObject({ ...heading, entries: z.array(job).max(25) }),
  projects: z.strictObject({
    ...heading, linkLabel: short, indexLabel: short, indexHeading: short, indexHighlight: optional, indexIntro: text,
  }),
  skills: z.strictObject({ ...heading, groups: z.array(skillGroup).max(25) }),
  education: z.strictObject({ ...heading, entries: z.array(degree).max(25) }),
  contact: z.strictObject({ ...heading, ...contactDetails, description: text, emailLabel: short }),
};
export const sectionKeys = ["hero", "about", "experience", "projects", "skills", "education", "contact"] as const;
export const sectionKey = z.enum(sectionKeys);
export type SectionKey = z.infer<typeof sectionKey>;
export const sectionLabels: Record<SectionKey, string> = {
  hero: "Hero", about: "About", experience: "Experience", projects: "Projects", skills: "Skills", education: "Education", contact: "Contact",
};
export const sectionAnchor: Record<SectionKey, string> = {
  hero: "home", about: "about", experience: "experience", projects: "projects", skills: "skills", education: "education", contact: "contact",
};
export type Sections = { [K in SectionKey]: z.infer<(typeof sectionSchemas)[K]> };
export type SectionVersion<K extends SectionKey = SectionKey> = { content: Sections[K]; visible: boolean; order: number };
export function sectionVersion<K extends SectionKey>(key: K) {
  return z.strictObject({ content: sectionSchemas[key], visible: z.boolean(), order: orderSchema });
}
export const settingsSchema = z.strictObject({
  name: short, title: short, description: text.max(350), openGraphDescription: text.max(350),
  openGraphImage: z.union([objectId, z.literal("")]), resumeUrl: z.union([target, z.literal("")]),
  resumeAsset: z.union([objectId, z.literal("")]),
});
export type Settings = z.infer<typeof settingsSchema>;
export const imageRef = z.strictObject({ id: objectId, alt: short });
export const projectSchema = z.strictObject({
  slug: slugSchema, name: short, subtitle: optional, category: short, description: text.min(1),
  fullDescription: text, stack: list(50), highlights: z.array(text.min(1)).max(30),
  problem: text, solution: text, architecture: text, challenges: text, security: text, outcome: text,
  visual: z.enum(["sapoms", "salon", "trello", "custom"]), github: blankLink, live: blankLink,
  thumbnail: imageRef.nullable(), images: z.array(imageRef).max(15), featured: z.boolean(), order: orderSchema,
});
export type ProjectContent = z.infer<typeof projectSchema>;
export const contentTypes = ["section", "project", "settings"] as const;
export type ContentType = typeof contentTypes[number];

export const assetUrl = (id: string) => `/media/${id}`;
export const credentialEmail = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const credentialPassword = z.string().min(1).max(256);
