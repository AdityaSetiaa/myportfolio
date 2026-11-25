import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { ThemeBootstrap } from "../components/theme-bootstrap";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-rose", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <body id="top" suppressHydrationWarning>
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}
