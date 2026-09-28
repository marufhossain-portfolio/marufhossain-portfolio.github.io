/* =========================================================
   RAG (red / amber / green) — sales & distribution thresholds.
   Single source of truth for the sales-mis suite.
   ========================================================= */

export const RAG_COLOR = { good: "#34d399", warn: "#fbbf24", bad: "#f87171" };

export const RAG = {
  achievement: { good: 100, warn: 90, higherIsBetter: true },  // % vs target
  growth:      { good: 10, warn: 0, higherIsBetter: true },    // % MoM / YoY
  conversion:  { good: 30, warn: 15, higherIsBetter: true },   // % lead -> delivery
  otif:        { good: 95, warn: 85, higherIsBetter: true },   // % on-time delivery
  leadTime:    { good: 5, warn: 10, higherIsBetter: false },   // days
  ageing:      { good: 30, warn: 60, higherIsBetter: false },  // inventory age (days)
  turnover:    { good: 8, warn: 4, higherIsBetter: true },     // inventory turns / yr
  margin:      { good: 12, warn: 6, higherIsBetter: true },    // % gross margin
  revenue:     { good: 100, warn: 90, higherIsBetter: true },  // % revenue vs budget
  variance:    { good: 0, warn: -5, higherIsBetter: true },    // % variance (neg = miss)
  dataQuality: { good: 98, warn: 90, higherIsBetter: true },   // % clean records
};

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

export function pct(x, dec = 1) {
  return (typeof x === "number" ? x.toFixed(dec) : x) + "%";
}
