export const messages = {
  en: {
    name: "SSH Server", desc: "Linux resources over native SSH: CPU, memory, root disk, network and recent CPU history.",
    label: "Display name", host: "SSH host", hostHelp: "Hostname or IP only, without a scheme or port. IPv6: omit brackets.",
    port: "SSH port", username: "SSH user", password: "Password", key: "Private key (PEM / OpenSSH)",
    keyHelp: "Paste the complete key. Use either a private key or a password, not both. No sudo is needed.",
    passphrase: "Private key passphrase",
    cpu: "CPU · {cores} cores", memory: "Memory", disk: "Root disk /", receive: "Receive", send: "Send",
    online: "Online", stale: "Connection lost · saved sample", history: "CPU · recent samples", collecting: "CPU history starts with the next refresh.",
    uptime: "Uptime", duration: "{days}d {hours}h {minutes}m", load: "Load · 1 / 5 / 15 min", updated: "Sampled {time}",
    setup: "Set the SSH host, user and one authentication method in the widget settings.",
    upgrade: "This widget needs a Genkan build with native genkan.ssh.stats support.",
    SSH_CONFIG: "Check the SSH host, port and user.", SSH_FINGERPRINT: "Enter a valid SHA256: server host key fingerprint.",
    SSH_CREDENTIALS: "Supply either a password or a private key, not both.", SSH_KEY: "The private key or its passphrase is invalid.",
    SSH_KEY_COST: "The encrypted private key exceeds the supported bcrypt cost (64 rounds). Use a dedicated monitoring key.",
    SSH_HOST_KEY: "Host key mismatch. Verify the server identity before updating its fingerprint.",
    SSH_HANDSHAKE: "SSH authentication or handshake failed. Check the user and credentials.",
    SSH_CONNECT: "Cannot reach the SSH server.", SSH_TIMEOUT: "SSH collection timed out.", SSH_SESSION: "The server refused the SSH session.",
    SSH_COLLECT: "Collection failed. Requires Linux, /proc, sh, awk, df, uname, cat, tail and sleep.",
    SSH_DATA: "The server returned incomplete or invalid resource data.", SSH_OUTPUT: "The server output exceeded the collection limit.",
    SSH_LIMIT: "SSH collection limit reached. Try the next refresh.", failed: "SSH collection failed.",
  },
  zh: {
    name: "SSH 服务器", desc: "通过原生 SSH 显示 Linux 服务器的 CPU、内存、根分区、网络和近期 CPU 趋势。",
    label: "显示名称", host: "SSH 主机", hostHelp: "只填主机名或 IP，不含协议和端口。IPv6 不加方括号。",
    port: "SSH 端口", username: "SSH 用户", password: "密码", key: "私钥（PEM / OpenSSH）",
    keyHelp: "粘贴完整私钥。私钥与密码二选一，无需 sudo。", passphrase: "私钥口令",
    cpu: "CPU · {cores} 核", memory: "内存", disk: "根分区 /", receive: "接收", send: "发送",
    online: "在线", stale: "连接中断 · 上次采样", history: "CPU · 近期采样", collecting: "下次刷新后开始显示 CPU 趋势。",
    uptime: "运行时间", duration: "{days} 天 {hours} 小时 {minutes} 分", load: "负载 · 1 / 5 / 15 分钟", updated: "采样时间 {time}",
    setup: "请在小组件设置中填写 SSH 主机、用户及一种认证方式。", upgrade: "此小组件需要支持原生 genkan.ssh.stats 的 Genkan 版本。",
    SSH_CONFIG: "请检查 SSH 主机、端口和用户名。", SSH_FINGERPRINT: "请填写有效的 SHA256: 服务器主机密钥指纹。",
    SSH_CREDENTIALS: "请提供密码或私钥，两者只能选择一种。", SSH_KEY: "私钥或私钥口令无效。",
    SSH_KEY_COST: "加密私钥的 bcrypt 成本超过支持上限（64 轮），请使用单独的监控密钥。",
    SSH_HOST_KEY: "主机密钥不匹配，请核实服务器身份后再更新指纹。", SSH_HANDSHAKE: "SSH 认证或握手失败，请检查用户和凭据。",
    SSH_CONNECT: "无法连接 SSH 服务器。", SSH_TIMEOUT: "SSH 采集超时。", SSH_SESSION: "服务器拒绝了 SSH 会话。",
    SSH_COLLECT: "采集失败，需要 Linux、/proc、sh、awk、df、uname、cat、tail 和 sleep。", SSH_DATA: "服务器返回的资源数据不完整或无效。",
    SSH_OUTPUT: "服务器输出超过采集限制。", SSH_LIMIT: "已达到 SSH 采集次数限制，请等待下次刷新。", failed: "SSH 采集失败。",
  },
};

export const manifest = {
  id: "ssh-server", name: t("name"), version: "1.0.0", description: t("desc"), icon: "server",
  permissions: { ssh: true },
  widgets: [{ id: "resources", name: t("name"), size: "m", refresh: 30, config: [
    { key: "name", type: "string", label: t("label") },
    { key: "host", type: "string", label: t("host"), help: t("hostHelp"), required: true },
    { key: "port", type: "number", label: t("port"), default: 22, min: 1, max: 65535 },
    { key: "username", type: "string", label: t("username"), required: true },
    { key: "password", type: "secret", label: t("password") },
    { key: "privateKey", type: "secret", multiline: true, label: t("key"), help: t("keyHelp") },
    { key: "passphrase", type: "secret", label: t("passphrase") },
  ] }],
};

function valid(d) {
  const nonnegative = n => typeof n === "number" && Number.isFinite(n) && n >= 0;
  const percent = n => nonnegative(n) && n <= 100;
  return d && typeof d.hostname === "string" && typeof d.kernel === "string" && typeof d.arch === "string"
    && nonnegative(d.collectedAt) && d.collectedAt > 0 && Number.isInteger(d.cores) && d.cores > 0
    && percent(d.cpuPercent) && nonnegative(d.uptimeSeconds)
    && Array.isArray(d.load) && d.load.length === 3 && d.load.every(nonnegative)
    && [d.memory, d.disk].every(v => v && percent(v.percent) && nonnegative(v.usedBytes) && nonnegative(v.totalBytes) && v.totalBytes > 0 && v.usedBytes <= v.totalBytes)
    && d.network && nonnegative(d.network.rxBytesPerSecond) && nonnegative(d.network.txBytesPerSecond);
}

function render(ctx, cfg, d, history, stale) {
  const { t } = ctx;
  const num = n => new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 1 }).format(n);
  const bytes = n => {
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
    const i = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log2(Math.max(1, n)) / 10)));
    return num(n / 1024 ** i) + " " + units[i];
  };
  const time = new Intl.DateTimeFormat(ctx.locale, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC", hourCycle: "h23" }).format(new Date(d.collectedAt)) + " UTC";
  const body = [
    { type: "text", text: (stale ? t("stale") : t("online")) + " · Linux " + d.kernel + " · " + d.arch, size: "s", muted: !stale },
    { type: "stats", items: [
      { label: t("cpu", { cores: num(d.cores) }), value: num(d.cpuPercent), unit: "%", icon: "cpu" },
      { label: t("memory"), value: num(d.memory.percent), unit: "%", icon: "database" },
    ] },
    { type: "text", text: t("history"), size: "s", muted: true },
    history.length > 1 ? { type: "chart", kind: "line", points: history, format: "percent", color: "green" }
      : { type: "text", text: t("collecting"), size: "s", muted: true },
    { type: "progress", label: t("memory"), value: d.memory.percent / 100, text: bytes(d.memory.usedBytes) + " / " + bytes(d.memory.totalBytes) },
    { type: "progress", label: t("disk"), value: d.disk.percent / 100, text: num(d.disk.percent) + "% · " + bytes(d.disk.usedBytes) + " / " + bytes(d.disk.totalBytes) },
    { type: "stats", items: [
      { label: t("receive"), value: bytes(d.network.rxBytesPerSecond), unit: "/s", icon: "arrow-down" },
      { label: t("send"), value: bytes(d.network.txBytesPerSecond), unit: "/s", icon: "arrow-up" },
    ] },
    { type: "kv", items: [
      { k: t("uptime"), v: t("duration", { days: num(Math.floor(d.uptimeSeconds / 86400)), hours: num(Math.floor(d.uptimeSeconds / 3600) % 24), minutes: num(Math.floor(d.uptimeSeconds / 60) % 60) }) },
      { k: t("load"), v: d.load.map(num).join(" / ") },
    ] },
    { type: "text", text: t("updated", { time }), size: "s", muted: true },
  ];
  return { title: cfg.name || d.hostname, icon: "server", body, ...(stale ? { tone: "yellow" } : {}) };
}

export async function widget(ctx) {
  const cfg = ctx.instance?.config || {};
  const fail = key => ({ title: cfg.name || ctx.t("name"), icon: "server", body: [], error: ctx.t(key) });
  if (!cfg.host || !cfg.username || (!cfg.password && !cfg.privateKey)) return fail("setup");
  if (!genkan.ssh || typeof genkan.ssh.stats !== "function") return fail("upgrade");
  const identity = JSON.stringify([cfg.host, cfg.port || 22, cfg.username]);
  const store = ctx.instance.storage;
  let cached;
  try { cached = store?.get("snapshot"); } catch (_) { /* Storage must not prevent collection. */ }
  const same = cached?.identity === identity;
  let history = same && Array.isArray(cached.history) ? cached.history.filter(p => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[1] >= 0 && p[1] <= 100 && p[0] <= ctx.now && p[0] >= ctx.now - 1800000).slice(-59) : [];
  try {
    const data = await genkan.ssh.stats({ host: cfg.host, port: cfg.port ?? 22, username: cfg.username,
      password: cfg.password || "", privateKey: cfg.privateKey || "", passphrase: cfg.passphrase || "" });
    if (!valid(data) || data.collectedAt < ctx.now - 30000 || data.collectedAt > ctx.now + 15000) return fail("SSH_DATA");
    // A reboot or an observation gap starts a new series; no fictitious line over an outage.
    if ((same && data.uptimeSeconds < cached.data?.uptimeSeconds) || (history.length && data.collectedAt - history[history.length - 1][0] > 90000)) history = [];
    history = history.filter(p => p[0] < data.collectedAt);
    history.push([data.collectedAt, data.cpuPercent]);
    try { store?.set("snapshot", { identity, data, history }); } catch (_) { /* Shared storage quota: still show live data. */ }
    return render(ctx, cfg, data, history, false);
  } catch (e) {
    const code = String(e?.message || "");
    if (["SSH_CONNECT", "SSH_TIMEOUT"].includes(code) && same && valid(cached.data)
      && ctx.now >= cached.data.collectedAt && ctx.now - cached.data.collectedAt < 300000) return render(ctx, cfg, cached.data, history, true);
    return fail(Object.prototype.hasOwnProperty.call(messages.en, code) && code.startsWith("SSH_") ? code : "failed");
  }
}
