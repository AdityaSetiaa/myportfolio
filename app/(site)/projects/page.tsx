import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarioStop } from "@/components/mario-stop";
import { ProjectCard } from "@/components/project-card";
import { HeadingText } from "@/components/portfolio-view";
import { seedSections } from "@/data/cms-seed";
import type { Sections } from "@/data/cms-schema";
import { getPublishedPortfolio } from "@/server/portfolio/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { settings, sections } = await getPublishedPortfolio();
  const work = (sections.projects?.content ?? seedSections.projects.content) as Sections["projects"];
  return { title: "Projects", description: settings.name === "Aditya Setia" && work.indexIntro === seedSections.projects.content.indexIntro
    ? "Selected full-stack, SaaS, and AI projects by Aditya Setia." : work.indexIntro };
}

export default async function ProjectsPage() {
  const { projects, sections } = await getPublishedPortfolio();
  const work = (sections.projects?.content ?? seedSections.projects.content) as Sections["projects"];
  return <div className="wrap inner-page" data-mario-area="projects">
    <Link className="back-link" href="/"><ArrowLeft size={17} /> BACK TO HOME</Link>
    <p className="eyebrow">{work.indexLabel}</p><h1><HeadingText heading={work.indexHeading} highlight={work.indexHighlight} /></h1>
    <p className="inner-intro">{work.indexIntro}</p>
    <div className="project-list" data-mario-platform="top"><MarioStop />{projects.map((project, index) => <ProjectCard key={project.slug} project={project} index={index + 1} />)}</div>
  </div>;
}
