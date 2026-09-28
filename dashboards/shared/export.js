/* CSV export helper */

function esc(v) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/[",\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCSV(columns, rows) {
  const header = columns.map((c) => esc(typeof c === "string" ? c : c.label)).join(",");
  const body = rows
    .map((r) => columns.map((c) => esc(typeof c === "string" ? r[c] : r[c.key])).join(","))
    .join("\n");
  return "\uFEFF" + header + "\n" + body;
}

export function downloadCSV(filename, columns, rows) {
  const csv = toCSV(columns, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
