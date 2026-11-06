import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
const source = readFileSync(new URL('../plugins/subscription-usage.js', import.meta.url), 'utf8');
const HOUR = 3600000, DAY = 24 * HOUR, start = Date.UTC(2026, 9, 1, 1);
const origin = 'https://subscription.example.test';
const fakeURL = 'https://subscription.example.test/sub?key=fixture-only-private-value';
const fields = (u = 100, d = 200, total = 10000) => `upload=${u}; download=${d}; total=${total}; expire=2000000000`;
function runtime({ fastTimeout = false, clock = Date, capabilities = { verifyTLS: true, scheduleWidgetFetch: true } } = {}) {
    const storage = new Map(), requests = [], logs = [], canceled = [];
    let widgets = [{ id: 'one', widget: 'usage', config: { origin, url: fakeURL, zone: 'UTC' } }], responder = () => response(fields());
    function response(header, status = 200) { return { status, ok: status >= 200 && status < 300, headers: new Headers(header == null ? {} : { 'Subscription-Userinfo': header }), body: { cancel: async () => canceled.push(true) } }; }
    const api = vm.runInNewContext(source.replace(/\bexport (?=(?:const|async function)\b)/g, '') + '\n;({manifest,messages,widget,schedule,parseHeader,fingerprint,config,record,blank,save});', {
        Date: clock, Intl, URL, Headers, TextEncoder, AbortController, setTimeout: fastTimeout ? fn => setTimeout(fn, 5) : setTimeout, clearTimeout,
        t: key => ({ en: key, zh: key }),
        fetch: async (url, options) => { requests.push({ url, options }); return responder(url, options); },
        genkan: { capabilities, widgets: { list: () => structuredClone(widgets) }, log: (...x) => logs.push(x), storage: {
                get: key => structuredClone(storage.get(key)), set: (key, value) => { const copy = structuredClone(value); const entries = new Map(storage); entries.set(key, copy); assert.ok([...entries].reduce((n, [k, v]) => n + Buffer.byteLength(k + JSON.stringify(v)), 0) <= 256 * 1024); storage.set(key, copy); },
                keys: () => [...storage.keys()], delete: key => storage.delete(key),
            } },
    });
    function context(time = start, lang = 'en', id = 'one') {
        return { now: time, locale: lang === 'zh' ? 'zh-CN' : 'en-US', config: {}, instance: { id, config: structuredClone(widgets.find(w => w.id === id)?.config || widgets[0]?.config || {}) },
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
    assert.equal(a.manifest.config, undefined);
    const field = a.manifest.widgets[0].config.find(f => f.key === 'origin');
    assert.ok(field.type === 'url' && field.allowFetch && field.verifyTLS);
    assert.equal(a.manifest.widgets[0].config.find(f => f.key === 'url').type, 'secret');
    assert.equal(a.manifest.schedules[0].every, 60);
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
    for (const invalidOrigin of ['https://subscription.example.test/path', 'https://subscription.example.test/?key=secret', 'https://name:password@subscription.example.test', 'http://subscription.example.test']) {
        const ctx = a.context();
        a.setWidgets([{ ...a.getWidgets()[0], config: { ...base.instance.config, origin: invalidOrigin } }]);
        ctx.instance.config.origin = invalidOrigin;
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
    a.setWidgets([{ id: 'one', widget: 'usage', config: { origin, url: fakeURL, zone: 'America/New_York' } }]);
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
    a.setWidgets(['one', 'two'].map(id => ({ id, widget: 'usage', config: { origin, url: fakeURL, zone: 'UTC' } })));
    await a.schedule(a.context());
    assert.equal(a.storage.size, 2);
    a.setWidgets([{ id: 'one', widget: 'usage', config: { origin, url: fakeURL + '&new=1', zone: 'UTC' } }]);
    await a.schedule(a.context(start + HOUR));
    assert.equal(a.storage.size, 1);
    assert.equal(state(a).points.length, 1);
    a.setResponder(() => { a.setWidgets([]); return a.response(fields()); });
    await a.schedule(a.context(start + 2 * HOUR));
    assert.equal(state(a).points.length, 1);
    await a.schedule({ ...a.context(start + 3 * HOUR), config: {} });
    assert.equal(a.storage.size, 0);
});
test('more than five instances are all sampled, with independent failures', async () => {
    const a = runtime();
    a.setWidgets(['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id, widget: 'usage', config: { origin: `https://${id}.example.test`, url: `https://${id}.example.test/sub?id=${id}` } })));
    a.setResponder(url => { if (url.endsWith('a'))
        throw new Error('offline'); return a.response(fields()); });
    const result = await a.schedule(a.context());
    assert.equal(result.sampled, 5);
    assert.equal(result.failed, 1);
    assert.equal(result.pending, 0);
    assert.equal(a.requests.length, 6);
    assert.equal((await a.widget(a.context(start, 'en', 'f'))).error, undefined);
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
test('40-day compaction and shared storage budget preserve daily aggregates', async () => {
    const a = runtime();
    const ids = ['one', 'two', 'three', 'four', 'five'];
    a.setWidgets(ids.map(id => ({ id, widget: 'usage', config: { origin, url: fakeURL } })));
    let n = 0;
    a.setResponder(() => a.response(fields(1000000000000 + n * 1000000, 2000000000000 + n * 2000000, 9000000000000000)));
    for (let hour = 0; hour < 40 * 24; hour++) {
        n++;
        await a.schedule(a.context(start + hour * HOUR));
    }
    const bytes = [...a.storage].reduce((sum, [k, v]) => sum + Buffer.byteLength(k + JSON.stringify(v)), 0);
    assert.ok(bytes <= 224 * 1024, bytes);
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

test('200 instances share the full storage budget including metadata; new and invalid instances rebalance old history', async () => {
    const a = runtime();
    const ids = Array.from({ length: 200 }, (_, i) => `widget-${String(i).padStart(3, '0')}`);
    const configs = ids.map((id, i) => ({ id, widget: 'usage', config: { origin, url: fakeURL + '&id=' + i, zone: 'UTC' } }));
    a.setWidgets(configs.slice(0, 5));
    a.storage.set('metadata', 'x'.repeat(12000));
    for (let i = 0; i < 5; i++) {
        const cfg = a.config({}, configs[i].config), s = a.blank(cfg.source);
        for (let h = 0; h < 180; h++)
            a.record(s, { u: 1000000000000 + h, d: 2000000000000 + h, total: 9000000000000000, expire: 2000000000 }, start / 1000 + h * 3600, 'UTC');
        a.save(ids[i], s, start / 1000 + 179 * 3600);
    }
    a.storage.set('usage:deleted', a.storage.get('usage:' + ids[0]));
    configs[0].config.origin = '1'; // migration must not prevent global compaction
    a.setWidgets(configs);
    a.setResponder(url => a.response(fields(Number(new URL(url).searchParams.get('id')), 200)));
    const now = start + 180 * HOUR;
    const result = await a.schedule(a.context(now));
    assert.equal(result.sampled, 199);
    assert.equal(result.failed, 1);
    assert.equal(a.storage.has('usage:deleted'), false);
    const bytes = [...a.storage].reduce((n, [k, v]) => n + Buffer.byteLength(k + JSON.stringify(v)), 0);
    assert.ok(bytes <= 224 * 1024, bytes);
    const quota = Math.floor((224 * 1024 - Buffer.byteLength('metadata' + JSON.stringify(a.storage.get('metadata')))) / 200);
    for (const id of ids) {
        const s = a.storage.get('usage:' + id);
        assert.ok(s.snapshot);
        assert.ok(Buffer.byteLength('usage:' + id + JSON.stringify(s)) <= quota);
    }
    assert.ok(a.storage.get('usage:' + ids[0]).points.length < 180);
    for (let i = 1; i < 200; i++)
        assert.equal(a.storage.get('usage:' + ids[i]).snapshot.u, i);
    const before = a.requests.length;
    await a.schedule(a.context(now + 60000));
    assert.equal(a.requests.length, before);
    a.setWidgets([configs[199]]);
    await a.schedule(a.context(now + 120000));
    assert.deepEqual([...a.storage.keys()].sort(), ['metadata', 'usage:' + ids[199]].sort());
});

test('bounded concurrency and oldest-first batches prevent 200 slow instances from starving', async () => {
    let clockTime = start, waiting = [], active = 0, peak = 0;
    class Clock extends Date { static now() { return clockTime; } }
    const a = runtime({ clock: Clock });
    const ids = Array.from({ length: 200 }, (_, i) => String(i).padStart(3, '0'));
    a.setWidgets(ids.map(id => ({ id, widget: 'usage', config: { origin, url: fakeURL + '&id=' + id } })));
    a.setResponder(url => new Promise((resolve, reject) => {
        active++;
        peak = Math.max(peak, active);
        waiting.push({ resolve, reject, id: Number(new URL(url).searchParams.get('id')) });
        if (waiting.length === 1) setImmediate(() => {
            clockTime += 8000;
            const batch = waiting.splice(0);
            for (const w of batch) {
                active--;
                if (w.id % 3 === 0) w.reject(new Error('synthetic failure'));
                else w.resolve(a.response(fields(w.id, 200)));
            }
        });
    }));
    let pending = 200;
    for (let minute = 0; pending && minute < 20; minute++) {
        clockTime = start + minute * 60000;
        const before = clockTime;
        const result = await a.schedule(a.context(clockTime));
        pending = result.pending;
        assert.ok(clockTime - before <= 45000, clockTime - before);
        assert.ok(result.sampled + result.failed > 0);
    }
    assert.equal(pending, 0);
    assert.equal(peak, 4);
    assert.equal(a.requests.length, 200);
    assert.equal(new Set(a.requests.map(r => r.url)).size, 200);
    assert.equal(a.storage.size, 200);
    assert.equal(a.storage.get('usage:199').snapshot.u, 199);
});

test('old slots show localized migration instructions and origin-only migration preserves history', async () => {
    const a = runtime();
    await a.schedule(a.context());
    const before = state(a);
    a.setWidgets([{ id: 'one', widget: 'usage', config: { origin: '1', url: fakeURL, zone: 'UTC' } }]);
    for (const lang of ['en', 'zh']) {
        const view = await a.widget(a.context(start, lang));
        assert.match(view.error, lang === 'en' ? /old slot number/ : /旧编号/);
    }
    const implicit = a.context();
    delete implicit.instance.config.origin;
    implicit.config.origin1 = origin;
    assert.match((await a.widget(implicit)).error, /old slot number/);
    await a.schedule(a.context(start + 60000));
    assert.deepEqual(state(a), before);
    assert.equal(a.requests.length, 1);
    a.setWidgets([{ id: 'one', widget: 'usage', config: { origin, url: fakeURL, zone: 'UTC' } }]);
    await a.schedule(a.context(start + HOUR));
    assert.equal(state(a).source, before.source);
    assert.equal(state(a).points.length, 2);
});

test('missing schedule-origin capability blocks requests without weakening TLS', async () => {
    const a = runtime({ capabilities: { verifyTLS: true } });
    await a.schedule(a.context());
    assert.equal(a.requests.length, 0);
    assert.match((await a.widget(a.context())).error, /Update Genkan/);
});

test('storage compression keeps recent daily snapshots visible when hourly detail is trimmed', async () => {
    const a = runtime(), cfg = a.config({}, a.context().instance.config), s = a.blank(cfg.source);
    for (let h = 0; h < 6 * 24; h++)
        a.record(s, { u: h, d: h, total: null, expire: null }, start / 1000 + h * 3600, 'UTC');
    a.save('one', s, start / 1000 + 143 * 3600, 1100);
    const saved = state(a);
    assert.ok(saved.points.length < 144);
    const view = await a.widget(a.context(start + 143 * HOUR));
    const points = view.body.filter(b => b.kind === 'line').flatMap(b => b.points);
    assert.ok(points.length > saved.points.length);
});
