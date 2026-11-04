export const messages = {
  en: {
    name: "Bitcoin Price", desc: "Bitcoin price and 24-hour change from CoinPaprika.",
    currency: "Quote currency", usd: "US dollar (USD)", cny: "Chinese yuan (CNY)",
    price: "Price per BTC", change: "24-hour change", unavailable: "Unavailable",
    updated: "Updated {time} (UTC)", source: "CoinPaprika · refreshes every 5 minutes",
    cached: "Refresh failed. Showing the last saved price.", stale: "The provider's price is over 10 minutes old.",
    invalidCurrency: "Choose USD or CNY in the widget settings.",
    failed: "Price unavailable: {reason}", http: "Provider returned HTTP {status}",
    badData: "The provider returned invalid or expired price data.", network: "Connection failed or timed out.",
  },
  zh: {
    name: "比特币价格", desc: "显示 CoinPaprika 的比特币价格及 24 小时涨跌幅。",
    currency: "计价货币", usd: "美元（USD）", cny: "人民币（CNY）",
    price: "每枚 BTC 价格", change: "24 小时涨跌", unavailable: "暂无数据",
    updated: "行情更新：{time}（UTC）", source: "CoinPaprika · 每 5 分钟刷新",
    cached: "刷新失败，正在显示上次保存的价格。", stale: "数据源的价格已超过 10 分钟未更新。",
    invalidCurrency: "请在小组件设置中选择美元或人民币。",
    failed: "价格暂不可用：{reason}", http: "数据源返回 HTTP {status}",
    badData: "数据源返回的价格无效或已过期。", network: "连接失败或请求超时。",
  },
};

export const manifest = {
  id: "bitcoin-price", name: t("name"), version: "1.0.0",
  description: t("desc"), icon: "trending-up",
  author: "jae-jae", homepage: "https://github.com/jae-jae/genkan-plugins",
  permissions: { fetch: ["api.coinpaprika.com"] },
  widgets: [{
    id: "price", name: t("name"), size: "s", refresh: 300,
    config: [{
      key: "currency", type: "select", label: t("currency"), default: "usd",
      options: [{ value: "usd", label: t("usd") }, { value: "cny", label: t("cny") }],
    }],
  }],
};

function view(ctx, currency, quote, fallback) {
  const fmt = new Intl.NumberFormat(ctx.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const time = new Intl.DateTimeFormat(ctx.locale, {
    timeZone: "UTC", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(quote.updated));
  const hasChange = Number.isFinite(quote.change);
  const body = [
    { type: "stat", label: ctx.t("price"), value: fmt.format(quote.price), unit: currency.toUpperCase() },
    { type: "stat", label: ctx.t("change"),
      value: hasChange ? (quote.change > 0 ? "+" : "") + fmt.format(quote.change) : ctx.t("unavailable"),
      unit: hasChange ? "%" : "", trend: hasChange ? (quote.change > 0 ? "up" : quote.change < 0 ? "down" : "flat") : undefined },
    { type: "text", text: ctx.t("updated", { time }), size: "s", muted: true },
    { type: "text", text: ctx.t("source"), size: "s", muted: true },
  ];
  if (fallback) body.push({ type: "text", text: ctx.t("cached"), size: "s" });
  else if (ctx.now - quote.updated > 600000) body.push({ type: "text", text: ctx.t("stale"), size: "s" });
  return { title: ctx.t("name"), icon: "trending-up", link: "https://coinpaprika.com/coin/btc-bitcoin/", body };
}

export async function widget(ctx) {
  const currency = ctx.instance?.config?.currency || "usd";
  const fail = (reason) => ({ title: ctx.t("name"), icon: "trending-up", body: [], error: reason });
  if (!["usd", "cny"].includes(currency)) return fail(ctx.t("invalidCurrency"));
  const key = "coinpaprika:" + currency;
  const cached = genkan.storage.get(key);
  const usable = (q) => q && Number.isFinite(q.price) && q.price > 0 && Number.isFinite(q.updated)
    && q.updated > 0 && ctx.now - q.updated >= -60000 && ctx.now - q.updated < 3600000;
  if (usable(cached) && ctx.now - cached.at >= 0 && ctx.now - cached.at < 300000) return view(ctx, currency, cached, false);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    let response;
    try {
      response = await fetch("https://api.coinpaprika.com/v1/tickers/btc-bitcoin?quotes=" + currency.toUpperCase(), {
        signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "genkan-bitcoin-price/1.0" },
      });
    } catch (_) { throw new Error(ctx.t("network")); }
    if (!response.ok) throw new Error(ctx.t("http", { status: response.status }));
    let data;
    try { data = await response.json(); }
    catch (_) { throw new Error(ctx.t("badData")); }
    const ticker = data?.quotes?.[currency.toUpperCase()];
    const quote = { price: ticker?.price, change: ticker?.percent_change_24h, updated: Date.parse(data?.last_updated), at: ctx.now };
    if (!usable(quote)) throw new Error(ctx.t("badData"));
    try { genkan.storage.set(key, quote); }
    catch (_) { console.warn("Could not cache the Bitcoin quote"); }
    return view(ctx, currency, quote, false);
  } catch (error) {
    console.warn("Bitcoin price refresh failed:", error.message);
    if (usable(cached)) return view(ctx, currency, cached, true);
    return fail(ctx.t("failed", { reason: error.message }));
  } finally {
    clearTimeout(timer);
  }
}
