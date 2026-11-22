import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Aditya Setia — Software Developer", template: "%s | Aditya Setia" },
  description: "Aditya Setia is a full-stack software developer building secure business platforms, multi-tenant SaaS applications, and AI-powered workflows.",
  openGraph: { title: "Aditya Setia — Software Developer", description: "Full-stack developer building software that solves real problems.", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={`${sans.variable} ${mono.variable}`}><body id="top"><SiteHeader/><main>{children}</main><SiteFooter/></body></html>;
}