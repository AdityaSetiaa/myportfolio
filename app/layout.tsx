import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { CherryBlossomBranch } from "../components/cherry-blossom-branch";
import { ThemeLanternToggle } from "../components/theme-lantern-toggle";
import { restoreThemeBeforePaint } from "../components/theme-preference";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-rose", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Aditya Setia — Software Developer", template: "%s | Aditya Setia" },
  description: "Aditya Setia is a full-stack software developer building secure business platforms, multi-tenant SaaS applications, and AI-powered workflows.",
  openGraph: { title: "Aditya Setia — Software Developer", description: "Full-stack developer building software that solves real problems.", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: restoreThemeBeforePaint }} /></head>
      <body id="top" suppressHydrationWarning>
        <SiteHeader />
        <div className="corner-world">
          <CherryBlossomBranch />
          <ThemeLanternToggle />
        </div>
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}