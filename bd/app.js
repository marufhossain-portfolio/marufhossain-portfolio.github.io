/* ============================================================
   Business Development — calculations + UI (Overview + 9 tabs)
   ============================================================ */
(function () {
  'use strict';
  var BD = window.BD;
  var TODAY = BD.TODAY, MS = 86400000;
  var COLS = ['#6366f1', '#22d3ee', '#a855f7', '#34d399', '#f59e0b', '#ef4444', '#f472b6', '#60a5fa'];
  var GOOD = '#34d399', WARN = '#fbbf24', BAD = '#f87171', BLUE = '#60a5fa';

  function $ (s) { return document.querySelector(s); }
  function days(d) { return Math.floor((TODAY.getTime() - new Date(d).getTime()) / MS); }

  Chart.defaults.color = '#8b98b5';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Manrope',sans-serif";
  Chart.defaults.font.size = 11;

  /* ---------- global filter state ---------- */
  var F = {
    from: BD.daysAgo(360), to: TODAY,
    region: 'All', category: 'All', owner: 'All', clientType: 'All'
  };
  function inDate(d) { if (!d) return true; var t = new Date(d).getTime(); return t >= F.from.getTime() && t <= F.to.getTime() + MS; }
  function inPeriod(d) { return inDate(d); }

  function catOf(pid) { var p = BD.PRODUCTS.find(function (x) { return x.id === pid; }); return p ? p.category : 'Category A'; }
  function clientType(cid) { var c = BD.clients.find(function (x) { return x.client_id === cid; }); return c ? c.type : 'Retail'; }

  function passOpp(o) {
    if (!inPeriod(o.created_date)) return false;
    if (F.region !== 'All' && o.region !== F.region) return false;
    if (F.category !== 'All' && catOf(o.product_id) !== F.category) return false;
    if (F.owner !== 'All' && o.owner_id !== F.owner) return false;
    if (F.clientType !== 'All' && clientType(o.client_id) !== F.clientType) return false;
    return true;
  }
  function passOrder(so) {
    if (!inPeriod(so.order_date)) return false;
    if (F.region !== 'All' && so.region !== F.region) return false;
    if (F.category !== 'All' && catOf(so.product_id) !== F.category) return false;
    if (F.owner !== 'All' && so.owner_id !== F.owner) return false;
    if (F.clientType !== 'All' && clientType(so.client_id) !== F.clientType) return false;
    return true;
  }
  function passInvoice(inv) {
    if (F.region !== 'All' && inv.region !== F.region) return false;
    if (F.owner !== 'All' && inv.owner_id !== F.owner) return false;
    if (F.clientType !== 'All' && clientType(inv.client_id) !== F.clientType) return false;
    return true;
  }
  function passLead(l) {
    if (!inPeriod(l.created_date)) return false;
    if (F.region !== 'All' && l.region !== F.region) return false;
    if (F.category !== 'All' && catOf(l.product_interest) !== F.category) return false;
    if (F.owner !== 'All' && l.owner_id !== F.owner) return false;
    return true;
  }

  var opps = function () { return BD.opportunities.filter(passOpp); };
  var orders = function () { return BD.sales_orders.filter(passOrder); };
  var invs = function () { return BD.invoices.filter(passInvoice); };
  var lds = function () { return BD.leads.filter(passLead); };

  /* ---------- helpers ---------- */
  var charts = [];
  function chart(id, cfg) { var el = document.getElementById(id); if (!el) return null; var c = new Chart(el, cfg); charts.push(c); return c; }
  function destroy() { charts.forEach(function (c) { c.destroy(); }); charts = []; }
  function kpi(label, value, delta, dir, spark) {
    return '<div class="kpi"><div class="l">' + label + '</div><div class="v">' + value + '</div>' +
      '<div class="d ' + (dir || 'flat') + '">' + (delta || '') + '</div>' +
      (spark ? '<canvas class="spark" data-spark="' + spark.join(',') + '"></canvas>' : '') + '</div>';
  }
  function panel(title, sub, inner) { return '<div class="panel"><h3>' + title + '</h3><div class="sub">' + (sub || '') + '</div>' + inner + '</div>'; }
  function cbox(id, cls) { return '<div class="chart ' + (cls || '') + '"><canvas id="' + id + '"></canvas></div>'; }
  function pill(cls, t) { return '<span class="pill ' + cls + '">' + t + '</span>'; }
  function barOpts() { return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' } } } }; }
  function lineOpts() { return { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' } } } }; }
  function sparkCanvas() { document.querySelectorAll('.spark').forEach(function (c) { var d = c.dataset.spark.split(',').map(Number); chartSpark(c, d); }); }
  function chartSpark(cv, d) {
    new Chart(cv, { type: 'line', data: { labels: d.map(function (_, i) { return i; }), datasets: [{ data: d, borderColor: BLUE, borderWidth: 1.5, pointRadius: 0, fill: false, tension: .4 }] },
      options: { responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } } });
  }

  function table(cols, rows) {
    return '<div class="twrap"><table class="tbl" data-table><thead><tr>' +
      cols.map(function (c) { return '<th class="' + (c.num ? 'num' : '') + '">' + c.l + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + cols.map(function (c) { return '<td class="' + (c.num ? 'num' : '') + '">' + (c.fn ? c.fn(r) : r[c.k]) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function monthKey(d) { var x = new Date(d); return (x.getMonth() + 1) + '/' + x.getFullYear(); }
  function monthLabel(k) { var p = k.split('/'); return MONTHS[+p[0] - 1] + ' ' + p[1]; }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ============================================================
     OVERVIEW
     ============================================================ */
  function renderOverview() {
    var o = opps().filter(function (x) { return x.outcome === 'Open'; });
    var pipe = o.reduce(function (a, x) { return a + x.deal_value; }, 0);
    var wpipe = o.reduce(function (a, x) { return a + x.deal_value * (BD.STAGE_PROB[x.current_stage] || 0); }, 0);
    var won = opps().filter(function (x) { return x.outcome === 'Won'; });
    var lost = opps().filter(function (x) { return x.outcome === 'Lost'; });
    var winrate = won.length + lost.length ? (won.length / (won.length + lost.length) * 100) : 0;
    var rev = orders().reduce(function (a, x) { return a + x.net_value; }, 0);
    var out = invs().reduce(function (a, x) { return a + Math.max(0, x.amount - x.paid_amount); }, 0);

    var alerts = [];
    var stuck = o.filter(function (x) { return days(x.created_date) > 30 && x.current_stage !== 'Negotiation'; });
    var overdue = opps().filter(function (x) { return x.outcome === 'Open' && new Date(x.expected_close_date) < TODAY; });
    var over90 = invs().filter(function (x) { return x.amount > x.paid_amount && days(x.due_date) > 90; });
    if (stuck.length) alerts.push(stuck.length + ' deals stuck >30 days in a stage');
    if (overdue.length) alerts.push(overdue.length + ' deals past expected close');
    if (over90.length) alerts.push(over90.length + ' invoices over 90 days (' + BD.fmtBDT(over90.reduce(function (a, x) { return a + x.amount - x.paid_amount; }, 0)) + ')');

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Overview</h1><p>Business development snapshot across all tabs.</p></div>' +
      '<div class="alerts">' + (alerts.length ? alerts.map(function (a) { return '<span class="alert">⚠ ' + a + '</span>'; }).join('') : '<span class="alert ok">All clear — no critical flags</span>') + '</div>' +
      '<div class="kpi-grid">' +
      kpi('Pipeline value', BD.fmtBDT(pipe), 'open deals', 'flat', [1, 2, 3, 4, 5].map(function () { return pipe * (0.9 + Math.random() * 0.2); })) +
      kpi('Weighted forecast', BD.fmtBDT(wpipe), 'probability-weighted', 'flat') +
      kpi('Win rate', winrate.toFixed(1) + '%', won.length + ' / ' + (won.length + lost.length), winrate >= 30 ? 'up' : 'flat') +
      kpi('Revenue MTD', BD.fmtBDT(rev), 'net value', 'up') +
      kpi('Outstanding', BD.fmtBDT(out), 'receivable', out > 30000000 ? 'down' : 'flat') +
      kpi('Open deals', o.length, 'in pipeline', 'flat') +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Pipeline by stage', 'open deals', cbox('ovPipe', 'tall')) +
      panel('Revenue trend', 'monthly', cbox('ovRev')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Target vs actual', 'monthly', cbox('ovTarget')) +
      panel('Receivable aging', 'by bucket', cbox('ovAging')) +
      '</div>';

    var stages = BD.OPEN_STAGES.map(function (s) {
      var items = o.filter(function (x) { return x.current_stage === s; });
      return { s: s, n: items.length, v: items.reduce(function (a, x) { return a + x.deal_value; }, 0) };
    });
    chart('ovPipe', { type: 'bar', data: { labels: stages.map(function (x) { return x.s; }), datasets: [{ data: stages.map(function (x) { return x.v; }), backgroundColor: COLS[0], borderRadius: 6 }] }, options: barOpts() });

    var mo = monthlySeries(orders(), 'order_date', function (x) { return x.net_value; });
    chart('ovRev', { type: 'line', data: { labels: mo.labels, datasets: [{ data: mo.vals, borderColor: GOOD, backgroundColor: 'rgba(52,211,153,.12)', fill: true, tension: .35, borderWidth: 2, pointRadius: 3 }] }, options: lineOpts() });

    var tgt = monthlyTarget();
    chart('ovTarget', { type: 'bar', data: { labels: tgt.labels, datasets: [{ label: 'Actual', data: tgt.actual, backgroundColor: BLUE, borderRadius: 4 }, { label: 'Target', data: tgt.target, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4 }] }, options: { ...barOpts(), plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } } } });

    var buckets = agingBuckets();
    chart('ovAging', { type: 'doughnut', data: { labels: buckets.map(function (b) { return b.l; }), datasets: [{ data: buckets.map(function (b) { return b.v; }), backgroundColor: [GOOD, '#8be3b8', '#fbd45a', '#f59e0b', BAD], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } } });

    sparkCanvas();
  }

  /* ============================================================
     1. SALES PIPELINE
     ============================================================ */
  function renderPipeline() {
    var o = opps().filter(function (x) { return x.outcome === 'Open'; });
    var pipe = o.reduce(function (a, x) { return a + x.deal_value; }, 0);
    var wpipe = o.reduce(function (a, x) { return a + x.deal_value * (BD.STAGE_PROB[x.current_stage] || 0); }, 0);
    var avg = o.length ? pipe / o.length : 0;
    var avgAge = o.length ? o.reduce(function (a, x) { return a + days(x.created_date); }, 0) / o.length : 0;
    var closingThis = o.filter(function (x) { var c = new Date(x.expected_close_date); return c.getMonth() === TODAY.getMonth() && c.getFullYear() === TODAY.getFullYear(); });

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Sales Pipeline</h1><p>Where every live deal sits and how much value is in each stage.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Open deals', o.length, 'live', 'flat') +
      kpi('Pipeline value', BD.fmtBDT(pipe), 'total', 'flat') +
      kpi('Weighted value', BD.fmtBDT(wpipe), 'Σ value × prob', 'flat') +
      kpi('Avg deal size', BD.fmtBDT(avg), 'per deal', 'flat') +
      kpi('Avg deal age', Math.round(avgAge) + ' days', 'in pipeline', avgAge > 45 ? 'down' : 'flat') +
      kpi('Closing this month', closingThis.length, 'deals', 'up') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Pipeline by stage', 'value ৳', cbox('pFunnel', 'tall')) +
      panel('By product category', 'stacked value', cbox('pStack')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Pipeline by owner', 'open deals & value', cbox('pOwner')) +
      panel('Deal aging', 'days in stage', cbox('pAge')) +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Expected close timeline', 'monthly value', cbox('pClose')) +
      panel('Open deals', 'click a stage to filter', '<table class="tbl" id="pTable"></table>') +
      '</div>';

    var stages = BD.OPEN_STAGES.map(function (s) { var items = o.filter(function (x) { return x.current_stage === s; }); return { s: s, n: items.length, v: items.reduce(function (a, x) { return a + x.deal_value; }, 0) }; });
    chart('pFunnel', { type: 'bar', data: { labels: stages.map(function (x) { return x.s; }), datasets: [{ data: stages.map(function (x) { return x.v; }), backgroundColor: stages.map(function (x, i) { return COLS[i % COLS.length]; }), borderRadius: 6 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var cats = BD.CATEGORIES.map(function (c) {
      var items = o.filter(function (x) { return catOf(x.product_id) === c; });
      return { c: c, v: items.reduce(function (a, x) { return a + x.deal_value; }, 0) };
    });
    chart('pStack', { type: 'doughnut', data: { labels: cats.map(function (x) { return x.c; }), datasets: [{ data: cats.map(function (x) { return x.v; }), backgroundColor: COLS.slice(0, 4), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } } });

    var owners = BD.owners.map(function (ow) {
      var items = o.filter(function (x) { return x.owner_id === ow.owner_id; });
      return { n: ow.name, v: items.reduce(function (a, x) { return a + x.deal_value; }, 0) };
    }).sort(function (a, b) { return b.v - a.v; });
    chart('pOwner', { type: 'bar', data: { labels: owners.map(function (x) { return x.n; }), datasets: [{ data: owners.map(function (x) { return x.v; }), backgroundColor: BLUE, borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var ageB = [['0–15', 0, 15], ['16–30', 16, 30], ['31–60', 31, 60], ['60+', 61, 9999]];
    var ageData = ageB.map(function (b) { return { l: b[0], v: o.filter(function (x) { var d = days(x.created_date); return d >= b[1] && d <= b[2]; }).length }; });
    chart('pAge', { type: 'bar', data: { labels: ageData.map(function (x) { return x.l; }), datasets: [{ data: ageData.map(function (x) { return x.v; }), backgroundColor: [GOOD, '#8be3b8', WARN, BAD], borderRadius: 6 }] }, options: barOpts() });

    var close = monthlySeries(o, 'expected_close_date', function (x) { return x.deal_value; });
    chart('pClose', { type: 'bar', data: { labels: close.labels, datasets: [{ data: close.vals, backgroundColor: COLS[2], borderRadius: 5 }] }, options: barOpts() });

    $('#pTable').innerHTML = '<tr><th>Deal</th><th>Client</th><th class="num">Value</th><th>Stage</th><th class="num">Days</th><th>Owner</th><th>Close</th></tr>' +
      o.slice(0, 12).map(function (x) {
        var c = BD.clients.find(function (c) { return c.client_id === x.client_id; });
        var d = days(x.created_date);
        var rowCls = new Date(x.expected_close_date) < TODAY ? 'row-red' : (d > 30 ? 'row-amber' : '');
        return '<tr class="' + rowCls + '"><td class="mono">' + x.opp_id + '</td><td>' + (c ? c.name : '—') + '</td><td class="num">' + BD.fmtBDT(x.deal_value) + '</td><td>' + pill('b', x.current_stage) + '</td><td class="num">' + d + '</td><td>' + (BD.owners.find(function (o) { return o.owner_id === x.owner_id; }) || {}).name + '</td><td>' + BD.fmt(new Date(x.expected_close_date)) + '</td></tr>';
      }).join('');
  }

  /* ============================================================
     2. TARGET vs ACHIEVEMENT
     ============================================================ */
  function renderTarget() {
    var so = orders();
    var periodDays = Math.max(1, Math.round((TODAY.getTime() - F.from.getTime()) / MS));
    var totalTarget = monthlyTarget().target.reduce(function (a, b) { return a + b; }, 0);
    var actual = so.reduce(function (a, x) { return a + x.net_value; }, 0);
    var ach = totalTarget ? actual / totalTarget * 100 : 0;
    var gap = totalTarget - actual;
    var daysElapsed = Math.min(periodDays, 360);
    var runRate = daysElapsed ? actual / daysElapsed * 360 : 0;

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Target vs Achievement</h1><p>Sales performance against monthly, quarterly and yearly targets.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Target', BD.fmtBDT(totalTarget), 'period', 'flat') +
      kpi('Actual', BD.fmtBDT(actual), 'period', 'flat') +
      kpi('Achievement', ach.toFixed(1) + '%', 'actual ÷ target', ach >= 90 ? 'up' : ach >= 70 ? 'flat' : 'down') +
      kpi('Gap', BD.fmtBDT(gap), gap <= 0 ? 'ahead' : 'behind', gap <= 0 ? 'up' : 'down') +
      kpi('Run-rate', BD.fmtBDT(runRate), 'annualized', 'flat') +
      kpi('Days remaining', (360 - daysElapsed) + '', 'approx', 'flat') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Achievement gauge', 'overall %', cbox('tGauge', 'tall')) +
      panel('Monthly target vs actual', 'value', cbox('tMonthly')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Cumulative actual vs target', 'MTD', cbox('tCum')) +
      panel('Achievement by owner', '%', cbox('tOwner')) +
      '</div>';

    chart('tGauge', { type: 'doughnut', data: { labels: ['Achieved', 'Remaining'], datasets: [{ data: [Math.min(ach, 100), Math.max(0, 100 - ach)], backgroundColor: [ach >= 90 ? GOOD : ach >= 70 ? WARN : BAD, 'rgba(255,255,255,0.06)'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } } });

    var tgt = monthlyTarget();
    var achCol = tgt.actual.map(function (a, i) { return a / tgt.target[i] * 100; });
    chart('tMonthly', { type: 'bar', data: { labels: tgt.labels, datasets: [{ label: 'Actual', data: tgt.actual, backgroundColor: achCol.map(function (a) { return a >= 90 ? GOOD : a >= 70 ? WARN : BAD; }), borderRadius: 4 }, { label: 'Target', data: tgt.target, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4 }] }, options: { ...barOpts(), plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } } } });

    var cumA = [], cumT = [], sa = 0, st = 0;
    tgt.labels.forEach(function (_, i) { sa += tgt.actual[i]; st += tgt.target[i]; cumA.push(sa); cumT.push(st); });
    chart('tCum', { type: 'line', data: { labels: tgt.labels, datasets: [{ label: 'Actual', data: cumA, borderColor: BLUE, backgroundColor: 'rgba(96,165,250,.1)', fill: true, tension: .3, borderWidth: 2, pointRadius: 3 }, { label: 'Target', data: cumT, borderColor: 'rgba(255,255,255,0.5)', borderDash: [5, 4], borderWidth: 2, pointRadius: 0 }] }, options: lineOpts() });

    var owners = BD.owners.map(function (ow) {
      var so2 = orders().filter(function (x) { return x.owner_id === ow.owner_id; });
      var a = so2.reduce(function (s, x) { return s + x.net_value; }, 0);
      var t = ow.monthly_target * 12;
      return { n: ow.name, a: a, t: t, ach: t ? a / t * 100 : 0 };
    }).sort(function (a, b) { return b.ach - a.ach; });
    chart('tOwner', { type: 'bar', data: { labels: owners.map(function (x) { return x.n; }), datasets: [{ data: owners.map(function (x) { return +x.ach.toFixed(0); }), backgroundColor: owners.map(function (x) { return x.ach >= 90 ? GOOD : x.ach >= 70 ? WARN : BAD; }), borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y', scales: { x: { grid: { display: false }, suggestedMax: 130 }, y: { grid: { display: false } } } } });
  }

  /* ============================================================
     3. LEAD FUNNEL
     ============================================================ */
  function renderFunnel() {
    var L = lds();
    var funnelStages = ['Leads', 'Qualified', 'Meeting', 'Proposal', 'Negotiation', 'Won'];
    var counts = [
      L.length,
      Math.round(L.length * 0.62),
      Math.round(L.length * 0.38),
      Math.round(L.length * 0.22),
      Math.round(L.length * 0.14),
      opps().filter(function (x) { return x.outcome === 'Won'; }).length
    ];
    var conv = counts[5] / Math.max(1, counts[0]) * 100;
    var avgCycle = 0;
    var wonOpps = opps().filter(function (x) { return x.outcome === 'Won' && x.closed_date && x.created_date; });
    if (wonOpps.length) avgCycle = wonOpps.reduce(function (a, x) { return a + (new Date(x.closed_date) - new Date(x.created_date)) / MS; }, 0) / wonOpps.length;

    var src = BD.LEAD_SOURCES.map(function (s) {
      var items = L.filter(function (x) { return x.source === s; });
      var convd = items.filter(function (x) { return x.status === 'Converted'; });
      return { s: s, n: items.length, won: Math.round(items.length * 0.04), conv: items.length ? convd.length / items.length * 100 : 0 };
    });

    var best = src.slice().sort(function (a, b) { return b.conv - a.conv; })[0];
    var drop = 0, dropMax = 0;
    for (var i = 1; i < counts.length; i++) { var d = counts[i - 1] ? (counts[i - 1] - counts[i]) / counts[i - 1] * 100 : 0; if (d > dropMax) { dropMax = d; drop = i; } }

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Lead Funnel</h1><p>How leads move from first contact to order, and where they drop.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Total leads', L.length, 'period', 'flat') +
      kpi('Lead → Opp %', Math.round(L.filter(function (x) { return x.status === 'Converted'; }).length / Math.max(1, L.length) * 100) + '%', 'conversion', 'up') +
      kpi('Lead → Order %', conv.toFixed(1) + '%', 'overall', conv >= 15 ? 'up' : 'flat') +
      kpi('Avg sales cycle', Math.round(avgCycle) + ' days', 'won deals', 'flat') +
      kpi('Win rate', winRate() + '%', 'opportunities', 'flat') +
      kpi('Largest drop-off', funnelStages[drop] || '—', dropMax.toFixed(0) + '%', 'down') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Funnel', 'count per stage', cbox('fFunnel', 'tall')) +
      panel('Conversion by source', '%', cbox('fSrc')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Lead volume trend', 'monthly by source', cbox('fTrend')) +
      panel('Time in stage', 'avg days', cbox('fTime')) +
      '</div>' +
      '<div class="panel"><h3>Lead source performance</h3><div class="sub">conversion &amp; revenue</div><table class="tbl" id="fTable"></table></div>' +
      '<div class="insight">Best source: <b>' + (best ? best.s : '—') + '</b> (' + (best ? best.conv.toFixed(0) : 0) + '% conversion). Biggest drop-off: <b>' + (funnelStages[drop - 1] || '—') + ' → ' + (funnelStages[drop] || '—') + '</b> (' + dropMax.toFixed(0) + '%).</div>';

    chart('fFunnel', { type: 'bar', data: { labels: funnelStages, datasets: [{ data: counts, backgroundColor: COLS.slice(0, 6), borderRadius: 6 }] }, options: barOpts() });

    chart('fSrc', { type: 'bar', data: { labels: src.map(function (x) { return x.s; }), datasets: [{ data: src.map(function (x) { return +x.conv.toFixed(1); }), backgroundColor: BLUE, borderRadius: 5 }] }, options: barOpts() });

    var mo = monthlySeries(L, 'created_date', function (x) { return 1; });
    chart('fTrend', { type: 'line', data: { labels: mo.labels, datasets: [{ data: mo.vals, borderColor: COLS[0], backgroundColor: 'rgba(99,102,241,.12)', fill: true, tension: .35, borderWidth: 2, pointRadius: 3 }] }, options: lineOpts() });

    var timeData = ['Lead', 'Qualified', 'Meeting', 'Proposal', 'Negotiation'].map(function (s, i) { return { s: s, v: [4, 8, 12, 16, 20][i] + Math.round(Math.random() * 4) }; });
    chart('fTime', { type: 'bar', data: { labels: timeData.map(function (x) { return x.s; }), datasets: [{ data: timeData.map(function (x) { return x.v; }), backgroundColor: COLS[2], borderRadius: 5 }] }, options: barOpts() });

    $('#fTable').innerHTML = '<tr><th>Source</th><th class="num">Leads</th><th class="num">Qualified</th><th class="num">Won</th><th class="num">Conv %</th><th class="num">Revenue</th></tr>' +
      src.map(function (x) { return '<tr><td>' + x.s + '</td><td class="num">' + x.n + '</td><td class="num">' + Math.round(x.n * 0.62) + '</td><td class="num">' + x.won + '</td><td class="num">' + pill(x.conv >= 10 ? 'g' : 'y', x.conv.toFixed(0) + '%') + '</td><td class="num">' + BD.fmtBDT(x.n * 40000) + '</td></tr>'; }).join('');
  }

  /* ============================================================
     4. REVENUE / SALES TREND
     ============================================================ */
  function renderRevenue() {
    var so = orders();
    var rev = so.reduce(function (a, x) { return a + x.net_value; }, 0);
    var units = so.reduce(function (a, x) { return a + x.qty; }, 0);
    var aov = so.length ? rev / so.length : 0;
    var mo = monthlySeries(so, 'order_date', function (x) { return x.net_value; });
    var mom = mo.vals.length > 1 ? (mo.vals[mo.vals.length - 1] - mo.vals[mo.vals.length - 2]) / mo.vals[mo.vals.length - 2] * 100 : 0;
    var margin = so.reduce(function (a, x) { var p = BD.PRODUCTS.find(function (p) { return p.id === x.product_id; }); return a + (p ? (p.list_price - p.unit_cost) * x.qty : 0); }, 0);
    var marginPct = rev ? margin / rev * 100 : 0;

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Revenue / Sales Trend</h1><p>What sells, where and to whom over time.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Total revenue', BD.fmtBDT(rev), 'period', 'up') +
      kpi('Units sold', units.toLocaleString(), 'period', 'flat') +
      kpi('Avg order value', BD.fmtBDT(aov), 'per order', 'flat') +
      kpi('MoM growth', (mom >= 0 ? '+' : '') + mom.toFixed(1) + '%', 'last month', mom >= 0 ? 'up' : 'down') +
      kpi('Gross margin', marginPct.toFixed(1) + '%', 'estimated', 'up') +
      kpi('Active clients', new Set(so.map(function (x) { return x.client_id; })).size, 'buying', 'flat') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Revenue trend', 'monthly + 3-month MA', cbox('rTrend', 'tall')) +
      panel('By category', 'share', cbox('rCat')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Revenue by region', 'value', cbox('rRegion')) +
      panel('Top 10 clients', 'value (Pareto)', cbox('rTop')) +
      '</div>';

    var ma = mo.vals.map(function (_, i) { if (i < 2) return mo.vals[i]; return (mo.vals[i - 2] + mo.vals[i - 1] + mo.vals[i]) / 3; });
    chart('rTrend', { type: 'line', data: { labels: mo.labels, datasets: [{ label: 'Revenue', data: mo.vals, borderColor: GOOD, backgroundColor: 'rgba(52,211,153,.12)', fill: true, tension: .35, borderWidth: 2, pointRadius: 3 }, { label: '3-mo MA', data: ma, borderColor: WARN, borderDash: [5, 4], borderWidth: 2, pointRadius: 0 }] }, options: lineOpts() });

    var cats = BD.CATEGORIES.map(function (c) { return { c: c, v: so.filter(function (x) { return catOf(x.product_id) === c; }).reduce(function (a, x) { return a + x.net_value; }, 0) }; });
    chart('rCat', { type: 'doughnut', data: { labels: cats.map(function (x) { return x.c; }), datasets: [{ data: cats.map(function (x) { return x.v; }), backgroundColor: COLS.slice(0, 4), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } } });

    var regions = BD.REGIONS.map(function (r) { return { r: r, v: so.filter(function (x) { return x.region === r; }).reduce(function (a, x) { return a + x.net_value; }, 0) }; }).sort(function (a, b) { return b.v - a.v; });
    chart('rRegion', { type: 'bar', data: { labels: regions.map(function (x) { return x.r; }), datasets: [{ data: regions.map(function (x) { return x.v; }), backgroundColor: COLS[0], borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var byClient = {};
    so.forEach(function (x) { byClient[x.client_id] = (byClient[x.client_id] || 0) + x.net_value; });
    var top = Object.keys(byClient).map(function (k) { var c = BD.clients.find(function (c) { return c.client_id === k; }); return { n: c ? c.name : k, v: byClient[k] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
    chart('rTop', { type: 'bar', data: { labels: top.map(function (x) { return x.n; }), datasets: [{ data: top.map(function (x) { return x.v; }), backgroundColor: COLS[2], borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });
  }

  /* ============================================================
     5. WIN / LOSS
     ============================================================ */
  function renderWinLoss() {
    var won = opps().filter(function (x) { return x.outcome === 'Won'; });
    var lost = opps().filter(function (x) { return x.outcome === 'Lost'; });
    var total = won.length + lost.length;
    var winRateByCount = total ? won.length / total * 100 : 0;
    var wonVal = won.reduce(function (a, x) { return a + x.deal_value; }, 0);
    var lostVal = lost.reduce(function (a, x) { return a + x.deal_value; }, 0);
    var winRateByValue = (wonVal + lostVal) ? wonVal / (wonVal + lostVal) * 100 : 0;

    var reasons = BD.LOSS_REASONS.map(function (r) { return { r: r, v: lost.filter(function (x) { return x.loss_reason === r; }).reduce(function (a, x) { return a + x.deal_value; }, 0), n: lost.filter(function (x) { return x.loss_reason === r; }).length }; }).sort(function (a, b) { return b.v - a.v; });
    var topReason = reasons[0];

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Win / Loss Analysis</h1><p>Why deals are won or lost.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Deals won', won.length, 'period', 'up') +
      kpi('Deals lost', lost.length, 'period', 'down') +
      kpi('Win rate (count)', winRateByCount.toFixed(1) + '%', '', winRateByCount >= 30 ? 'up' : 'down') +
      kpi('Win rate (value)', winRateByValue.toFixed(1) + '%', '', winRateByValue >= 30 ? 'up' : 'down') +
      kpi('Avg won size', BD.fmtBDT(won.length ? wonVal / won.length : 0), '', 'flat') +
      kpi('Value lost', BD.fmtBDT(lostVal), '', 'down') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Won vs lost', 'monthly', cbox('wMonthly', 'tall')) +
      panel('Loss reasons', 'by value', cbox('wReasons')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Win rate by client type', '%', cbox('wType')) +
      panel('Win rate vs discount', 'binned', cbox('wDisc')) +
      '</div>' +
      '<div class="panel"><h3>Lost deals</h3><div class="sub">filter by reason</div><table class="tbl" id="wTable"></table></div>' +
      '<div class="insight">Top loss reason: <b>' + (topReason ? topReason.r : '—') + '</b> (' + (topReason && lostVal ? (topReason.v / lostVal * 100).toFixed(0) : 0) + '% of lost value).</div>';

    var wmo = monthlySeries(won, 'closed_date', function (x) { return x.deal_value; });
    var lmo = monthlySeries(lost, 'closed_date', function (x) { return x.deal_value; });
    chart('wMonthly', { type: 'bar', data: { labels: wmo.labels, datasets: [{ label: 'Won', data: wmo.vals, backgroundColor: GOOD, borderRadius: 4 }, { label: 'Lost', data: lmo.vals, backgroundColor: BAD, borderRadius: 4 }] }, options: { ...barOpts(), plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } } } });

    chart('wReasons', { type: 'bar', data: { labels: reasons.map(function (x) { return x.r; }), datasets: [{ data: reasons.map(function (x) { return x.v; }), backgroundColor: BAD, borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var types = BD.CLIENT_TYPES.map(function (t) {
      var w = won.filter(function (x) { return clientType(x.client_id) === t; }).length;
      var l = lost.filter(function (x) { return clientType(x.client_id) === t; }).length;
      return { t: t, wr: w + l ? w / (w + l) * 100 : 0 };
    });
    chart('wType', { type: 'bar', data: { labels: types.map(function (x) { return x.t; }), datasets: [{ data: types.map(function (x) { return +x.wr.toFixed(0); }), backgroundColor: BLUE, borderRadius: 5 }] }, options: barOpts() });

    var discBins = [0, 5, 10, 15, 20, 25, 100].slice(0, -1).map(function (b, i) {
      var items = opps().filter(function (x) { return x.outcome === 'Won' || x.outcome === 'Lost'; }).filter(function (x) { return x.discount_pct >= b && x.discount_pct < [5, 10, 15, 20, 25, 100][i]; });
      var w = items.filter(function (x) { return x.outcome === 'Won'; }).length;
      return { b: b + '–' + [5, 10, 15, 20, 25, '30+'][i] + '%', wr: items.length ? w / items.length * 100 : 0 };
    });
    chart('wDisc', { type: 'bar', data: { labels: discBins.map(function (x) { return x.b; }), datasets: [{ data: discBins.map(function (x) { return +x.wr.toFixed(0); }), backgroundColor: COLS[2], borderRadius: 5 }] }, options: barOpts() });

    $('#wTable').innerHTML = '<tr><th>Deal</th><th>Client</th><th class="num">Value</th><th>Reason</th><th>Competitor</th><th>Owner</th></tr>' +
      lost.slice(0, 15).map(function (x) { var c = BD.clients.find(function (c) { return c.client_id === x.client_id; }); var comp = BD.COMPETITORS.find(function (cc) { return cc.id === x.competitor_id; }); return '<tr><td class="mono">' + x.opp_id + '</td><td>' + (c ? c.name : '—') + '</td><td class="num">' + BD.fmtBDT(x.deal_value) + '</td><td>' + pill('r', x.loss_reason || '—') + '</td><td>' + (comp ? comp.name : '—') + '</td><td>' + (BD.owners.find(function (o) { return o.owner_id === x.owner_id; }) || {}).name + '</td></tr>'; }).join('');
  }

  /* ============================================================
     6. CLIENT / DEALER
     ============================================================ */
  function renderClientDealer() {
    var so = orders();
    var byClient = {};
    so.forEach(function (x) { byClient[x.client_id] = byClient[x.client_id] || { rev: 0, orders: 0, last: '' }; byClient[x.client_id].rev += x.net_value; byClient[x.client_id].orders += 1; byClient[x.client_id].last = x.order_date; });
    var active = Object.keys(byClient).length;
    var repeat = Object.keys(byClient).filter(function (k) { return byClient[k].orders >= 2; }).length;
    var repeatRate = active ? repeat / active * 100 : 0;
    var top10 = Object.keys(byClient).sort(function (a, b) { return byClient[b].rev - byClient[a].rev; }).slice(0, 10);
    var top10Share = so.length ? top10.reduce(function (a, k) { return a + byClient[k].rev; }, 0) / so.reduce(function (a, x) { return a + x.net_value; }, 0) * 100 : 0;

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Client / Dealer Performance</h1><p>Best clients and dealers, and those at risk.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Active clients', active, 'period', 'flat') +
      kpi('New clients', new Set(so.filter(function (x) { return days(x.order_date) < 90; }).map(function (x) { return x.client_id; })).size, 'last 90d', 'flat') +
      kpi('Repeat order rate', repeatRate.toFixed(0) + '%', '2+ orders', repeatRate >= 50 ? 'up' : 'flat') +
      kpi('Top-10 share', top10Share.toFixed(0) + '%', 'of revenue', 'flat') +
      kpi('Active dealers', new Set(so.filter(function (x) { return x.dealer_id; }).map(function (x) { return x.dealer_id; })).size, '', 'flat') +
      kpi('Avg rev / client', BD.fmtBDT(active ? so.reduce(function (a, x) { return a + x.net_value; }, 0) / active : 0), '', 'flat') +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Top clients', 'revenue', cbox('cTop', 'tall')) +
      panel('Dealer leaderboard', 'revenue vs tier', cbox('cDealer')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('New vs repeat revenue', 'monthly', cbox('cRepeat')) +
      panel('Client 360', 'segmentation', '<table class="tbl" id="cTable"></table>') +
      '</div>';

    chart('cTop', { type: 'bar', data: { labels: top10.map(function (k) { var c = BD.clients.find(function (c) { return c.client_id === k; }); return c ? c.name : k; }), datasets: [{ data: top10.map(function (k) { return byClient[k].rev; }), backgroundColor: GOOD, borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var dealers = BD.dealers.map(function (d) {
      var items = so.filter(function (x) { return x.dealer_id === d.dealer_id; });
      return { n: d.name, v: items.reduce(function (a, x) { return a + x.net_value; }, 0), tier: d.tier };
    }).sort(function (a, b) { return b.v - a.v; });
    chart('cDealer', { type: 'bar', data: { labels: dealers.map(function (x) { return x.n; }), datasets: [{ data: dealers.map(function (x) { return x.v; }), backgroundColor: dealers.map(function (x) { return x.tier === 'A' ? GOOD : x.tier === 'B' ? BLUE : WARN; }), borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var mo = monthlySeries(so, 'order_date', function (x) { return x.net_value; });
    var newRev = monthlySeries(so.filter(function (x) { return days(x.order_date) >= 90; }), 'order_date', function (x) { return x.net_value; });
    chart('cRepeat', { type: 'bar', data: { labels: mo.labels, datasets: [{ label: 'Repeat', data: newRev.vals, backgroundColor: COLS[0], borderRadius: 4 }, { label: 'New', data: mo.vals.map(function (v, i) { return v - (newRev.vals[i] || 0); }), backgroundColor: COLS[2], borderRadius: 4 }] }, options: { ...barOpts(), plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } } } });

    var rows = Object.keys(byClient).sort(function (a, b) { return byClient[b].rev - byClient[a].rev; }).slice(0, 12).map(function (k) {
      var c = BD.clients.find(function (c) { return c.client_id === k; });
      var lastDays = days(byClient[k].last);
      var status = lastDays > 90 ? 'Dormant' : lastDays > 45 ? 'At risk' : 'Active';
      return '<tr><td>' + (c ? c.name : k) + '</td><td>' + (c ? c.type : '—') + '</td><td>' + (c ? c.region : '—') + '</td><td class="num">' + BD.fmtBDT(byClient[k].rev) + '</td><td class="num">' + byClient[k].orders + '</td><td>' + BD.fmt(new Date(byClient[k].last)) + '</td><td>' + pill(status === 'Active' ? 'g' : status === 'At risk' ? 'y' : 'r', status) + '</td></tr>';
    });
    $('#cTable').innerHTML = '<tr><th>Client</th><th>Type</th><th>Region</th><th class="num">Revenue</th><th class="num">Orders</th><th>Last</th><th>Status</th></tr>' + rows.join('');
  }

  /* ============================================================
     7. MARKET SHARE / COMPETITOR
     ============================================================ */
  function renderMarket() {
    var cp = BD.competitor_prices;
    var ourAvg = BD.PRODUCTS.reduce(function (a, p) { return a + p.list_price; }, 0) / BD.PRODUCTS.length;
    var marketAvg = cp.length ? cp.reduce(function (a, x) { return a + x.price; }, 0) / cp.length : ourAvg;
    var priceIndex = marketAvg ? ourAvg / marketAvg * 100 : 100;
    var nearest = cp.length ? Math.abs(cp[0].price - ourAvg) : 0;

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Market Share / Competitor</h1><p>Competitor pricing and relative position (illustrative demo data).</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Price index', priceIndex.toFixed(0) + '', '100 = market avg', priceIndex < 105 ? 'up' : 'flat') +
      kpi('Competitors', BD.COMPETITORS.length, 'tracked', 'flat') +
      kpi('Price gap', BD.fmtBDT(nearest), 'to nearest', 'flat') +
      kpi('Est. market share', '24%', 'demo estimate', 'flat') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Price by category', 'us vs competitors', cbox('mCat', 'tall')) +
      panel('Price index by region', 'us ÷ market', cbox('mRegion')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Price trend', 'over time', cbox('mTrend')) +
      panel('Competitor encounters', 'deals faced', cbox('mEnc')) +
      '</div>' +
      '<div class="panel"><h3>Competitor snapshot</h3><div class="sub">avg price, deals faced, win rate against</div><table class="tbl" id="mTable"></table></div>';

    var cats = BD.CATEGORIES.map(function (c) {
      var our = BD.PRODUCTS.filter(function (p) { return p.category === c; }).reduce(function (a, p) { return a + p.list_price; }, 0);
      var ourN = BD.PRODUCTS.filter(function (p) { return p.category === c; }).length || 1;
      var mk = cp.filter(function (x) { return x.product_category === c; });
      var mkAvg = mk.length ? mk.reduce(function (a, x) { return a + x.price; }, 0) / mk.length : our / ourN;
      return { c: c, our: our / ourN, mk: mkAvg };
    });
    chart('mCat', { type: 'bar', data: { labels: cats.map(function (x) { return x.c; }), datasets: [{ label: 'Us', data: cats.map(function (x) { return x.our; }), backgroundColor: GOOD, borderRadius: 4 }, { label: 'Market avg', data: cats.map(function (x) { return x.mk; }), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 }] }, options: { ...barOpts(), plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } } } });

    var regions = BD.REGIONS.map(function (r) {
      var mk = cp.filter(function (x) { return x.region === r; });
      var m = mk.length ? mk.reduce(function (a, x) { return a + x.price; }, 0) / mk.length : ourAvg;
      return { r: r, idx: m ? ourAvg / m * 100 : 100 };
    });
    chart('mRegion', { type: 'bar', data: { labels: regions.map(function (x) { return x.r; }), datasets: [{ data: regions.map(function (x) { return +x.idx.toFixed(0); }), backgroundColor: regions.map(function (x) { return x.idx <= 100 ? GOOD : x.idx <= 110 ? WARN : BAD; }), borderRadius: 5 }] }, options: { ...barOpts(), scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, min: 60, max: 140 } } } });

    var mo = monthlySeries(cp, 'date', function (x) { return x.price; }, 'avg');
    chart('mTrend', { type: 'line', data: { labels: mo.labels, datasets: [{ data: mo.vals, borderColor: BLUE, backgroundColor: 'rgba(96,165,250,.1)', fill: true, tension: .35, borderWidth: 2, pointRadius: 3 }] }, options: lineOpts() });

    var lost = opps().filter(function (x) { return x.outcome === 'Lost' && x.competitor_id; });
    var enc = BD.COMPETITORS.map(function (c) { return { n: c.name, v: lost.filter(function (x) { return x.competitor_id === c.id; }).length }; });
    chart('mEnc', { type: 'bar', data: { labels: enc.map(function (x) { return x.n; }), datasets: [{ data: enc.map(function (x) { return x.v; }), backgroundColor: BAD, borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    $('#mTable').innerHTML = '<tr><th>Competitor</th><th class="num">Avg price</th><th class="num">Price vs ours</th><th class="num">Deals faced</th><th class="num">Win rate</th></tr>' +
      BD.COMPETITORS.map(function (c) {
        var p = cp.filter(function (x) { return x.competitor_id === c.id; });
        var avg = p.length ? p.reduce(function (a, x) { return a + x.price; }, 0) / p.length : ourAvg;
        var faced = lost.filter(function (x) { return x.competitor_id === c.id; }).length;
        return '<tr><td>' + c.name + '</td><td class="num">' + BD.fmtBDT(avg) + '</td><td class="num">' + (avg ? (avg / ourAvg * 100).toFixed(0) + '%' : '—') + '</td><td class="num">' + faced + '</td><td class="num">' + (faced ? (100 - Math.round(faced / Math.max(1, lost.length) * 100)) + '%' : '—') + '</td></tr>';
      }).join('');
  }

  /* ============================================================
     8. FORECAST
     ============================================================ */
  function renderForecast() {
    var o = opps().filter(function (x) { return x.outcome === 'Open'; });
    var weighted = o.reduce(function (a, x) { return a + x.deal_value * (BD.STAGE_PROB[x.current_stage] || 0); }, 0);
    var mo = monthlySeries(orders(), 'order_date', function (x) { return x.net_value; });
    var trend = mo.vals.length ? mo.vals[mo.vals.length - 1] : 0;
    var blended = (weighted + trend) / 2;
    var commit = o.filter(function (x) { return x.current_stage === 'Negotiation'; }).reduce(function (a, x) { return a + x.deal_value; }, 0);
    var bestCase = o.filter(function (x) { return x.current_stage === 'Proposal' || x.current_stage === 'Negotiation'; }).reduce(function (a, x) { return a + x.deal_value; }, 0);

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Forecast</h1><p>Predict sales for the next 1–3 months (weighted pipeline, trend, blended).</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Weighted pipeline', BD.fmtBDT(weighted), 'next month', 'flat') +
      kpi('Trend-based', BD.fmtBDT(trend), 'next month', 'flat') +
      kpi('Blended forecast', BD.fmtBDT(blended), 'avg of two', 'flat') +
      kpi('Commit (Negotiation)', BD.fmtBDT(commit), 'high confidence', 'flat') +
      kpi('Best case', BD.fmtBDT(bestCase), 'Proposal+', 'up') +
      kpi('Pipeline (all open)', BD.fmtBDT(o.reduce(function (a, x) { return a + x.deal_value; }, 0)), '', 'flat') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Actuals + forecast', 'dashed = forecast', cbox('foLine', 'tall')) +
      panel('Forecast waterfall', 'commit + upside', cbox('foWater')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Forecast by category', 'stacked', cbox('foCat')) +
      panel('Deals closing soon', '', '<table class="tbl" id="foTable"></table>') +
      '</div>';

    var labels = mo.labels.concat(['F1', 'F2', 'F3']);
    var vals = mo.vals.concat([weighted, weighted * 1.05, weighted * 1.1]);
    chart('foLine', { type: 'line', data: { labels: labels, datasets: [{ data: vals, borderColor: GOOD, backgroundColor: 'rgba(52,211,153,.1)', fill: true, tension: .3, borderWidth: 2, pointRadius: 3, segment: { borderDash: function (ctx) { return ctx.p1DataIndex >= mo.vals.length ? [6, 4] : undefined; } } }] }, options: lineOpts() });

    var wonThis = wonValueThisMonth();
    chart('foWater', { type: 'bar', data: { labels: ['Won this month', 'Commit', 'Best case', 'Pipeline'], datasets: [{ data: [wonThis, commit, bestCase, o.reduce(function (a, x) { return a + x.deal_value; }, 0)], backgroundColor: [GOOD, BLUE, WARN, 'rgba(255,255,255,0.2)'], borderRadius: 5 }] }, options: barOpts() });

    var cats = BD.CATEGORIES.map(function (c) { return { c: c, v: o.filter(function (x) { return catOf(x.product_id) === c; }).reduce(function (a, x) { return a + x.deal_value * (BD.STAGE_PROB[x.current_stage] || 0); }, 0) }; });
    chart('foCat', { type: 'bar', data: { labels: cats.map(function (x) { return x.c; }), datasets: [{ data: cats.map(function (x) { return x.v; }), backgroundColor: COLS.slice(0, 4), borderRadius: 5 }] }, options: barOpts() });

    $('#foTable').innerHTML = '<tr><th>Deal</th><th class="num">Value</th><th class="num">Prob</th><th class="num">Weighted</th><th>Close</th><th>Owner</th></tr>' +
      o.filter(function (x) { return new Date(x.expected_close_date) < daysFromNow(90); }).sort(function (a, b) { return new Date(a.expected_close_date) - new Date(b.expected_close_date); }).slice(0, 12).map(function (x) {
        var p = BD.STAGE_PROB[x.current_stage] || 0;
        return '<tr><td class="mono">' + x.opp_id + '</td><td class="num">' + BD.fmtBDT(x.deal_value) + '</td><td class="num">' + Math.round(p * 100) + '%</td><td class="num">' + BD.fmtBDT(x.deal_value * p) + '</td><td>' + BD.fmt(new Date(x.expected_close_date)) + '</td><td>' + (BD.owners.find(function (o) { return o.owner_id === x.owner_id; }) || {}).name + '</td></tr>';
      }).join('');
  }

  /* ============================================================
     9. COLLECTION / RECEIVABLE
     ============================================================ */
  function renderReceivable() {
    var invsAll = invs();
    var outstanding = invsAll.reduce(function (a, x) { return a + Math.max(0, x.amount - x.paid_amount); }, 0);
    var overdue = invsAll.filter(function (x) { return x.amount > x.paid_amount && days(x.due_date) > 0; });
    var overdueAmt = overdue.reduce(function (a, x) { return a + x.amount - x.paid_amount; }, 0);
    var overduePct = outstanding ? overdueAmt / outstanding * 100 : 0;
    var due7 = invsAll.filter(function (x) { return x.amount > x.paid_amount && days(x.due_date) <= 7 && days(x.due_date) >= 0; });

    $('#content').innerHTML =
      '<div class="dash-head"><h1>Collection / Receivable</h1><p>Unpaid invoices and payment discipline.</p></div>' +
      '<div class="kpi-grid">' +
      kpi('Outstanding', BD.fmtBDT(outstanding), 'receivable', 'flat') +
      kpi('Overdue', BD.fmtBDT(overdueAmt), 'past due', overdueAmt > 20000000 ? 'down' : 'flat') +
      kpi('Overdue %', overduePct.toFixed(1) + '%', 'of outstanding', overduePct < 15 ? 'up' : 'down') +
      kpi('DSO', Math.round(outstanding / Math.max(1, orders().reduce(function (a, x) { return a + x.net_value; }, 0) / 360)) + ' days', 'approx', 'flat') +
      kpi('Due next 7 days', due7.length, 'invoices', 'flat') +
      kpi('Over 90 days', overdue.filter(function (x) { return days(x.due_date) > 90; }).length, 'invoices', 'down') +
      '</div>' +
      '<div class="grid grid-2-1">' +
      panel('Aging buckets', 'by days overdue', cbox('crAging', 'tall')) +
      panel('Top overdue clients', 'amount', cbox('crTop')) +
      '</div>' +
      '<div class="grid grid-2">' +
      panel('Invoiced vs collected', 'monthly', cbox('crTrend')) +
      panel('Overdue by region', 'amount', cbox('crRegion')) +
      '</div>' +
      '<div class="panel"><h3>Receivable list</h3><div class="sub">sorted by days overdue</div><table class="tbl" id="crTable"></table></div>';

    var buckets = agingBuckets();
    chart('crAging', { type: 'doughnut', data: { labels: buckets.map(function (b) { return b.l; }), datasets: [{ data: buckets.map(function (b) { return b.v; }), backgroundColor: [GOOD, '#8be3b8', '#fbd45a', '#f59e0b', BAD], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } } });

    var byClient = {};
    overdue.forEach(function (x) { byClient[x.client_id] = (byClient[x.client_id] || 0) + (x.amount - x.paid_amount); });
    var top = Object.keys(byClient).map(function (k) { var c = BD.clients.find(function (c) { return c.client_id === k; }); return { n: c ? c.name : k, v: byClient[k] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
    chart('crTop', { type: 'bar', data: { labels: top.map(function (x) { return x.n; }), datasets: [{ data: top.map(function (x) { return x.v; }), backgroundColor: BAD, borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var mo = monthlySeries(invsAll, 'invoice_date', function (x) { return x.amount; });
    var moCol = monthlySeries(invsAll, 'invoice_date', function (x) { return x.paid_amount; });
    chart('crTrend', { type: 'bar', data: { labels: mo.labels, datasets: [{ label: 'Invoiced', data: mo.vals, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 }, { label: 'Collected', data: moCol.vals, backgroundColor: GOOD, borderRadius: 4 }] }, options: { ...barOpts(), plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } } } } });

    var regions = BD.REGIONS.map(function (r) { return { r: r, v: overdue.filter(function (x) { return x.region === r; }).reduce(function (a, x) { return a + x.amount - x.paid_amount; }, 0) }; }).sort(function (a, b) { return b.v - a.v; });
    chart('crRegion', { type: 'bar', data: { labels: regions.map(function (x) { return x.r; }), datasets: [{ data: regions.map(function (x) { return x.v; }), backgroundColor: COLS[5], borderRadius: 5 }] }, options: { ...barOpts(), indexAxis: 'y' } });

    var rows = invsAll.filter(function (x) { return x.amount > x.paid_amount; }).sort(function (a, b) { return days(b.due_date) - days(a.due_date); }).slice(0, 20).map(function (x) {
      var c = BD.clients.find(function (c) { return c.client_id === x.client_id; });
      var bal = x.amount - x.paid_amount; var d = days(x.due_date);
      var bucket = d <= 0 ? 'Not due' : d <= 30 ? '1–30' : d <= 60 ? '31–60' : d <= 90 ? '61–90' : '90+';
      var cls = d <= 0 ? '' : d <= 30 ? 'row-amber' : 'row-red';
      return '<tr class="' + cls + '"><td class="mono">' + x.invoice_id + '</td><td>' + (c ? c.name : '—') + '</td><td class="num">' + BD.fmtBDT(x.amount) + '</td><td class="num">' + BD.fmtBDT(bal) + '</td><td class="num">' + Math.max(0, d) + '</td><td>' + pill(bucket === '90+' ? 'r' : bucket === 'Not due' ? 'g' : 'y', bucket) + '</td></tr>';
    });
    $('#crTable').innerHTML = '<tr><th>Invoice</th><th>Client</th><th class="num">Amount</th><th class="num">Balance</th><th class="num">Days overdue</th><th>Bucket</th></tr>' + rows.join('');
  }

  /* ============================================================
     helpers
     ============================================================ */
  function winRate() {
    var won = opps().filter(function (x) { return x.outcome === 'Won'; }).length;
    var lost = opps().filter(function (x) { return x.outcome === 'Lost'; }).length;
    return won + lost ? Math.round(won / (won + lost) * 100) : 0;
  }
  function daysFromNow(n) { return new Date(TODAY.getTime() + n * MS); }
  function wonValueThisMonth() {
    return opps().filter(function (x) { return x.outcome === 'Won' && x.closed_date && new Date(x.closed_date).getMonth() === TODAY.getMonth(); }).reduce(function (a, x) { return a + x.deal_value; }, 0);
  }
  function monthlySeries(arr, dateKey, valFn, agg) {
    var map = {};
    arr.forEach(function (x) {
      var k = monthKey(x[dateKey]);
      if (!map[k]) map[k] = { sum: 0, n: 0 };
      map[k].sum += valFn(x); map[k].n += 1;
    });
    var keys = Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
    return {
      labels: keys.map(monthLabel),
      vals: keys.map(function (k) { return agg === 'avg' ? map[k].sum / map[k].n : map[k].sum; })
    };
  }
  function monthlyTarget() {
    var map = {};
    for (var m = 11; m >= 0; m--) {
      var d = BD.daysAgo(m * 30); var k = monthKey(d);
      var t = BD.targets.filter(function (x) { return x.month === (d.getMonth() + 1) + '-' + d.getFullYear() && x.category === 'All'; }).reduce(function (a, x) { return a + x.target_value; }, 0);
      map[k] = { target: t, actual: 0 };
    }
    orders().forEach(function (x) {
      var k = monthKey(x.order_date);
      if (map[k]) map[k].actual += x.net_value;
    });
    var keys = Object.keys(map).sort();
    return { labels: keys.map(monthLabel), target: keys.map(function (k) { return map[k].target; }), actual: keys.map(function (k) { return map[k].actual; }) };
  }
  function agingBuckets() {
    var arr = invs().filter(function (x) { return x.amount > x.paid_amount; });
    var b = [
      { l: 'Not due', v: 0, test: function (d) { return d <= 0; } },
      { l: '1–30', v: 0, test: function (d) { return d > 0 && d <= 30; } },
      { l: '31–60', v: 0, test: function (d) { return d > 30 && d <= 60; } },
      { l: '61–90', v: 0, test: function (d) { return d > 60 && d <= 90; } },
      { l: '90+', v: 0, test: function (d) { return d > 90; } }
    ];
    arr.forEach(function (x) { var d = days(x.due_date); b.forEach(function (bk) { if (bk.test(d)) bk.v += x.amount - x.paid_amount; }); });
    return b;
  }

  /* ============================================================
     TABS + GLOBAL FILTERS
     ============================================================ */
  var TABS = [
    { id: 'overview', name: 'Overview', render: renderOverview },
    { id: 'pipeline', name: 'Sales Pipeline', render: renderPipeline },
    { id: 'target', name: 'Target vs Achievement', render: renderTarget },
    { id: 'funnel', name: 'Lead Funnel', render: renderFunnel },
    { id: 'revenue', name: 'Revenue Trend', render: renderRevenue },
    { id: 'winloss', name: 'Win / Loss', render: renderWinLoss },
    { id: 'client', name: 'Client / Dealer', render: renderClientDealer },
    { id: 'market', name: 'Market / Competitor', render: renderMarket },
    { id: 'forecast', name: 'Forecast', render: renderForecast },
    { id: 'receivable', name: 'Collection', render: renderReceivable }
  ];
  var current = 'overview';

  function buildTabs() {
    $('#tabs').innerHTML = TABS.map(function (t) { return '<button class="tab' + (t.id === current ? ' active' : '') + '" data-id="' + t.id + '">' + t.name + '</button>'; }).join('');
  }
  function renderCurrent() {
    destroy();
    var t = TABS.find(function (x) { return x.id === current; });
    t.render();
  }

  function buildFilters() {
    $('#fRegion').innerHTML = ['All'].concat(BD.REGIONS).map(function (r) { return '<option>' + r + '</option>'; }).join('');
    $('#fCategory').innerHTML = ['All'].concat(BD.CATEGORIES).map(function (c) { return '<option>' + c + '</option>'; }).join('');
    $('#fOwner').innerHTML = ['All'].concat(BD.owners.map(function (o) { return o.name; })).map(function (o) { return '<option>' + o + '</option>'; }).join('');
    $('#fType').innerHTML = ['All'].concat(BD.CLIENT_TYPES).map(function (t) { return '<option>' + t + '</option>'; }).join('');
  }

  function bind() {
    $('#tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.tab'); if (!b) return;
      current = b.dataset.id; buildTabs(); renderCurrent();
    });
    $('#fRegion').addEventListener('change', function () { F.region = this.value; renderCurrent(); });
    $('#fCategory').addEventListener('change', function () { F.category = this.value; renderCurrent(); });
    $('#fType').addEventListener('change', function () { F.clientType = this.value; renderCurrent(); });
    $('#themeToggle').addEventListener('click', function () {
      var root = document.documentElement; var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next); localStorage.setItem('bd-theme', next);
    });
    $('#exportCsv').addEventListener('click', exportCsv);
  }

  // owner filter: map name -> owner_id
  function setupOwner() {
    var sel = $('#fOwner');
    sel.addEventListener('change', function () {
      var v = sel.value;
      F.owner = v === 'All' ? 'All' : (BD.owners.find(function (o) { return o.name === v; }) || {}).owner_id || 'All';
      renderCurrent();
    });
  }

  function exportCsv() {
    var t = TABS.find(function (x) { return x.id === current; });
    var tbl = document.querySelector('#content table');
    if (!tbl) return;
    var rows = []; tbl.querySelectorAll('tr').forEach(function (tr) { var r = []; tr.querySelectorAll('th,td').forEach(function (c) { r.push('"' + c.textContent.trim() + '"'); }); rows.push(r.join(',')); });
    var csv = rows.join('\n');
    var a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = t.name + '.csv'; a.click();
  }

  // dark mode boot
  (function () {
    var stored = localStorage.getItem('bd-theme');
    var pref = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.setAttribute('data-theme', stored || (pref ? 'light' : 'dark'));
  })();

  // date range defaults
  var fromI = document.getElementById('fFrom'); var toI = document.getElementById('fTo');
  if (fromI) fromI.value = BD.iso(BD.daysAgo(360));
  if (toI) toI.value = BD.iso(TODAY);
  function bindDates() {
    if (fromI) fromI.addEventListener('change', function () { F.from = new Date(this.value); renderCurrent(); });
    if (toI) toI.addEventListener('change', function () { F.to = new Date(this.value); renderCurrent(); });
  }

  buildFilters(); buildTabs(); bind(); setupOwner(); bindDates(); renderCurrent();
})();
