import Link from "next/link";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";
import { sectionAnchor, type ProjectContent, type SectionKey, type SectionVersion, type Sections } from "@/data/cms-schema";
import { CherryBiome } from "./cherry-biome";
import { HeroLeaves } from "./hero-leaves/hero-leaves";
import { CopyEmail } from "./copy-email";
import { MarioStop } from "./mario-stop";
import { ProjectCard } from "./project-card";
import { Reveal } from "./reveal";

export function HeadingText({ heading, highlight, wrap }: { heading: string; highlight: string; wrap?: boolean }) {
  return <>{heading}{highlight && <>{wrap ? <br /> : " "}<em>{highlight}</em></>}</>;
}
function SectionHead({ index, label, title }: { index: string; label: string; title: React.ReactNode }) {
  return <div className="section-head">
    <p className="eyebrow">{index} / {label}</p><h2>{title}</h2>
  </div>;
}

const indices: Partial<Record<SectionKey, string>> = {
  about: "01", experience: "02", projects: "03", skills: "04", education: "05",
};

type Props = {
  section: SectionKey; version: SectionVersion; projects?: ProjectContent[]; resume?: string;
  preview?: boolean; scrollTarget?: string;
};

export function PortfolioSection({ section, version, projects = [], resume, preview = false, scrollTarget = "#about" }: Props) {
  const stop = preview ? null : <MarioStop />;
  const id = preview ? undefined : sectionAnchor[section];
  const platform = preview ? undefined : "top";
  if (section === "hero") {
    const hero = version.content as Sections["hero"];
    return <section id={id} className="hero wrap">
      <Reveal>
        <p className="eyebrow">{hero.metadata}</p>
        <h1>{hero.heading}{hero.secondLine && <><br />{hero.secondLine}</>}{hero.highlight && <> <em>{hero.highlight}</em></>}</h1>
        <p className="hero-copy">{hero.description}</p>
        <div className="actions">
          <Link className="button primary" href={hero.ctaHref} data-mario-platform={platform}>{hero.ctaLabel} <ArrowUpRight size={17} />{stop}</Link>
          {resume && <a className="button ghost" href={resume} download data-mario-platform={platform}>{stop}Download resume <ArrowDown size={17} /></a>}
        </div>
      </Reveal>
      {scrollTarget && <a className="scroll-cue" href={scrollTarget}>{hero.scrollLabel} <ArrowDown size={15} /></a>}
      {preview ? <CherryBiome hero artworkOnly /> : <><CherryBiome hero /><HeroLeaves /></>}
    </section>;
  }
  if (section === "contact") {
    const contact = version.content as Sections["contact"];
    return <section id={id} className="contact" data-mario-platform={preview ? undefined : "divider"}><div className="wrap"><Reveal>
      <p className="eyebrow">{contact.label}</p>
      <h2><HeadingText {...contact} wrap /></h2>
      <p>{contact.description}</p>
      <div className="actions">
        <a className="button primary" href={`mailto:${contact.email}`} data-mario-platform={platform}>{contact.emailLabel} <Mail size={17} />{stop}</a>
        <CopyEmail email={contact.email} />
        {resume && <a className="button ghost" href={resume} download data-mario-platform={platform}>{stop}Download resume</a>}
      </div>
      <div className="contact-meta" data-mario-platform={platform}>
        {stop}<CherryBiome artworkOnly={preview} /><a href={`mailto:${contact.email}`}>{contact.email}</a><span>{contact.location}</span>
        <SocialLinks social={contact.social} />
      </div>
    </Reveal></div>{stop}</section>;
  }

  const { label, heading, highlight } = version.content as Sections[typeof section];
  const title = <SectionHead index={indices[section]!} label={label} title={<HeadingText heading={heading} highlight={highlight} wrap={section === "about"} />} />;
  let body;
  switch (section) {
    case "about": {
      const about = version.content as Sections["about"];
      body = <div className="about-grid">
        <div className="body-large"><p>{about.intro}</p><p>{about.biography}</p></div>
        <div className="facts">{about.facts.map((fact, index) => <div className="fact" key={index}>
          <span className="eyebrow">{fact.label}</span><strong>{fact.value}</strong><small>{fact.detail}</small>
        </div>)}</div>
      </div>;
      break;
    }
    case "experience": {
      const experience = version.content as Sections["experience"];
      body = experience.entries.map((job, index) => <div className="experience" key={index}>
        <div className="experience-date"><p className="eyebrow">{job.start}{(job.current || job.end) && <> — {job.current ? "Present" : job.end}</>}</p><span>{job.location}</span></div>
        <div className="experience-role"><h3>{job.title}</h3><span>{[job.kind, job.company].filter(Boolean).join(" · ")}</span></div>
        <div className="experience-detail">
          {job.intro && <p>{job.intro}</p>}
          {(job.responsibilities.length > 0 || job.achievements.length > 0) && <ul>
            {[...job.responsibilities, ...job.achievements].map((item, position) => <li key={position}>{item}</li>)}
          </ul>}
          <Tags items={job.stack} />
        </div>
      </div>);
      break;
    }
    case "projects": {
      const work = version.content as Sections["projects"];
      return <section id={id} className="section wrap" data-mario-platform={preview ? undefined : "divider"}><Reveal>
        <div className="section-heading-row">{title}<Link className="text-link" href="/projects">{work.linkLabel} <ArrowUpRight size={17} /></Link></div>
        <div className="project-list" data-mario-platform={platform}>
          {stop}{projects.filter(project => project.featured).map((project, index) =>
            <ProjectCard key={project.slug} project={project} index={index + 1} preview={preview} />)}
        </div>
      </Reveal>{stop}</section>;
    }
    case "skills": {
      const skills = version.content as Sections["skills"];
      body = <div className="skills-grid">{skills.groups.filter(group => group.visible).map((group, index) =>
        <div className="skill-group" key={index}><h3>{group.name}</h3>
          <div className="skill-items">{group.items.map((item, position) => <span key={position}>{item}</span>)}</div>
        </div>)}</div>;
      break;
    }
    case "education": {
      const education = version.content as Sections["education"];
      body = <div className="education-grid" data-mario-platform={platform}>{stop}{education.entries.map((item, index) =>
        <div className="education-card" key={index}><p className="eyebrow">{item.dates}</p><h3>{item.degree}</h3>
          <p>{item.school}</p><Tags items={item.coursework} />
        </div>)}</div>;
      break;
    }
  }
  return <section id={id} className={section === "education" ? "section wrap education-section" : "section wrap"}
    data-mario-platform={preview ? undefined : "divider"}><Reveal>{title}{body}</Reveal>{stop}</section>;
}

export function Tags({ items }: { items: string[] }) {
  return <div className="tags">{items.map((item, index) => <span key={index}>{item}</span>)}</div>;
}
export function SocialLinks({ social }: { social?: Sections["contact"]["social"] }) {
  if (!social) return null;
  return <>{social.github && <a href={social.github}>GitHub</a>}{social.linkedin && <a href={social.linkedin}>LinkedIn</a>}
    {social.links.map((link, index) => <a key={index} href={link.href}>{link.label}</a>)}</>;
}
