/**
 * Preferencias globales del prototipo SUMA (tema + tipo de menú).
 * Persistidas en localStorage y aplicadas a <html>.
 */
(function () {
  const KEY_THEME = "suma.prefs.theme";
  const KEY_MENU = "suma.prefs.menuMode";
  const KEY_SIDE = "suma.prefs.sideCollapsed";

  function read(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }

  function applyTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    write(KEY_THEME, t);
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      const on = btn.getAttribute("data-theme-btn") === t;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function applyMenuMode(mode) {
    const m = mode === "launcher" ? "launcher" : "side";
    document.documentElement.setAttribute("data-menu-mode", m);
    write(KEY_MENU, m);
    document.querySelectorAll("[data-menu-mode-btn]").forEach((btn) => {
      const on = btn.getAttribute("data-menu-mode-btn") === m;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const shell = document.querySelector(".shell");
    if (shell) shell.classList.remove("nav-open");
  }

  function applySideCollapsed(collapsed) {
    const on = collapsed === true || collapsed === "true";
    document.documentElement.setAttribute(
      "data-side-collapsed",
      on ? "true" : "false"
    );
    write(KEY_SIDE, on ? "true" : "false");
    document.querySelectorAll("[data-side-collapse]").forEach((btn) => {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        on ? "Expandir menú" : "Plegar menú"
      );
      btn.setAttribute(
        "title",
        on ? "Expandir menú" : "Plegar menú"
      );
    });
  }

  function toggleSideCollapsed() {
    const cur =
      document.documentElement.getAttribute("data-side-collapsed") === "true";
    applySideCollapsed(!cur);
  }

  function bind() {
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.addEventListener("click", () =>
        applyTheme(btn.getAttribute("data-theme-btn"))
      );
    });
    document.querySelectorAll("[data-menu-mode-btn]").forEach((btn) => {
      btn.addEventListener("click", () =>
        applyMenuMode(btn.getAttribute("data-menu-mode-btn"))
      );
    });
    document.querySelectorAll("[data-side-collapse]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSideCollapsed();
      });
    });
  }

  function boot() {
    const theme = read(KEY_THEME, "light");
    const menuMode = read(KEY_MENU, "side");
    const sideCollapsed = read(KEY_SIDE, "false") === "true";
    applyTheme(theme);
    applyMenuMode(menuMode);
    applySideCollapsed(sideCollapsed);
    bind();
  }

  // Aplica ya al <html> para evitar flash; re-sincroniza botones al DOM listo
  applyTheme(read(KEY_THEME, "light"));
  applyMenuMode(read(KEY_MENU, "side"));
  applySideCollapsed(read(KEY_SIDE, "false") === "true");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.SUMA_PREFS = {
    applyTheme,
    applyMenuMode,
    applySideCollapsed,
    toggleSideCollapsed,
  };
})();
