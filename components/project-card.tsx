import { MarioStop } from "./mario-stop";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { assetUrl, type ProjectContent } from "@/data/cms-schema";

const visuals = {
  sapoms: ["01", "SAPOMS", "DEALER OPERATIONS"],
  salon: ["02", "SALON", "BUSINESS OPERATIONS"],
  trello: ["03", "TRELLO SNAP", "INTELLIGENT AUTOMATION"],
};

export function ProjectVisual({ project }: { project: ProjectContent }) {
  if (project.thumbnail) {
    return <div className="project-visual project-image"><Image src={assetUrl(project.thumbnail.id)} alt={project.thumbnail.alt} fill unoptimized /></div>;
  }
  const { visual } = project;
  const [number, name, caption] = visual === "custom" ? ["", project.name, project.category] : visuals[visual];
  return <div className={`project-visual visual-${visual}`} aria-hidden="true">
    {number && <span className="visual-index">{number}</span>}
    <span className="visual-name">{name}</span>
    <span className="visual-caption">{caption}</span>
  </div>;
}

export function ProjectCard({ project, index, preview = false }: { project: ProjectContent; index: number; preview?: boolean }) {
  return <Link href={`/projects/${project.slug}`} className="project-card" data-mario-project={preview ? undefined : project.slug} data-mario-platform={preview ? undefined : "bottom"}>
    {!preview && <MarioStop />}
    <span className="project-index">{String(index).padStart(2, "0")}</span>
    <div className="project-content">
      <p className="eyebrow">{project.category}</p>
      <h3>{project.name}</h3>
      <p className="project-subtitle">{project.subtitle}</p>
      <p className="project-description">{project.description}</p>
      <div className="project-tech">{project.stack.slice(0, 4).join(" · ")}</div>
    </div>
    <ProjectVisual project={project} />
    <ArrowUpRight className="project-arrow" size={24} strokeWidth={1.5} aria-hidden="true" />
  </Link>;
}
