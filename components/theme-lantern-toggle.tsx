"use client";

import { useSyncExternalStore } from "react";
import { themeStorageKey } from "./theme-preference";
import "./theme-lantern-toggle.css";

function subscribe(notify: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(notify);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  function syncStorage(event: StorageEvent) {
    if (event.storageArea === localStorage && (event.key === themeStorageKey || event.key === null)) {
      root.dataset.theme = event.newValue === "light" ? "light" : "dark";
    }
  }

  window.addEventListener("storage", syncStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", syncStorage);
  };
}

function useThemeSwitch() {
  const light = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "light", () => false);

  function toggleTheme() {
    const root = document.documentElement;
    const theme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = theme;
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch {
      // The toggle still works for this page if storage is blocked.
    }
  }

  return { light, toggleTheme };
}

export function ContactLanternToggle() {
  const { light, toggleTheme } = useThemeSwitch();
  return (
    <button
      className="theme-lantern theme-lantern-contact"
      type="button"
      aria-label={light ? "Switch to dark mode (Contact tree lantern)" : "Switch to light mode (Contact tree lantern)"}
      onClick={toggleTheme}
    />
  );
}

export function ThemeLanternToggle({ variant = "header" }: { variant?: "header" | "branch" }) {
  const { light, toggleTheme } = useThemeSwitch();
  const switchLabel = light ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      className={`theme-lantern theme-lantern-${variant}`}
      type="button"
      aria-label={variant === "branch" ? "Light mode (cherry tree lantern)" : "Light mode"}
      aria-pressed={light}
      title={switchLabel}
      onClick={event => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          event.currentTarget.querySelector("svg")?.animate(
            [{ filter: "brightness(1)" }, { filter: "brightness(1.55)", offset: .22 }, { filter: "brightness(1)" }],
            { duration: 380, easing: "ease-out" }
          );
        }
        toggleTheme();
      }}
    >
      <svg viewBox="10 10 43 76" aria-hidden="true" shapeRendering="crispEdges">
        <g className="theme-lantern-hanging">
          <path fill="#3e292a" d="M30 10h5v4h3v8h-2v19h-7V19h-1v-6h2z" />
          <path fill="#926957" d="M31 13h2v6h-1v19h-2V18h1z" />
          <path fill="#59403a" d="M26 36h12v4h5v5h4v5h4v6H13v-5h4v-5h4v-5h5z" />
          <path fill="#a0704c" d="M24 42h16v3H24zM19 48h25v3H19zM15 53h32v3H15z" />
          <path className="theme-lantern-glass" fill="#db832c" d="M16 55h31v25H16z" />
          <path fill="#ffc45b" d="M19 58h14v19H19zM39 59h6v18h-6z" />
          <path fill="#ffe9a1" d="M23 62h9v14h-9zM41 64h3v10h-3z" />
          <path fill="#fff6cb" d="M26 66h5v7h-5z" />
          <path fill="#b65d26" d="M17 56h16v3H17zM39 56h7v3h-7zM17 76h17v3H17z" />
          <path fill="#69402c" d="M14 54h4v25h-4zM34 54h5v25h-5zM46 54h3v26h-3zM12 79h39v5H12z" />
          <path fill="#ad764c" d="M14 80h33v2H14zM34 57h1v20h-1z" />
        </g>
      </svg>
    </button>
  );
}