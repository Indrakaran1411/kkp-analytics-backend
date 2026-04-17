/**
 * KKP GROUP — TEXTILE ANALYTICS BACKEND
 * =======================================
 * Single-file Express.js backend
 * All analytics algorithms + JSON responses
 * 
 * FEATURES:
 *   GET /api/overview              — summary metrics
 *   GET /api/orders                — all orders with filters
 *   GET /api/orders/status         — confirmed / processed / declined split
 *   GET /api/orders/weave          — weave type breakdown
 *   GET /api/orders/quality        — quality breakdown
 *   GET /api/orders/composition    — composition breakdown
 *   GET /api/agents                — agent performance stats
 *   GET /api/agents/:name          — single agent detail
 *   GET /api/customers             — customer ranking
 *   GET /api/weekly-trend          — weekly order trend + rolling avg
 *   GET /api/funnel                — enquiry → confirmed funnel
 *   GET /api/analytics/momentum         — month-over-month revenue momentum score
 *   GET /api/analytics/affinity-matrix  — agent × customer confirmation rate matrix
 *   GET /api/analytics/rfm              — RFM customer loyalty segmentation
 *   GET /api/analytics/price-scatter    — rate × quantity correlation data
 *   GET /api/analytics/velocity-gaps    — order gap anomaly detection
 *   GET /api/analytics/margin           — margin estimator per composition
 *   GET /api/analytics/time-heatmap     — day × hour order submission heatmap
 *
 * HOW TO RUN:
 *   node index.js
 *   Server starts at http://localhost:3000
 */

const express = require("express");
const app = express();
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// SAMPLE DATA  (replace this with your real DB/API call)
// Structure matches your data2.json exactly
// ─────────────────────────────────────────────────────────────
const ORDERS = [
  { _id:"old001", date:"2025-12-12T10:12:34.123Z", quality:"premium",                        weave:"twill",  quantity:120,  composition:"cotton fabric",                   status:"Confirmed", rate:115, agentName:"Ravi Kumar",    customerName:"Mukilan"       },
  { _id:"old002", date:"2025-12-15T14:45:22.567Z", quality:"standard",                       weave:"plain",  quantity:300,  composition:"cotton fabric",                   status:"Processed", rate:95,  agentName:"Suresh",         customerName:"Arun Textiles" },
  { _id:"old003", date:"2025-12-18T09:30:11.200Z", quality:"premium",                        weave:"twill",  quantity:800,  composition:"cotton blend",                    status:"Confirmed", rate:130, agentName:"Unknown Agent",  customerName:"Mukilan"       },
  { _id:"old004", date:"2025-12-20T16:05:40.900Z", quality:"good",                           weave:"fabric", quantity:1500, composition:"poly cotton",                     status:"Processed", rate:75,  agentName:"Mukilan",        customerName:"Test Client"   },
  { _id:"old005", date:"2026-01-05T11:20:10.111Z", quality:"60sX60s/92X72(G)",               weave:"plain",  quantity:4000, composition:"100% Kasturi Cotton",             status:"Processed", rate:185, agentName:"Ravi Kumar",    customerName:"Mukilan"       },
  { _id:"old006", date:"2026-01-10T13:55:33.876Z", quality:"60sX60s/92X92(G)",               weave:"plain",  quantity:4500, composition:"100% Kasturi Cotton",             status:"Processed", rate:190, agentName:"Suresh",         customerName:"Mukilan"       },
  { _id:"old007", date:"2026-01-15T08:44:12.321Z", quality:"30sX20s/124X64(G)",              weave:"twill",  quantity:6000, composition:"100% Kasturi Cotton",             status:"Confirmed", rate:210, agentName:"Unknown Agent",  customerName:"Export House"  },
  { _id:"old008", date:"2026-01-20T17:10:55.654Z", quality:"2/40 viscose x 20s cotton flex", weave:"plain",  quantity:9000, composition:"52% viscose / 40% cotton / 8% linen", status:"Processed", rate:205, agentName:"Mukilan", customerName:"Global Fabrics"},
  { _id:"old009", date:"2026-01-25T12:05:25.789Z", quality:"20s cotton x 20s cotton flex",   weave:"plain",  quantity:8500, composition:"92% cotton / 8% linen",           status:"Processed", rate:198, agentName:"Ravi Kumar",    customerName:"Test Client"   },
  { _id:"old010", date:"2026-02-02T10:30:00.000Z", quality:"premium",                        weave:"twill",  quantity:200,  composition:"cotton fabric",                   status:"Confirmed", rate:140, agentName:"Suresh",         customerName:"Mukilan"       },
];

// ─────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────

/** revenue = quantity × rate */
const revenue = (o) => o.quantity * o.rate;

/** group array of objects by a key */
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/** YYYY-MM from ISO date string */
const toMonth = (iso) => iso.slice(0, 7);

/** round to 2 decimal places */
const r2 = (n) => Math.round(n * 100) / 100;

/** average of number array */
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "KKP Textile Analytics API",
    version: "2.0.0",
    language: "Node.js / Express",
    endpoints: [
      "GET /api/overview",
      "GET /api/orders",
      "GET /api/orders/status",
      "GET /api/orders/weave",
      "GET /api/orders/quality",
      "GET /api/orders/composition",
      "GET /api/agents",
      "GET /api/agents/:name",
      "GET /api/customers",
      "GET /api/weekly-trend",
      "GET /api/funnel",
      "GET /api/analytics/momentum",
      "GET /api/analytics/affinity-matrix",
      "GET /api/analytics/rfm",
      "GET /api/analytics/price-scatter",
      "GET /api/analytics/velocity-gaps",
      "GET /api/analytics/margin",
      "GET /api/analytics/time-heatmap",
    ],
  });
});

// ═══════════════════════════════════════════════════════════
// ── FEATURES ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/overview
 * Summary KPIs for the main dashboard
 */
app.get("/api/overview", (req, res) => {
  const totalRevenue   = ORDERS.reduce((s, o) => s + revenue(o), 0);
  const confirmed      = ORDERS.filter(o => o.status === "Confirmed");
  const totalQty       = ORDERS.reduce((s, o) => s + o.quantity, 0);
  const avgRate        = r2(avg(ORDERS.map(o => o.rate)));

  // top agent by revenue
  const agentRevMap = {};
  ORDERS.forEach(o => { agentRevMap[o.agentName] = (agentRevMap[o.agentName] || 0) + revenue(o); });
  const topAgent = Object.entries(agentRevMap).sort((a, b) => b[1] - a[1])[0];

  // top customer by order count
  const custMap = {};
  ORDERS.forEach(o => { custMap[o.customerName] = (custMap[o.customerName] || 0) + 1; });
  const topCustomer = Object.entries(custMap).sort((a, b) => b[1] - a[1])[0];

  res.json({
    success: true,
    endpoint: "overview",
    algorithm: "Business Health Scoring & Top Performer Extraction",
    analysis: "High-level aggregation of primary KPIs with automated insight generation.",
    data: {
      totalOrders:       ORDERS.length,
      confirmedOrders:   confirmed.length,
      processedOrders:   ORDERS.filter(o => o.status === "Processed").length,
      declinedOrders:    ORDERS.filter(o => o.status === "Declined").length,
      confirmationRate:  r2((confirmed.length / ORDERS.length) * 100),
      totalQuantityMetres: totalQty,
      totalRevenue:      totalRevenue,
      totalRevenueLakhs: r2(totalRevenue / 100000),
      avgRatePerMetre:   avgRate,
      topAgent: {
        name:    topAgent[0],
        revenue: topAgent[1],
        revenueLakhs: r2(topAgent[1] / 100000),
      },
      topCustomer: {
        name:   topCustomer[0],
        orders: topCustomer[1],
      },
    },
    insight: (confirmed.length / ORDERS.length) > 0.5 
             ? "Healthy overall confirmation rate. Focus on scaling top performers."
             : "Low conversion rate detected. Review rejection reasons."
  });
});

/**
 * GET /api/orders
 * All orders — supports ?status=Confirmed&agent=Suresh&weave=plain
 */
app.get("/api/orders", (req, res) => {
  let result = [...ORDERS];
  if (req.query.status) result = result.filter(o => o.status === req.query.status);
  if (req.query.agent)  result = result.filter(o => o.agentName === req.query.agent);
  if (req.query.weave)  result = result.filter(o => o.weave === req.query.weave);
  if (req.query.customer) result = result.filter(o => o.customerName === req.query.customer);

  res.json({
    success: true,
    endpoint: "orders",
    algorithm: "Multi-dimensional Order Filtering & Revenue Aggregation",
    analysis: "Dynamic view of order level metrics based on agent, status, weave or customer criteria.",
    filters: req.query,
    total: result.length,
    data: result.map(o => ({
      ...o,
      revenue:      revenue(o),
      revenueLakhs: r2(revenue(o) / 100000),
    })),
  });
});

/**
 * GET /api/orders/status
 * Confirmed / Processed / Declined breakdown with %
 */
app.get("/api/orders/status", (req, res) => {
  const groups = groupBy(ORDERS, o => o.status);
  const result = Object.entries(groups).map(([status, orders]) => ({
    status,
    count:        orders.length,
    percentage:   r2((orders.length / ORDERS.length) * 100),
    totalRevenue: orders.reduce((s, o) => s + revenue(o), 0),
    totalQty:     orders.reduce((s, o) => s + o.quantity, 0),
  }));
  res.json({ 
    success: true, 
    endpoint: "orders/status", 
    algorithm: "Status Distribution & Bottleneck Indicator",
    analysis: "Evaluates the proportion of processed vs declined vs confirmed to detect pipeline blockages.",
    total: ORDERS.length, 
    data: result,
    recommendation: result.find(r => r.status === "Declined")?.percentage > 20 
      ? "High decline rate detected. Investigate primary causes for lost orders." 
      : "Status distribution appears normal."
  });
});

/**
 * GET /api/orders/weave
 * Revenue, quantity, confirmation rate per weave type
 */
app.get("/api/orders/weave", (req, res) => {
  const groups = groupBy(ORDERS, o => o.weave);
  const data = Object.entries(groups).map(([weave, orders]) => {
    const conf = orders.filter(o => o.status === "Confirmed").length;
    return {
      weave,
      totalOrders:      orders.length,
      confirmedOrders:  conf,
      confirmationRate: r2((conf / orders.length) * 100),
      totalQuantity:    orders.reduce((s, o) => s + o.quantity, 0),
      totalRevenue:     orders.reduce((s, o) => s + revenue(o), 0),
      avgRatePerMetre:  r2(avg(orders.map(o => o.rate))),
    };
  });
  const bestWeave = data.sort((a, b) => b.confirmationRate - a.confirmationRate)[0];

  res.json({ 
    success: true, 
    endpoint: "orders/weave", 
    algorithm: "Weave Preference & Conversion Analytics",
    analysis: "Identifies which weave types have the best confirmation rates and generate the most volume.",
    data,
    insight: `Highest converting weave is ${bestWeave?.weave} at ${bestWeave?.confirmationRate}% confirmation rate.`
  });
});

/**
 * GET /api/orders/quality
 * Revenue, quantity, rate, confirmation rate per quality type
 */
app.get("/api/orders/quality", (req, res) => {
  const groups = groupBy(ORDERS, o => o.quality);
  const data = Object.entries(groups)
    .map(([quality, orders]) => {
      const conf = orders.filter(o => o.status === "Confirmed").length;
      const rev  = orders.reduce((s, o) => s + revenue(o), 0);
      const qty  = orders.reduce((s, o) => s + o.quantity, 0);
      return {
        quality,
        totalOrders:      orders.length,
        confirmedOrders:  conf,
        confirmationRate: r2((conf / orders.length) * 100),
        totalQuantity:    qty,
        totalRevenue:     rev,
        revenueLakhs:     r2(rev / 100000),
        avgRatePerMetre:  r2(avg(orders.map(o => o.rate))),
        revenuePerMetre:  r2(rev / qty),
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  res.json({ 
    success: true, 
    endpoint: "orders/quality", 
    algorithm: "Quality Yield & Revenue Density",
    analysis: "Ranks quality types by total revenue and determines revenue per metre.",
    data,
    topQualityInsight: data.length > 0 ? `${data[0].quality} drives the highest overall revenue.` : "No quality data available."
  });
});

/**
 * GET /api/orders/composition
 * Revenue, quantity, avg rate per fibre composition
 */
app.get("/api/orders/composition", (req, res) => {
  const groups = groupBy(ORDERS, o => o.composition);
  const data = Object.entries(groups)
    .map(([composition, orders]) => {
      const rev = orders.reduce((s, o) => s + revenue(o), 0);
      const qty = orders.reduce((s, o) => s + o.quantity, 0);
      return {
        composition,
        totalOrders:     orders.length,
        totalQuantity:   qty,
        totalRevenue:    rev,
        revenueLakhs:    r2(rev / 100000),
        avgRatePerMetre: r2(avg(orders.map(o => o.rate))),
        revenuePerMetre: r2(rev / qty),
        weaveTypes:      [...new Set(orders.map(o => o.weave))],
        customers:       [...new Set(orders.map(o => o.customerName))],
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  res.json({ 
    success: true, 
    endpoint: "orders/composition", 
    algorithm: "Composition Revenue Grouping & Popularity Model",
    analysis: "Analyzes revenue performance and customer spread across different fibre compositions.",
    data,
    recommendation: data.length > 0 ? `Promote ${data[0].composition} to drive maximum top-line growth.` : ""
  });
});

/**
 * GET /api/agents
 * All agents: orders, confirmed, revenue, avg rate, response profile
 */
app.get("/api/agents", (req, res) => {
  const groups = groupBy(ORDERS, o => o.agentName);
  const data = Object.entries(groups)
    .map(([agent, orders]) => {
      const conf   = orders.filter(o => o.status === "Confirmed");
      const rev    = orders.reduce((s, o) => s + revenue(o), 0);
      const qty    = orders.reduce((s, o) => s + o.quantity, 0);
      const rates  = orders.map(o => o.rate);
      const weaveBreakdown = {};
      orders.forEach(o => {
        if (!weaveBreakdown[o.weave]) weaveBreakdown[o.weave] = { total: 0, confirmed: 0 };
        weaveBreakdown[o.weave].total++;
        if (o.status === "Confirmed") weaveBreakdown[o.weave].confirmed++;
      });
      return {
        agentName:        agent,
        totalOrders:      orders.length,
        confirmedOrders:  conf.length,
        confirmationRate: r2((conf.length / orders.length) * 100),
        totalRevenue:     rev,
        revenueLakhs:     r2(rev / 100000),
        totalQuantity:    qty,
        avgRatePerMetre:  r2(avg(rates)),
        minRate:          Math.min(...rates),
        maxRate:          Math.max(...rates),
        customersServed:  [...new Set(orders.map(o => o.customerName))],
        weaveBreakdown,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  res.json({ 
    success: true, 
    endpoint: "agents", 
    algorithm: "Agent Performance Ranking & Conversion Efficiency",
    analysis: "Evaluates agents on total revenue, conversion percentages, and pricing capability (avg rate).",
    data,
    topAgent: data.length > 0 ? data[0].agentName : null,
    insight: data.length > 0 ? `${data[0].agentName} is leading with ₹${data[0].totalRevenue} revenue.` : "No agents found."
  });
});

/**
 * GET /api/agents/:name
 * Single agent deep detail
 */
app.get("/api/agents/:name", (req, res) => {
  const agentOrders = ORDERS.filter(o =>
    o.agentName.toLowerCase() === req.params.name.toLowerCase()
  );
  if (!agentOrders.length) {
    return res.status(404).json({ success: false, message: "Agent not found" });
  }
  const conf   = agentOrders.filter(o => o.status === "Confirmed");
  const rev    = agentOrders.reduce((s, o) => s + revenue(o), 0);

  // monthly breakdown
  const monthly = {};
  agentOrders.forEach(o => {
    const m = toMonth(o.date);
    if (!monthly[m]) monthly[m] = { total: 0, confirmed: 0, revenue: 0 };
    monthly[m].total++;
    if (o.status === "Confirmed") monthly[m].confirmed++;
    monthly[m].revenue += revenue(o);
  });

  res.json({
    success:         true,
    endpoint:        `agents/${req.params.name}`,
    algorithm:       "Agent Temporal Profiling & Cohort Analysis",
    analysis:        "Provides a month-by-month breakdown of agent performance to identify trends and consistency.",
    agentName:       agentOrders[0].agentName,
    totalOrders:     agentOrders.length,
    confirmedOrders: conf.length,
    confirmationRate: r2((conf.length / agentOrders.length) * 100),
    totalRevenue:    rev,
    revenueLakhs:    r2(rev / 100000),
    orders:          agentOrders.map(o => ({ ...o, revenue: revenue(o) })),
    monthlyBreakdown: Object.entries(monthly).map(([month, v]) => ({
      month,
      ...v,
      confirmationRate: v.total ? r2((v.confirmed / v.total) * 100) : 0,
      revenueLakhs:     r2(v.revenue / 100000),
    })),
    insight: conf.length / agentOrders.length > 0.5 ? "Agent converts more than half of their orders." : "Agent conversion rate needs coaching."
  });
});

/**
 * GET /api/customers
 * Customer ranking by revenue and order count
 * Supports ?days=30 to filter by recency
 */
app.get("/api/customers", (req, res) => {
  const NOW = new Date("2026-02-10");
  let orders = [...ORDERS];
  if (req.query.days) {
    const cutoff = new Date(NOW.getTime() - Number(req.query.days) * 86400000);
    orders = orders.filter(o => new Date(o.date) >= cutoff);
  }
  const groups = groupBy(orders, o => o.customerName);
  const data = Object.entries(groups)
    .map(([customer, ords]) => {
      const rev       = ords.reduce((s, o) => s + revenue(o), 0);
      const qty       = ords.reduce((s, o) => s + o.quantity, 0);
      const lastDate  = ords.map(o => o.date).sort().pop();
      const daysAgo   = Math.round((NOW - new Date(lastDate)) / 86400000);
      return {
        customerName:    customer,
        totalOrders:     ords.length,
        totalRevenue:    rev,
        revenueLakhs:    r2(rev / 100000),
        totalQuantity:   qty,
        avgRatePerMetre: r2(rev / qty),
        lastOrderDate:   lastDate.slice(0, 10),
        daysSinceLastOrder: daysAgo,
        activityStatus:  daysAgo <= 30 ? "Active" : daysAgo <= 60 ? "At-Risk" : "Inactive",
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  res.json({ 
    success: true, 
    endpoint: "customers", 
    algorithm: "Customer Activity Scoring Based on Recency Thresholds",
    analysis: "Classifies customers into Active, At-Risk, or Inactive based on days since last order.",
    filter: req.query.days ? `last ${req.query.days} days` : "all time", 
    data,
    insight: `Found ${data.filter(d => d.activityStatus === "At-Risk").length} At-Risk customers requiring follow up.`
  });
});

/**
 * GET /api/weekly-trend
 * Weekly orders + 4-week rolling average + target comparison
 */
app.get("/api/weekly-trend", (req, res) => {
  const TARGET = 3;

  // get Monday of the week for a date
  const getWeekStart = (iso) => {
    const d = new Date(iso);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday.toISOString().slice(0, 10);
  };

  const weekMap = {};
  ORDERS.forEach(o => {
    const wk = getWeekStart(o.date);
    if (!weekMap[wk]) weekMap[wk] = { orders: 0, revenue: 0 };
    weekMap[wk].orders++;
    weekMap[wk].revenue += revenue(o);
  });

  const weeks = Object.keys(weekMap).sort();
  const counts = weeks.map(w => weekMap[w].orders);

  // 4-week rolling average
  const rollingAvg = counts.map((_, i, arr) => {
    const slice = arr.slice(Math.max(0, i - 3), i + 1);
    return r2(avg(slice));
  });

  const data = weeks.map((week, i) => ({
    weekStart:      week,
    orders:         counts[i],
    revenue:        weekMap[week].revenue,
    revenueLakhs:   r2(weekMap[week].revenue / 100000),
    rollingAvg4Wk:  rollingAvg[i],
    target:         TARGET,
    vsTarget:       r2(((counts[i] - TARGET) / TARGET) * 100),
    status:         counts[i] >= TARGET ? "On Target" : "Below Target",
  }));

  res.json({
    success:      true,
    endpoint:     "weekly-trend",
    algorithm:    "4-Week Rolling Average Trend & Target Velocity",
    analysis:     "Calculates order volume against rolling averages and static weekly targets to determine growth momentum.",
    weeklyTarget: TARGET,
    summary: {
      totalWeeks:      weeks.length,
      avgOrdersPerWeek: r2(avg(counts)),
      bestWeek:        { week: weeks[counts.indexOf(Math.max(...counts))], orders: Math.max(...counts) },
      worstWeek:       { week: weeks[counts.indexOf(Math.min(...counts))], orders: Math.min(...counts) },
    },
    data,
    insight: counts.length > 0 && counts[counts.length - 1] >= TARGET ? "Current week is on or above target." : "Current week is missing target."
  });
});

/**
 * GET /api/funnel
 * Sales funnel: Enquiries → Orders → Confirmed → Processed
 */
app.get("/api/funnel", (req, res) => {
  const total     = ORDERS.length;
  const confirmed = ORDERS.filter(o => o.status === "Confirmed").length;
  const processed = ORDERS.filter(o => o.status === "Processed").length;
  const declined  = ORDERS.filter(o => o.status === "Declined").length;

  const stages = [
    { stage: "Enquiries Received",  count: total,     pct: 100,                                conversionFromPrev: null },
    { stage: "Orders Placed",       count: total,     pct: 100,                                conversionFromPrev: 100  },
    { stage: "Confirmed",           count: confirmed, pct: r2((confirmed / total) * 100),      conversionFromPrev: r2((confirmed / total) * 100) },
    { stage: "Processed",           count: processed, pct: r2((processed / total) * 100),      conversionFromPrev: r2((processed / (total - confirmed)) * 100) },
    { stage: "Declined",            count: declined,  pct: r2((declined / total) * 100),       conversionFromPrev: r2((declined / total) * 100) },
  ];

  // weave conversion
  const weaveConv = Object.entries(groupBy(ORDERS, o => o.weave)).map(([weave, ords]) => {
    const c = ords.filter(o => o.status === "Confirmed").length;
    return { weave, total: ords.length, confirmed: c, conversionRate: r2((c / ords.length) * 100) };
  });

  // agent conversion
  const agentConv = Object.entries(groupBy(ORDERS, o => o.agentName)).map(([agent, ords]) => {
    const c = ords.filter(o => o.status === "Confirmed").length;
    return { agent, total: ords.length, confirmed: c, conversionRate: r2((c / ords.length) * 100) };
  }).sort((a, b) => b.conversionRate - a.conversionRate);

  res.json({
    success:          true,
    endpoint:         "funnel",
    algorithm:        "Multi-stage Sales Funnel Drop-off Analysis",
    analysis:         "Measures stage-to-stage conversion survival rates across enquiries, confirmations, and processing.",
    overallConvRate:  r2((confirmed / total) * 100),
    stages,
    byWeave:          weaveConv,
    byAgent:          agentConv,
    bottleneck:       declined / total > 0.2 ? "High funnel drop-off at confirmation stage." : "Funnel is relatively stable."
  });
});

// ═══════════════════════════════════════════════════════════
// ── ANALYTICS FEATURES ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/analytics/momentum
 * ALGORITHM: Month-over-month revenue momentum score
 * 
 * Logic:
 *   1. Group orders by YYYY-MM
 *   2. Calculate revenue per month
 *   3. MoM % = ((currentMonth - prevMonth) / prevMonth) × 100
 *   4. Momentum score: >20% = "Accelerating", -20% to +20% = "Stable", <-20% = "Decelerating"
 *   5. Flag if latest month is the worst in last 3 months
 */
app.get("/api/analytics/momentum", (req, res) => {
  const monthGroups = groupBy(ORDERS, o => toMonth(o.date));
  const months = Object.keys(monthGroups).sort();

  const monthlyData = months.map(month => {
    const ords = monthGroups[month];
    const rev  = ords.reduce((s, o) => s + revenue(o), 0);
    return { month, orders: ords.length, revenue: rev, revenueLakhs: r2(rev / 100000) };
  });

  // Calculate MoM changes
  const withMoM = monthlyData.map((m, i) => {
    if (i === 0) return { ...m, momChangePercent: null, momentumSignal: "Baseline" };
    const prev = monthlyData[i - 1].revenue;
    const change = prev === 0 ? null : r2(((m.revenue - prev) / prev) * 100);
    let signal = "Stable";
    if (change !== null) {
      if (change > 20)   signal = "Accelerating";
      if (change < -20)  signal = "Decelerating";
      if (change < -80)  signal = "Critical Drop";
    }
    return { ...m, momChangePercent: change, momentumSignal: signal };
  });

  // Overall momentum score (weighted avg of last 3 months)
  const last3 = withMoM.slice(-3).filter(m => m.momChangePercent !== null);
  const overallMoM = last3.length ? r2(avg(last3.map(m => m.momChangePercent))) : null;

  const latest = withMoM[withMoM.length - 1];

  res.json({
    success:  true,
    endpoint: "analytics/momentum",
    algorithm: "Month-over-month revenue momentum with signal classification",
    summary: {
      currentMonth:        latest.month,
      currentRevenueLakhs: latest.revenueLakhs,
      currentMoMChange:    latest.momChangePercent,
      currentSignal:       latest.momentumSignal,
      overallMoM3Month:    overallMoM,
      businessHealth:      overallMoM === null ? "Insufficient data"
                           : overallMoM > 10  ? "Growing"
                           : overallMoM > -10 ? "Stable"
                           : "Declining — action needed",
      alert: latest.momentumSignal === "Critical Drop"
        ? `ALERT: Revenue dropped ${Math.abs(latest.momChangePercent)}% from last month`
        : null,
    },
    monthlyBreakdown: withMoM,
  });
});

/**
 * GET /api/analytics/affinity-matrix
 * ALGORITHM: Agent × Customer confirmation rate matrix
 * 
 * Logic:
 *   1. Build matrix[agent][customer] = { total, confirmed }
 *   2. Calculate confirmation rate per cell
 *   3. Rank best agent per customer (routing recommendation)
 *   4. Flag zero-rate pairs as "avoid routing"
 */
app.get("/api/analytics/affinity-matrix", (req, res) => {
  const agents    = [...new Set(ORDERS.map(o => o.agentName))];
  const customers = [...new Set(ORDERS.map(o => o.customerName))];

  // Build matrix
  const matrix = {};
  agents.forEach(a => {
    matrix[a] = {};
    customers.forEach(c => { matrix[a][c] = { total: 0, confirmed: 0 }; });
  });
  ORDERS.forEach(o => {
    matrix[o.agentName][o.customerName].total++;
    if (o.status === "Confirmed") matrix[o.agentName][o.customerName].confirmed++;
  });

  // Format matrix with rates
  const matrixFormatted = agents.map(agent => ({
    agent,
    customers: customers.map(customer => {
      const cell = matrix[agent][customer];
      const rate = cell.total > 0 ? r2((cell.confirmed / cell.total) * 100) : null;
      return {
        customer,
        totalOrders:      cell.total,
        confirmedOrders:  cell.confirmed,
        confirmationRate: rate,
        rating: rate === null ? "No history"
               : rate === 100 ? "Best match"
               : rate >= 50   ? "Good match"
               : "Poor match",
      };
    }),
  }));

  // Routing recommendations per customer
  const routingRecs = customers.map(customer => {
    const agentRates = agents
      .map(agent => {
        const cell = matrix[agent][customer];
        return { agent, total: cell.total, rate: cell.total > 0 ? r2((cell.confirmed / cell.total) * 100) : null };
      })
      .filter(a => a.rate !== null)
      .sort((a, b) => b.rate - a.rate);

    return {
      customer,
      recommendedAgent: agentRates[0]?.agent || "No data — assign any available agent",
      recommendedRate:  agentRates[0]?.rate || null,
      avoidAgent:       agentRates.find(a => a.rate === 0)?.agent || null,
      allAgentRates:    agentRates,
    };
  });

  res.json({
    success:   true,
    endpoint:  "analytics/affinity-matrix",
    algorithm: "Agent × Customer confirmation rate matrix with routing recommendations",
    agents,
    customers,
    matrix:             matrixFormatted,
    routingRecommendations: routingRecs,
  });
});

/**
 * GET /api/analytics/rfm
 * ALGORITHM: RFM (Recency, Frequency, Monetary) customer segmentation
 * 
 * Logic:
 *   1. Recency   = days since last order (lower = better, score 1-5)
 *   2. Frequency = total number of orders (higher = better, score 1-5)
 *   3. Monetary  = total revenue (higher = better, score 1-5)
 *   4. RFM score = weighted avg (R:30%, F:30%, M:40%)
 *   5. Segment: Champion (≥4), Loyal (3–4), At-Risk (2–3), Lost (<2)
 */
app.get("/api/analytics/rfm", (req, res) => {
  const NOW = new Date("2026-02-10");

  const customerGroups = groupBy(ORDERS, o => o.customerName);
  const customers = Object.entries(customerGroups).map(([name, ords]) => {
    const rev      = ords.reduce((s, o) => s + revenue(o), 0);
    const lastDate = ords.map(o => o.date).sort().pop();
    const daysAgo  = Math.round((NOW - new Date(lastDate)) / 86400000);
    return { name, frequency: ords.length, monetary: rev, recencyDays: daysAgo };
  });

  // Score each dimension 1–5 (percentile-based within this dataset)
  const scoreR = (days)  => days <= 10 ? 5 : days <= 20 ? 4 : days <= 40 ? 3 : days <= 60 ? 2 : 1;
  const scoreF = (freq)  => freq >= 5  ? 5 : freq === 4 ? 4 : freq === 3 ? 3 : freq === 2 ? 2 : 1;
  const scoreM = (money) => {
    if (money >= 1500000) return 5;
    if (money >= 1000000) return 4;
    if (money >= 500000)  return 3;
    if (money >= 100000)  return 2;
    return 1;
  };

  const rfmData = customers.map(c => {
    const R = scoreR(c.recencyDays);
    const F = scoreF(c.frequency);
    const M = scoreM(c.monetary);
    const rfmScore = r2(R * 0.3 + F * 0.3 + M * 0.4); // weighted

    let segment, action;
    if (rfmScore >= 4)     { segment = "Champion";      action = "Reward with priority service & early access to new fabrics"; }
    else if (rfmScore >= 3) { segment = "Loyal";         action = "Send personalised re-order reminders"; }
    else if (rfmScore >= 2) { segment = "At-Risk";       action = "Send re-engagement offer immediately"; }
    else                    { segment = "Lost";           action = "Win-back campaign — offer discount on next order"; }

    return {
      customerName:    c.name,
      recencyDays:     c.recencyDays,
      frequency:       c.frequency,
      monetaryRevenue: c.monetary,
      monetaryLakhs:   r2(c.monetary / 100000),
      scores:          { recency: R, frequency: F, monetary: M, overall: rfmScore },
      segment,
      recommendedAction: action,
    };
  }).sort((a, b) => b.scores.overall - a.scores.overall);

  const segmentSummary = {};
  rfmData.forEach(c => {
    if (!segmentSummary[c.segment]) segmentSummary[c.segment] = 0;
    segmentSummary[c.segment]++;
  });

  res.json({
    success:   true,
    endpoint:  "analytics/rfm",
    algorithm: "RFM scoring — Recency(30%) + Frequency(30%) + Monetary(40%) weighted",
    segmentSummary,
    customers: rfmData,
  });
});

/**
 * GET /api/analytics/price-scatter
 * ALGORITHM: Rate × Quantity correlation analysis
 * 
 * Logic:
 *   1. For each order: x = rate, y = quantity, size = revenue
 *   2. Calculate Pearson correlation coefficient between rate and quantity
 *   3. Classify as positive/negative/neutral correlation
 *   4. Find pricing sweet spots (high rate + high qty)
 *   5. Generate actionable pricing insight
 */
app.get("/api/analytics/price-scatter", (req, res) => {
  const points = ORDERS.map(o => ({
    orderId:     o._id,
    rate:        o.rate,
    quantity:    o.quantity,
    revenue:     revenue(o),
    revenueLakhs: r2(revenue(o) / 100000),
    weave:       o.weave,
    quality:     o.quality,
    status:      o.status,
    agent:       o.agentName,
    customer:    o.customerName,
    quadrant: o.rate >= 165 && o.quantity >= 4000 ? "High Rate + High Qty (Best)"
            : o.rate >= 165                        ? "High Rate + Low Qty"
            : o.quantity >= 4000                   ? "Low Rate + High Qty"
            :                                        "Low Rate + Low Qty",
  }));

  // Pearson correlation coefficient
  const rates = ORDERS.map(o => o.rate);
  const qtys  = ORDERS.map(o => o.quantity);
  const n     = rates.length;
  const meanR = avg(rates);
  const meanQ = avg(qtys);
  const num   = rates.reduce((s, r, i) => s + (r - meanR) * (qtys[i] - meanQ), 0);
  const denR  = Math.sqrt(rates.reduce((s, r) => s + (r - meanR) ** 2, 0));
  const denQ  = Math.sqrt(qtys.reduce((s, q) => s + (q - meanQ) ** 2, 0));
  const pearson = r2(num / (denR * denQ));

  // Quadrant summary
  const qMap = {};
  points.forEach(p => { qMap[p.quadrant] = (qMap[p.quadrant] || 0) + 1; });

  res.json({
    success:   true,
    endpoint:  "analytics/price-scatter",
    algorithm: "Pearson correlation coefficient between rate (₹/m) and order quantity (m)",
    correlation: {
      pearsonCoefficient: pearson,
      interpretation: pearson > 0.5  ? "Strong positive — higher rates attract larger orders"
                    : pearson > 0.2  ? "Moderate positive — slight tendency for higher rate = larger orders"
                    : pearson > -0.2 ? "No clear pattern"
                    :                  "Negative — higher rates mean smaller orders",
      pricingInsight: pearson > 0 
        ? "Premium pricing is NOT deterring volume. Agents should confidently quote higher rates for large fabric orders."
        : "Higher prices are reducing order size. Consider tiered pricing for bulk orders.",
    },
    quadrantBreakdown: Object.entries(qMap).map(([quadrant, count]) => ({ quadrant, count })),
    scatterPoints: points,
    pricingRanges: {
      lowRate:  { max: 165, avgQty: r2(avg(ORDERS.filter(o => o.rate < 165).map(o => o.quantity))) },
      highRate: { min: 165, avgQty: r2(avg(ORDERS.filter(o => o.rate >= 165).map(o => o.quantity))) },
    },
  });
});

/**
 * GET /api/analytics/velocity-gaps
 * ALGORITHM: Order velocity gap anomaly detection
 * 
 * Logic:
 *   1. Sort orders by date
 *   2. Calculate gap (days) between each consecutive pair
 *   3. Compute mean and standard deviation of all gaps
 *   4. Flag any gap > mean + 1.5×stdDev as anomalous
 *   5. Severity: WARNING (1.5–2× avg), CRITICAL (>2× avg)
 */
app.get("/api/analytics/velocity-gaps", (req, res) => {
  const sorted = [...ORDERS].sort((a, b) => new Date(a.date) - new Date(b.date));

  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const days = Math.round((curr - prev) / 86400000);
    gaps.push({
      gapIndex:       i,
      fromOrderId:    sorted[i - 1]._id,
      fromDate:       sorted[i - 1].date.slice(0, 10),
      toOrderId:      sorted[i]._id,
      toDate:         sorted[i].date.slice(0, 10),
      gapDays:        days,
    });
  }

  const gapValues  = gaps.map(g => g.gapDays);
  const meanGap    = r2(avg(gapValues));
  const variance   = avg(gapValues.map(g => (g - meanGap) ** 2));
  const stdDev     = r2(Math.sqrt(variance));
  const threshold  = r2(meanGap + 1.5 * stdDev);

  const annotated = gaps.map(g => ({
    ...g,
    isAnomaly:  g.gapDays > threshold,
    severity:   g.gapDays > meanGap * 2 ? "CRITICAL"
              : g.gapDays > threshold    ? "WARNING"
              :                            "Normal",
    vsAverage:  r2(((g.gapDays - meanGap) / meanGap) * 100),
  }));

  const anomalies = annotated.filter(g => g.isAnomaly);

  res.json({
    success:   true,
    endpoint:  "analytics/velocity-gaps",
    algorithm: "Gap anomaly detection using mean + 1.5×stdDev threshold",
    stats: {
      totalGaps:       gaps.length,
      avgGapDays:      meanGap,
      stdDevDays:      stdDev,
      anomalyThreshold: threshold,
      anomaliesFound:  anomalies.length,
    },
    anomalies,
    allGaps: annotated,
    recommendation: anomalies.length > 0
      ? `${anomalies.length} gap(s) exceed normal range. Consider proactive follow-up when no order is received for ${Math.ceil(threshold)} days.`
      : "No anomalous gaps detected. Order velocity is consistent.",
  });
});

/**
 * GET /api/analytics/margin
 * ALGORITHM: Estimated margin per composition type
 * 
 * Logic:
 *   1. Group orders by composition
 *   2. Calculate avg selling rate per composition
 *   3. Apply estimated cost benchmarks (textile industry standards)
 *      — can be overridden via query params: ?cotton=80&linen=100 etc.
 *   4. Margin % = (selling rate - cost) / selling rate × 100
 *   5. Rank by margin %, flag below 20% as "Low Margin Warning"
 * 
 * Query params (optional cost overrides in ₹/m):
 *   ?kasturi=X&linen=X&poly=X&cotton=X&blend=X
 */
app.get("/api/analytics/margin", (req, res) => {
  // Default estimated costs per metre (₹) — textile industry benchmarks
  // These can be overridden via query params
  const defaultCosts = {
    "100% Kasturi Cotton":                  Number(req.query.kasturi) || 85,
    "52% viscose / 40% cotton / 8% linen":  Number(req.query.linen)   || 80,
    "92% cotton / 8% linen":                Number(req.query.linen)   || 78,
    "cotton fabric":                         Number(req.query.cotton)  || 90,
    "cotton blend":                          Number(req.query.blend)   || 85,
    "poly cotton":                           Number(req.query.poly)    || 65,
  };

  const groups = groupBy(ORDERS, o => o.composition);
  const data = Object.entries(groups)
    .map(([composition, ords]) => {
      const rev         = ords.reduce((s, o) => s + revenue(o), 0);
      const qty         = ords.reduce((s, o) => s + o.quantity, 0);
      const avgSelling  = r2(rev / qty);
      const estimatedCost = defaultCosts[composition] || 80;
      const marginPct   = r2(((avgSelling - estimatedCost) / avgSelling) * 100);
      const marginRs    = r2(avgSelling - estimatedCost);
      const totalEstimatedProfit = r2(qty * marginRs);

      return {
        composition,
        totalOrders:           ords.length,
        totalQuantityMetres:   qty,
        avgSellingRatePerMetre: avgSelling,
        estimatedCostPerMetre: estimatedCost,
        estimatedMarginPercent: marginPct,
        estimatedMarginPerMetre: marginRs,
        totalEstimatedProfitRs:  totalEstimatedProfit,
        profitLakhs:             r2(totalEstimatedProfit / 100000),
        alert: marginPct < 15 ? "LOW MARGIN — review pricing or costs"
             : marginPct < 25 ? "MEDIUM MARGIN — monitor closely"
             : "Healthy margin",
        recommendation: marginPct < 20
          ? `Consider raising ₹/m rate or renegotiating supply cost for this composition`
          : `This composition is profitable — prioritise in sales pipeline`,
      };
    })
    .sort((a, b) => b.estimatedMarginPercent - a.estimatedMarginPercent);

  res.json({
    success:   true,
    endpoint:  "analytics/margin",
    algorithm: "Margin = (AvgSellingRate - EstimatedCost) / AvgSellingRate × 100",
    note:      "Cost estimates are defaults. Override via query params: ?kasturi=85&linen=80&poly=65&cotton=90&blend=85",
    costInputsUsed: defaultCosts,
    summary: {
      highestMarginComposition: data[0]?.composition,
      highestMarginPercent:     data[0]?.estimatedMarginPercent,
      lowestMarginComposition:  data[data.length - 1]?.composition,
      lowestMarginPercent:      data[data.length - 1]?.estimatedMarginPercent,
      compositionsAtRisk:       data.filter(d => d.estimatedMarginPercent < 20).map(d => d.composition),
    },
    data,
  });
});

/**
 * GET /api/analytics/time-heatmap
 * ALGORITHM: Day-of-week × Hour-of-day order submission heatmap
 * 
 * Logic:
 *   1. Parse each order's ISO timestamp → day of week + hour bucket
 *   2. Build 7×6 matrix (Mon–Sun × 4 time slots)
 *   3. Calculate percentage of orders per cell
 *   4. Flag weekend orders as operational insight
 *   5. Recommend staffing windows based on peak cells
 */
app.get("/api/analytics/time-heatmap", (req, res) => {
  const DAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const SLOTS = [
    { label: "Early morning (6–9am)",   start: 6,  end: 9  },
    { label: "Morning (9am–12pm)",      start: 9,  end: 12 },
    { label: "Afternoon (12–3pm)",      start: 12, end: 15 },
    { label: "Late afternoon (3–6pm)",  start: 15, end: 18 },
    { label: "Evening (6–9pm)",         start: 18, end: 21 },
  ];

  // Build matrix
  const matrix = {};
  DAYS.forEach(d  => { matrix[d] = {}; SLOTS.forEach(s => { matrix[d][s.label] = 0; }); });

  const rawPoints = [];
  ORDERS.forEach(o => {
    const dt   = new Date(o.date);
    const day  = DAYS[dt.getDay()];
    const hour = dt.getHours();
    const slot = SLOTS.find(s => hour >= s.start && hour < s.end);
    if (slot) matrix[day][slot.label]++;
    rawPoints.push({ orderId: o._id, date: o.date.slice(0, 10), dayOfWeek: day, hour, isWeekend: dt.getDay() === 0 || dt.getDay() === 6 });
  });

  const weekendOrders = rawPoints.filter(p => p.isWeekend);
  const weekdayOrders = rawPoints.filter(p => !p.isWeekend);

  // Flatten matrix to array for easy rendering
  const heatmapRows = DAYS.map(day => ({
    day,
    isWeekend: day === "Saturday" || day === "Sunday",
    slots: SLOTS.map(slot => ({
      timeSlot:   slot.label,
      orderCount: matrix[day][slot.label],
      percentage: r2((matrix[day][slot.label] / ORDERS.length) * 100),
      intensity:  matrix[day][slot.label] === 0 ? "None"
                : matrix[day][slot.label] === 1  ? "Low"
                : matrix[day][slot.label] === 2  ? "Medium"
                : "High",
    })),
  }));

  // Find peak windows
  const allCells = [];
  DAYS.forEach(day => {
    SLOTS.forEach(slot => {
      if (matrix[day][slot.label] > 0) {
        allCells.push({ day, slot: slot.label, count: matrix[day][slot.label] });
      }
    });
  });
  allCells.sort((a, b) => b.count - a.count);

  res.json({
    success:   true,
    endpoint:  "analytics/time-heatmap",
    algorithm: "Day × Hour order submission pattern analysis with staffing recommendations",
    summary: {
      totalOrders:           ORDERS.length,
      weekendOrders:         weekendOrders.length,
      weekdayOrders:         weekdayOrders.length,
      weekendPercentage:     r2((weekendOrders.length / ORDERS.length) * 100),
      peakWindows:           allCells.slice(0, 3),
      staffingAlert: weekendOrders.length > 0
        ? `${weekendOrders.length} orders (${r2((weekendOrders.length / ORDERS.length) * 100)}%) placed on weekends — agents should be available Sat/Sun`
        : "No weekend orders detected",
    },
    heatmap:   heatmapRows,
    rawPoints,
    staffingRecommendation: {
      mustCover: allCells.slice(0, 3).map(c => `${c.day} ${c.slot}`),
      weekendCoverage: weekendOrders.length > 0 ? "Required" : "Optional",
    },
  });
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅  KKP Analytics API running at http://localhost:${PORT}`);
  console.log(`\n📋  FEATURES:`);
  console.log(`    GET /api/overview`);
  console.log(`    GET /api/orders`);
  console.log(`    GET /api/orders/status`);
  console.log(`    GET /api/orders/weave`);
  console.log(`    GET /api/orders/quality`);
  console.log(`    GET /api/orders/composition`);
  console.log(`    GET /api/agents`);
  console.log(`    GET /api/agents/:name`);
  console.log(`    GET /api/customers`);
  console.log(`    GET /api/weekly-trend`);
  console.log(`    GET /api/funnel`);
  console.log(`    GET /api/analytics/momentum`);
  console.log(`    GET /api/analytics/affinity-matrix`);
  console.log(`    GET /api/analytics/rfm`);
  console.log(`    GET /api/analytics/price-scatter`);
  console.log(`    GET /api/analytics/velocity-gaps`);
  console.log(`    GET /api/analytics/margin`);
  console.log(`    GET /api/analytics/time-heatmap`);
});
