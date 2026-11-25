import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { CaseStudyView } from "@/components/case-study";
import { assetUrl } from "@/data/cms-schema";
import { seedProjects } from "@/data/cms-seed";
import { getPublishedPortfolio } from "@/server/portfolio/queries";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seedProjects.map(project => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getPublishedPortfolio();
  const project = projects.find(item => item.slug === slug);
  if (!project) return {};
  const { name, description, thumbnail } = project;
  return {
    title: name, description,
    ...(thumbnail ? { openGraph: { title: name, description, images: [{ url: assetUrl(thumbnail.id), alt: thumbnail.alt }] } } : {}),
  };
}

async function ProjectContent({ params }: Props) {
  const { slug } = await params;
  const portfolio = await getPublishedPortfolio();
  const project = portfolio.projects.find(item => item.slug === slug);
  if (!project) {
    const alias = Object.hasOwn(portfolio.aliases, slug) ? portfolio.aliases[slug] : undefined;
    if (alias) redirect(`/projects/${alias}`);
    notFound();
  }
  return <CaseStudyView project={project} />;
}

export default function CaseStudy({ params }: Props) {
  return <Suspense fallback={null}><ProjectContent params={params} /></Suspense>;
}
