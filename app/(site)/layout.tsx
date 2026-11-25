import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CompanionWorld } from "@/components/companions/companion-world";
import { SiteFooter } from "@/components/site-footer";
import { CherryBlossomBranch } from "@/components/cherry-blossom-branch";
import { ThemeLanternToggle } from "@/components/theme-lantern-toggle";
import { assetUrl, sectionAnchor, type Sections } from "@/data/cms-schema";
import { getPublishedPortfolio, orderedSections, resumeLink } from "@/server/portfolio/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublishedPortfolio();
  return {
    ...(process.env.PUBLIC_SITE_URL ? { metadataBase: new URL(process.env.PUBLIC_SITE_URL) } : {}),
    title: { default: settings.title, template: `%s | ${settings.name}` },
    description: settings.description,
    openGraph: {
      title: settings.title, description: settings.openGraphDescription, type: "website",
      images: settings.openGraphImage ? [{ url: assetUrl(settings.openGraphImage) }] : undefined,
    },
  };
}

export default async function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const portfolio = await getPublishedPortfolio();
  const { settings, sections } = portfolio;
  const contact = sections.contact?.visible ? sections.contact.content as Sections["contact"] : undefined;
  return <>
    <SiteHeader name={settings.name} resume={resumeLink(settings)} visible={orderedSections(portfolio).map(key => sectionAnchor[key])} />
    <div className="corner-world"><CherryBlossomBranch /><ThemeLanternToggle /></div>
    <main>{children}</main>
    <SiteFooter name={settings.name} social={contact?.social} />
    <CompanionWorld />
  </>;
}
