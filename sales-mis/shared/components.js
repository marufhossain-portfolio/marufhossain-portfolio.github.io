/* =========================================================
   Shared UI components — used by every dashboard page.
   ========================================================= */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/* ---- theme handling ---- */
export function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("mmh2-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.setAttribute("data-theme", stored || (prefersLight ? "light" : "dark"));
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("mmh2-theme", next);
    });
  }
}

/* ---- required sample-data badge ---- */
export function sampleBadge() {
  return el(
    "div",
    { class: "badge-sample", role: "note" },
    el("span", {
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    }),
    el("span", {}, "Sample data for demonstration")
  );
}

/* ---- KPI cards ---- */
export function kpiCards(items) {
  const wrap = el("div", { class: "kpis" });
  for (const it of items) {
    const delta = it.delta
      ? el("span", { class: "delta " + (it.deltaDir || "up") }, it.delta)
      : null;
    wrap.append(
      el(
        "div",
        { class: "kpi", "data-status": it.status || "" },
        el("div", { class: "lab" }, it.label),
        el("div", { class: "val" }, it.value, delta || ""),
        el("div", { class: "sub" }, it.sub || "")
      )
    );
  }
  return wrap;
}

/* ---- filter bar ---- */
export function filterBar(fields, onChange) {
  const bar = el("div", { class: "filterbar" });
  const state = {};
  for (const f of fields) {
    let control;
    if (f.type === "select") {
      control = el(
        "select",
        { "data-key": f.key },
        ...f.options.map((o) =>
          el("option", { value: typeof o === "string" ? o : o.value, selected: typeof o === "object" && o.selected ? "" : null }, typeof o === "string" ? o : o.label)
        )
      );
      state[f.key] = control.value;
    } else if (f.type === "date") {
      control = el("input", { type: "date", "data-key": f.key, value: f.value || "" });
      state[f.key] = control.value;
    } else if (f.type === "range") {
      const val = el("span", { class: "range-val", id: "rv-" + f.key }, f.value ?? f.min);
      control = el("input", {
        type: "range", "data-key": f.key, min: f.min, max: f.max, step: f.step || 1, value: f.value ?? f.min,
      });
      state[f.key] = Number(control.value);
      control.addEventListener("input", () => {
        val.textContent = control.value + (f.suffix || "");
        state[f.key] = Number(control.value);
        if (onChange) onChange(state);
      });
      bar.append(el("div", { class: "field" }, el("label", {}, f.label), el("div", { style: "display:flex;align-items:center;gap:10px" }, control, val)));
      continue;
    } else if (f.type === "number") {
      control = el("input", { type: "number", "data-key": f.key, value: f.value ?? "", min: f.min, max: f.max, step: f.step || 1 });
      state[f.key] = Number(control.value);
    }
    control.addEventListener("change", () => {
      state[f.key] = f.type === "number" || f.type === "range" ? Number(control.value) : control.value;
      if (onChange) onChange(state);
    });
    bar.append(el("div", { class: "field" }, el("label", {}, f.label), control));
  }
  return { el: bar, state };
}

/* ---- data table ---- */
export function dataTable(columns, rows) {
  const scroll = el("div", { class: "table-scroll" });
  const table = el("table", { class: "data" });
  const thead = el("thead");
  const trh = el("tr");
  for (const c of columns) {
    const th = el("th", { class: c.align === "right" ? "num" : "" }, typeof c === "string" ? c : c.label);
    trh.append(th);
  }
  thead.append(trh);
  table.append(thead);

  const tbody = el("tbody");
  for (const r of rows) {
    const tr = el("tr");
    for (const c of columns) {
      const key = typeof c === "string" ? c : c.key;
      let cellVal = typeof c === "string" ? r[c] : r[key];
      if (c.render) cellVal = c.render(r);
      const td = el("td", { class: c.align === "right" ? "num" : "" });
      if (cellVal instanceof Node) td.append(cellVal);
      else td.append(document.createTextNode(cellVal == null ? "" : String(cellVal)));
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  scroll.append(table);
  return scroll;
}

/* ---- RAG pill / dot helpers ---- */
export function pill(status, text) {
  return el("span", { class: "pill " + status }, text);
}
export function ragDot(status) {
  return el("span", { class: "rag-dot", style: `background:var(--${status === "good" ? "good" : status === "warn" ? "warn" : "bad"})` });
}

/* ---- insights box ---- */
export function insights(items) {
  const ul = el("ul");
  for (const it of items) {
    ul.append(el("li", { html: it }));
  }
  return el("div", { class: "insights" }, el("h3", {}, "Auto insights"), ul);
}

/* ---- "how it's calculated" collapsible ---- */
export function calcSection(title, formulas, notes) {
  const body = el("div", { class: "calc-body" });
  for (const f of formulas) {
    body.append(el("span", { class: "formula" }, f));
  }
  if (notes && notes.length) {
    const ul = el("ul");
    for (const n of notes) ul.append(el("li", {}, n));
    body.append(ul);
  }
  const wrap = el("div", { class: "calc" });
  const btn = el(
    "button",
    { type: "button" },
    el("span", { html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' }),
    el("span", {}, title),
    el("span", { class: "chev", html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>' })
  );
  btn.addEventListener("click", () => wrap.classList.toggle("open"));
  wrap.append(btn, body);
  return wrap;
}

/* ---- card wrapper ---- */
export function card(title, iconPath, content) {
  const h = el("h3", {});
  if (iconPath) h.append(el("span", { class: "ico", html: iconPath }));
  h.append(el("span", {}, title));
  return el("div", { class: "card" }, h, content);
}

/* ---- heatmap grid (rows x cols of colored cells) ---- */
export function heatmap({ rowLabels, colLabels, values, colorFor, fmt }) {
  const wrap = el("div", { class: "table-scroll" });
  const table = el("table", { class: "data heatmap", style: "min-width:0" });
  const thead = el("thead");
  const htr = el("tr");
  htr.append(el("th", {}, ""));
  for (const c of colLabels) htr.append(el("th", { class: "num" }, c));
  thead.append(htr);
  table.append(thead);
  const tbody = el("tbody");
  values.forEach((row, i) => {
    const tr = el("tr");
    tr.append(el("td", {}, rowLabels[i]));
    row.forEach((v, j) => {
      const td = el("td", { class: "num" }, fmt ? fmt(v) : String(v));
      td.style.background = colorFor(v);
      td.style.color = "#0a0f1f";
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

/* ---- toolbar (regenerate + export) ---- */
const REFRESH_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>';
const DOWNLOAD_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>';

export function toolbarButtons({ onRegenerate, onExport, extra }) {
  const bar = el("div", { class: "toolbar" });
  bar.append(
    el("button", { class: "btn", type: "button", html: REFRESH_ICON + '<span>Regenerate data</span>', onclick: onRegenerate }),
    el("button", { class: "btn primary", type: "button", html: DOWNLOAD_ICON + "<span>Export CSV</span>", onclick: onExport })
  );
  if (extra) for (const b of extra) bar.append(b);
  return bar;
}

/* ---- number formatting ---- */
export const fmt = (n, dec = 0) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function pctStr(x, dec = 1) {
  return (x == null ? "—" : Number(x).toFixed(dec)) + "%";
}
