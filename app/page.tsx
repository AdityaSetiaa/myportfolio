import { MarioStop } from "../components/mario-stop";
import { CherryBiome } from "../components/cherry-biome";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";
import { portfolio } from "../data/portfolio";
import { ProjectCard } from "../components/project-card";
import { Reveal } from "../components/reveal";
import { CopyEmail } from "../components/copy-email";

export default function Home() {
  return <div className="portfolio-sections">
    <section id="home" className="hero wrap">
      <Reveal>
        <p className="eyebrow">Aditya Setia / Software Developer / Punjab, India</p>
        <h1>I build software<br/>that <em>works.</em></h1>
        <p className="hero-copy">I’m Aditya Setia, a full-stack developer specializing in secure, scalable web applications, business platforms, and AI-powered workflows.</p>
        <div className="actions">
          <Link className="button primary" href="#projects" data-mario-platform="top">Explore my work <ArrowUpRight size={17}/><MarioStop /></Link>
          {portfolio.resumePath && <a className="button ghost" href={portfolio.resumePath} download data-mario-platform="top"><MarioStop />Download resume <ArrowDown size={17}/></a>}
        </div>
      </Reveal>
      <a className="scroll-cue" href="#about">Scroll to explore <ArrowDown size={15}/></a>
      <CherryBiome hero />
    </section>

    <section id="about" className="section wrap" data-mario-platform="divider"><Reveal>
      <SectionHead index="01" label="About" title={<>An engineer’s mindset.<br/><em>A builder’s instinct.</em></>}/>
      <div className="about-grid">
        <div className="body-large">
          <p>I build practical software for the way businesses actually work. My experience spans full-stack delivery, secure authentication, database design, REST APIs, and production troubleshooting.</p>
          <p>At MiriSoft Solutions, I work across the development lifecycle, from understanding requirements to implementation, deployment, and maintenance. I’m also pursuing a Master of Computer Applications.</p>
        </div>
        <div className="facts">
          <Fact label="Current role" value="Software Developer" detail="MiriSoft Solutions"/>
          <Fact label="Location" value="Punjab, India" detail="Working in Ambala, Haryana"/>
          <Fact label="Education" value="Master of Computer Applications" detail="Chandigarh University"/>
          <Fact label="Focus" value="Full-stack systems" detail="SaaS · Security · AI workflows"/>
        </div>
      </div>
    </Reveal><MarioStop /></section>

    <section id="experience" className="section wrap" data-mario-platform="divider"><Reveal>
      <SectionHead index="02" label="Experience" title={<>Building in the <em>real world.</em></>}/>
      <div className="experience">
        <div className="experience-date"><p className="eyebrow">Feb 2026 — Present</p><span>Ambala, Haryana</span></div>
        <div className="experience-role"><h3>Software Developer</h3><span>Full-Time · MiriSoft Solutions</span></div>
        <div className="experience-detail">
          <p>Delivering production business applications across frontend, backend, data, and deployment.</p>
          <ul>
            <li>Own delivery from requirements and implementation through testing, debugging, deployment, and maintenance.</li>
            <li>Develop business applications with modern JavaScript and TypeScript frameworks.</li>
            <li>Contributed to SAPOMS, including legacy PHP backend and data migration, authentication, and role-based access.</li>
            <li>Built a multi-tenant salon management platform covering CRM, appointments, billing, loyalty, and reporting.</li>
          </ul>
          <div className="tags"><span>Next.js</span><span>TypeScript</span><span>PostgreSQL</span><span>Prisma</span></div>
        </div>
      </div>
    </Reveal><MarioStop /></section>

    <section id="projects" className="section wrap" data-mario-platform="divider"><Reveal>
      <div className="section-heading-row"><SectionHead index="03" label="Selected work" title={<>Systems with <em>substance.</em></>}/><Link className="text-link" href="/projects">All projects <ArrowUpRight size={17}/></Link></div>
      <div className="project-list" data-mario-platform="top"><MarioStop />{portfolio.projects.map((project, index) => <ProjectCard key={project.slug} project={project} index={index + 1}/>)}</div>
    </Reveal><MarioStop /></section>

    <section id="skills" className="section wrap" data-mario-platform="divider"><Reveal>
      <SectionHead index="04" label="Capabilities" title={<>The tools behind <em>the work.</em></>}/>
      <div className="skills-grid">{portfolio.skills.map(group => <div className="skill-group" key={group.name}><h3>{group.name}</h3><div className="skill-items">{group.items.map(item => <span key={item}>{item}</span>)}</div></div>)}</div>
    </Reveal><MarioStop /></section>

    <section id="education" className="section wrap education-section" data-mario-platform="divider"><Reveal>
      <SectionHead index="05" label="Education" title={<>Always <em>learning.</em></>}/>
      <div className="education-grid" data-mario-platform="top"><MarioStop />{portfolio.education.map(item => <div className="education-card" key={item.degree}><p className="eyebrow">{item.dates}</p><h3>{item.degree}</h3><p>{item.school}</p><div className="tags">{item.coursework.map(course => <span key={course}>{course}</span>)}</div></div>)}</div>
    </Reveal><MarioStop /></section>

    <section id="contact" className="contact" data-mario-platform="divider"><div className="wrap"><Reveal>
      <p className="eyebrow">Contact</p>
      <h2>Let’s build something<br/><em>meaningful.</em></h2>
      <p>Whether it’s an interesting opportunity, a challenging project, or a conversation about technology, I’d love to connect.</p>
      <div className="actions"><a className="button primary" href={`mailto:${portfolio.email}`} data-mario-platform="top">Send an email <Mail size={17}/><MarioStop /></a><CopyEmail email={portfolio.email}/>{portfolio.resumePath && <a className="button ghost" href={portfolio.resumePath} download data-mario-platform="top"><MarioStop />Download resume</a>}</div>
      <div className="contact-meta" data-mario-platform="top"><MarioStop /><CherryBiome /><a href={`mailto:${portfolio.email}`}>{portfolio.email}</a><span>Punjab, India</span>{portfolio.social.github && <a href={portfolio.social.github}>GitHub</a>}{portfolio.social.linkedin && <a href={portfolio.social.linkedin}>LinkedIn</a>}</div>
    </Reveal></div><MarioStop /></section>
  </div>;
}

function SectionHead({ index, label, title }: { index: string; label: string; title: React.ReactNode }) {
  return <div className="section-head"><p className="eyebrow">{index} / {label}</p><h2>{title}</h2></div>;
}
function Fact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="fact"><span className="eyebrow">{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}