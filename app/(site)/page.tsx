import { PortfolioSection } from "@/components/portfolio-view";
import { sectionAnchor } from "@/data/cms-schema";
import { getPublishedPortfolio, orderedSections, resumeLink } from "@/server/portfolio/queries";

export default async function Home() {
  const portfolio = await getPublishedPortfolio();
  const sections = orderedSections(portfolio);
  const next = sections[sections.indexOf("hero") + 1];
  return <div className="portfolio-sections">
    {sections.map(section => <PortfolioSection key={section} section={section} version={portfolio.sections[section]!}
      projects={portfolio.projects} resume={resumeLink(portfolio.settings)} scrollTarget={next ? `#${sectionAnchor[next]}` : ""} />)}
  </div>;
}
