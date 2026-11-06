// Subscription URLs are credentials. Only their SHA-256 identity is persisted;
// requests and raw exceptions must never be logged or returned to the browser.
export const messages = {
    en: {
        name: "Subscription Usage", description: "Hourly subscription usage snapshots and observed daily changes.",
        label: "Display name", url: "Subscription URL", urlHelp: "Full private subscription URL. Stored as a secret.",
        range: "Chart range", r7: "7 days", r30: "30 days", zone: "Time zone", zoneHelp: "Daily totals use this zone. Changing the URL or zone starts a new history.",
        host: "Update Genkan: this plugin requires private URL fetch and scheduled widget access.", setup: "Enter a valid HTTP(S) subscription URL.",
        timezone: "Enter a valid IANA time zone.", collecting: "Waiting for a sample. Subscriptions are sampled hourly; busy queues may take longer.",
        network: "Connection failure or request timeout.", header: "The service did not provide valid upload and download counters.", http: "The service returned HTTP {status}.", redirect: "Redirect refused. Configure the final HTTP(S) subscription endpoint instead.", storage: "Could not save the sample within the storage budget.",
        used: "Used", quota: "Allowance", remaining: "Remaining", unlimited: "Unlimited", unknown: "Unknown", expires: "Expires", expired: "Expired", upload: "Upload", download: "Download", over: "Over allowance", updated: "Last success: {time}",
        stale: "Saved data · refresh failed or overdue. {reason}", cumulative: "Reported cumulative usage (GiB)", daily: "Observed daily increase (GiB)",
        dailyNote: "Partial observations, not billing totals. Gaps, resets and intervals crossing midnight are excluded; dates with no observed interval are omitted.",
        coverage: "Latest observed day: {date} · {hours} h covered · {count} intervals",
        segments: "Separate charts stop at resets or gaps. Only the latest three segments are shown; older detail is summarized daily.",
        noIntervals: "No comparable within-day samples yet.", reset: "Counter reset or observation gap detected. A new baseline was started.",
        period: "{days}-day window · {zone}",
    },
    zh: {
        name: "机场订阅用量", description: "每小时记录订阅用量，展示累计趋势和每日可观测增量。",
        label: "显示名称", url: "订阅地址", urlHelp: "填写完整私密订阅地址，以 secret 保存。",
        range: "图表范围", r7: "7 天", r30: "30 天", zone: "时区", zoneHelp: "按此时区统计日期。修改订阅地址或时区会重新建立历史。",
        host: "请更新 Genkan：此插件需要私密地址网络授权及定时任务访问小组件的能力。", setup: "请填写有效的 HTTP(S) 订阅地址。",
        timezone: "请填写有效的 IANA 时区。", collecting: "等待采样。每个订阅每小时采样，队列繁忙时可能延后。",
        network: "连接失败或请求超时。", header: "服务未返回有效的上传和下载计数。", http: "服务返回 HTTP {status}。", redirect: "已拒绝重定向，请配置最终的 HTTP(S) 订阅入口。", storage: "无法在存储预算内保存此次采样。",
        used: "已用", quota: "总配额", remaining: "剩余", unlimited: "不限量", unknown: "未知", expires: "到期时间", expired: "已到期", upload: "上传", download: "下载", over: "超出配额", updated: "最后成功：{time}",
        stale: "旧数据 · 刷新失败或已超时。{reason}", cumulative: "服务报告累计量（GiB）", daily: "每日可观测增量（GiB）",
        dailyNote: "仅部分观测，非账单用量。缺口、重置及跨午夜区间不计入；没有可观测区间的日期不画柱。",
        coverage: "最近观测日：{date} · 覆盖 {hours} 小时 · {count} 个区间",
        segments: "重置或缺口前后分图，仅展示最近 3 段；较早的小时细节压缩为每日快照。",
        noIntervals: "尚无同一天内可比较的连续样本。", reset: "发现计数重置或观测缺口，已建立新基线。",
        period: "近 {days} 天 · {zone}",
    },
};
export const manifest = {
    id: "subscription-usage", name: t("name"), version: "1.2.0", description: t("description"), icon: "gauge",
    permissions: { fetch: [] },
    widgets: [{ id: "usage", name: t("name"), size: "m", refresh: 300, config: [
                { key: "name", type: "string", label: t("label") },
                { key: "url", type: "secret", label: t("url"), help: t("urlHelp"), required: true, allowFetch: !!(genkan.capabilities && genkan.capabilities.secretFetch) },
                { key: "range", type: "select", label: t("range"), default: "7", options: [{ value: "7", label: t("r7") }, { value: "30", label: t("r30") }] },
                { key: "zone", type: "string", label: t("zone"), help: t("zoneHelp"), default: "Asia/Shanghai" },
            ] }],
    schedules: [{ id: "sample", every: 60 }],
};
const HOUR = 3600, DAY = 86400, GIB = 1073741824, PREFIX = "usage:", MAX_BYTES = 40 * 1024, TOTAL_BYTES = 224 * 1024;
const safe = n => Number.isSafeInteger(n) && n >= 0;
const failure = (kind, status) => ({ kind, status });
const keyOf = id => PREFIX + id;
// FIPS 180-4 SHA-256, used only for source identity (no Web Crypto in moejs).
function fingerprint(text) {
    const k = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes = Array.from(new TextEncoder().encode(text)), bits = bytes.length * 8;
    bytes.push(128);
    while (bytes.length % 64 !== 56)
        bytes.push(0);
    bytes.push(0, 0, 0, 0, (bits >>> 24) & 255, (bits >>> 16) & 255, (bits >>> 8) & 255, bits & 255);
    const ro = (x, n) => (x >>> n) | (x << (32 - n));
    for (let offset = 0; offset < bytes.length; offset += 64) {
        const w = [];
        for (let i = 0; i < 16; i++) {
            const j = offset + i * 4;
            w[i] = (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3];
        }
        for (let i = 16; i < 64; i++) {
            const a = w[i - 15], b = w[i - 2];
            w[i] = (w[i - 16] + (ro(a, 7) ^ ro(a, 18) ^ (a >>> 3)) + w[i - 7] + (ro(b, 17) ^ ro(b, 19) ^ (b >>> 10))) | 0;
        }
        let [a, b, c, d, e, f, g, hh] = h;
        for (let i = 0; i < 64; i++) {
            const x = (hh + (ro(e, 6) ^ ro(e, 11) ^ ro(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + w[i]) | 0;
            const y = ((ro(a, 2) ^ ro(a, 13) ^ ro(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            hh = g;
            g = f;
            f = e;
            e = (d + x) | 0;
            d = c;
            c = b;
            b = a;
            a = (x + y) | 0;
        }
        [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
    }
    return h.map(v => (v >>> 0).toString(16).padStart(8, "0")).join("");
}
function config(plugin, cfg) {
    if (!genkan.capabilities || genkan.capabilities.secretFetch !== true || genkan.capabilities.scheduleWidgetFetch !== true)
        throw failure("host");
    let url;
    try {
        url = new URL(cfg.url);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.hash || url.hostname.includes("*"))
            throw 0;
    }
    catch (_) {
        throw failure("setup");
    }
    const zone = cfg.zone || "Asia/Shanghai";
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(0);
    }
    catch (_) {
        throw failure("timezone");
    }
    return { url: url.href, zone, source: fingerprint(url.href + "\n" + zone) };
}
function parseHeader(raw) {
    if (typeof raw !== "string" || raw.length > 4096)
        throw failure("header");
    const values = {};
    for (const part of raw.split(";")) {
        const at = part.indexOf("=");
        const key = (at < 0 ? part : part.slice(0, at)).trim().toLowerCase();
        if (!["upload", "download", "total", "expire"].includes(key))
            continue;
        const value = at < 0 ? "" : part.slice(at + 1).trim();
        if (Object.prototype.hasOwnProperty.call(values, key) || !/^\d+$/.test(value) || !safe(Number(value)))
            throw failure("header");
        values[key] = Number(value);
    }
    const { upload: u, download: d } = values;
    if (!safe(u) || !safe(d) || !safe(u + d))
        throw failure("header");
    const expire = values.expire ?? null;
    if (expire !== null && expire > 8640000000000)
        throw failure("header");
    return { u, d, total: values.total ?? null, expire };
}
async function fetchUsage(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        for (const method of ["HEAD", "GET"]) {
            let res;
            try {
                res = await fetch(url, { method, redirect: "manual", signal: controller.signal, headers: { "User-Agent": "clash.meta" } });
                if (res.status >= 300 && res.status < 400 || res.type === "opaqueredirect")
                    throw failure("redirect");
                if (method === "HEAD" && (res.status === 405 || res.status === 501))
                    continue;
                if (!res.ok)
                    throw failure("http", res.status);
                try {
                    return parseHeader(res.headers.get("Subscription-Userinfo"));
                }
                catch (_) {
                    if (method === "GET")
                        throw failure("header");
                }
            }
            finally {
                if (res && res.body && typeof res.body.cancel === "function")
                    await res.body.cancel();
            }
        }
        throw failure("header");
    }
    catch (e) {
        if (e && ["redirect", "http", "header"].includes(e.kind))
            throw e;
        throw failure("network");
    }
    finally {
        clearTimeout(timer);
    }
}
function dateKey(seconds, zone) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(seconds * 1000));
    const get = key => parts.find(p => p.type === key).value;
    return get("year") + "-" + get("month") + "-" + get("day");
}
function blank(source) { return { v: 1, source, attempt: 0, ok: 0, segment: 0, snapshot: null, error: null, points: [], days: [] }; }
function load(id, source) {
    const value = genkan.storage.get(keyOf(id));
    if (!value || value.v !== 1 || value.source !== source || !safe(value.attempt) || !safe(value.ok) || !safe(value.segment) ||
        !Array.isArray(value.points) || value.points.length > 180 || !Array.isArray(value.days) || value.days.length > 31)
        return blank(source);
    const snap = value.snapshot;
    if (snap && (!safe(snap.u) || !safe(snap.d) || !safe(snap.u + snap.d) ||
        !(snap.total === null || safe(snap.total)) || !(snap.expire === null || safe(snap.expire) && snap.expire <= 8640000000000)))
        return blank(source);
    if (!value.points.every(p => Array.isArray(p) && p.length === 4 && p.every(safe) && safe(p[1] + p[2])) ||
        !value.days.every(d => Array.isArray(d) && d.length === 8 && /^\d{4}-\d{2}-\d{2}$/.test(d[0]) && d.slice(1).every(safe)))
        return blank(source);
    if (value.error && (!["network", "header", "http", "redirect", "storage"].includes(value.error.kind) ||
        value.error.status !== undefined && (!safe(value.error.status) || value.error.status < 100 || value.error.status > 599)))
        return blank(source);
    return value;
}
function prune(state, now) {
    state.points = state.points.filter(p => p[0] >= now - 7 * DAY).slice(-180);
    state.days = state.days.filter(d => d[1] >= now - 30 * DAY).slice(-31);
}
function save(id, state, now, budget = MAX_BYTES) {
    prune(state, now);
    const size = () => new TextEncoder().encode(keyOf(id) + JSON.stringify(state)).length;
    while (size() > budget && state.points.length > 1)
        state.points.shift();
    while (size() > budget && state.days.length > 1)
        state.days.shift();
    if (size() > budget && state.points.length)
        state.points = [];
    if (size() > budget)
        throw failure("storage");
    try {
        genkan.storage.set(keyOf(id), state);
    }
    catch (_) {
        throw failure("storage");
    }
}
function record(state, value, now, zone) {
    const prev = state.snapshot, elapsed = now - state.ok;
    const continuous = prev && !state.error && elapsed > 0 && elapsed <= 90 * 60 && value.u >= prev.u && value.d >= prev.d;
    if (!continuous)
        state.segment++;
    const day = dateKey(now, zone), used = value.u + value.d;
    // [date, last timestamp, last cumulative bytes, segment, observed bytes,
    //  covered seconds, observed intervals, samples]. No backfill across midnight.
    let bucket = state.days.find(d => d[0] === day);
    if (!bucket) {
        bucket = [day, now, used, state.segment, 0, 0, 0, 0];
        state.days.push(bucket);
    }
    if (continuous && dateKey(state.ok, zone) === day) {
        const delta = value.u - prev.u + value.d - prev.d;
        if (safe(bucket[4] + delta)) {
            bucket[4] += delta;
            bucket[5] += elapsed;
            bucket[6]++;
        }
    }
    bucket[1] = now;
    bucket[2] = used;
    bucket[3] = state.segment;
    bucket[7]++;
    state.points.push([now, value.u, value.d, state.segment]);
    state.snapshot = value;
    state.ok = now;
    state.attempt = now;
    state.error = null;
}
function instances() { return genkan.widgets.list().filter(w => w.widget === "usage").sort((a, b) => a.id.localeCompare(b.id)); }
function message(ctx, err) { return err ? ctx.t(err.kind || "network", { status: err.status }) : ""; }
export async function schedule(ctx) {
    const all = instances(), ids = new Set(all.map(w => w.id));
    for (const key of genkan.storage.keys())
        if (key.startsWith(PREFIX) && !ids.has(key.slice(PREFIX.length)))
            genkan.storage.delete(key);
    const now = Math.floor(ctx.now / 1000), until = Date.now() + 45000;
    const overhead = genkan.storage.keys().filter(k => !k.startsWith(PREFIX)).reduce((n, k) =>
        n + new TextEncoder().encode(k + JSON.stringify(genkan.storage.get(k))).length, 0);
    const budget = Math.min(MAX_BYTES, Math.max(0, Math.floor((TOTAL_BYTES - overhead) / Math.max(1, all.length))));
    let sampled = 0, failed = 0, cursor = 0;
    const queue = [];
    // Rebalance existing history before adding samples, including when new
    // widgets arrive. Quotas divide bytes, not the number of allowed widgets.
    for (const instance of all) {
        try {
            const stored = genkan.storage.get(keyOf(instance.id));
            if (stored)
                save(instance.id, load(instance.id, stored.source), now, budget);
            const cfg = config(ctx.config, instance.config || {});
            const prior = load(instance.id, cfg.source);
            if (!prior.attempt || now - prior.attempt >= HOUR)
                queue.push({ instance, cfg, attempt: prior.attempt });
        }
        catch (_) { failed++; }
    }
    // Oldest attempts first: slow or failing early IDs cannot starve later ones.
    queue.sort((a, b) => a.attempt - b.attempt || a.instance.id.localeCompare(b.instance.id));
    async function worker() {
        while (cursor < queue.length && Date.now() + 8500 < until) {
            const { instance, cfg } = queue[cursor++];
            let value, error;
            try { value = await fetchUsage(cfg.url); }
            catch (e) { error = e; }
            const current = instances().find(w => w.id === instance.id);
            try {
                if (!current || config(ctx.config, current.config || {}).source !== cfg.source)
                    continue;
            }
            catch (_) { continue; }
            const state = load(instance.id, cfg.source);
            if (state.attempt >= now)
                continue;
            if (error) {
                state.attempt = now;
                state.error = { kind: error.kind || "network", ...(error.status ? { status: error.status } : {}) };
            }
            else
                record(state, value, now, cfg.zone);
            try {
                save(instance.id, state, now, budget);
                if (error) failed++;
                else sampled++;
            }
            catch (_) { failed++; }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, queue.length) }, () => worker()));
    return { sampled, failed, pending: queue.length - cursor };
}
export async function widget(ctx) {
    const wc = ctx.instance.config || {}, title = String(wc.name || ctx.t("name")).trim().slice(0, 60);
    const view = { title, icon: "gauge", body: [] };
    let cfg;
    try {
        cfg = config(ctx.config, wc);
    }
    catch (e) {
        return { ...view, error: message(ctx, e) };
    }
    const state = load(ctx.instance.id, cfg.source), now = Math.floor(ctx.now / 1000);
    if (!state.snapshot)
        return state.error ? { ...view, error: message(ctx, state.error) } : { ...view, body: [{ type: "text", text: ctx.t("collecting"), muted: true }] };
    const t = ctx.t, s = state.snapshot, used = s.u + s.d;
    const nf = new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 2 });
    const bytes = n => nf.format(n / GIB) + " GiB";
    const timestamp = sec => new Intl.DateTimeFormat(ctx.locale, { timeZone: cfg.zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(sec * 1000));
    const body = view.body;
    if (state.error || now - state.ok > 2 * HOUR)
        body.push({ type: "text", text: t("stale", { reason: message(ctx, state.error) }), size: "s" });
    body.push({ type: "stats", items: [
            { label: t("used"), value: bytes(used) }, { label: t("quota"), value: s.total === null ? t("unknown") : s.total === 0 ? t("unlimited") : bytes(s.total) },
            { label: t("remaining"), value: s.total === null ? t("unknown") : s.total === 0 ? t("unlimited") : bytes(Math.max(0, s.total - used)) },
        ] });
    if (s.total > 0)
        body.push({ type: "progress", value: used / s.total, label: t("used"), text: nf.format(used / s.total * 100) + "%" });
    if (s.total > 0 && used > s.total)
        body.push({ type: "text", text: t("over") + ": " + bytes(used - s.total), size: "s" });
    body.push({ type: "kv", items: [{ k: t("upload"), v: bytes(s.u) }, { k: t("download"), v: bytes(s.d) },
            { k: t("expires"), v: s.expire ? timestamp(s.expire) + (s.expire <= now ? " · " + t("expired") : "") : t("unknown") }] });
    body.push({ type: "text", text: t("updated", { time: timestamp(state.ok) }) + " · " + cfg.zone, size: "s", muted: true });
    const range = wc.range === "30" ? 30 : 7, since = now - range * DAY;
    body.push({ type: "divider" }, { type: "text", text: t("period", { days: range, zone: cfg.zone }), muted: true, size: "s" }, { type: "text", text: t("cumulative") });
    const detailStart = state.points.length ? state.points[0][0] : Infinity;
    const points = [...state.days.filter(d => d[1] < detailStart).map(d => [d[1], d[2], d[3]]), ...state.points.map(p => [p[0], p[1] + p[2], p[3]])].filter(p => p[0] >= since).sort((a, b) => a[0] - b[0]);
    const groups = [];
    for (const p of points) {
        let group = groups[groups.length - 1];
        if (!group || group.segment !== p[2]) {
            group = { segment: p[2], points: [] };
            groups.push(group);
        }
        group.points.push([p[0] * 1000, p[1] / GIB]);
    }
    for (const group of groups.slice(-3))
        body.push({ type: "chart", kind: "line", points: group.points.slice(-500), format: "decimal", color: "blue" });
    if (!groups.length)
        body.push({ type: "text", text: t("collecting"), muted: true });
    if (state.segment > 1)
        body.push({ type: "text", text: t("reset"), muted: true, size: "s" });
    body.push({ type: "text", text: t("segments"), muted: true, size: "s" }, { type: "text", text: t("daily") });
    const days = state.days.filter(d => d[1] >= since).slice(-range).filter(d => d[6] > 0);
    if (days.length) {
        body.push({ type: "chart", kind: "bar", values: days.map(d => d[4] / GIB), labels: days.map(d => d[0] + "*") });
        const last = days[days.length - 1];
        body.push({ type: "text", text: t("coverage", { date: last[0], hours: nf.format(last[5] / HOUR), count: last[6] }), muted: true, size: "s" });
    }
    else
        body.push({ type: "text", text: t("noIntervals"), muted: true });
    body.push({ type: "text", text: t("dailyNote"), muted: true, size: "s" });
    return view;
}
