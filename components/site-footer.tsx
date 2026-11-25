"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Sections } from "@/data/cms-schema";

export function SiteFooter({ name, social }: { name: string; social?: Sections["contact"]["social"] }) {
  const year = useSyncExternalStore(() => () => {}, () => new Date().getFullYear(), () => 2026);
  return (
    <footer className="footer">
      <div className="wrap footer-row">
        <Link className="brand" href="/" aria-label={`${name} home`}>AS<span>.</span></Link>
        <span>© {year} {name}</span>
        <span className="footer-note">Designed with intention. Built with code.</span>
        <div className="footer-links">
          {social?.github && <a href={social.github}>GitHub</a>}
          {social?.linkedin && <a href={social.linkedin}>LinkedIn</a>}
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}