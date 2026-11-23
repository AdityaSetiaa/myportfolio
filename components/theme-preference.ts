export const themeStorageKey = "portfolio-theme";

export const restoreThemeBeforePaint = `
  try {
    if (localStorage.getItem("${themeStorageKey}") === "light") {
      document.documentElement.dataset.theme = "light";
    }
  } catch {}
`;