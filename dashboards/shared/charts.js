/* =========================================================
   Chart helpers — wraps Chart.js (loaded via <script> tag as
   global `window.Chart`) with theme-aware defaults.
   ========================================================= */

const PALETTE = ["#6366f1", "#22d3ee", "#a855f7", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#60a5fa", "#fb923c", "#a3e635"];

function isLight() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

export function theme() {
  const light = isLight();
  return {
    grid: light ? "rgba(15,23,42,0.08)" : "rgba(148,163,184,0.08)",
    tick: light ? "#5a6780" : "#94a3b8",
  };
}

export function color(i) {
  return PALETTE[i % PALETTE.length];
}

export function colorAlpha(i, a) {
  const c = color(i);
  const hex = c.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function base(cfg) {
  const t = theme();
  const font = '"Manrope", system-ui, sans-serif';
  if (cfg.options?.scales) {
    for (const k of Object.keys(cfg.options.scales)) {
      const s = cfg.options.scales[k];
      s.grid = Object.assign({ color: t.grid }, s.grid || {});
      s.ticks = Object.assign({ color: t.tick, font: { family: font, size: 11 } }, s.ticks || {});
      if (s.title) s.title = Object.assign({ color: t.tick, font: { family: font, size: 11 } }, s.title);
    }
  }
  if (cfg.options?.plugins?.legend) {
    cfg.options.plugins.legend.labels = Object.assign(
      { color: t.tick, font: { family: font, size: 12 }, usePointStyle: true, boxWidth: 8 },
      cfg.options.plugins.legend.labels || {}
    );
  }
  return cfg;
}

export function make(canvas, cfg) {
  if (!window.Chart) throw new Error("Chart.js not loaded");
  return new window.Chart(canvas, base(cfg));
}

/* ---- convenience chart factories ---- */

export function lineChart(canvas, { labels, datasets, yTitle, stacked = false, fill = false, tension = 0.3 }) {
  return make(canvas, {
    type: "line",
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label: d.label,
        data: d.data,
        borderColor: d.color || color(i),
        backgroundColor: d.color ? colorAlpha(i, 0.12) : colorAlpha(i, 0.12),
        fill: d.fill ?? fill,
        tension,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked },
        y: { stacked, title: yTitle ? { display: true, text: yTitle } : undefined },
      },
    },
  });
}

export function barChart(canvas, { labels, datasets, yTitle, stacked = false, horizontal = false }) {
  return make(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.backgroundColor ?? (d.color || color(i)),
        borderColor: "transparent",
        borderRadius: horizontal ? 6 : 4,
        barThickness: d.barThickness,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked },
        y: { stacked, beginAtZero: true, title: yTitle ? { display: true, text: yTitle } : undefined },
      },
      indexAxis: horizontal ? "y" : "x",
    },
  });
}

/* Pareto: bars + cumulative % line + optional 80% reference marker */
export function paretoChart(canvas, { labels, values, valueLabel = "Value", yTitle }) {
  const total = values.reduce((a, b) => a + b, 0);
  let cum = 0;
  const cumPct = values.map((v) => {
    cum += v;
    return +( (cum / total) * 100 ).toFixed(1);
  });
  return make(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: valueLabel,
          data: values,
          backgroundColor: values.map((_, i) => (cumPct[i] <= 80 ? color(0) : color(5))),
          yAxisID: "y",
          borderRadius: 4,
        },
        {
          type: "line",
          label: "Cumulative %",
          data: cumPct,
          borderColor: "#fbbf24",
          backgroundColor: "#fbbf24",
          pointRadius: 3,
          pointBackgroundColor: "#fbbf24",
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: yTitle || valueLabel },
          grid: { color: theme().grid },
          ticks: { color: theme().tick },
        },
        y1: {
          position: "right",
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Cumulative %" },
          grid: { drawOnChartArea: false },
          ticks: { color: theme().tick, callback: (v) => v + "%" },
        },
        x: { grid: { display: false }, ticks: { color: theme().tick, maxRotation: 45, minRotation: 0 } },
      },
    },
  });
}

export function doughnutChart(canvas, { labels, values, colors }) {
  return make(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors || labels.map((_, i) => color(i)),
          borderWidth: 2,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#05060d",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: { legend: { position: "bottom" } },
    },
  });
}

/* Heatmap via a scatter / matrix plugin-free approach using bar grid is complex;
   we render heatmaps with a plain colored grid in components.js instead. */

export function destroyChart(chart) {
  if (chart && typeof chart.destroy === "function") chart.destroy();
}
