/* ============================================================
   Business Development — seeded demo data layer
   All tables linked by IDs. Reproducible (seed = 42).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- seeded PRNG ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    var n = mulberry32(seed);
    return {
      next: n,
      int: function (a, b) { return Math.floor(n() * (b - a + 1)) + a; },
      float: function (a, b) { return n() * (b - a) + a; },
      pick: function (arr) { return arr[Math.floor(n() * arr.length)]; },
      bool: function (p) { return n() < (p || 0.5); },
      norm: function (m, s) { var x = 0; for (var i = 0; i < 6; i++) x += n(); return m + (x - 3) / Math.sqrt(0.5) * s; }
    };
  }

  /* ---------- date helpers ---------- */
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  var MS = 86400000;
  function daysAgo(d) { return new Date(TODAY.getTime() - d * MS); }
  function daysFrom(d, n) { return new Date(d.getTime() + n * MS); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmt(d) { return d.getDate() + '-' + MONTHS[d.getMonth()] + '-' + d.getFullYear(); }

  /* ---------- reference lists ---------- */
  var REGIONS = ['Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'];
  var CITIES = {
    Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj'], Chattogram: ['Chattogram', 'Cumilla'], Khulna: ['Khulna', 'Jessore'],
    Rajshahi: ['Rajshahi', 'Bogra'], Sylhet: ['Sylhet'], Barishal: ['Barishal'], Rangpur: ['Rangpur', 'Dinajpur'], Mymensingh: ['Mymensingh']
  };
  var CATEGORIES = ['Category A', 'Category B', 'Category C', 'Category D'];
  var PRODUCTS = [
    { id: 'P1', name: 'Product A1', category: 'Category A', list_price: 125000, unit_cost: 82000 },
    { id: 'P2', name: 'Product A2', category: 'Category A', list_price: 205000, unit_cost: 141000 },
    { id: 'P3', name: 'Product B1', category: 'Category B', list_price: 48000, unit_cost: 30000 },
    { id: 'P4', name: 'Product B2', category: 'Category B', list_price: 87000, unit_cost: 56000 },
    { id: 'P5', name: 'Product C1', category: 'Category C', list_price: 320000, unit_cost: 226000 },
    { id: 'P6', name: 'Product C2', category: 'Category C', list_price: 540000, unit_cost: 392000 },
    { id: 'P7', name: 'Product D1', category: 'Category D', list_price: 158000, unit_cost: 109000 },
    { id: 'P8', name: 'Product D2', category: 'Category D', list_price: 69000, unit_cost: 41000 }
  ];
  var CLIENT_TYPES = ['Corporate', 'Government', 'Dealer-Customer', 'Retail'];
  var INDUSTRIES = ['Textile', 'Pharma', 'FMCG', 'Construction', 'IT', 'Education', 'Hospitality', 'Power'];
  var LEAD_SOURCES = ['Referral', 'Cold Call', 'Website', 'Exhibition', 'Dealer', 'LinkedIn'];
  var STAGES = ['Lead', 'Qualified', 'Meeting', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  var OPEN_STAGES = ['Lead', 'Qualified', 'Meeting', 'Proposal', 'Negotiation'];
  var STAGE_PROB = { Lead: 0.10, Qualified: 0.25, Meeting: 0.40, Proposal: 0.60, Negotiation: 0.80 };
  var LOSS_REASONS = ['Price', 'Competitor', 'Timing', 'Specs', 'Budget', 'No Response'];
  var COMPETITORS = [
    { id: 'CP1', name: 'Competitor Alpha' }, { id: 'CP2', name: 'Competitor Beta' },
    { id: 'CP3', name: 'Competitor Gamma' }, { id: 'CP4', name: 'Competitor Delta' },
    { id: 'CP5', name: 'Competitor Epsilon' }
  ];
  var FIRST = ['Rahim', 'Karim', 'Sabbir', 'Nusrat', 'Tahmid', 'Farhana', 'Tanvir', 'Mim', 'Arif', 'Sadia', 'Rakib', 'Jannat', 'Shuvo', 'Priya', 'Hasan', 'Lima', 'Sajib', 'Ruma', 'Nayeem', 'Tania'];

  var R = rng(42);

  /* ---------- sales owners ---------- */
  var owners = REGIONS.slice(0, 8).map(function (r, i) {
    return { owner_id: 'O' + (i + 1), name: R.pick(FIRST) + ' ' + R.pick(FIRST), region: r, monthly_target: R.int(40, 90) * 100000 };
  });

  /* ---------- dealers ---------- */
  var dealers = [];
  for (var d = 0; d < 15; d++) {
    var region = R.pick(REGIONS);
    dealers.push({
      dealer_id: 'D' + (d + 1), name: R.pick(FIRST) + ' ' + R.pick(['Trading', 'Motors', 'Enterprise', 'Supplies', 'Corp']) + ' ' + (d + 1),
      region: region, city: R.pick(CITIES[region]), tier: R.pick(['A', 'B', 'C']), onboard_date: iso(daysAgo(R.int(180, 1200)))
    });
  }

  /* ---------- clients ---------- */
  var clients = [];
  for (var c = 0; c < 60; c++) {
    var region = R.pick(REGIONS);
    var type = R.pick(CLIENT_TYPES);
    clients.push({
      client_id: 'C' + (c + 1), name: R.pick(FIRST) + ' ' + R.pick(['Textiles', 'Pharma', 'Foods', 'Steel', 'Energy', 'Trading', 'Homes', 'Ltd']) + ' Ltd',
      type: type, industry: R.pick(INDUSTRIES), region: region, city: R.pick(CITIES[region]),
      credit_limit: R.int(5, 40) * 100000, onboard_date: iso(daysAgo(R.int(60, 1500))), is_active: R.bool(0.9)
    });
  }

  /* ---------- leads ---------- */
  var leads = [];
  for (var l = 0; l < 700; l++) {
    var region = R.pick(REGIONS);
    var conv = R.bool(0.35);
    leads.push({
      lead_id: 'L' + (l + 1), created_date: iso(daysAgo(R.int(0, 360))), source: R.pick(LEAD_SOURCES),
      client_id: R.bool(0.5) ? 'C' + R.int(1, 60) : null, region: region, product_interest: R.pick(PRODUCTS).id,
      owner_id: R.pick(owners).owner_id, status: conv ? 'Converted' : (R.bool(0.5) ? 'Open' : 'Dropped'),
      expected_value: R.int(2, 60) * 100000
    });
  }

  /* ---------- opportunities (from converted leads) ---------- */
  var opportunities = [];
  var convertedLeads = leads.filter(function (x) { return x.status === 'Converted'; });
  var oppCount = 0;
  convertedLeads.slice(0, 260).forEach(function (lead, i) {
    oppCount++;
    var product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    var type = lead.client_id ? (clients.find(function (c) { return c.client_id === lead.client_id; }) || {}).type || 'Corporate' : 'Corporate';
    var created = daysAgo(R.int(5, 360));
    var cycle = type === 'Government' ? R.int(45, 100) : type === 'Corporate' ? R.int(30, 75) : R.int(20, 55);
    var outcome = R.bool(0.30) ? 'Won' : R.bool(0.62) ? 'Lost' : 'Open';
    var stage = outcome === 'Won' ? 'Won' : outcome === 'Lost' ? 'Lost' : OPEN_STAGES[R.int(0, 4)];
    var qty = R.int(1, 50);
    var deal_value = Math.round(qty * product.list_price * R.float(0.7, 1.3));
    var expected_close = daysFrom(created, cycle);
    opportunities.push({
      opp_id: 'OP' + (oppCount), lead_id: lead.lead_id, client_id: lead.client_id || 'C' + R.int(1, 60),
      dealer_id: R.bool(0.4) ? 'D' + R.int(1, 15) : null, product_id: product.id, qty: qty, deal_value: deal_value,
      discount_pct: R.int(0, 20), current_stage: stage, created_date: iso(created), expected_close_date: iso(expected_close),
      closed_date: outcome !== 'Open' ? iso(daysFrom(created, R.int(cycle - 15, cycle + 20))) : null,
      outcome: outcome, loss_reason: outcome === 'Lost' ? R.pick(LOSS_REASONS) : null,
      competitor_id: outcome === 'Lost' ? R.pick(COMPETITORS).id : null, owner_id: lead.owner_id, region: lead.region
    });
  });

  /* ---------- stage history ---------- */
  var stage_history = [];
  opportunities.forEach(function (op) {
    var created = new Date(op.created_date);
    var order = OPEN_STAGES.slice(0, OPEN_STAGES.indexOf(op.current_stage) + 1);
    if (op.current_stage === 'Won') order = OPEN_STAGES.concat(['Won']);
    if (op.current_stage === 'Lost') order = OPEN_STAGES.slice(0, 3).concat(['Lost']);
    var prev = created;
    order.forEach(function (s, i) {
      var d = i === order.length - 1 ? (op.closed_date ? new Date(op.closed_date) : daysFrom(created, R.int(10, 40))) : daysFrom(created, Math.round((i + 1) / order.length * 30));
      stage_history.push({ opp_id: op.opp_id, stage: s, entered_date: iso(d) });
    });
  });

  /* ---------- sales orders (from won opportunities + repeat orders) ---------- */
  var sales_orders = [];
  var wonOpps = opportunities.filter(function (o) { return o.outcome === 'Won'; });
  var soCount = 0;
  for (var s = 0; s < 180; s++) {
    var wo = wonOpps[s % wonOpps.length];
    var product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    var qty = R.int(1, 40);
    var order_date = daysAgo(R.int(0, 360));
    soCount++;
    sales_orders.push({
      order_id: 'SO' + (soCount), opp_id: wo.opp_id, client_id: wo.client_id, dealer_id: wo.dealer_id,
      product_id: product.id, order_date: iso(order_date), qty: qty,
      net_value: Math.round(qty * product.list_price * R.float(0.85, 1.0)), region: wo.region, owner_id: wo.owner_id
    });
  }

  /* ---------- invoices ---------- */
  var invoices = [];
  var invCount = 0;
  sales_orders.slice(0, 180).forEach(function (so) {
    invCount++;
    var inv_date = new Date(so.order_date);
    var due = daysFrom(inv_date, R.int(15, 60));
    var paid = R.bool(0.85);
    var paid_amt = paid ? so.net_value : (R.bool(0.4) ? Math.round(so.net_value * R.float(0.2, 0.8)) : 0);
    invoices.push({
      invoice_id: 'INV' + (invCount), order_id: so.order_id, client_id: so.client_id,
      invoice_date: iso(inv_date), due_date: iso(due), amount: so.net_value,
      paid_amount: paid_amt, paid_date: paid ? iso(daysFrom(inv_date, R.int(5, 45))) : (paid_amt > 0 ? iso(daysFrom(inv_date, R.int(5, 30))) : null),
      region: so.region, owner_id: so.owner_id
    });
  });

  /* ---------- targets (monthly, per owner/region/category) ---------- */
  var targets = [];
  for (var m = 11; m >= 0; m--) {
    var monthDate = daysAgo(m * 30); var mk = (monthDate.getMonth() + 1) + '-' + monthDate.getFullYear();
    owners.forEach(function (o) {
      targets.push({ month: mk, owner_id: o.owner_id, region: o.region, category: 'All', target_value: o.monthly_target });
    });
    REGIONS.forEach(function (r) {
      CATEGORIES.forEach(function (cat) {
        targets.push({ month: mk, owner_id: null, region: r, category: cat, target_value: R.int(12, 40) * 100000 });
      });
    });
  }

  /* ---------- competitor prices ---------- */
  var competitor_prices = [];
  for (var cp = 0; cp < 150; cp++) {
    competitor_prices.push({
      competitor_id: R.pick(COMPETITORS).id, product_category: R.pick(CATEGORIES),
      date: iso(daysAgo(R.int(0, 360))), price: R.int(60, 140) * 1000, region: R.pick(REGIONS)
    });
  }

  /* ---------- forecast (next 3 months) ---------- */
  var forecast = [];
  for (var f = 1; f <= 3; f++) {
    CATEGORIES.forEach(function (cat) {
      REGIONS.forEach(function (r) {
        forecast.push({ month: fmt(daysFrom(TODAY, f * 30)), category: cat, region: r, forecast_value: R.int(20, 60) * 100000, plan_value: R.int(25, 65) * 100000 });
      });
    });
  }

  /* ---------- expose ---------- */
  window.BD = {
    TODAY: TODAY, REGIONS: REGIONS, CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS, CLIENT_TYPES: CLIENT_TYPES,
    LEAD_SOURCES: LEAD_SOURCES, STAGES: STAGES, OPEN_STAGES: OPEN_STAGES, STAGE_PROB: STAGE_PROB,
    LOSS_REASONS: LOSS_REASONS, COMPETITORS: COMPETITORS,
    owners: owners, dealers: dealers, clients: clients, leads: leads, opportunities: opportunities,
    stage_history: stage_history, sales_orders: sales_orders, targets: targets, invoices: invoices,
    competitor_prices: competitor_prices, forecast: forecast,
    fmt: fmt, fmtBDT: fmtBDT, iso: iso, daysAgo: daysAgo
  };

  function fmtBDT(n) {
    n = Math.round(n);
    var neg = n < 0 ? '-' : ''; n = Math.abs(n);
    if (n >= 10000000) { var c = n / 10000000; return neg + '৳' + (c >= 100 ? Math.round(c) : c.toFixed(2).replace(/\.?0+$/, '')) + ' Cr'; }
    if (n >= 100000) { var l = n / 100000; return neg + '৳' + (l >= 100 ? Math.round(l) : l.toFixed(1).replace(/\.0$/, '')) + ' L'; }
    if (n >= 1000) return neg + '৳' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return neg + '৳' + n;
  }
})();
