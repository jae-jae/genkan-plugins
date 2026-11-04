export const messages = {
  en: {
    name: "Codex Usage", description: "Remaining Codex subscription allowance and reset times, read with your ChatGPT access token.",
    token: "ChatGPT access token", tokenHelp: "After signing in to Codex with ChatGPT, get the value from ~/.codex/auth.json → tokens.access_token. Use that value, not an OpenAI API key. Update it when expired; never share it in chat.",
    account: "Account ID (optional)", accountHelp: "Leave blank to use the account in the token. Set a ChatGPT account/workspace ID to select a specific account.",
    timezone: "Time zone", timezoneHelp: "IANA time zone, e.g. Asia/Shanghai or Europe/London.",
    mode: "Progress bars", remaining: "Remaining", used: "Used", general: "Codex", review: "Code review",
    hours: "{n}-hour window", days: "{n}-day window", minutes: "{n}-minute window", window: "Quota window",
    percentRemaining: "{n} remaining", percentUsed: "{n} used", resets: "Resets {time}", resetUnknown: "Reset time not provided",
    resetPending: "Reset time reached; awaiting the next refresh", plan: "Plan", credits: "Credits", unlimited: "Unlimited",
    noWindows: "This account did not return fixed quota windows. No remaining percentage is available.",
    restricted: "Usage is currently restricted for this account or workspace.", updated: "Updated {time}",
    missing: "Add your ChatGPT access token in Settings → Plugins → Codex Usage. The plugin is read-only.",
    tokenFormat: "The access token has an invalid format. Copy only the tokens.access_token value from ~/.codex/auth.json, without quotes, spaces, or other fields.",
    apiKey: "This is an OpenAI API key. Enter the ChatGPT/Codex access_token for subscription usage instead.",
    expired: "Your access token has expired. Replace it in the plugin settings.", invalidAccount: "The account ID has an invalid format.",
    unauthorized: "The access token was rejected. Replace it in the plugin settings and check the selected account ID.",
    forbidden: "ChatGPT denied the request (HTTP 403). Check the account ID and whether the Genkan server can access ChatGPT.",
    rateLimited: "ChatGPT rate-limited this request. Wait a few minutes before retrying.",
    http: "ChatGPT returned HTTP {status}.", network: "Cannot reach ChatGPT. Check the Genkan server's network connection.",
    timeout: "ChatGPT did not respond within 8 seconds.", invalid: "ChatGPT returned an unsupported usage response.",
    badTimezone: "Invalid time zone. Use an IANA name such as Asia/Shanghai.",
    planFree: "Free", planGo: "Go", planPlus: "Plus", planPro: "Pro", planBusiness: "Business", planEnterprise: "Enterprise", planEdu: "Education",
  },
  zh: {
    name: "Codex 用量", description: "使用 ChatGPT 访问令牌读取 Codex 订阅的剩余额度和重置时间。",
    token: "ChatGPT 访问令牌", tokenHelp: "使用 ChatGPT 登录 Codex 后，可从 ~/.codex/auth.json → tokens.access_token 获取。填写该字段的值，不是 OpenAI API key。过期后在此更新，请勿发到聊天里。",
    account: "账户 ID（选填）", accountHelp: "留空使用令牌中的账户。需要选择特定账户时，填写 ChatGPT 账户或工作区 ID。",
    timezone: "时区", timezoneHelp: "IANA 时区名称，例如 Asia/Shanghai 或 Europe/London。",
    mode: "进度条显示", remaining: "剩余额度", used: "已用额度", general: "Codex", review: "代码审查",
    hours: "{n} 小时额度", days: "{n} 天额度", minutes: "{n} 分钟额度", window: "额度窗口",
    percentRemaining: "剩余 {n}", percentUsed: "已用 {n}", resets: "重置时间：{time}", resetUnknown: "接口未提供重置时间",
    resetPending: "已到重置时间，等待下次刷新确认", plan: "套餐", credits: "点数余额", unlimited: "不限量",
    noWindows: "此账户未返回固定额度窗口，暂时无法显示剩余百分比。",
    restricted: "当前账户或工作区的用量受到限制。", updated: "更新时间：{time}",
    missing: "请在「设置 → 插件 → Codex 用量」填写 ChatGPT 访问令牌。插件仅查询用量。",
    tokenFormat: "访问令牌格式无效。请只复制 ~/.codex/auth.json 中 tokens.access_token 的值，不要包含引号、空格或其他字段。",
    apiKey: "这是一枚 OpenAI API key。查询订阅用量需要 ChatGPT/Codex 的 access_token。",
    expired: "访问令牌已过期，请在插件设置中更新。", invalidAccount: "账户 ID 格式不正确。",
    unauthorized: "访问令牌被拒绝，请在插件设置中更新，并检查所选账户 ID。",
    forbidden: "ChatGPT 拒绝访问（HTTP 403），请检查账户 ID 以及 Genkan 服务器能否访问 ChatGPT。",
    rateLimited: "ChatGPT 暂时限制了请求频率，请等待几分钟再试。",
    http: "ChatGPT 返回 HTTP {status}。", network: "无法连接 ChatGPT，请检查 Genkan 服务器的网络。",
    timeout: "ChatGPT 未在 8 秒内响应。", invalid: "ChatGPT 返回的用量数据格式暂不受支持。",
    badTimezone: "时区名称无效，请填写 Asia/Shanghai 等 IANA 时区名称。",
    planFree: "免费版", planGo: "Go", planPlus: "Plus", planPro: "Pro", planBusiness: "商业版", planEnterprise: "企业版", planEdu: "教育版",
  },
};

export const manifest = {
  id: "codex-usage", name: t("name"), version: "1.0.0", description: t("description"), icon: "gauge",
  author: "jae-jae", homepage: "https://github.com/jae-jae/genkan-plugins",
  permissions: { fetch: ["chatgpt.com:443"] },
  config: [
    { key: "access_token", type: "secret", label: t("token"), help: t("tokenHelp") },
    { key: "account_id", type: "string", label: t("account"), help: t("accountHelp") },
  ],
  widgets: [{
    id: "usage", name: t("name"), size: "m", refresh: 300,
    config: [
      { key: "timezone", type: "string", label: t("timezone"), help: t("timezoneHelp"), default: "Asia/Shanghai" },
      { key: "mode", type: "select", label: t("mode"), default: "remaining", options: [
        { value: "remaining", label: t("remaining") }, { value: "used", label: t("used") },
      ] },
    ],
  }],
};

const USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";

// JWT claims only select the account and provide an early expiry hint; the server authenticates the token.
function tokenClaims(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    const raw = part.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(raw.padEnd(Math.ceil(raw.length / 4) * 4, "=")), c => c.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return value && typeof value === "object" ? value : {};
  } catch (_) { return {}; }
}

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function windowLabel(ctx, window) {
  const seconds = number(window.limit_window_seconds);
  const fmt = new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 1 });
  if (seconds > 0 && seconds % 86400 === 0) return ctx.t("days", { n: fmt.format(seconds / 86400) });
  if (seconds > 0 && seconds % 3600 === 0) return ctx.t("hours", { n: fmt.format(seconds / 3600) });
  if (seconds > 0) return ctx.t("minutes", { n: fmt.format(seconds / 60) });
  return ctx.t("window");
}

function renderUsage(ctx, data, dateFmt) {
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.plan_type !== "string") {
    throw new Error(ctx.t("invalid"));
  }
  const cfg = (ctx.instance && ctx.instance.config) || {};
  const usedMode = cfg.mode === "used";
  const percent = new Intl.NumberFormat(ctx.locale, { style: "percent", maximumFractionDigits: 1 });
  const body = [];
  let windows = 0;
  const groups = [{ name: ctx.t("general"), limit: data.rate_limit }];
  if (data.code_review_rate_limit) groups.push({ name: ctx.t("review"), limit: data.code_review_rate_limit });
  if (Array.isArray(data.additional_rate_limits)) {
    for (const item of data.additional_rate_limits.slice(0, 4)) {
      if (!item || typeof item !== "object") continue;
      groups.push({ name: String(item.limit_name || item.metered_feature || ctx.t("general")).slice(0, 100), limit: item.rate_limit });
    }
  }
  for (const group of groups) {
    if (!group.limit || typeof group.limit !== "object") continue;
    for (const window of [group.limit.primary_window, group.limit.secondary_window]) {
      if (!window) continue;
      const used = number(window.used_percent);
      if (used === null || used < 0) throw new Error(ctx.t("invalid"));
      const fraction = Math.max(0, Math.min(1, (usedMode ? used : 100 - used) / 100));
      body.push({ type: "progress", label: group.name + " · " + windowLabel(ctx, window), value: fraction,
        text: ctx.t(usedMode ? "percentUsed" : "percentRemaining", { n: percent.format(fraction) }) });
      const reset = number(window.reset_at);
      const after = number(window.reset_after_seconds);
      const at = reset > 0 ? reset * 1000 : after !== null && after >= 0 ? ctx.now + after * 1000 : null;
      const resetText = at === null ? ctx.t("resetUnknown") : at <= ctx.now ? ctx.t("resetPending") : ctx.t("resets", { time: dateFmt.format(new Date(at)) });
      body.push({ type: "text", text: resetText, size: "s", muted: true });
      windows++;
    }
    if (group.limit.allowed === false || group.limit.limit_reached === true) {
      body.push({ type: "text", text: ctx.t("restricted"), size: "s", muted: true });
    }
  }
  if (!windows) body.push({ type: "text", text: ctx.t("noWindows"), muted: true });
  const plans = { free: "planFree", go: "planGo", plus: "planPlus", pro: "planPro", business: "planBusiness", team: "planBusiness", enterprise: "planEnterprise", edu: "planEdu", education: "planEdu" };
  const details = [{ k: ctx.t("plan"), v: plans[data.plan_type] ? ctx.t(plans[data.plan_type]) : data.plan_type.slice(0, 60) }];
  const credits = data.credits;
  if (credits && credits.unlimited === true) details.push({ k: ctx.t("credits"), v: ctx.t("unlimited") });
  else if (credits && credits.has_credits === true && credits.balance !== null && credits.balance !== undefined) {
    const balance = typeof credits.balance === "string" && credits.balance.trim() ? Number(credits.balance) : credits.balance;
    if (number(balance) !== null && balance >= 0) details.push({ k: ctx.t("credits"), v: new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 2 }).format(balance) });
  }
  if (data.spend_control && data.spend_control.reached === true) body.push({ type: "text", text: ctx.t("restricted"), muted: true });
  body.push({ type: "kv", items: details });
  body.push({ type: "text", text: ctx.t("updated", { time: dateFmt.format(new Date(ctx.now)) }), size: "s", muted: true });
  return body;
}

export async function widget(ctx) {
  const view = { title: ctx.t("name"), icon: "gauge", link: "https://chatgpt.com/codex/settings/usage", body: [] };
  const cfg = ctx.config || {};
  const token = String(cfg.access_token || "").trim().replace(/^Bearer\s+/i, "");
  if (!token) return { ...view, error: ctx.t("missing") };
  if (/^sk-/i.test(token)) return { ...view, error: ctx.t("apiKey") };
  const parts = token.split(".");
  if (!/^[A-Za-z0-9_.-]+$/.test(token) || (parts.length !== 1 && (parts.length !== 3 || parts.some(part => !part)))) {
    return { ...view, error: ctx.t("tokenFormat") };
  }
  const claims = tokenClaims(token);
  if (number(claims.exp) !== null && claims.exp * 1000 <= ctx.now) return { ...view, error: ctx.t("expired") };
  const auth = claims["https://api.openai.com/auth"] || {};
  const account = String(cfg.account_id || auth.chatgpt_account_id || "").trim();
  if (account && !/^[A-Za-z0-9_-]{1,160}$/.test(account)) return { ...view, error: ctx.t("invalidAccount") };
  let dateFmt;
  try {
    dateFmt = new Intl.DateTimeFormat(ctx.locale, { timeZone: ((ctx.instance && ctx.instance.config) || {}).timezone || "Asia/Shanghai", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  } catch (_) { return { ...view, error: ctx.t("badTimezone") }; }
  const headers = { Authorization: "Bearer " + token, Accept: "application/json", "User-Agent": "genkan-codex-usage/1.0.0" };
  if (account) headers["ChatGPT-Account-Id"] = account;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(USAGE_URL, { method: "GET", headers, signal: controller.signal, redirect: "error" });
    if (res.status === 401) {
      let code;
      try { code = (await res.json())?.error?.code; } catch (_) {}
      return { ...view, error: ctx.t(code === "invalid_jwt" ? "tokenFormat" : "unauthorized") };
    }
    if (res.status === 403) return { ...view, error: ctx.t("forbidden") };
    if (res.status === 429) return { ...view, error: ctx.t("rateLimited") };
    if (!res.ok) return { ...view, error: ctx.t("http", { status: res.status }) };
    let data;
    try { data = await res.json(); } catch (_) { return { ...view, error: ctx.t("invalid") }; }
    try { view.body = renderUsage(ctx, data, dateFmt); }
    catch (_) { return { ...view, body: [], error: ctx.t("invalid") }; }
    return view;
  } catch (_) {
    return { ...view, error: ctx.t(controller.signal.aborted ? "timeout" : "network") };
  } finally { clearTimeout(timer); }
}
