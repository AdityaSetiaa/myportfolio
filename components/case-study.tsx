import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { assetUrl, type ProjectContent } from "@/data/cms-schema";
import { ProjectVisual } from "./project-card";
import { Tags } from "./portfolio-view";

export function CaseStudyView({ project, preview = false }: { project: ProjectContent; preview?: boolean }) {
  const sections = [
    ["01 / OVERVIEW", "Project overview", project.fullDescription || project.description],
    ["02 / CONTEXT", "Business problem", project.problem],
    ["03 / APPROACH", "Solution", project.solution],
    ["04 / FEATURES", "Major features", project.highlights],
    ["05 / SYSTEM", "Technical architecture", project.architecture],
    ["06 / ENGINEERING", "Engineering challenges", project.challenges],
    ["07 / TRUST", "Security & performance", project.security],
    ["08 / REFLECTION", "Outcomes & learnings", project.outcome],
  ] as const;
  const populated = sections.map(([key, title, copy], index) => ({ key, title, copy, index })).filter(item => item.copy.length);
  return <article className="wrap inner-page case-study">
    {!preview && <Link className="back-link" href="/projects"><ArrowLeft size={17} /> ALL PROJECTS</Link>}
    <p className="eyebrow">{project.category}</p><h1>{project.name}{project.subtitle && <><br /><em>{project.subtitle}</em></>}</h1>
    <p className="inner-intro">{project.description}</p><Tags items={project.stack} /><ProjectVisual project={project} />
    {(project.live || project.github) && <div className="case-project-links">
      {project.live && <a className="text-link" href={project.live}>Live project <ArrowUpRight size={17} /></a>}
      {project.github && <a className="text-link" href={project.github}>GitHub <ArrowUpRight size={17} /></a>}
    </div>}
    <div className="case-layout"><aside><p className="eyebrow">CASE STUDY</p>
      <nav aria-label="Case study sections">{populated.map(({ key, title, index }) => <a key={key} href={`#section-${index}`}>{title}</a>)}</nav>
    </aside><div>
      {populated.map(({ key, title, copy, index }) => <section className="case-section" id={`section-${index}`} key={key}>
        <p className="eyebrow">{key}</p><h2>{title}</h2>
        {typeof copy === "string" ? <p>{copy}</p> : <ul>{copy.map((item, position) => <li key={position}>{item}</li>)}</ul>}
      </section>)}
      {!!project.images.length && <section className="case-section"><h2>Screenshots</h2><div className="case-gallery">
        {project.images.map(({ id, alt }, index) => <Image key={index} src={assetUrl(id)} alt={alt} width={1600} height={900} unoptimized />)}
      </div></section>}
      <div className="case-section"><p className="eyebrow">TECHNOLOGIES USED</p><Tags items={project.stack} /></div>
      {!preview && <Link className="text-link" href="/projects">EXPLORE MORE PROJECTS <ArrowUpRight size={17} /></Link>}
    </div></div>
  </article>;
}
