/* =========================================================
   RAG (red / amber / green) — single source of truth.
   Thresholds live here so every dashboard is consistent.
   ========================================================= */

export const RAG_COLOR = { good: "#34d399", warn: "#fbbf24", bad: "#f87171" };

/* Named metric thresholds. `good` and `warn` are the boundary values.
   For higher-is-better metrics, value >= good => good, >= warn => warn, else bad.
   For lower-is-better, value <= good => good, <= warn => warn, else bad. */
export const RAG = {
  oee:        { good: 85, warn: 70, higherIsBetter: true },   // %
  availability: { good: 90, warn: 80, higherIsBetter: true },
  performance:  { good: 95, warn: 85, higherIsBetter: true },
  quality:    { good: 98, warn: 95, higherIsBetter: true },   // %
  efficiency: { good: 90, warn: 78, higherIsBetter: true },   // %
  achievement:{ good: 100, warn: 90, higherIsBetter: true },  // % vs plan
  utilization:{ good: 88, warn: 75, higherIsBetter: true },   // %
  balance:    { good: 90, warn: 78, higherIsBetter: true },   // line balance %
  fpy:        { good: 98, warn: 95, higherIsBetter: true },
  dhu:        { good: 2, warn: 5, higherIsBetter: false },    // defects per hundred units
  rejection:  { good: 1, warn: 3, higherIsBetter: false },    // %
  rework:     { good: 2, warn: 4, higherIsBetter: false },    // %
  downtime:   { good: 5, warn: 10, higherIsBetter: false },   // % of time
  mtbf:       { good: 120, warn: 60, higherIsBetter: true },  // hours
  mttr:       { good: 1, warn: 3, higherIsBetter: false },    // hours
  otif:       { good: 95, warn: 85, higherIsBetter: true },   // %
  pmCompliance:{ good: 95, warn: 85, higherIsBetter: true },  // %
  turnover:   { good: 8, warn: 4, higherIsBetter: true },     // inventory turns
  cpk:        { good: 1.33, warn: 1.0, higherIsBetter: true },
  leadTime:   { good: 5, warn: 10, higherIsBetter: false },   // days
  pce:        { good: 25, warn: 10, higherIsBetter: true },   // process cycle efficiency %
  safety:     { good: 0, warn: 1, higherIsBetter: false },    // lost-time incidents
  energy:     { good: 0.9, warn: 1.0, higherIsBetter: false },// intensity vs target (ratio)
};

/* Generic resolver given a metric key + value (scaled 0-100 or raw units). */
export function rag(metric, value) {
  const c = RAG[metric];
  if (!c) return "good";
  if (c.higherIsBetter) {
    if (value >= c.good) return "good";
    if (value >= c.warn) return "warn";
    return "bad";
  } else {
    if (value <= c.good) return "good";
    if (value <= c.warn) return "warn";
    return "bad";
  }
}

export function ragColor(metric, value) {
  return RAG_COLOR[rag(metric, value)];
}

/* Percent values sometimes exceed 100 (e.g. achievement) — clamp helpers */
export function pct(x, dec = 1) {
  return (typeof x === "number" ? x.toFixed(dec) : x) + "%";
}
