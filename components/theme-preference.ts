export const themeStorageKey = "portfolio-theme";

export const restoreThemeBeforePaint = `
  (() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-theme")) return;
    let theme = "dark";
    try {
      if (localStorage.getItem("${themeStorageKey}") === "light") theme = "light";
    } catch {}
    root.dataset.theme = theme;
  })();
`;
