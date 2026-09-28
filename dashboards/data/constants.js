/* Shared reference data (synthetic) reused across dashboards. */

export const LINES = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5", "Line 6"];

export const SKUS = [
  { id: "SKU-1001", name: "MCB 16A", group: "MCB", smv: 1.8 },
  { id: "SKU-1002", name: "MCB 32A", group: "MCB", smv: 2.1 },
  { id: "SKU-2001", name: "LED Bulb 9W", group: "LED", smv: 1.2 },
  { id: "SKU-2002", name: "LED Bulb 15W", group: "LED", smv: 1.4 },
  { id: "SKU-3001", name: "Switch 1-Gang", group: "Wiring", smv: 0.9 },
  { id: "SKU-3002", name: "Socket 13A", group: "Wiring", smv: 1.1 },
  { id: "SKU-4001", name: "Ceiling Fan", group: "Fan", smv: 6.5 },
  { id: "SKU-4002", name: "Exhaust Fan", group: "Fan", smv: 5.8 },
  { id: "SKU-5001", name: "DB Box 4W", group: "DB", smv: 3.2 },
  { id: "SKU-5002", name: "DB Box 8W", group: "DB", smv: 3.9 },
];

export const DEFECT_TYPES = [
  "Scratch / cosmetic",
  "Wrong assembly",
  "Missing component",
  "Poor soldering",
  "Dimensional deviation",
  "Functional failure",
  "Contamination",
  "Packing error",
];

export const MACHINES = [
  "Injection Moulding",
  "SMT Line",
  "Assembly Conveyor",
  "Press Machine",
  "Packing Machine",
  "CNC Router",
  "Testing Rig",
  "Winding Machine",
];

export const DOWNTIME_REASONS = [
  "Tool changeover",
  "Mechanical breakdown",
  "Material shortage",
  "Quality adjustment",
  "Power outage",
  "Operator absence",
  "Scheduled PM",
  "Minor stoppage",
];

export const SUPPLIERS = [
  "Alpha Components",
  "Beta Plastics",
  "Gamma Electronics",
  "Delta Packaging",
  "Epsilon Metals",
  "Zeta Wiring",
];

export const WASTE_TYPES = [
  "Overproduction",
  "Waiting",
  "Transport",
  "Over-processing",
  "Inventory",
  "Motion",
  "Defects",
  "Unused talent",
];

export const DEPARTMENTS = ["Assembly", "Moulding", "SMT", "Packing", "Quality", "Maintenance", "Store", "Planning"];

export const SHIFTS = ["Shift A", "Shift B", "Shift C"];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
