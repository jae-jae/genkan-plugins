import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

globalThis.t = (key) => key;
const plugin = await import('../plugins/stock-trend.js');
const now = Date.UTC(2026, 10, 6, 1);
let requests;
let logs;
function context(lang = 'en', config = {}, store = new Map()) {
  return {
    now, locale: lang === 'zh' ? 'zh-CN' : 'en-US',
    t: (key, params = {}) => plugin.messages[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)),
    instance: { config, storage: { get: (k) => store.get(k), set: (k, v) => store.set(k, structuredClone(v)) } },
  };
}
function response(period = '1d') {
  return { chart: { result: [{
    meta: { regularMarketPrice: 102, regularMarketTime: now / 1000, previousClose: period === '1d' ? 100 : 50,
      chartPreviousClose: period === '1d' ? 100 : 50, instrumentType: 'INDEX', currency: 'USD' },
    timestamp: [now / 1000 - 120, now / 1000 - 60, now / 1000],
    indicators: { quote: [{ close: [99, null, 102] }] },
  }], error: null } };
}
beforeEach(() => {
  requests = []; logs = [];
  globalThis.genkan = { log: (...args) => logs.push(args) };
  globalThis.fetch = async (url) => {
    requests.push(url);
    return { ok: true, json: async () => response(new URL(url).searchParams.get('range')) };
  };
});
test('localizations have the same keys', () => {
  assert.deepEqual(Object.keys(plugin.messages.en).sort(), Object.keys(plugin.messages.zh).sort());
});
test('daily comparison stays daily on a yearly chart; null prices are omitted', async () => {
  const view = await plugin.widget(context('en', { period: '1y' }));
  assert.equal(view.error, undefined);
  assert.equal(view.body[0].items[1].value, '+2.00');
  assert.equal(view.body[0].items[1].unit, '%');
  assert.match(view.body[1].text, /Daily change: \+2.00 pts/);
  assert.equal(view.body[2].points.length, 2);
  assert.equal(requests.length, 2);
});
test('Chinese rendering, one-day request reuse, and index unit', async () => {
  const view = await plugin.widget(context('zh', { period: '1d' }));
  assert.equal(view.title, '纳斯达克综合指数');
  assert.equal(view.body[0].items[0].unit, '点');
  assert.equal(requests.length, 1);
});
test('primary host failure retries only the declared backup', async () => {
  const success = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('query1.')) { requests.push(url); throw new Error('offline'); }
    return success(url);
  };
  assert.equal((await plugin.widget(context('en', { period: '1d' }))).error, undefined);
  assert.equal(requests.length, 2);
  assert.ok(requests[1].startsWith('https://query2.finance.yahoo.com/'));
});
test('fresh cache avoids requests; failed refresh shows stale data with a warning', async () => {
  const ctx = context();
  await plugin.widget(ctx);
  await plugin.widget(ctx);
  assert.equal(requests.length, 2);
  ctx.now += 300001;
  globalThis.fetch = async () => { throw new Error('offline'); };
  const view = await plugin.widget(ctx);
  assert.equal(view.error, undefined);
  assert.match(view.body[0].text, /cached data/);
});
test('a different ticker or period never receives an unrelated stale quote', async () => {
  const ctx = context();
  await plugin.widget(ctx);
  globalThis.fetch = async () => { throw new Error('offline'); };
  ctx.instance.config.symbol = 'AAPL';
  assert.match((await plugin.widget(ctx)).error, /unavailable/);
  ctx.instance.config = { period: '1y' };
  assert.match((await plugin.widget(ctx)).error, /unavailable/);
});
test('all period actions persist independently per instance; default setting changes take effect', async () => {
  const ctx = context();
  ctx.action = 'period';
  for (const period of ['1d', '1mo', '1y']) {
    ctx.params = { period };
    const result = await plugin.action(ctx);
    assert.equal(result.view.error, undefined);
    assert.match(result.view.body[1].text, new RegExp(plugin.messages.en[{ '1d': 'day', '1mo': 'month', '1y': 'year' }[period]]));
  }
  const other = await plugin.widget(context());
  assert.match(other.body[1].text, /1M/);
  ctx.instance.config.period = '1d';
  assert.match((await plugin.widget(ctx)).body[1].text, /1D/);
});
test('bad config and action parameters are localized and do not access the network', async () => {
  for (const symbol of ['', 'https://evil.invalid/', '../AAPL', 'A'.repeat(33)]) {
    assert.match((await plugin.widget(context('zh', { symbol }))).error, /代码/);
  }
  for (const period of ['__proto__', 'constructor', 'max']) {
    const ctx = context('zh'); ctx.action = 'period'; ctx.params = { period };
    await assert.rejects(plugin.action(ctx), /周期/);
  }
  const ctx = context('en'); ctx.action = 'missing';
  await assert.rejects(plugin.action(ctx), /Unknown action/);
  assert.equal(requests.length, 0);
});
test('malformed or empty upstream data returns a clear error instead of zero', async () => {
  for (const payload of [{}, { chart: { result: null, error: { code: 'Not Found' } } }, response()]) {
    if (payload.chart?.result?.[0]) payload.chart.result[0].indicators.quote[0].close = [null, null, null];
    globalThis.fetch = async () => ({ ok: true, json: async () => payload });
    assert.match((await plugin.widget(context())).error, /unavailable/);
  }
});
test('long history is sorted, deduplicated and capped with both endpoints preserved', async () => {
  const payload = response(); const r = payload.chart.result[0];
  r.timestamp = Array.from({ length: 1001 }, (_, i) => now / 1000 - i * 60);
  r.indicators.quote[0].close = Array.from({ length: 1001 }, (_, i) => 1001 - i);
  globalThis.fetch = async () => ({ ok: true, json: async () => payload });
  const points = (await plugin.widget(context())).body[2].points;
  assert.equal(points.length, 400);
  assert.equal(points[0][1], 1);
  assert.equal(points.at(-1)[1], 1001);
  assert.ok(points.every((p, i) => i === 0 || p[0] > points[i - 1][0]));
});
test('storage exhaustion does not discard a successful quote', async () => {
  const ctx = context(); ctx.instance.storage.set = () => { throw new Error('full'); };
  assert.equal((await plugin.widget(ctx)).error, undefined);
});
test('storage exhaustion still renders the requested period and explains it was not saved', async () => {
  const ctx = context(); ctx.instance.storage.set = () => { throw new Error('full'); };
  ctx.action = 'period'; ctx.params = { period: '1y' };
  const result = await plugin.action(ctx);
  assert.equal(result.view.error, undefined);
  assert.match(result.view.body[1].text, /1Y/);
  assert.match(result.toast, /could not be saved/);
});
