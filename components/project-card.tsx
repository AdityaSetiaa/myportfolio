import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "../data/portfolio";

export function ProjectVisual({ visual }: { visual: string }) {
  return <div className={`project-visual visual-${visual}`} aria-hidden="true">
    <span className="visual-index">{visual === "sapoms" ? "01" : visual === "salon" ? "02" : "03"}</span>
    <span className="visual-name">{visual === "sapoms" ? "SAPOMS" : visual === "salon" ? "SALON" : "TRELLO SNAP"}</span>
    <span className="visual-caption">{visual === "sapoms" ? "DEALER OPERATIONS" : visual === "salon" ? "BUSINESS OPERATIONS" : "INTELLIGENT AUTOMATION"}</span>
  </div>;
}

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return <Link href={`/projects/${project.slug}`} className="project-card">
    <span className="project-index">0{index}</span>
    <div className="project-content">
      <p className="eyebrow">{project.category}</p>
      <h3>{project.name}</h3>
      <p className="project-subtitle">{project.subtitle}</p>
      <p className="project-description">{project.description}</p>
      <div className="project-tech">{project.stack.slice(0, 4).join(" · ")}</div>
    </div>
    <ProjectVisual visual={project.visual}/>
    <ArrowUpRight className="project-arrow" size={24} strokeWidth={1.5} aria-hidden="true"/>
  </Link>;
}