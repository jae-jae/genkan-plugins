import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
const source = readFileSync(new URL('../plugins/subscription-usage.js', import.meta.url), 'utf8');
const HOUR = 3600000, DAY = 24 * HOUR, start = Date.UTC(2026, 9, 1, 1);
const fakeURL = 'https://subscription.example.test/sub?key=fixture-only-private-value';
const fields = (u = 100, d = 200, total = 10000) => `upload=${u}; download=${d}; total=${total}; expire=2000000000`;
function runtime({ fastTimeout = false } = {}) {
    const storage = new Map(), requests = [], logs = [], canceled = [];
    let widgets = [{ id: 'one', widget: 'usage', config: { url: fakeURL, origin: '1', zone: 'UTC' } }], responder = () => response(fields());
    function response(header, status = 200) { return { status, ok: status >= 200 && status < 300, headers: new Headers(header == null ? {} : { 'Subscription-Userinfo': header }), body: { cancel: async () => canceled.push(true) } }; }
    const api = vm.runInNewContext(source.replace(/\bexport (?=(?:const|async function)\b)/g, '') + '\n;({manifest,messages,widget,schedule,parseHeader,fingerprint,config,record,blank,save});', {
        Date, Intl, URL, Headers, TextEncoder, AbortController, setTimeout: fastTimeout ? fn => setTimeout(fn, 5) : setTimeout, clearTimeout,
        t: key => ({ en: key, zh: key }),
        fetch: async (url, options) => { requests.push({ url, options }); return responder(url, options); },
        genkan: { capabilities: { verifyTLS: true }, widgets: { list: () => structuredClone(widgets) }, log: (...x) => logs.push(x), storage: {
                get: key => structuredClone(storage.get(key)), set: (key, value) => { const copy = structuredClone(value); const entries = new Map(storage); entries.set(key, copy); assert.ok([...entries].reduce((n, [k, v]) => n + Buffer.byteLength(k + JSON.stringify(v)), 0) <= 256 * 1024); storage.set(key, copy); },
                keys: () => [...storage.keys()], delete: key => storage.delete(key),
            } },
    });
    function context(time = start, lang = 'en', id = 'one') {
        return { now: time, locale: lang === 'zh' ? 'zh-CN' : 'en-US', config: { origin1: 'https://subscription.example.test' }, instance: { id, config: structuredClone(widgets.find(w => w.id === id)?.config || widgets[0]?.config || {}) },
            t: (key, params = {}) => { assert.ok(api.messages[lang][key], key); return api.messages[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)); } };
    }
    return { ...api, context, storage, requests, logs, canceled, response, setResponder: fn => { responder = fn; }, setWidgets: list => { widgets = structuredClone(list); }, getWidgets: () => structuredClone(widgets) };
}
const text = view => JSON.stringify(view);
const state = api => api.storage.get('usage:one');
test('manifest, catalog, strict origins and translations', () => {
    const a = runtime();
    assert.deepEqual(Object.keys(a.messages.en).sort(), Object.keys(a.messages.zh).sort());
    assert.equal(a.manifest.permissions.fetch.length, 0);
    assert.equal(a.manifest.config.length, 5);
    assert.ok(a.manifest.config.every(f => f.type === 'url' && f.allowFetch && f.verifyTLS));
    assert.equal(a.manifest.widgets[0].config.find(f => f.key === 'url').type, 'secret');
    assert.equal(a.manifest.schedules[0].every, 3600);
    const catalog = JSON.parse(readFileSync(new URL('../genkan-plugins.json', import.meta.url), 'utf8'));
    assert.ok(catalog.plugins.includes('plugins/subscription-usage.js'));
});
test('SHA-256 identity matches standard vectors and URL strings', () => {
    const a = runtime();
    for (const v of ['', 'abc', '中文', 'x'.repeat(1000), fakeURL + '\nUTC'])
        assert.equal(a.fingerprint(v), createHash('sha256').update(v).digest('hex'));
});
test('header parser preserves unknowns and zero, rejects malformed or ambiguous fields', () => {
    const a = runtime();
    for (const raw of ['UPLOAD = 0; DownLoad=0', 'upload=1;download=2;total=0']) {
        const p = a.parseHeader(raw);
        assert.equal(p.expire, null);
        assert.equal(p.total, raw.includes('total') ? 0 : null);
    }
    for (const raw of [null, '', 'total=100', 'upload=0', 'download=0', 'upload=;download=0', 'upload=-1;download=2', 'upload=NaN;download=2', 'upload=1e3;download=2', 'upload=1;download=2;total=no', 'upload=1;download=2;expire=8640000000001', 'upload=9007199254740991;download=1', 'upload=1;download=2;upload=3', 'upload=1;download=2;expire', 'x'.repeat(4097)])
        assert.throws(() => a.parseHeader(raw));
});
test('widget renders only saved samples; HEAD succeeds without downloading or persisting credentials', async () => {
    const a = runtime();
    assert.match(text(await a.widget(a.context())), /Waiting/);
    assert.equal(a.requests.length, 0);
    await a.schedule(a.context());
    assert.equal(a.requests.length, 1);
    assert.equal(a.requests[0].options.method, 'HEAD');
    assert.equal(a.requests[0].options.redirect, 'manual');
    assert.equal(a.requests[0].options.headers['User-Agent'], 'clash.meta');
    assert.equal(a.canceled.length, 1);
    for (const lang of ['en', 'zh']) {
        const view = await a.widget(a.context(start, lang));
        assert.equal(view.error, undefined);
        assert.ok(view.body.some(b => b.type === 'chart' && b.kind === 'line'));
        assert.doesNotMatch(text(view), /fixture-only-private-value|subscription.example.test/);
    }
    assert.doesNotMatch(JSON.stringify([...a.storage]), /fixture-only-private-value|subscription.example.test/);
    await a.schedule(a.context(start + 1000));
    assert.equal(a.requests.length, 1);
});
test('HEAD unsupported or missing usable header falls back once to GET and cancels bodies', async () => {
    for (const mode of ['missing', 405, 501]) {
        const a = runtime();
        a.setResponder((_, o) => o.method === 'HEAD' ? a.response(mode === 'missing' ? null : fields(), mode === 'missing' ? 200 : mode) : a.response(fields()));
        await a.schedule(a.context());
        assert.equal(a.requests.length, 2);
        assert.equal(a.requests[1].options.method, 'GET');
        assert.equal(a.canceled.length, 2);
        assert.ok(state(a).snapshot);
    }
});
test('errors never expose upstream exception or replace successful data; no needless auth retries', async () => {
    for (const code of [301, 302, 401, 403, 429, 500]) {
        const a = runtime();
        await a.schedule(a.context());
        a.setResponder(() => a.response(fields(), code));
        await a.schedule(a.context(start + HOUR));
        assert.equal(a.requests.length, 2);
        assert.equal(state(a).ok, start / 1000);
        assert.equal(state(a).points.length, 1);
        assert.ok(state(a).error);
        assert.match(text(await a.widget(a.context(start + HOUR))), /Saved data/);
    }
    const a = runtime();
    await a.schedule(a.context());
    a.setResponder(() => { throw new Error(fakeURL); });
    await a.schedule(a.context(start + HOUR));
    assert.equal(state(a).error.kind, 'network');
    assert.doesNotMatch(JSON.stringify({ view: await a.widget(a.context(start + HOUR)), storage: [...a.storage], logs: a.logs }), /fixture-only-private-value/);
});
test('missing header on both requests is a failed sample; scheduler silence also marks data stale', async () => {
    const a = runtime();
    await a.schedule(a.context());
    assert.match(text(await a.widget(a.context(start + 3 * HOUR))), /Saved data/);
    a.setResponder(() => a.response(null));
    await a.schedule(a.context(start + HOUR));
    assert.equal(state(a).error.kind, 'header');
    assert.equal(state(a).points.length, 1);
});
test('origin validation and capability gate fail closed before any request', async () => {
    const a = runtime();
    const base = a.context();
    for (const origin of ['https://subscription.example.test/path', 'https://subscription.example.test/?key=secret', 'https://name:password@subscription.example.test', 'http://subscription.example.test']) {
        const ctx = a.context();
        ctx.config.origin1 = origin;
        assert.match(text(await a.widget(ctx)), /matching HTTPS/);
        await a.schedule(ctx);
    }
    for (const url of ['https://another.example.test/', 'http://subscription.example.test/', 'https://name:password@subscription.example.test/', 'https://subscription.example.test/#fragment']) {
        a.setWidgets([{ id: 'one', widget: 'usage', config: { ...base.instance.config, url } }]);
        await a.schedule(a.context());
    }
    assert.equal(a.requests.length, 0);
    const cfg = base.instance.config;
    cfg.zone = 'Not/AZone';
    assert.throws(() => a.config(base.config, cfg));
    const old = source;
    const hook = vm.runInNewContext(old.replace(/\bexport (?=(?:const|async function)\b)/g, '') + ';widget;', { t: k => k, genkan: { capabilities: {} }, URL, Intl });
    assert.match(text(await hook(base)), /requires verified TLS/);
});
test('positive within-day deltas, zero deltas, resets, failures and long gaps', async () => {
    const a = runtime();
    let u = 100, d = 200;
    a.setResponder(() => a.response(fields(u, d)));
    await a.schedule(a.context());
    u += 50;
    d += 100;
    await a.schedule(a.context(start + HOUR));
    let s = state(a);
    assert.equal(s.days[0][4], 150);
    assert.equal(s.days[0][5], 3600);
    assert.equal(s.days[0][6], 1);
    await a.schedule(a.context(start + 2 * HOUR));
    assert.equal(state(a).days[0][6], 2);
    u = 10;
    d += 100;
    await a.schedule(a.context(start + 3 * HOUR));
    s = state(a);
    assert.equal(s.segment, 2);
    assert.equal(s.days[0][4], 150);
    u += 500;
    await a.schedule(a.context(start + 6 * HOUR));
    assert.equal(state(a).segment, 3);
    assert.equal(state(a).days[0][4], 150);
    a.setResponder(() => { throw new Error('offline'); });
    await a.schedule(a.context(start + 7 * HOUR));
    a.setResponder(() => a.response(fields(u + 100, d)));
    await a.schedule(a.context(start + 8 * HOUR));
    assert.equal(state(a).segment, 4);
    assert.equal(state(a).days[0][4], 150);
    const v = await a.widget(a.context(start + 8 * HOUR));
    assert.equal(v.body.filter(b => b.kind === 'line').length, 3);
});
test('midnight and DST do not invent daily allocation', async () => {
    const a = runtime();
    a.setWidgets([{ id: 'one', widget: 'usage', config: { url: fakeURL, zone: 'America/New_York' } }]);
    const midnight = Date.UTC(2026, 10, 1, 4);
    let n = 1;
    a.setResponder(() => a.response(fields(n++, 0)));
    await a.schedule(a.context(midnight - HOUR));
    await a.schedule(a.context(midnight));
    assert.equal(state(a).days[1][4], 0);
    await a.schedule(a.context(midnight + HOUR));
    await a.schedule(a.context(midnight + 2 * HOUR));
    await a.schedule(a.context(midnight + 3 * HOUR));
    const d = state(a).days[1];
    assert.equal(d[4], 3);
    assert.equal(d[5], 10800);
    assert.equal(d[6], 3);
});
test('same URL instances stay isolated, source changes reset, deleted/reconfigured in-flight samples are discarded', async () => {
    const a = runtime();
    a.setWidgets(['one', 'two'].map(id => ({ id, widget: 'usage', config: { url: fakeURL, zone: 'UTC' } })));
    await a.schedule(a.context());
    assert.equal(a.storage.size, 2);
    a.setWidgets([{ id: 'one', widget: 'usage', config: { url: fakeURL + '&new=1', zone: 'UTC' } }]);
    await a.schedule(a.context(start + HOUR));
    assert.equal(a.storage.size, 1);
    assert.equal(state(a).points.length, 1);
    a.setResponder(() => { a.setWidgets([]); return a.response(fields()); });
    await a.schedule(a.context(start + 2 * HOUR));
    assert.equal(state(a).points.length, 1);
    await a.schedule({ ...a.context(start + 3 * HOUR), config: { origin1: 'https://subscription.example.test' } });
    assert.equal(a.storage.size, 0);
});
test('five instance limit and independent failures', async () => {
    const a = runtime();
    a.setWidgets(['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id, widget: 'usage', config: { url: fakeURL + '&id=' + id } })));
    a.setResponder(url => { if (url.endsWith('a'))
        throw new Error('offline'); return a.response(fields()); });
    const result = await a.schedule(a.context());
    assert.equal(result.sampled, 4);
    assert.equal(result.failed, 1);
    assert.equal(result.limited, 1);
    assert.equal(a.requests.length, 5);
    assert.match(text(await a.widget(a.context(start, 'en', 'f'))), /at most five/);
});
test('quota unknown/unlimited/overage and expiry render without division by zero', async () => {
    for (const header of ['upload=1;download=2', 'upload=1;download=2;total=0;expire=0', 'upload=5;download=6;total=1;expire=1']) {
        const a = runtime();
        a.setResponder(() => a.response(header));
        await a.schedule(a.context());
        const v = await a.widget(a.context());
        assert.doesNotMatch(text(v), /NaN|Infinity/);
        assert.equal(v.body.some(b => b.type === 'progress'), header.includes('total=1;'));
    }
});
test('40-day compaction and five-instance worst-case budget preserve daily aggregates', async () => {
    const a = runtime();
    const ids = ['one', 'two', 'three', 'four', 'five'];
    a.setWidgets(ids.map(id => ({ id, widget: 'usage', config: { url: fakeURL } })));
    let n = 0;
    a.setResponder(() => a.response(fields(1000000000000 + n * 1000000, 2000000000000 + n * 2000000, 9000000000000000)));
    for (let hour = 0; hour < 40 * 24; hour++) {
        n++;
        await a.schedule(a.context(start + hour * HOUR));
    }
    const bytes = [...a.storage].reduce((sum, [k, v]) => sum + Buffer.byteLength(k + JSON.stringify(v)), 0);
    assert.ok(bytes < 200 * 1024, bytes);
    for (const [k, s] of a.storage) {
        assert.ok(Buffer.byteLength(k + JSON.stringify(s)) <= 40 * 1024);
        assert.ok(s.points.length <= 180);
        assert.ok(s.days.length <= 31);
        assert.ok(s.days.some(d => d[6] >= 20));
    }
    const ctx = a.context(start + 40 * DAY);
    ctx.instance.config.range = '30';
    const v = await a.widget(ctx);
    assert.ok(v.body.filter(b => b.kind === 'line').every(b => b.points.length <= 500));
    assert.ok(v.body.find(b => b.kind === 'bar').values.length <= 30);
});
test('timeout aborts the request and saves only a safe error category', async () => {
    const a = runtime({ fastTimeout: true });
    a.setResponder((_, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error(fakeURL)), { once: true })));
    await a.schedule(a.context());
    assert.equal(state(a).error.kind, 'network');
    assert.equal(a.requests[0].options.signal.aborted, true);
    assert.doesNotMatch(text(await a.widget(a.context())), /fixture-only-private-value/);
});
test('malformed persisted state recovers without breaking other instances', async () => {
    const a = runtime();
    await a.schedule(a.context());
    const bad = state(a);
    bad.points = [null];
    a.storage.set('usage:one', bad);
    assert.match(text(await a.widget(a.context())), /Waiting/);
    await a.schedule(a.context(start + HOUR));
    assert.equal(state(a).points.length, 1);
});
test('a one-byte observed increase never becomes a zero bar', async () => {
    const a = runtime();
    a.setResponder(() => a.response(fields(1, 0)));
    await a.schedule(a.context());
    a.setResponder(() => a.response(fields(2, 0)));
    await a.schedule(a.context(start + HOUR));
    const view = await a.widget(a.context(start + HOUR));
    assert.ok(view.body.find(b => b.kind === 'bar').values[0] > 0);
});
