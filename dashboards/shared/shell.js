/* =========================================================
   Page shell — renders the shared top bar + page header so
   every dashboard looks and navigates consistently.
   ========================================================= */
import { initTheme, sampleBadge, el } from "./components.js";

const SUN = '<svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

export function renderShell({ title, kicker, description, category }) {
  initTheme();

  const topbar = el(
    "div",
    { class: "topbar" },
    el(
      "a",
      { class: "brand", href: "./index.html" },
      el("span", { class: "mark" }, "MMH"),
      el("span", { class: "txt" }, "Manufacturing Analytics", el("small", {}, category || "Dashboard"))
    ),
    el(
      "a",
      { class: "back", href: "./index.html" },
      el("span", { html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' }),
      "All dashboards"
    ),
    el("button", { class: "theme-toggle", id: "themeToggle", "aria-label": "Toggle theme", html: SUN + MOON })
  );

  const head = el(
    "div",
    { class: "wrap" },
    el(
      "div",
      { class: "page-head" },
      el("div", { class: "kicker" }, kicker || "Dashboard"),
      el("h1", {}, title),
      el("div", { class: "sub" }, description),
      sampleBadge()
    ),
    el("div", { id: "toolbar", class: "toolbar" }),
    el("main", { id: "main" })
  );

  document.body.prepend(head);
  document.body.prepend(topbar);
  return { head, main: document.getElementById("main"), toolbar: document.getElementById("toolbar") };
}
