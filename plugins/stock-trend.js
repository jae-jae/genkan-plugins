// Genkan server-side plugin. Public market data only; no credentials required.
export const messages = {
  en: {
    name: "Stock Trend", description: "Index and stock quotes with an interactive price chart from Yahoo Finance.",
    symbol: "Ticker symbol", symbolHelp: "Yahoo ticker: ^IXIC (Nasdaq Composite), ^NDX (Nasdaq 100), AAPL, MSFT.",
    label: "Display name", labelHelp: "Optional. Leave empty to use the ticker or index name.",
    period: "Default chart period", day: "1D", month: "1M", year: "1Y",
    nasdaq: "Nasdaq Composite", nasdaq100: "Nasdaq 100", price: "Latest quote", change: "Daily change",
    points: "pts", amount: "Daily change: {amount} {unit}", unavailable: "Unavailable", badSymbol: "Enter a valid Yahoo ticker in widget settings (e.g. ^IXIC or AAPL).",
    badPeriod: "Unsupported chart period.", unknownAction: "Unknown action.",
    failed: "Market data unavailable. Please try again later or check the ticker.",
    stale: "Connection failed; showing cached data from {time}.",
    quoteTime: "Quote: {time}", source: "Yahoo Finance · May be delayed · Refreshes every 5 min",
    range: "Chart period: {period}", selectionNotSaved: "Storage is full; this period selection could not be saved.",
  },
  zh: {
    name: "股票走势", description: "显示指数、个股行情及可交互的价格折线图，数据来自 Yahoo Finance。",
    symbol: "股票或指数代码", symbolHelp: "Yahoo 代码：^IXIC（纳斯达克综合）、^NDX（纳斯达克100）、AAPL、MSFT。",
    label: "显示名称", labelHelp: "可选，留空时使用股票代码或指数名称。",
    period: "默认图表周期", day: "1日", month: "1月", year: "1年",
    nasdaq: "纳斯达克综合指数", nasdaq100: "纳斯达克100指数", price: "最新点位／价格", change: "日涨跌",
    points: "点", amount: "日涨跌额：{amount} {unit}", unavailable: "暂无", badSymbol: "请在小组件设置中填写有效的 Yahoo 代码，例如 ^IXIC 或 AAPL。",
    badPeriod: "不支持此图表周期。", unknownAction: "未知操作。",
    failed: "暂时无法获取行情，请稍后重试或检查股票代码。",
    stale: "连接失败，当前显示 {time} 获取的缓存数据。",
    quoteTime: "行情时间：{time}", source: "Yahoo Finance · 行情可能延迟 · 每5分钟刷新",
    range: "图表周期：{period}", selectionNotSaved: "存储空间已满，此次周期选择未能保存。",
  },
};

export const manifest = {
  id: "stock-trend", name: t("name"), version: "1.0.0", description: t("description"), icon: "chart-line",
  author: "jae-jae", homepage: "https://github.com/jae-jae/genkan-plugins",
  permissions: { fetch: ["query1.finance.yahoo.com", "query2.finance.yahoo.com"] },
  widgets: [{
    id: "market", name: t("name"), size: "m", refresh: 300,
    config: [
      { key: "symbol", type: "string", label: t("symbol"), help: t("symbolHelp"), default: "^IXIC", required: true },
      { key: "label", type: "string", label: t("label"), help: t("labelHelp") },
      { key: "period", type: "select", label: t("period"), default: "1mo", options: [
        { value: "1d", label: t("day") }, { value: "1mo", label: t("month") }, { value: "1y", label: t("year") },
      ] },
    ],
  }],
};

const PERIODS = { "1d": { interval: "5m", key: "day" }, "1mo": { interval: "1d", key: "month" }, "1y": { interval: "1d", key: "year" } };
const HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const TTL = 300000;

function settings(ctx) {
  const cfg = ctx.instance.config || {};
  const symbol = String(cfg.symbol === undefined ? "^IXIC" : cfg.symbol).trim().toUpperCase();
  if (!/^[A-Z0-9^][A-Z0-9.^=_-]{0,31}$/.test(symbol)) throw new Error(ctx.t("badSymbol"));
  const configured = cfg.period || "1mo";
  if (!Object.hasOwn(PERIODS, configured)) throw new Error(ctx.t("badPeriod"));
  const selection = ctx.instance.storage.get("selection");
  const period = selection && selection.configured === configured && Object.hasOwn(PERIODS, selection.period)
    ? selection.period : configured;
  return { symbol, period, configured, label: String(cfg.label || "").trim().slice(0, 80) };
}

// Each host has a short timeout; even two failed attempts fit the 10 s hook budget.
async function chart(symbol, period) {
  let failure;
  for (const host of HOSTS) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 2800);
    try {
      const url = "https://" + host + "/v8/finance/chart/" + encodeURIComponent(symbol)
        + "?range=" + period + "&interval=" + PERIODS[period].interval + "&includePrePost=false";
      const response = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "Genkan-Stock-Trend/1.0", Accept: "application/json" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      const result = payload && payload.chart && payload.chart.result && payload.chart.result[0];
      if (!result || payload.chart.error || !result.meta) throw new Error("Invalid chart response");
      return result;
    } catch (e) {
      failure = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw failure || new Error("No chart response");
}

function positive(v) { return typeof v === "number" && Number.isFinite(v) && v > 0; }

function series(result) {
  const times = result.timestamp;
  const quote = result.indicators && result.indicators.quote && result.indicators.quote[0];
  const closes = quote && quote.close;
  if (!Array.isArray(times) || !Array.isArray(closes)) throw new Error("Missing price history");
  const unique = new Map();
  for (let i = 0; i < times.length; i++) {
    if (positive(times[i]) && times[i] < 8640000000000 && positive(closes[i])) unique.set(times[i] * 1000, closes[i]);
  }
  const points = Array.from(unique.entries()).sort((a, b) => a[0] - b[0]);
  if (!points.length) throw new Error("Empty price history");
  if (points.length <= 400) return points;
  return Array.from({ length: 400 }, (_, i) => points[Math.round(i * (points.length - 1) / 399)]);
}

async function load(ctx, cfg) {
  const cached = ctx.instance.storage.get("market");
  const matches = cached && cached.symbol === cfg.symbol && cached.period === cfg.period
    && positive(cached.at) && cached.data && positive(cached.data.price)
    && positive(cached.data.time) && Array.isArray(cached.data.points) && cached.data.points.length > 0;
  if (matches && ctx.now >= cached.at && ctx.now - cached.at < TTL) return { data: cached.data, stale: false };
  try {
    // A long-range chartPreviousClose is the range baseline, NOT yesterday's close.
    // Always obtain the daily comparison from a separate 1-day response.
    const [daily, history] = cfg.period === "1d"
      ? await chart(cfg.symbol, "1d").then((r) => [r, r])
      : await Promise.all([chart(cfg.symbol, "1d"), chart(cfg.symbol, cfg.period)]);
    const meta = daily.meta;
    if (!positive(meta.regularMarketPrice) || !positive(meta.regularMarketTime)) throw new Error("Missing quote");
    const previous = positive(meta.previousClose) ? meta.previousClose : meta.chartPreviousClose;
    const change = positive(previous) ? meta.regularMarketPrice - previous : null;
    const data = {
      price: meta.regularMarketPrice, time: meta.regularMarketTime * 1000,
      change, percent: change === null ? null : change / previous * 100,
      currency: typeof meta.currency === "string" ? meta.currency.slice(0, 12) : "",
      index: meta.instrumentType === "INDEX", points: series(history),
    };
    try { ctx.instance.storage.set("market", { symbol: cfg.symbol, period: cfg.period, at: ctx.now, data }); }
    catch (e) { genkan.log("Quote cache could not be saved"); }
    return { data, stale: false };
  } catch (e) {
    genkan.log("Market request failed for", cfg.symbol, cfg.period, String(e && e.message || e).slice(0, 160));
    if (matches) return { data: cached.data, stale: true, cachedAt: cached.at };
    throw new Error(ctx.t("failed"));
  }
}

function timestamp(ctx, ms) {
  return new Intl.DateTimeFormat(ctx.locale, {
    timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(ms)) + " UTC";
}

async function render(ctx, period) {
  const { t } = ctx;
  let cfg;
  try { cfg = settings(ctx); }
  catch (e) { return { title: t("name"), icon: "chart-line", body: [], error: e.message }; }
  if (period) cfg.period = period;
  const title = cfg.label || (cfg.symbol === "^IXIC" ? t("nasdaq") : cfg.symbol === "^NDX" ? t("nasdaq100") : cfg.symbol);
  const view = { title, icon: "chart-line", link: "https://finance.yahoo.com/quote/" + encodeURIComponent(cfg.symbol) + "/", body: [] };
  try {
    const result = await load(ctx, cfg);
    const d = result.data;
    const number = new Intl.NumberFormat(ctx.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const signed = new Intl.NumberFormat(ctx.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
    const trend = d.change === null || d.change === 0 ? "flat" : d.change > 0 ? "up" : "down";
    if (result.stale) view.body.push({ type: "text", text: t("stale", { time: timestamp(ctx, result.cachedAt) }), size: "s" });
    view.body.push(
      { type: "stats", items: [
        { label: t("price"), value: number.format(d.price), unit: d.index ? t("points") : d.currency },
        { label: t("change"), value: d.percent === null ? t("unavailable") : signed.format(d.percent),
          unit: d.percent === null ? "" : "%", trend },
      ] },
      { type: "text", text: t("amount", { amount: d.change === null ? t("unavailable") : signed.format(d.change), unit: d.index ? t("points") : d.currency })
        + "\n" + t("range", { period: t(PERIODS[cfg.period].key) }) + " · " + cfg.symbol, size: "s", muted: true },
      { type: "chart", kind: "line", points: d.points, format: "decimal",
        color: d.points[d.points.length - 1][1] >= d.points[0][1] ? "green" : "red" },
      { type: "row", children: Object.keys(PERIODS).map((period) => ({
        type: "button", label: (period === cfg.period ? "✓ " : "") + t(PERIODS[period].key), action: "period", params: { period },
      })) },
      { type: "text", text: t("quoteTime", { time: timestamp(ctx, d.time) }), size: "s", muted: true },
      { type: "text", text: t("source"), size: "s", muted: true },
    );
  } catch (e) { view.error = t("failed"); }
  return view;
}

export async function widget(ctx) { return render(ctx); }

export async function action(ctx) {
  if (ctx.action !== "period") throw new Error(ctx.t("unknownAction"));
  const period = ctx.params && ctx.params.period;
  if (typeof period !== "string" || !Object.hasOwn(PERIODS, period)) throw new Error(ctx.t("badPeriod"));
  const cfg = settings(ctx);
  let saved = true;
  try { ctx.instance.storage.set("selection", { configured: cfg.configured, period }); }
  catch (e) { saved = false; genkan.log("Period selection could not be saved"); }
  const result = { view: await render(ctx, period) };
  if (!saved) result.toast = ctx.t("selectionNotSaved");
  return result;
}
