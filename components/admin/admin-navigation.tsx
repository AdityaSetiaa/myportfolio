"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const paths = [
  ["Dashboard", "/admin"], ["Hero", "/admin/sections/hero"], ["About", "/admin/sections/about"],
  ["Experience", "/admin/sections/experience"], ["Projects", "/admin/projects"],
  ["Skills", "/admin/sections/skills"], ["Education", "/admin/sections/education"], ["Contact", "/admin/sections/contact"],
  ["Media", "/admin/media"], ["Settings", "/admin/settings"], ["Revisions", "/admin/revisions"],
];

function activePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
}

export function AdminTopTitle() {
  const pathname = usePathname();
  const title = paths.find(([, href]) => activePath(pathname, href))?.[0]
    ?? (pathname.endsWith("/sections/projects") ? "Projects" : pathname.startsWith("/admin/preview") ? "Preview" : "Sections");
  return <span className="admin-page-title">{title}</span>;
}

export function AdminNavigation() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  return <aside className="admin-sidebar">
    <Link className="brand" href="/admin" aria-label="Portfolio admin home">AS<span>.</span></Link>
    <div className="admin-navigation" data-expanded={expanded}>
      <button className="admin-nav-toggle admin-secondary" type="button" aria-controls="admin-links"
        aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Navigation</button>
      <nav id="admin-links" aria-label="Admin">
        {paths.map(([label, href]) => <Link key={href} href={href} aria-current={activePath(pathname, href) ? "page" : undefined}
          onClick={() => setExpanded(false)}>{label}</Link>)}
      </nav>
    </div>
  </aside>;
}
