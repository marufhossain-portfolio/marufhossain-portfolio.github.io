/* Shared reference data (synthetic) for the automotive sales & distribution MIS. */

export const REGIONS = ["Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh"];

export const MODELS = [
  { id: "M-SED", name: "Sedan X", price: 2_450_000 },
  { id: "M-SUV", name: "SUV Y", price: 3_850_000 },
  { id: "M-HTB", name: "Hatchback Z", price: 1_650_000 },
  { id: "M-MPV", name: "MPV W", price: 2_950_000 },
  { id: "M-PCK", name: "Pickup V", price: 3_250_000 },
  { id: "M-EV", name: "EV Compact", price: 2_150_000 },
];

export const DEALERS = [
  { id: "DL-01", name: "Dhaka City Motors", region: "Dhaka" },
  { id: "DL-02", name: "Uttara Auto", region: "Dhaka" },
  { id: "DL-03", name: "Chattogram Wheels", region: "Chattogram" },
  { id: "DL-04", name: "Agrabad Auto", region: "Chattogram" },
  { id: "DL-05", name: "Khulna Motors", region: "Khulna" },
  { id: "DL-06", name: "Rajshahi Auto", region: "Rajshahi" },
  { id: "DL-07", name: "Sylhet Autos", region: "Sylhet" },
  { id: "DL-08", name: "Barishal Wheels", region: "Barishal" },
  { id: "DL-09", name: "Rangpur Motors", region: "Rangpur" },
  { id: "DL-10", name: "Mymensingh Auto", region: "Mymensingh" },
  { id: "DL-11", name: "Comilla Auto House", region: "Chattogram" },
  { id: "DL-12", name: "Gazipur Motors", region: "Dhaka" },
];

export const FUNNEL_STAGES = ["Lead", "Test drive", "Booking", "Invoiced", "Delivered"];

export const ORDER_STATUS = ["Booked", "Invoiced", "Delivered", "Cancelled"];

export const DEPARTMENTS = ["Sales", "Finance", "Inventory", "Service"];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
