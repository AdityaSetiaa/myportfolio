"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { portfolio } from "../data/portfolio";

export function SiteFooter() {
  const year = useSyncExternalStore(() => () => {}, () => new Date().getFullYear(), () => 2026);
  return (
    <footer className="footer">
      <div className="wrap footer-row">
        <Link className="brand" href="/" aria-label="Aditya Setia home">AS<span>.</span></Link>
        <span>© {year} {portfolio.name}</span>
        <span className="footer-note">Designed with intention. Built with code.</span>
        <div className="footer-links">
          {portfolio.social.github && <a href={portfolio.social.github}>GitHub</a>}
          {portfolio.social.linkedin && <a href={portfolio.social.linkedin}>LinkedIn</a>}
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}