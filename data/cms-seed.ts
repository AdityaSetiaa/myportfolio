import { portfolio } from "./portfolio";
import { sectionKeys, type ProjectContent, type SectionKey, type Sections, type SectionVersion, type Settings } from "./cms-schema";

const staticSections: Sections = {
  hero: {
    metadata: "Aditya Setia / Software Developer / Punjab, India",
    heading: "I build software", secondLine: "that", highlight: "works.",
    description: "I’m Aditya Setia, a full-stack developer specializing in secure, scalable web applications, business platforms, and AI-powered workflows.",
    ctaLabel: "Explore my work", ctaHref: "#projects", scrollLabel: "Scroll to explore",
  },
  about: {
    label: "About", heading: "An engineer’s mindset.", highlight: "A builder’s instinct.",
    intro: "I build practical software for the way businesses actually work. My experience spans full-stack delivery, secure authentication, database design, REST APIs, and production troubleshooting.",
    biography: "At MiriSoft Solutions, I work across the development lifecycle, from understanding requirements to implementation, deployment, and maintenance. I’m also pursuing a Master of Computer Applications.",
    facts: [
      { label: "Current role", value: "Software Developer", detail: "MiriSoft Solutions" },
      { label: "Location", value: "Punjab, India", detail: "Working in Ambala, Haryana" },
      { label: "Education", value: "Master of Computer Applications", detail: "Chandigarh University" },
      { label: "Focus", value: "Full-stack systems", detail: "SaaS · Security · AI workflows" },
    ],
  },
  experience: {
    label: "Experience", heading: "Building in the", highlight: "real world.",
    entries: [{
      title: "Software Developer", company: "MiriSoft Solutions", kind: "Full-Time", location: "Ambala, Haryana",
      start: "Feb 2026", end: "", current: true,
      intro: "Delivering production business applications across frontend, backend, data, and deployment.",
      responsibilities: [
        "Own delivery from requirements and implementation through testing, debugging, deployment, and maintenance.",
        "Develop business applications with modern JavaScript and TypeScript frameworks.",
        "Contributed to SAPOMS, including legacy PHP backend and data migration, authentication, and role-based access.",
        "Built a multi-tenant salon management platform covering CRM, appointments, billing, loyalty, and reporting.",
      ],
      achievements: [], stack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
    }],
  },
  projects: {
    label: "Selected work", heading: "Systems with", highlight: "substance.", linkLabel: "All projects",
    indexLabel: "SELECTED PROJECTS / 2026", indexHeading: "Work built for", indexHighlight: "real use.",
    indexIntro: "A closer look at business platforms, secure systems, and AI-enabled workflows.",
  },
  skills: {
    label: "Capabilities", heading: "The tools behind", highlight: "the work.",
    groups: portfolio.skills.map(group => ({ ...group, visible: true })),
  },
  education: {
    label: "Education", heading: "Always", highlight: "learning.", entries: portfolio.education,
  },
  contact: {
    label: "Contact", heading: "Let’s build something", highlight: "meaningful.",
    description: "Whether it’s an interesting opportunity, a challenging project, or a conversation about technology, I’d love to connect.",
    emailLabel: "Send an email", email: portfolio.email, location: "Punjab, India",
    social: { github: portfolio.social.github ?? "", linkedin: portfolio.social.linkedin ?? "", links: [] },
  },
};

export const seedSections = Object.fromEntries(sectionKeys.map((key, order) => [
  key, { content: staticSections[key], order, visible: true },
])) as { [K in SectionKey]: SectionVersion<K> };

export const blankProject: ProjectContent = {
  name: "", slug: "", subtitle: "", category: "", description: "", fullDescription: "", stack: [],
  highlights: [], problem: "", solution: "", architecture: "", challenges: "", security: "", outcome: "",
  visual: "custom", thumbnail: null, images: [], github: "", live: "", featured: true, order: 0,
};

export const seedProjects: ProjectContent[] = portfolio.projects.map((project, order) => ({
  ...blankProject, ...project, visual: project.visual as ProjectContent["visual"], order,
}));

export const seedSettings: Settings = {
  name: portfolio.name, title: "Aditya Setia — Software Developer",
  description: "Aditya Setia is a full-stack software developer building secure business platforms, multi-tenant SaaS applications, and AI-powered workflows.",
  openGraphDescription: "Full-stack developer building software that solves real problems.",
  openGraphImage: "", resumeUrl: portfolio.resumePath ?? "", resumeAsset: "",
};
