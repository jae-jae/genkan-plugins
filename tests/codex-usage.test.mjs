import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../plugins/codex-usage.js", import.meta.url), "utf8");
const now = Date.UTC(2026, 10, 4, 4);
const sample = {
  plan_type: "plus",
  rate_limit: {
    allowed: true, limit_reached: false,
    primary_window: { used_percent: 23, limit_window_seconds: 18000, reset_at: now / 1000 + 3600 },
    secondary_window: { used_percent: 61, limit_window_seconds: 604800, reset_at: now / 1000 + 86400 },
  },
  credits: { has_credits: true, unlimited: false, balance: "12.50" },
};

function runtime(fetchImpl) {
  const logs = [];
  const api = vm.runInNewContext(
    source.replace(/\bexport (?=(?:const|async function)\b)/g, "") + "\n;({messages, manifest, widget});",
    {
      Intl, Date, TextDecoder, Uint8Array, atob, AbortController, setTimeout, clearTimeout,
      t: key => ({ en: key, zh: key }),
      fetch: fetchImpl || (async () => { throw new Error("Network must not be called"); }),
      genkan: { log: (...args) => logs.push(args) },
    },
  );
  function context(lang = "en", overrides = {}) {
    const ctx = {
      now, locale: lang === "zh" ? "zh-CN" : "en-US",
      config: { access_token: "test-only-opaque-token" }, instance: { id: "test", config: { timezone: "Asia/Shanghai", mode: "remaining" } },
      ...overrides,
    };
    ctx.t = (key, params = {}) => {
      assert.ok(Object.hasOwn(api.messages[lang], key), "Missing translation: " + key);
      return api.messages[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    };
    return ctx;
  }
  return { ...api, context, logs };
}

const response = (body, status = 200) => ({ status, ok: status >= 200 && status < 300, json: async () => structuredClone(body) });
const progress = view => view.body.filter(b => b.type === "progress");

test("English and Chinese have matching keys; UI strings use localization", () => {
  const api = runtime();
  assert.deepEqual(Object.keys(api.messages.en).sort(), Object.keys(api.messages.zh).sort());
  assert.doesNotMatch(source, /ctx\.lang\s*===/);
  assert.equal(api.manifest.config.find(c => c.key === "access_token").type, "secret");
  assert.equal(api.manifest.permissions.fetch.join(), "chatgpt.com:443");
});

for (const lang of ["en", "zh"]) {
  test(`${lang}: quotas, window durations, credits, time zone and no token leakage`, async () => {
    const api = runtime(async (url, options) => {
      assert.equal(url, "https://chatgpt.com/backend-api/wham/usage");
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.Authorization, "Bearer test-only-opaque-token");
      return response(sample);
    });
    const view = await api.widget(api.context(lang));
    assert.equal(view.error, undefined);
    assert.equal(progress(view).length, 2);
    assert.equal(progress(view)[0].value, 0.77);
    assert.equal(progress(view)[1].value, 0.39);
    assert.match(progress(view)[0].label, /5/);
    assert.match(progress(view)[1].label, /7/);
    assert.match(JSON.stringify(view), /77%/);
    assert.doesNotMatch(JSON.stringify({ view, logs: api.logs }), /test-only-opaque-token/);
    assert.match(JSON.stringify(view), /12\.5/);
    if (lang === "zh") assert.match(JSON.stringify(view), /剩余|重置时间/);
  });
  test(`${lang}: empty credentials have a clear error and make no request`, async () => {
    const api = runtime();
    const view = await api.widget(api.context(lang, { config: {} }));
    assert.equal(view.error, api.messages[lang].missing);
  });
}

test("used display mode and nonstandard windows use the actual server values", async () => {
  const data = structuredClone(sample);
  data.rate_limit.primary_window.limit_window_seconds = 900;
  const api = runtime(async () => response(data));
  const ctx = api.context(); ctx.instance.config.mode = "used";
  const view = await api.widget(ctx);
  assert.equal(progress(view)[0].value, 0.23);
  assert.match(progress(view)[0].label, /15-minute/);
});

test("absent quota windows never imply 100% remaining", async () => {
  const api = runtime(async () => response({ plan_type: "pro", rate_limit: null, credits: { unlimited: true } }));
  const view = await api.widget(api.context());
  assert.equal(view.error, undefined);
  assert.equal(progress(view).length, 0);
  assert.match(JSON.stringify(view), /did not return fixed quota/);
  assert.match(JSON.stringify(view), /Unlimited/);
});

test("additional buckets are rendered with a bounded number of blocks", async () => {
  const data = structuredClone(sample);
  data.additional_rate_limits = Array.from({ length: 50 }, (_, i) => ({ limit_name: "model " + i, rate_limit: sample.rate_limit }));
  const api = runtime(async () => response(data));
  const view = await api.widget(api.context());
  assert.equal(progress(view).length, 10);
  assert.ok(view.body.length <= 50);
});

test("reset_at is authoritative, missing resets stay unknown, elapsed resets do not invent fresh quota", async () => {
  const data = structuredClone(sample);
  data.rate_limit.primary_window.reset_at = now / 1000 - 5;
  data.rate_limit.primary_window.reset_after_seconds = 60;
  delete data.rate_limit.secondary_window.reset_at;
  const api = runtime(async () => response(data));
  const view = await api.widget(api.context());
  assert.match(view.body[1].text, /awaiting the next refresh/);
  assert.match(view.body[3].text, /not provided/);
  assert.equal(progress(view)[0].value, 0.77);
});

for (const [status, key] of [[401, "unauthorized"], [403, "forbidden"], [429, "rateLimited"], [500, "http"]]) {
  test(`HTTP ${status}: localized failure with no echoed response body`, async () => {
    const api = runtime(async () => response({ leaked: "test-only-opaque-token" }, status));
    const view = await api.widget(api.context("zh"));
    assert.equal(view.error, api.messages.zh[key].replace("{status}", status));
    assert.equal(view.body.length, 0);
    assert.doesNotMatch(JSON.stringify(view), /test-only-opaque-token/);
  });
}

test("connection errors do not expose exception text or credentials", async () => {
  const api = runtime(async () => { throw new Error("test-only-opaque-token"); });
  const view = await api.widget(api.context());
  assert.equal(view.error, api.messages.en.network);
  assert.doesNotMatch(JSON.stringify(view), /test-only-opaque-token/);
});

test("invalid JSON and malformed quota numbers fail without showing invented metrics", async () => {
  for (const body of [null, [], {}, { plan_type: "plus", rate_limit: { primary_window: { used_percent: null } } }]) {
    const api = runtime(async () => response(body));
    const view = await api.widget(api.context());
    assert.equal(view.error, api.messages.en.invalid);
    assert.equal(view.body.length, 0);
  }
  const api = runtime(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("invalid JSON"); } }));
  assert.equal((await api.widget(api.context())).error, api.messages.en.invalid);
});

test("API keys and expired tokens are rejected before any network request", async () => {
  const api = runtime();
  const expired = "e30." + Buffer.from(JSON.stringify({ exp: now / 1000 - 1 })).toString("base64url") + ".sig";
  for (const [token, key] of [["sk-test-only-not-a-secret", "apiKey"], [expired, "expired"]]) {
    const view = await api.widget(api.context("en", { config: { access_token: token } }));
    assert.equal(view.error, api.messages.en[key]);
  }
});

test("JWT account selection, Bearer prefixes, and explicit account overrides", async () => {
  const token = "e30." + Buffer.from(JSON.stringify({ "https://api.openai.com/auth": { chatgpt_account_id: "account-from-token" }, label: "测试" })).toString("base64url") + ".sig";
  for (const account of [undefined, "account-override"]) {
    const api = runtime(async (_, options) => {
      assert.equal(options.headers["ChatGPT-Account-Id"], account || "account-from-token");
      assert.equal(options.headers.Authorization, "Bearer " + token);
      return response(sample);
    });
    const view = await api.widget(api.context("en", { config: { access_token: "Bearer " + token, account_id: account } }));
    assert.equal(view.error, undefined);
  }
});

test("invalid account IDs and time zones fail locally", async () => {
  const api = runtime();
  const badAccount = api.context(); badAccount.config.account_id = "not an account\r\n";
  assert.equal((await api.widget(badAccount)).error, api.messages.en.invalidAccount);
  const badZone = api.context(); badZone.instance.config.timezone = "Invalid/Timezone";
  assert.equal((await api.widget(badZone)).error, api.messages.en.badTimezone);
});

test("out-of-range quota percentages are clamped to valid progress values", async () => {
  const data = structuredClone(sample);
  data.rate_limit.primary_window.used_percent = 120;
  const api = runtime(async () => response(data));
  assert.equal(progress(await api.widget(api.context()))[0].value, 0);
});

test("copied JSON fragments, whitespace and extra JWT segments are rejected before a request", async () => {
  for (const token of ['e30.e30.signature trailing.text', '"e30.e30.signature"', '{"access_token":"e30.e30.signature"}', 'e30.e30.signature.extra.part', 'e30..signature']) {
    let requested = false;
    const api = runtime(async () => { requested = true; return response({}, 401); });
    const ctx = api.context("zh", { config: { access_token: token } });
    const view = await api.widget(ctx);
    assert.equal(requested, false, "Malformed credentials must never be sent upstream");
    assert.equal(view.error, api.messages.zh.tokenFormat);
  }
});

test("upstream invalid_jwt produces a specific copy-format error", async () => {
  const api = runtime(async () => response({ error: { code: "invalid_jwt", message: "private upstream error" } }, 401));
  const view = await api.widget(api.context());
  assert.ok(api.messages.en.tokenFormat);
  assert.equal(view.error, api.messages.en.tokenFormat);
  assert.doesNotMatch(JSON.stringify(view), /private upstream error/);
});
