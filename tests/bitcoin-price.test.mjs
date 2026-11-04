import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../plugins/bitcoin-price.js", import.meta.url), "utf8");
const now = Date.UTC(2026, 10, 4, 4);
const sample = {
  last_updated: new Date(now).toISOString(),
  quotes: { USD: { price: 76517, percent_change_24h: -0.28 }, CNY: { price: 510000, percent_change_24h: 1.5 } },
};
const response = (body, status = 200) => ({ status, ok: status >= 200 && status < 300, json: async () => structuredClone(body) });

function runtime(fetchImpl) {
  const logs = [], requests = [], storage = new Map();
  const api = vm.runInNewContext(
    source.replace(/\bexport (?=(?:const|async function)\b)/g, "") + "\n;({messages, manifest, widget});",
    {
      Intl, Date, AbortController, setTimeout, clearTimeout,
      t: key => ({ en: key, zh: key }),
      console: { warn: (...args) => logs.push(args) },
      fetch: async (...args) => {
        requests.push(args);
        if (!fetchImpl) throw new Error("Network must not be called");
        return fetchImpl(...args);
      },
      genkan: { storage: {
        get: key => storage.get(key),
        set: (key, value) => storage.set(key, JSON.parse(JSON.stringify(value))),
      } },
    },
  );
  function context(lang = "en", currency = "usd", time = now) {
    return {
      now: time, locale: lang === "zh" ? "zh-CN" : "en-US", instance: { config: { currency } },
      t: (key, params = {}) => {
        assert.ok(Object.hasOwn(api.messages[lang], key), "Missing translation: " + key);
        return api.messages[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
      },
    };
  }
  return { ...api, context, storage, logs, requests };
}

test("matching translations, restricted network permission and catalog entry", () => {
  const api = runtime();
  assert.deepEqual(Object.keys(api.messages.en).sort(), Object.keys(api.messages.zh).sort());
  assert.doesNotMatch(source, /ctx\.lang\s*===/);
  assert.equal(api.manifest.permissions.fetch.join(), "api.coinpaprika.com");
  assert.equal(api.manifest.permissions.links, undefined);
  const catalog = JSON.parse(readFileSync(new URL("../genkan-plugins.json", import.meta.url), "utf8"));
  assert.ok(catalog.plugins.includes("plugins/bitcoin-price.js"));
});

for (const [lang, currency, price, change, trend] of [["en", "usd", "76,517.00", "-0.28", "down"], ["zh", "cny", "510,000.00", "+1.50", "up"]]) {
  test(`${lang}: ${currency} price, daily change and provider timestamp`, async () => {
    const api = runtime(async (url, options) => {
      const target = new URL(url);
      assert.equal(target.origin, "https://api.coinpaprika.com");
      assert.equal(target.pathname, "/v1/tickers/btc-bitcoin");
      assert.equal(target.searchParams.get("quotes"), currency.toUpperCase());
      assert.equal(options.signal.aborted, false);
      return response(sample);
    });
    const view = await api.widget(api.context(lang, currency));
    assert.equal(view.error, undefined);
    assert.equal(view.title, api.messages[lang].name);
    assert.equal(view.body[0].value, price);
    assert.equal(view.body[0].unit, currency.toUpperCase());
    assert.equal(view.body[1].value, change);
    assert.equal(view.body[1].trend, trend);
    assert.match(view.body[2].text, /04:00.*UTC/);
    assert.equal(view.body.length, 4);
  });
  test(`${lang}: network failures are localized without leaking exception details`, async () => {
    const api = runtime(async () => { throw new Error("private upstream failure"); });
    const view = await api.widget(api.context(lang, currency));
    assert.equal(view.error, api.messages[lang].failed.replace("{reason}", api.messages[lang].network));
    assert.equal(view.body.length, 0);
    assert.doesNotMatch(JSON.stringify({ view, logs: api.logs }), /private upstream failure/);
  });
}

test("fresh cache avoids requests, expires at five minutes and separates currencies", async () => {
  const api = runtime(async () => response(sample));
  await api.widget(api.context());
  await api.widget(api.context("zh", "usd", now + 299999));
  assert.equal(api.requests.length, 1);
  await api.widget(api.context("en", "usd", now + 300000));
  await api.widget(api.context("en", "cny", now + 300000));
  assert.equal(api.requests.length, 3);
  assert.equal(api.storage.size, 2);
});

test("missing config uses USD; invalid currency makes no request", async () => {
  const api = runtime(async () => response(sample));
  const ctx = api.context(); ctx.instance.config = {};
  assert.equal((await api.widget(ctx)).body[0].unit, "USD");
  const before = api.requests.length;
  assert.equal((await api.widget(api.context("zh", "eur"))).error, api.messages.zh.invalidCurrency);
  assert.equal(api.requests.length, before);
});

test("refresh failure marks saved prices, which expire after one hour", async () => {
  let count = 0;
  const api = runtime(async () => { if (count++ === 0) return response(sample); throw new Error("offline"); });
  await api.widget(api.context());
  const fallback = await api.widget(api.context("en", "usd", now + 301000));
  assert.equal(fallback.error, undefined);
  assert.ok(fallback.body.some(b => b.text === api.messages.en.cached));
  const expired = await api.widget(api.context("en", "usd", now + 3600000));
  assert.ok(expired.error);
  assert.equal(expired.body.length, 0);
});

test("HTTP rate limiting and malformed JSON produce readable errors", async () => {
  const limited = runtime(async () => response({ private: "hidden response" }, 429));
  const view = await limited.widget(limited.context("zh"));
  assert.match(view.error, /HTTP 429/);
  assert.doesNotMatch(JSON.stringify(view), /hidden response/);
  const malformed = runtime(async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } }));
  assert.match((await malformed.widget(malformed.context())).error, /invalid or expired/);
});

test("invalid prices and timestamps never become displayed or cached prices", async () => {
  const invalid = [null, {}, { ...sample, quotes: {} }];
  for (const price of [null, 0, -1, "76517", Infinity]) {
    const data = structuredClone(sample); data.quotes.USD.price = price; invalid.push(data);
  }
  for (const time of ["", "not-a-date", new Date(now - 3600000).toISOString(), new Date(now + 120000).toISOString()]) {
    invalid.push({ ...sample, last_updated: time });
  }
  for (const data of invalid) {
    const api = runtime(async () => response(data));
    const view = await api.widget(api.context());
    assert.ok(view.error);
    assert.equal(view.body.length, 0);
    assert.equal(api.storage.size, 0);
  }
});

test("missing daily change stays unknown; zero change is flat", async () => {
  for (const change of [null, undefined, 0]) {
    const data = structuredClone(sample); data.quotes.USD.percent_change_24h = change;
    const api = runtime(async () => response(data));
    const view = await api.widget(api.context());
    assert.equal(view.error, undefined);
    assert.equal(view.body[1].value, change === 0 ? "0.00" : api.messages.en.unavailable);
    assert.equal(view.body[1].trend, change === 0 ? "flat" : undefined);
  }
});

test("provider data older than ten minutes carries a stale warning", async () => {
  const api = runtime(async () => response({ ...sample, last_updated: new Date(now - 600001).toISOString() }));
  const view = await api.widget(api.context());
  assert.equal(view.error, undefined);
  assert.ok(view.body.some(b => b.text === api.messages.en.stale));
});
