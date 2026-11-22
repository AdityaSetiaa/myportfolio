import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { portfolio } from "../../data/portfolio";
import { ProjectCard } from "../../components/project-card";
export const metadata:Metadata={title:"Projects",description:"Selected full-stack, SaaS, and AI projects by Aditya Setia."};
export default function ProjectsPage(){return <div className="wrap inner-page"><Link className="back-link" href="/"><ArrowLeft size={17}/> BACK TO HOME</Link><p className="eyebrow">SELECTED PROJECTS / 2026</p><h1>Work built for <em>real use.</em></h1><p className="inner-intro">A closer look at business platforms, secure systems, and AI-enabled workflows.</p><div className="project-list">{portfolio.projects.map((project,i)=><ProjectCard key={project.slug} project={project} index={i+1}/>)}</div></div>}