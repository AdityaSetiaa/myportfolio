"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { restoreThemeBeforePaint, themeStorageKey } from "./theme-preference";

export function ThemeBootstrap() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script data-portfolio-theme-bootstrap dangerouslySetInnerHTML={{ __html: restoreThemeBeforePaint }} />;
  });

  useLayoutEffect(() => {
    // A client remount can clear the attribute applied while parsing the HTML.
    const root = document.documentElement;
    if (root.hasAttribute("data-theme")) return;
    try {
      root.dataset.theme = localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
    } catch {
      // The page keeps its default theme if storage is unavailable.
    }
  }, []);

  return null;
}
