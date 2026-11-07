// Airport / Clash proxy subscription widget for Genkan.
// Subscription URLs are credentials: only a SHA-256 identity is persisted,
// and raw URLs, hostnames, tokens and upstream exceptions are never logged or shown.
export const messages = {
  en: {
    name: "Airport Subscription",
    description: "Real-time proxy subscription quota, daily usage bars, traffic trend and cycle countdown.",
    job: "Sample subscriptions",
    url: "Subscription URL",
    urlHelp: "Full HTTP(S) subscription link returning Subscription-Userinfo (Clash, Mihomo, V2Board, SSPanel). Stored as a secret.",
    label: "Display name",
    labelHelp: "Optional. Leave blank to auto-detect from the subscription title.",
    resetDay: "Monthly reset day",
    resetDayHelp: "Optional (1–31). Calculates days until next reset and daily available budget.",
    view: "Default chart",
    v7d: "7-day daily usage",
    v30d: "30-day daily usage",
    vTrend: "Usage trend",
    zone: "Time zone",
    zoneHelp: "IANA time zone for daily totals and dates, e.g. Asia/Shanghai.",
    tab7d: "7D",
    tab30d: "30D",
    tabTrend: "Trend",
    sync: "Sync",
    synced: "Subscription usage updated",
    remaining: "Remaining",
    totalUsed: "Used",
    overQuota: "Over quota",
    today: "Today",
    expiresIn: "Expires in",
    resetsIn: "Resets in",
    status: "Status",
    validity: "Validity",
    dayUnit: "d",
    todayWord: "Today",
    neverShort: "Forever",
    neverExpires: "Never expires",
    noExpiry: "No expiry date",
    expired: "Expired",
    unlimited: "Unlimited",
    usedOf: "{used} of {total}",
    overText: "Over by {over} ({pct})",
    upDown: "Up / Down",
    quotaLabel: "Allowance",
    nextReset: "Next reset",
    resetToday: "Today (day {day})",
    resetInDays: "{date} (in {n}d)",
    dailyBudget: "Daily budget",
    perDay: "{amount} / day",
    expiresLabel: "Expires",
    daysLeft: "{date} ({n}d left)",
    expiredOn: "{date} · Expired",
    chart7d: "Last 7 days · {total} used",
    chart30d: "Last 30 days · {total} used",
    chartTrend: "30-day usage trend (GB)",
    chartTrendInit: "Usage trend (GB) · building history",
    updatedAt: "Updated {time}",
    staleBanner: "Showing saved data from {time} · {reason}",
    setupHint: "Right-click this card and select Edit widget to paste your subscription URL.",
    errHost: "Update Genkan: this plugin requires private URL fetch and scheduled widget support.",
    errSetup: "Enter a valid HTTP(S) subscription URL in widget settings.",
    errZone: "Invalid time zone. Use an IANA name such as Asia/Shanghai.",
    errResetDay: "Monthly reset day must be between 1 and 31.",
    errAuth: "Subscription rejected (HTTP {status}). Check whether the link expired or was reset.",
    errNotFound: "Subscription endpoint returned HTTP 404. Check the subscription URL.",
    errRate: "Rate-limited by provider (HTTP 429). Will retry automatically.",
    errHttp: "Provider returned HTTP {status}.",
    errRedirect: "Cross-domain redirect refused. Enter the final subscription URL directly.",
    errHeader: "No valid Subscription-Userinfo header returned by this URL.",
    errNetwork: "Cannot reach subscription server or request timed out.",
    errStorage: "Plugin storage is full; could not save usage history.",
    errAction: "Unsupported action.",
  },
  zh: {
    name: "机场订阅",
    description: "实时展示机场订阅剩余流量、今日用量、每日柱状图、走势与重置倒计时。",
    job: "后台采样订阅用量",
    url: "订阅地址",
    urlHelp: "填写完整的 HTTP(S) 机场订阅链接（支持 Clash / Mihomo / V2Board / SSPanel 等），以私密凭据保存。",
    label: "显示名称",
    labelHelp: "选填，留空时自动读取订阅返回的名称。",
    resetDay: "每月重置日",
    resetDayHelp: "选填（1–31），用于计算距下次流量重置天数与日均可用流量。",
    view: "默认图表",
    v7d: "近 7 天每日用量",
    v30d: "近 30 天每日用量",
    vTrend: "累计流量走势",
    zone: "时区",
    zoneHelp: "用于统计每日用量与到期日期，例如 Asia/Shanghai。",
    tab7d: "7天",
    tab30d: "30天",
    tabTrend: "走势",
    sync: "刷新",
    synced: "订阅用量已更新",
    remaining: "剩余流量",
    totalUsed: "累计已用",
    overQuota: "超出配额",
    today: "今日用量",
    expiresIn: "到期剩余",
    resetsIn: "距重置",
    status: "当前状态",
    validity: "有效期",
    dayUnit: "天",
    todayWord: "今日",
    neverShort: "长期",
    neverExpires: "长期有效",
    noExpiry: "未限时",
    expired: "已到期",
    unlimited: "不限量",
    usedOf: "已用 {used} / {total}",
    overText: "超出 {over}（{pct}）",
    upDown: "上下行流量",
    quotaLabel: "套餐额度",
    nextReset: "下次重置",
    resetToday: "今日重置（每月 {day} 日）",
    resetInDays: "{date}（{n} 天后）",
    dailyBudget: "日均可用",
    perDay: "{amount} / 天",
    expiresLabel: "到期时间",
    daysLeft: "{date}（剩余 {n} 天）",
    expiredOn: "{date} · 已到期",
    chart7d: "近 7 天每日用量 · 共 {total}",
    chart30d: "近 30 天每日用量 · 共 {total}",
    chartTrend: "近 30 天累计流量走势（GB）",
    chartTrendInit: "累计流量走势（GB） · 持续记录中",
    updatedAt: "更新于 {time}",
    staleBanner: "当前显示 {time} 的缓存数据 · {reason}",
    setupHint: "右键此卡片选择「编辑小组件」，填入机场订阅链接即可查看实时流量与走势。",
    errHost: "请更新 Genkan：此插件需要私密地址网络授权与后台小组件访问支持。",
    errSetup: "请在小组件设置中填写有效的 HTTP(S) 订阅链接。",
    errZone: "时区名称无效，请使用 Asia/Shanghai 等 IANA 时区。",
    errResetDay: "每月重置日需在 1 到 31 之间。",
    errAuth: "订阅链接被拒绝（HTTP {status}），请检查订阅是否过期或已重置。",
    errNotFound: "订阅地址返回 HTTP 404，请检查链接是否正确。",
    errRate: "订阅接口触发限流（HTTP 429），稍后将自动重试。",
    errHttp: "订阅服务返回 HTTP {status}。",
    errRedirect: "订阅链接跳转到其他域名，请直接填写最终的订阅地址。",
    errHeader: "该链接未返回有效的 Subscription-Userinfo 流量信息头。",
    errNetwork: "无法连接订阅服务器或请求超时。",
    errStorage: "插件存储空间不足，无法保存历史记录。",
    errAction: "不支持的操作。",
  },
};

export const manifest = {
  id: "airport-subscription",
  name: t("name"),
  version: "1.0.0",
  description: t("description"),
  author: "jae-jae",
  homepage: "https://github.com/jae-jae/genkan-plugins",
  icon: "plane",
  permissions: { fetch: [] },
  widgets: [
    {
      id: "sub",
      name: t("name"),
      size: "m",
      refresh: 300,
      config: [
        {
          key: "url",
          type: "secret",
          label: t("url"),
          help: t("urlHelp"),
          allowFetch: !!(genkan.capabilities && genkan.capabilities.secretFetch),
        },
        { key: "name", type: "string", label: t("label"), help: t("labelHelp") },
        { key: "resetDay", type: "number", label: t("resetDay"), help: t("resetDayHelp"), min: 1, max: 31 },
        {
          key: "view",
          type: "select",
          label: t("view"),
          default: "7d",
          options: [
            { value: "7d", label: t("v7d") },
            { value: "30d", label: t("v30d") },
            { value: "trend", label: t("vTrend") },
          ],
        },
        { key: "zone", type: "string", label: t("zone"), help: t("zoneHelp"), default: "Asia/Shanghai" },
      ],
    },
  ],
  schedules: [{ id: "sample", name: t("job"), every: 60 }],
};

const GB = 1073741824;
const HOUR = 3600;
const DAY = 86400;
const WIDGET_TTL = 900;        // 15 min live reuse during page views
const RETRY_COOLDOWN = 60;     // 1 min cooldown before widget() retries a failed upstream
const SAMPLE_INTERVAL = 1800;  // 30 min background schedule cadence per subscription
const PREFIX = "sub:";
const MAX_INSTANCE_BYTES = 32 * 1024;
const TOTAL_BUDGET_BYTES = 224 * 1024;
const VIEWS = ["7d", "30d", "trend"];
const GENERIC_NAMES = new Set(["clash", "config", "sub", "subscribe", "subscription", "profile", "yaml", "default", "index"]);

const isSafeInt = (n) => Number.isSafeInteger(n) && n >= 0;
const fail = (kind, status) => ({ kind, status });
const keyOf = (id) => PREFIX + id;

// FIPS 180-4 SHA-256 for source identity (Web Crypto is unavailable in moejs).
function sha256(text) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const hi = Math.floor(bits / 0x100000000);
  const lo = bits >>> 0;
  bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < bytes.length; off += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] = (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
}

function parseConfig(rawCfg) {
  if (!genkan.capabilities || genkan.capabilities.secretFetch !== true || genkan.capabilities.scheduleWidgetFetch !== true) {
    throw fail("errHost");
  }
  const cfg = rawCfg || {};
  let parsed;
  try {
    parsed = new URL(String(cfg.url || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash || parsed.hostname.includes("*")) {
      throw 0;
    }
  } catch (_) {
    throw fail("errSetup");
  }
  const zone = String(cfg.zone || "Asia/Shanghai").trim() || "Asia/Shanghai";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(0);
  } catch (_) {
    throw fail("errZone");
  }
  let resetDay = null;
  if (cfg.resetDay !== undefined && cfg.resetDay !== null && cfg.resetDay !== "") {
    const n = Number(cfg.resetDay);
    if (!Number.isInteger(n) || n < 1 || n > 31) throw fail("errResetDay");
    resetDay = n;
  }
  const defaultView = VIEWS.includes(cfg.view) ? cfg.view : "7d";
  const label = cleanLine(cfg.name, 40);
  return {
    url: parsed.href,
    origin: parsed.origin,
    zone,
    resetDay,
    defaultView,
    label,
    src: sha256(parsed.href + "\n" + zone),
  };
}

function cleanLine(value, max) {
  if (typeof value !== "string") return "";
  const s = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(s).slice(0, max).join("");
}

function decodeBase64Utf8(b64) {
  const norm = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!norm || /[^A-Za-z0-9+/=]/.test(norm)) return "";
  const padded = norm.padEnd(Math.ceil(norm.length / 4) * 4, "=");
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

// Extracts a safe display name from Clash/HTTP headers, rejecting anything that echoes part of the secret URL.
function extractProfileTitle(meta, secretUrl) {
  const candidates = [];
  if (typeof meta.profileTitle === "string" && meta.profileTitle.trim()) {
    const raw = meta.profileTitle.trim();
    if (/^base64:/i.test(raw)) {
      try { candidates.push(decodeBase64Utf8(raw.slice(7))); } catch (_) {}
    } else {
      let text = raw;
      if (/%[0-9A-Fa-f]{2}/.test(raw)) {
        try { text = decodeURIComponent(raw); } catch (_) {}
      }
      candidates.push(text);
    }
  }
  if (typeof meta.disposition === "string" && meta.disposition.trim()) {
    const star = meta.disposition.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/);
    if (star) {
      try { candidates.push(decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""))); } catch (_) {}
    }
    const plain = meta.disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i);
    if (plain) candidates.push(plain[1] || plain[2] || "");
  }
  const lowerUrl = secretUrl.toLowerCase();
  for (const raw of candidates) {
    const stripped = String(raw || "").replace(/\.(?:ya?ml|json|txt|conf|ini)$/i, "");
    const name = cleanLine(stripped, 40);
    if (!name || name.length < 2) continue;
    if (/^https?:\/\//i.test(name) || /^[0-9a-f_-]{16,}$/i.test(name)) continue;
    if (GENERIC_NAMES.has(name.toLowerCase())) continue;
    if (lowerUrl.includes(name.toLowerCase())) continue;
    return name;
  }
  return "";
}

function parseUserinfo(raw) {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 4096) throw fail("errHeader");
  const seen = {};
  let resetHint = null;
  for (const part of raw.split(/[;,]/)) {
    const eq = part.indexOf("=");
    if (eq < 0) {
      const bare = part.trim().toLowerCase();
      if (["upload", "download", "total", "expire"].includes(bare)) throw fail("errHeader");
      continue;
    }
    const key = part.slice(0, eq).trim().toLowerCase();
    const val = part.slice(eq + 1).trim();
    if (key === "reset_day" && /^\d+$/.test(val)) {
      const d = Number(val);
      if (d >= 1 && d <= 31) resetHint = d;
      continue;
    }
    if (!["upload", "download", "total", "expire"].includes(key)) continue;
    if (Object.prototype.hasOwnProperty.call(seen, key)) throw fail("errHeader");
    if ((key === "total" || key === "expire") && (val === "" || val.toLowerCase() === "null" || val.toLowerCase() === "none")) {
      seen[key] = null;
      continue;
    }
    if (!/^\d+(?:\.\d+)?$/.test(val)) throw fail("errHeader");
    const num = Math.floor(Number(val));
    if (!isSafeInt(num)) throw fail("errHeader");
    seen[key] = num;
  }
  const u = seen.upload;
  const d = seen.download;
  if (!isSafeInt(u) || !isSafeInt(d) || !isSafeInt(u + d)) throw fail("errHeader");
  let expire = seen.expire ?? null;
  if (expire !== null) {
    if (expire >= 1e11 && expire <= 8640000000000000) expire = Math.floor(expire / 1000);
    if (expire > 253402300799) throw fail("errHeader");
  }
  const total = seen.total ?? null;
  return { u, d, t: total, e: expire, r: resetHint };
}

async function fetchSub(cfg) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  async function requestOnce(method) {
    let cur = cfg.url;
    for (let hop = 0; hop <= 3; hop++) {
      let res;
      try {
        res = await fetch(cur, {
          method,
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "clash.meta/1.18.0" },
        });
        if ((res.status >= 300 && res.status < 400) || res.type === "opaqueredirect") {
          const loc = res.headers && res.headers.get("location");
          if (!loc || hop === 3) throw fail("errRedirect");
          let next;
          try { next = new URL(loc, cur); } catch (_) { throw fail("errRedirect"); }
          if (next.origin !== cfg.origin || next.username || next.password || next.hash) throw fail("errRedirect");
          cur = next.href;
          continue;
        }
        return {
          status: res.status,
          ok: res.ok,
          userinfo: res.headers ? res.headers.get("subscription-userinfo") : null,
          profileTitle: res.headers ? res.headers.get("profile-title") : null,
          disposition: res.headers ? res.headers.get("content-disposition") : null,
          resetHeader: res.headers ? res.headers.get("profile-reset-day") : null,
        };
      } finally {
        if (res && res.body && typeof res.body.cancel === "function") {
          try { await res.body.cancel(); } catch (_) {}
        }
      }
    }
    throw fail("errRedirect");
  }

  function classifyHttp(status) {
    if (status === 401 || status === 403) return fail("errAuth", status);
    if (status === 404) return fail("errNotFound", 404);
    if (status === 429) return fail("errRate", 429);
    return fail("errHttp", status);
  }

  function buildReading(meta) {
    const parsed = parseUserinfo(meta.userinfo);
    let resetHint = parsed.r;
    if (!resetHint && typeof meta.resetHeader === "string" && /^\d+$/.test(meta.resetHeader.trim())) {
      const n = Number(meta.resetHeader.trim());
      if (n >= 1 && n <= 31) resetHint = n;
    }
    return {
      u: parsed.u,
      d: parsed.d,
      t: parsed.t,
      e: parsed.e,
      n: extractProfileTitle(meta, cfg.url),
      ...(resetHint ? { r: resetHint } : {}),
    };
  }

  try {
    const head = await requestOnce("HEAD");
    if (head.ok && head.userinfo) {
      try { return buildReading(head); } catch (_) {}
    }
    if (head.status === 401 || head.status === 429 || (head.status >= 500 && head.status !== 501)) {
      throw classifyHttp(head.status);
    }
    const get = await requestOnce("GET");
    if (!get.ok) throw classifyHttp(get.status);
    return buildReading(get);
  } catch (e) {
    if (e && typeof e.kind === "string") throw e;
    throw fail("errNetwork");
  } finally {
    clearTimeout(timer);
  }
}

function makeDayFormatter(zone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (sec) => {
    const parts = fmt.formatToParts(new Date(sec * 1000));
    let y = "", m = "", d = "";
    for (const p of parts) {
      if (p.type === "year") y = p.value;
      else if (p.type === "month") m = p.value;
      else if (p.type === "day") d = p.value;
    }
    return `${y}-${m}-${d}`;
  };
}

function blankState(src) {
  return { v: 1, src, at: 0, ok: 0, view: "", err: null, snap: null, pts: [], days: [] };
}

function validSnap(s) {
  return !!(
    s &&
    typeof s === "object" &&
    isSafeInt(s.u) &&
    isSafeInt(s.d) &&
    isSafeInt(s.u + s.d) &&
    (s.t === null || isSafeInt(s.t)) &&
    (s.e === null || (isSafeInt(s.e) && s.e <= 253402300799)) &&
    typeof s.n === "string" &&
    s.n.length <= 40 &&
    (s.r === undefined || (Number.isInteger(s.r) && s.r >= 1 && s.r <= 31))
  );
}

function validState(v, src) {
  if (!v || typeof v !== "object" || v.v !== 1 || v.src !== src) return false;
  if (!isSafeInt(v.at) || !isSafeInt(v.ok)) return false;
  if (typeof v.view !== "string" || (v.view !== "" && !VIEWS.includes(v.view))) return false;
  if (v.snap !== null && !validSnap(v.snap)) return false;
  if (!Array.isArray(v.pts) || v.pts.length > 240) return false;
  if (!v.pts.every((p) => Array.isArray(p) && p.length === 2 && isSafeInt(p[0]) && isSafeInt(p[1]))) return false;
  if (!Array.isArray(v.days) || v.days.length > 35) return false;
  if (!v.days.every((d) => Array.isArray(d) && d.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(d[0]) && isSafeInt(d[1]) && isSafeInt(d[2]))) return false;
  if (v.err !== null) {
    if (!v.err || typeof v.err !== "object" || typeof v.err.k !== "string" || !Object.prototype.hasOwnProperty.call(messages.en, v.err.k)) return false;
    if (v.err.s !== undefined && (!isSafeInt(v.err.s) || v.err.s < 100 || v.err.s > 599)) return false;
  }
  return true;
}

function activeInstances() {
  return genkan.widgets
    .list()
    .filter((w) => w.widget === "sub")
    .sort((a, b) => a.id.localeCompare(b.id));
}

function isSavedInstance(id) {
  return activeInstances().some((w) => w.id === id);
}

function loadState(ctx, id, src, saved) {
  const raw = saved ? genkan.storage.get(keyOf(id)) : ctx.instance && ctx.instance.storage ? ctx.instance.storage.get("state") : undefined;
  return validState(raw, src) ? raw : blankState(src);
}

function compactState(state, nowSec) {
  const cutoff30 = nowSec - 30 * DAY;
  const cutoff7 = nowSec - 7 * DAY;
  state.days = state.days
    .filter((d) => d[2] >= cutoff30 - DAY)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-32);

  const sorted = state.pts.filter((p) => p[0] >= cutoff30).sort((a, b) => a[0] - b[0]);
  const compacted = [];
  let lastBucket = null;
  for (const pt of sorted) {
    const bucket = pt[0] < cutoff7 ? Math.floor(pt[0] / (6 * HOUR)) : null;
    if (bucket !== null && bucket === lastBucket) {
      compacted[compacted.length - 1] = pt;
    } else if (compacted.length && compacted[compacted.length - 1][0] === pt[0]) {
      compacted[compacted.length - 1] = pt;
    } else {
      compacted.push(pt);
    }
    lastBucket = bucket;
  }
  state.pts = compacted.slice(-200);
}

function computeInstanceBudget(count) {
  const overhead = genkan.storage
    .keys()
    .filter((k) => !k.startsWith(PREFIX))
    .reduce((sum, k) => sum + new TextEncoder().encode(k + JSON.stringify(genkan.storage.get(k))).length, 0);
  return Math.min(MAX_INSTANCE_BYTES, Math.max(0, Math.floor((TOTAL_BUDGET_BYTES - overhead) / Math.max(1, count))));
}

function saveState(ctx, id, state, nowSec, saved, budget) {
  compactState(state, nowSec);
  if (!saved) {
    if (ctx.instance && ctx.instance.storage) {
      try { ctx.instance.storage.set("state", state); } catch (_) {}
    }
    return;
  }
  const cap = budget === undefined ? computeInstanceBudget(activeInstances().length) : budget;
  const key = keyOf(id);
  const enc = new TextEncoder();
  const size = () => enc.encode(key + JSON.stringify(state)).length;
  while (size() > cap && state.pts.length > 2) state.pts.shift();
  while (size() > cap && state.days.length > 2) state.days.shift();
  if (size() > cap && state.pts.length > 0) state.pts = [];
  if (size() > cap && state.days.length > 1) state.days = state.days.slice(-1);
  if (size() > cap && state.days.length > 0) state.days = [];
  if (size() > cap) throw fail("errStorage");
  try {
    genkan.storage.set(key, state);
  } catch (_) {
    throw fail("errStorage");
  }
}

function addDayBytes(state, day, bytes, sec) {
  let entry = state.days.find((d) => d[0] === day);
  if (!entry) {
    entry = [day, 0, sec];
    state.days.push(entry);
  }
  if (bytes > 0 && isSafeInt(entry[1] + bytes)) entry[1] += bytes;
  if (sec > entry[2]) entry[2] = sec;
}

// Updates daily totals (proportionally splitting intervals across local midnight) and trend points.
function recordReading(state, reading, nowSec, zone) {
  const dayOf = makeDayFormatter(zone);
  const today = dayOf(nowSec);
  const prev = state.snap;
  const prevSec = state.ok;

  if (prev && nowSec > prevSec && reading.u >= prev.u && reading.d >= prev.d) {
    const delta = reading.u - prev.u + (reading.d - prev.d);
    const totalSpan = nowSec - prevSec;
    if (delta > 0) {
      const startDay = dayOf(prevSec);
      if (startDay === today) {
        addDayBytes(state, today, delta, nowSec);
      } else if (totalSpan <= 48 * HOUR) {
        let cur = prevSec;
        let remDelta = delta;
        let remSpan = totalSpan;
        for (let guard = 0; guard < 4 && cur < nowSec && remDelta > 0; guard++) {
          const curDay = dayOf(cur);
          if (curDay === today) {
            addDayBytes(state, today, remDelta, nowSec);
            remDelta = 0;
            break;
          }
          let lo = cur + 1;
          let hi = nowSec;
          while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (dayOf(mid) === curDay) lo = mid + 1;
            else hi = mid;
          }
          const seg = lo - cur;
          const part = Math.min(remDelta, Math.max(0, Math.round((remDelta * seg) / Math.max(1, remSpan))));
          addDayBytes(state, curDay, part, lo - 1);
          remDelta -= part;
          remSpan -= seg;
          cur = lo;
        }
        if (remDelta > 0) addDayBytes(state, today, remDelta, nowSec);
      }
    }
  }
  addDayBytes(state, today, 0, nowSec);

  const used = reading.u + reading.d;
  if (state.pts.length && nowSec >= state.pts[state.pts.length - 1][0] && nowSec - state.pts[state.pts.length - 1][0] < 600 && used >= state.pts[state.pts.length - 1][1]) {
    state.pts[state.pts.length - 1] = [nowSec, used];
  } else {
    state.pts.push([nowSec, used]);
  }
  if (!reading.n && prev && prev.n) reading.n = prev.n;
  if (!reading.r && prev && prev.r) reading.r = prev.r;
  state.snap = reading;
  state.ok = nowSec;
  state.at = nowSec;
  state.err = null;
}

function splitBytes(bytes, locale, zeroUnit = "B") {
  if (!Number.isFinite(bytes) || bytes <= 0) return { value: "0", unit: zeroUnit };
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const idx = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(1024))));
  const val = bytes / 1024 ** idx;
  const maxFrac = idx <= 1 ? 0 : val < 10 ? 2 : 1;
  return {
    value: new Intl.NumberFormat(locale, { maximumFractionDigits: maxFrac }).format(val),
    unit: units[idx],
  };
}

function fmtBytes(bytes, locale, zeroUnit = "B") {
  const s = splitBytes(bytes, locale, zeroUnit);
  return `${s.value} ${s.unit}`;
}

function calendarWindow(nowSec, zone, count) {
  const today = makeDayFormatter(zone)(nowSec);
  const [y, m, d] = today.split("-").map(Number);
  const list = [];
  for (let i = count - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    list.push(`${yy}-${mm}-${dd}`);
  }
  return list;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function computeResetInfo(nowSec, zone, resetDay) {
  if (!resetDay) return null;
  const today = makeDayFormatter(zone)(nowSec);
  const [y, m, d] = today.split("-").map(Number);
  const effThis = Math.min(resetDay, daysInMonth(y, m));
  if (d === effThis) {
    return { days: 0, date: `${m.toString().padStart(2, "0")}-${effThis.toString().padStart(2, "0")}`, day: resetDay };
  }
  let ty = y, tm = m;
  if (d > effThis) {
    tm += 1;
    if (tm > 12) { tm = 1; ty += 1; }
  }
  const effTarget = Math.min(resetDay, daysInMonth(ty, tm));
  const diffDays = Math.round((Date.UTC(ty, tm - 1, effTarget) - Date.UTC(y, m - 1, d)) / 86400000);
  return {
    days: Math.max(1, diffDays),
    date: `${String(tm).padStart(2, "0")}-${String(effTarget).padStart(2, "0")}`,
    day: resetDay,
  };
}

function errMessage(ctx, err) {
  if (!err) return "";
  return ctx.t(err.k || err.kind || "errNetwork", { status: err.s ?? err.status ?? "" });
}

function renderCard(ctx, cfg, state, nowSec) {
  const { t, locale } = ctx;
  const s = state.snap;
  const cardTitle = cfg.label || (s && s.n) || t("name");
  const view = { title: cardTitle, icon: "plane", body: [] };

  if (!s) {
    return { ...view, error: errMessage(ctx, state.err) || t("errNetwork") };
  }

  const used = s.u + s.d;
  const dayMap = new Map(state.days.map((d) => [d[0], d[1]]));
  const todayStr = makeDayFormatter(zoneOrDefault(cfg.zone))(nowSec);
  const todayBytes = dayMap.get(todayStr) || 0;

  const resetDay = cfg.resetDay || s.r || null;
  const resetInfo = computeResetInfo(nowSec, cfg.zone, resetDay);
  const expired = s.e !== null && s.e > 0 && s.e <= nowSec;
  const expireDays = s.e !== null && s.e > nowSec ? Math.max(1, Math.ceil((s.e - nowSec) / DAY)) : null;
  const stale = Boolean(state.err) || nowSec - state.ok > 3 * HOUR;

  // Determine card visual tone for immediate glanceability
  const ratio = s.t !== null && s.t > 0 ? used / s.t : 0;
  if (expired || (s.t !== null && s.t > 0 && used >= s.t)) {
    view.tone = "pink";
  } else if (stale || ratio >= 0.85 || (expireDays !== null && expireDays <= 7)) {
    view.tone = "yellow";
  }

  const dateFmt = new Intl.DateTimeFormat(locale, {
    timeZone: cfg.zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    timeZone: cfg.zone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  if (stale) {
    const reason = state.err ? errMessage(ctx, state.err) : t("errNetwork");
    view.body.push({
      type: "text",
      text: t("staleBanner", { time: timeFmt.format(new Date(state.ok * 1000)), reason }),
      size: "s",
    });
  }

  // 1. Headline 3-column stats
  let primaryStat;
  if (s.t !== null && s.t > 0) {
    if (used > s.t) {
      const over = splitBytes(used - s.t, locale);
      primaryStat = { label: t("overQuota"), value: over.value, unit: over.unit, icon: "triangle-alert" };
    } else {
      const rem = splitBytes(s.t - used, locale);
      primaryStat = { label: t("remaining"), value: rem.value, unit: rem.unit, icon: "database" };
    }
  } else {
    const tot = splitBytes(used, locale);
    primaryStat = { label: t("totalUsed"), value: tot.value, unit: tot.unit, icon: "database" };
  }

  const todaySplit = splitBytes(todayBytes, locale, "MB");
  const todayStat = { label: t("today"), value: todaySplit.value, unit: todaySplit.unit, icon: "activity" };

  let cycleStat;
  if (expired) {
    cycleStat = { label: t("status"), value: t("expired"), icon: "circle-alert" };
  } else if (resetInfo && (expireDays === null || resetInfo.days <= expireDays)) {
    cycleStat = resetInfo.days === 0
      ? { label: t("resetsIn"), value: t("todayWord"), icon: "refresh-cw" }
      : { label: t("resetsIn"), value: String(resetInfo.days), unit: t("dayUnit"), icon: "refresh-cw" };
  } else if (expireDays !== null) {
    cycleStat = { label: t("expiresIn"), value: String(expireDays), unit: t("dayUnit"), icon: "calendar" };
  } else {
    cycleStat = { label: t("validity"), value: t("neverShort"), icon: "shield" };
  }

  view.body.push({ type: "stats", items: [primaryStat, todayStat, cycleStat] });

  // 2. Quota progress bar
  if (s.t !== null && s.t > 0) {
    const pctStr = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(used / s.t);
    view.body.push({
      type: "progress",
      label: t("usedOf", { used: fmtBytes(used, locale), total: fmtBytes(s.t, locale) }),
      value: Math.max(0, Math.min(1, used / s.t)),
      text: used > s.t ? t("overText", { over: fmtBytes(used - s.t, locale), pct: pctStr }) : pctStr,
    });
  }

  // 3. Key-value details
  const kv = [
    { k: t("upDown"), v: `↑ ${fmtBytes(s.u, locale)} · ↓ ${fmtBytes(s.d, locale)}` },
  ];
  if (s.t === 0) {
    kv.push({ k: t("quotaLabel"), v: t("unlimited") });
  }
  if (resetInfo && !expired) {
    kv.push({
      k: t("nextReset"),
      v: resetInfo.days === 0
        ? t("resetToday", { day: resetInfo.day })
        : t("resetInDays", { date: resetInfo.date, n: resetInfo.days }),
    });
  }

  // Daily available budget when remaining quota & cycle window are finite
  if (!expired && s.t !== null && s.t > used) {
    let budgetDays = null;
    if (resetInfo) {
      budgetDays = Math.max(1, resetInfo.days || 1);
      if (expireDays !== null) budgetDays = Math.min(budgetDays, expireDays);
    } else if (expireDays !== null && expireDays <= 400) {
      budgetDays = expireDays;
    }
    if (budgetDays !== null && budgetDays >= 1) {
      kv.push({
        k: t("dailyBudget"),
        v: t("perDay", { amount: fmtBytes(Math.floor((s.t - used) / budgetDays), locale) }),
      });
    }
  }

  if (s.e !== null && s.e > 0) {
    const dStr = dateFmt.format(new Date(s.e * 1000));
    kv.push({
      k: t("expiresLabel"),
      v: expired ? t("expiredOn", { date: dStr }) : t("daysLeft", { date: dStr, n: expireDays }),
    });
  } else if (s.e === 0) {
    kv.push({ k: t("expiresLabel"), v: t("neverExpires") });
  } else if (!resetInfo) {
    kv.push({ k: t("expiresLabel"), v: t("noExpiry") });
  }

  view.body.push({ type: "kv", items: kv });

  // 4. Chart (7D daily bars, 30D daily bars, or 30D cumulative line trend)
  const activeView = VIEWS.includes(state.view) ? state.view : cfg.defaultView;
  if (activeView === "trend") {
    const pts = state.pts.length
      ? state.pts.map((p) => [p[0] * 1000, Math.round((p[1] / GB) * 1000) / 1000])
      : [[state.ok * 1000, Math.round((used / GB) * 1000) / 1000]];
    const color = s.t !== null && s.t > 0 && used >= s.t ? "red" : ratio >= 0.85 ? "orange" : "blue";
    view.body.push(
      { type: "text", text: pts.length >= 2 ? t("chartTrend") : t("chartTrendInit"), size: "s", muted: true },
      { type: "chart", kind: "line", points: pts.slice(-240), format: "decimal", color },
    );
  } else {
    const count = activeView === "30d" ? 30 : 7;
    const dates = calendarWindow(nowSec, cfg.zone, count);
    let windowTotal = 0;
    const values = dates.map((day) => {
      const b = dayMap.get(day) || 0;
      windowTotal += b;
      if (b <= 0) return 0;
      return Math.max(0.01, Math.round((b / GB) * 100) / 100);
    });
    const labels = dates.map((d) => d.slice(5));
    view.body.push(
      {
        type: "text",
        text: t(count === 30 ? "chart30d" : "chart7d", { total: fmtBytes(windowTotal, locale, "MB") }),
        size: "s",
        muted: true,
      },
      { type: "chart", kind: "bar", values, labels },
    );
  }

  // 5. Interactive admin toolbar (view switcher + one-click live sync)
  view.body.push({
    type: "row",
    children: [
      { type: "button", label: (activeView === "7d" ? "✓ " : "") + t("tab7d"), action: "view", params: { view: "7d" } },
      { type: "button", label: (activeView === "30d" ? "✓ " : "") + t("tab30d"), action: "view", params: { view: "30d" } },
      { type: "button", label: (activeView === "trend" ? "✓ " : "") + t("tabTrend"), action: "view", params: { view: "trend" } },
      { type: "button", label: t("sync"), icon: "refresh-cw", action: "sync" },
    ],
  });

  view.body.push({
    type: "text",
    text: t("updatedAt", { time: timeFmt.format(new Date(state.ok * 1000)) }),
    size: "s",
    muted: true,
  });

  return view;
}

function zoneOrDefault(zone) {
  return zone || "Asia/Shanghai";
}

async function refreshInstance(ctx, id, cfg, state, nowSec, saved, budget) {
  let reading;
  try {
    reading = await fetchSub(cfg);
  } catch (e) {
    state.at = nowSec;
    const kind = e && typeof e.kind === "string" ? e.kind : "errNetwork";
    state.err = { k: kind, ...(e && e.status ? { s: e.status } : {}) };
    try { saveState(ctx, id, state, nowSec, saved, budget); } catch (_) {}
    return { ok: false, err: state.err };
  }
  recordReading(state, reading, nowSec, cfg.zone);
  try {
    saveState(ctx, id, state, nowSec, saved, budget);
    return { ok: true, saved: true };
  } catch (_) {
    return { ok: true, saved: false };
  }
}

export async function widget(ctx) {
  const rawCfg = (ctx.instance && ctx.instance.config) || {};
  const fallbackTitle = cleanLine(rawCfg.name, 40) || ctx.t("name");
  if (!String(rawCfg.url || "").trim()) {
    if (!genkan.capabilities || genkan.capabilities.secretFetch !== true || genkan.capabilities.scheduleWidgetFetch !== true) {
      return { title: fallbackTitle, icon: "plane", body: [], error: ctx.t("errHost") };
    }
    return {
      title: fallbackTitle,
      icon: "plane",
      body: [{ type: "text", text: ctx.t("setupHint"), size: "s", muted: true }],
    };
  }
  let cfg;
  try {
    cfg = parseConfig(rawCfg);
  } catch (e) {
    return { title: fallbackTitle, icon: "plane", body: [], error: errMessage(ctx, e) };
  }

  const id = (ctx.instance && ctx.instance.id) || "test";
  const saved = isSavedInstance(id);
  const nowSec = Math.floor(ctx.now / 1000);
  const state = loadState(ctx, id, cfg.src, saved);

  const needsInitial = !state.snap;
  const staleForLive = state.snap && !state.err && nowSec - state.ok >= WIDGET_TTL;
  const retryDue = state.err && nowSec - state.at >= (state.snap ? RETRY_COOLDOWN : 15);

  if (needsInitial || staleForLive || retryDue) {
    await refreshInstance(ctx, id, cfg, state, nowSec, saved);
  }

  return renderCard(ctx, cfg, state, nowSec);
}

export async function action(ctx) {
  const rawCfg = (ctx.instance && ctx.instance.config) || {};
  let cfg;
  try {
    cfg = parseConfig(rawCfg);
  } catch (e) {
    throw new Error(errMessage(ctx, e));
  }

  const id = (ctx.instance && ctx.instance.id) || "test";
  const saved = isSavedInstance(id);
  const nowSec = Math.floor(ctx.now / 1000);
  const state = loadState(ctx, id, cfg.src, saved);
  const params = ctx.params && typeof ctx.params === "object" ? ctx.params : {};

  if (ctx.action === "view") {
    if (!VIEWS.includes(params.view)) throw new Error(ctx.t("errAction"));
    state.view = params.view === cfg.defaultView ? "" : params.view;
    let toast;
    try {
      saveState(ctx, id, state, nowSec, saved);
    } catch (_) {
      toast = ctx.t("errStorage");
    }
    if (!state.snap) {
      await refreshInstance(ctx, id, cfg, state, nowSec, saved);
    }
    return { view: renderCard(ctx, cfg, state, nowSec), ...(toast ? { toast } : {}) };
  }

  if (ctx.action === "sync") {
    const res = await refreshInstance(ctx, id, cfg, state, nowSec, saved);
    if (!res.ok) throw new Error(errMessage(ctx, res.err));
    return { view: renderCard(ctx, cfg, state, nowSec), toast: res.saved === false ? ctx.t("errStorage") : ctx.t("synced") };
  }

  throw new Error(ctx.t("errAction"));
}

export async function schedule(ctx) {
  const all = activeInstances();
  const activeIds = new Set(all.map((w) => w.id));
  for (const key of genkan.storage.keys()) {
    if (key.startsWith(PREFIX) && !activeIds.has(key.slice(PREFIX.length))) {
      genkan.storage.delete(key);
    }
  }

  const nowSec = Math.floor(ctx.now / 1000);
  const deadline = Date.now() + 45000;
  const budget = computeInstanceBudget(all.length);
  const queue = [];
  let sampled = 0;
  let failed = 0;
  let cursor = 0;

  for (const inst of all) {
    try {
      const existing = genkan.storage.get(keyOf(inst.id));
      if (existing && typeof existing.src === "string") {
        saveState(ctx, inst.id, loadState(ctx, inst.id, existing.src, true), nowSec, true, budget);
      }
      if (!String((inst.config && inst.config.url) || "").trim()) continue;
      const cfg = parseConfig(inst.config || {});
      const prior = loadState(ctx, inst.id, cfg.src, true);
      if (!prior.at || nowSec - prior.at >= SAMPLE_INTERVAL) {
        queue.push({ inst, cfg, at: prior.at });
      }
    } catch (_) {
      failed++;
    }
  }

  queue.sort((a, b) => a.at - b.at || a.inst.id.localeCompare(b.inst.id));

  async function worker() {
    while (cursor < queue.length && Date.now() + 8500 < deadline) {
      const { inst, cfg } = queue[cursor++];
      let reading, error;
      try {
        reading = await fetchSub(cfg);
      } catch (e) {
        error = e;
      }
      const latest = activeInstances().find((w) => w.id === inst.id);
      try {
        if (!latest || parseConfig(latest.config || {}).src !== cfg.src) continue;
      } catch (_) {
        continue;
      }
      const state = loadState(ctx, inst.id, cfg.src, true);
      if (state.at >= nowSec) continue;
      if (error) {
        state.at = nowSec;
        state.err = { k: error.kind || "errNetwork", ...(error.status ? { s: error.status } : {}) };
      } else {
        recordReading(state, reading, nowSec, cfg.zone);
      }
      try {
        saveState(ctx, inst.id, state, nowSec, true, budget);
        if (error) failed++;
        else sampled++;
      } catch (_) {
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, () => worker()));
  return { sampled, failed, pending: queue.length - cursor };
}
