import type { SectionKey } from "@/data/cms-schema";

type Leaf = { type: "text" | "multiline" | "number" | "checkbox" | "url" | "email"; label: string; key: string };
type Options = { type: "select"; label: string; key: string; options: [string, string][] };
type Asset = { type: "image" | "asset"; label: string; key: string; file?: "image" | "pdf" };
type List = { type: "list"; label: string; key: string; item: string; fields?: Field[]; empty?: Record<string, unknown>; multiline?: boolean };
export type Field = Leaf | Options | Asset | List;

const field = (key: string, label: string, type: Leaf["type"] = "text"): Leaf => ({ type, label, key });
const entries = (key: string, label: string, item: string, fields?: Field[], empty?: Record<string, unknown>): List =>
  ({ type: "list", key, label, item, fields, empty });
const paragraphs = (key: string, label: string, item: string): List =>
  ({ type: "list", key, label, item, multiline: true });
const headline = [field("label", "Section label"), field("heading", "Headline"), field("highlight", "Highlighted text")];
const visibility = [field("visible", "Visible on the website", "checkbox"), field("order", "Display order", "number")];

export const sectionFields: Record<SectionKey, Field[]> = {
  hero: [
    field("metadata", "Professional metadata"), field("heading", "Headline, first line"), field("secondLine", "Headline, second line"),
    field("highlight", "Highlighted text"), field("description", "Supporting description", "multiline"),
    field("ctaLabel", "Call-to-action label"), field("ctaHref", "Call-to-action destination"), field("scrollLabel", "Scroll indicator text"),
  ],
  about: [...headline, field("intro", "Introduction", "multiline"), field("biography", "Biography", "multiline"),
    entries("facts", "Professional information", "Fact", [field("label", "Label"), field("value", "Value"), field("detail", "Details")],
      { label: "", value: "", detail: "" })],
  experience: [...headline, entries("entries", "Experience", "Role", [
    field("title", "Job title"), field("company", "Company"), field("kind", "Employment type"), field("location", "Location"),
    field("start", "Start date"), field("end", "End date"), field("current", "Currently working here", "checkbox"),
    field("intro", "Summary", "multiline"), paragraphs("responsibilities", "Responsibilities", "Responsibility"),
    paragraphs("achievements", "Achievements", "Achievement"), entries("stack", "Technologies", "Technology"),
  ], { title: "", company: "", kind: "", location: "", start: "", end: "", current: false, intro: "", responsibilities: [], achievements: [], stack: [] })],
  projects: [...headline, field("linkLabel", "All projects link"), field("indexLabel", "Project index label"),
    field("indexHeading", "Project index heading"), field("indexHighlight", "Project index highlight"), field("indexIntro", "Project index introduction", "multiline")],
  skills: [...headline, entries("groups", "Skill categories", "Category",
    [field("name", "Category name"), field("visible", "Visible", "checkbox"), entries("items", "Technologies", "Technology")],
    { name: "", visible: true, items: [] })],
  education: [...headline, entries("entries", "Qualifications", "Qualification",
    [field("degree", "Degree"), field("school", "Institution"), field("dates", "Dates"), entries("coursework", "Coursework", "Course")],
    { degree: "", school: "", dates: "", coursework: [] })],
  contact: [...headline, field("description", "Supporting description", "multiline"), field("emailLabel", "Email button label"),
    field("email", "Public email", "email"), field("location", "Location")],
};

export const socialFields = [
  field("github", "GitHub URL", "url"), field("linkedin", "LinkedIn URL", "url"),
  entries("links", "Additional profiles", "Profile", [field("label", "Link label"), field("href", "URL", "url")], { label: "", href: "" }),
];

export const sectionOptions = visibility;

export const projectFields: Field[] = [
  field("name", "Project title"), field("slug", "Case study slug"), field("subtitle", "Subtitle"), field("category", "Category"),
  field("description", "Short description", "multiline"), field("fullDescription", "Long description", "multiline"),
  entries("stack", "Technology stack", "Technology"), paragraphs("highlights", "Features and highlights", "Feature"),
  field("problem", "Business problem", "multiline"), field("solution", "Solution", "multiline"),
  field("architecture", "Technical architecture", "multiline"), field("challenges", "Engineering challenges", "multiline"),
  field("security", "Security and performance", "multiline"), field("outcome", "Outcomes and learnings", "multiline"),
  { type: "image", label: "Thumbnail", key: "thumbnail" },
  entries("images", "Screenshots", "Screenshot", [
    { type: "asset", key: "id", label: "Image", file: "image" }, field("alt", "Alt text"),
  ], { id: "", alt: "" }),
  { type: "select", key: "visual", label: "Fallback illustration", options: [
    ["custom", "Project name"], ["sapoms", "SAPOMS"], ["salon", "Salon"], ["trello", "Trello Snap"],
  ] },
  field("live", "Live project URL", "url"), field("github", "GitHub URL", "url"), field("featured", "Featured on the homepage", "checkbox"),
  field("order", "Display order", "number"),
];

export const settingsFields: Field[] = [
  field("name", "Public name"), field("title", "Website title"), field("description", "Meta description", "multiline"),
  field("openGraphDescription", "Social sharing description", "multiline"),
  { type: "asset", key: "openGraphImage", label: "Open Graph image", file: "image" },
  { type: "asset", key: "resumeAsset", label: "Uploaded resume", file: "pdf" },
  field("resumeUrl", "Resume URL when no PDF is selected"),
];
