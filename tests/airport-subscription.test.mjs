import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../plugins/airport-subscription.js', import.meta.url), 'utf8');
const GB = 1073741824;
const HOUR = 3600000;
const DAY = 24 * HOUR;
const start = Date.UTC(2026, 10, 7, 6, 0, 0); // 2026-11-07 06:00 UTC (14:00 Asia/Shanghai)
const secretToken = 'fixture-private-sub-token-9988';
const fakeURL = `https://sub.example.test/api/v1/client/subscribe?token=${secretToken}`;

const userinfo = (u = 5 * GB, d = 20 * GB, total = 100 * GB, expire = Math.floor((start + 30 * DAY) / 1000)) =>
  `upload=${u}; download=${d}; total=${total}; expire=${expire}`;

function createRuntime({ fastTimeout = false, clock = Date, capabilities = { secretFetch: true, scheduleWidgetFetch: true } } = {}) {
  const storage = new Map();
  const scratch = new Map();
  const requests = [];
  const logs = [];
  const canceled = [];
  let widgets = [{ id: 'w1', widget: 'sub', config: { url: fakeURL, zone: 'Asia/Shanghai' } }];
  let responder = () => makeResponse({ header: userinfo() });

  function makeResponse({ header = userinfo(), status = 200, extraHeaders = {} } = {}) {
    const h = new Headers(extraHeaders);
    if (header !== null && header !== undefined) h.set('Subscription-Userinfo', header);
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: h,
      body: { cancel: async () => { canceled.push(true); } },
    };
  }

  const exported = vm.runInNewContext(
    source.replace(/\bexport (?=(?:const|async function)\b)/g, '') +
      '\n;({ manifest, messages, widget, action, schedule, sha256, parseUserinfo, parseConfig, recordReading, blankState, saveState });',
    {
      Date: clock,
      Intl,
      URL,
      Headers,
      TextEncoder,
      TextDecoder,
      Uint8Array,
      AbortController,
      atob,
      btoa,
      setTimeout: fastTimeout ? (fn) => setTimeout(fn, 5) : setTimeout,
      clearTimeout,
      t: (key) => ({ en: key, zh: key }),
      fetch: async (url, options) => {
        requests.push({ url, options });
        return responder(url, options);
      },
      genkan: {
        capabilities,
        widgets: { list: () => structuredClone(widgets) },
        log: (...args) => logs.push(args),
        storage: {
          get: (k) => structuredClone(storage.get(k)),
          set: (k, v) => {
            const copy = structuredClone(valueCheck(v));
            const next = new Map(storage);
            next.set(k, copy);
            const totalBytes = [...next].reduce((n, [ek, ev]) => n + Buffer.byteLength(ek + JSON.stringify(ev)), 0);
            assert.ok(totalBytes <= 256 * 1024, `storage overflow: ${totalBytes}`);
            storage.set(k, copy);
          },
          keys: () => [...storage.keys()],
          delete: (k) => storage.delete(k),
        },
      },
    },
  );

  function valueCheck(v) {
    JSON.stringify(v);
    return v;
  }

  function context({ time = start, lang = 'en', id = 'w1', configOverride, actionName, params } = {}) {
    const found = widgets.find((w) => w.id === id);
    const cfg = structuredClone(configOverride ?? found?.config ?? {});
    if (!scratch.has(id)) scratch.set(id, new Map());
    const instMap = scratch.get(id);
    return {
      now: time,
      lang,
      locale: lang === 'zh' ? 'zh-CN' : 'en-US',
      config: {},
      action: actionName,
      params,
      instance: {
        id,
        config: cfg,
        storage: {
          get: (k) => structuredClone(instMap.get(k)),
          set: (k, v) => instMap.set(k, structuredClone(v)),
          delete: (k) => instMap.delete(k),
          keys: () => [...instMap.keys()],
        },
      },
      t: (key, p = {}) => {
        assert.ok(Object.hasOwn(exported.messages[lang], key), `missing i18n key ${lang}.${key}`);
        return exported.messages[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? `{${k}}`));
      },
    };
  }

  return {
    ...exported,
    context,
    storage,
    scratch,
    requests,
    logs,
    canceled,
    makeResponse,
    setResponder: (fn) => { responder = fn; },
    setWidgets: (list) => { widgets = structuredClone(list); },
  };
}

const json = (v) => JSON.stringify(v);

test('manifest, catalog registration, private secret URL policy and bilingual parity', () => {
  const rt = createRuntime();
  assert.deepEqual(Object.keys(rt.messages.en).sort(), Object.keys(rt.messages.zh).sort());
  assert.equal(rt.manifest.id, 'airport-subscription');
  assert.equal(rt.manifest.icon, 'plane');
  assert.equal(rt.manifest.permissions.fetch.length, 0);
  const urlField = rt.manifest.widgets[0].config.find((f) => f.key === 'url');
  assert.equal(urlField.type, 'secret');
  assert.equal(urlField.required, undefined);
  assert.equal(urlField.allowFetch, true);
  const catalog = JSON.parse(readFileSync(new URL('../genkan-plugins.json', import.meta.url), 'utf8'));
  assert.ok(catalog.plugins.includes('plugins/airport-subscription.js'));
  assert.equal(catalog.plugins.includes('plugins/subscription-usage.js'), false);
});

test('SHA-256 implementation matches Node crypto across ASCII, UTF-8 and long inputs', () => {
  const rt = createRuntime();
  for (const sample of ['', 'abc', '次元云机场 🚀', 'x'.repeat(1500), `${fakeURL}\nAsia/Shanghai`]) {
    assert.equal(rt.sha256(sample), createHash('sha256').update(sample).digest('hex'));
  }
});

test('Subscription-Userinfo parser handles real-world panel quirks and rejects malformed headers', () => {
  const rt = createRuntime();
  // Standard + reset_day
  const std = structuredClone(rt.parseUserinfo('upload=1024; download=2048; total=10240; expire=1800000000; reset_day=15'));
  assert.deepEqual(std, { u: 1024, d: 2048, t: 10240, e: 1800000000, r: 15 });

  // Empty expire / total (pay-as-you-go / never-expiring packages), floats and millisecond timestamps
  const flex = structuredClone(rt.parseUserinfo('UPLOAD=100.9, Download=200.2; total=; expire=1800000000000'));
  assert.deepEqual(flex, { u: 100, d: 200, t: null, e: 1800000000, r: null });

  const unlim = structuredClone(rt.parseUserinfo('upload=0; download=500; total=0; expire=0'));
  assert.deepEqual(unlim, { u: 0, d: 500, t: 0, e: 0, r: null });

  for (const bad of [
    null,
    '',
    'total=1000',
    'upload=100',
    'download=200',
    'upload=; download=100',
    'upload=-1; download=2',
    'upload=abc; download=2',
    'upload=1; download=2; upload=3',
    'upload=9007199254740991; download=5',
    'upload=1; download=2; expire=99999999999999999',
    'x'.repeat(4097),
  ]) {
    assert.throws(() => rt.parseUserinfo(bad));
  }
});

test('widget fetches live immediately on first load, auto-detects base64 profile-title, and never leaks secrets', async () => {
  const rt = createRuntime();
  const titleB64 = 'base64:' + Buffer.from('次元云 Pro', 'utf8').toString('base64');
  rt.setResponder(() => rt.makeResponse({
    header: userinfo(2 * GB, 18 * GB, 100 * GB, Math.floor((start + 42 * DAY) / 1000)),
    extraHeaders: { 'profile-title': titleB64 },
  }));

  const zhView = await rt.widget(rt.context({ lang: 'zh' }));
  assert.equal(zhView.error, undefined);
  assert.equal(zhView.title, '次元云 Pro');
  assert.equal(rt.requests.length, 1);
  assert.equal(rt.requests[0].options.method, 'HEAD');
  assert.equal(rt.canceled.length, 1);

  // Reuses fresh reading within TTL (zero extra requests when switching language)
  const enView = await rt.widget(rt.context({ lang: 'en', time: start + 60000 }));
  assert.equal(enView.error, undefined);
  assert.equal(enView.title, '次元云 Pro');
  assert.equal(rt.requests.length, 1);

  assert.ok(enView.body.some((b) => b.type === 'stats'));
  assert.ok(enView.body.some((b) => b.type === 'progress'));
  assert.ok(enView.body.some((b) => b.type === 'chart' && b.kind === 'bar' && b.values.length === 7));
  assert.ok(enView.body.some((b) => b.type === 'row' && b.children.length === 4));

  const dump = json({ zhView, enView, storage: [...rt.storage], logs: rt.logs });
  assert.doesNotMatch(dump, new RegExp(secretToken + '|sub\\.example\\.test'));
});

test('profile-title and Content-Disposition never echo secret URL fragments or generic boilerplate filenames', async () => {
  for (const extraHeaders of [
    { 'profile-title': secretToken },
    { 'profile-title': 'sub.example.test' },
    { 'profile-title': fakeURL },
    { 'content-disposition': 'attachment; filename="clash.yaml"' },
    { 'content-disposition': `attachment; filename="${secretToken}.yaml"` },
  ]) {
    const rt = createRuntime();
    rt.setResponder(() => rt.makeResponse({ extraHeaders }));
    const view = await rt.widget(rt.context({ lang: 'zh' }));
    assert.equal(view.title, '机场订阅');
    assert.doesNotMatch(json(view), new RegExp(secretToken + '|sub\\.example\\.test'));
  }

  // Valid RFC 5987 UTF-8 filename is accepted
  const rt = createRuntime();
  rt.setResponder(() => rt.makeResponse({
    extraHeaders: { 'content-disposition': "attachment; filename*=UTF-8''FlowerCloud%20HK.yaml" },
  }));
  const view = await rt.widget(rt.context({ lang: 'en' }));
  assert.equal(view.title, 'FlowerCloud HK');
});

test('unsaved /test scratch runs fetch live without leaving orphan keys in plugin storage', async () => {
  const rt = createRuntime();
  const view = await rt.widget(rt.context({ id: 'test', configOverride: { url: fakeURL, zone: 'UTC' } }));
  assert.equal(view.error, undefined);
  assert.equal(rt.requests.length, 1);
  assert.equal(rt.storage.size, 0);
});

test('HEAD rejections (403/404/405/501) or missing header fall back to GET; same-origin redirects work while cross-origin fails closed', async () => {
  for (const headMode of ['no-header', 400, 403, 404, 405, 501]) {
    const rt = createRuntime();
    rt.setResponder((_, opts) => {
      if (opts.method === 'HEAD') {
        return headMode === 'no-header'
          ? rt.makeResponse({ header: null, status: 200 })
          : rt.makeResponse({ header: null, status: headMode });
      }
      return rt.makeResponse({ header: userinfo() });
    });
    const view = await rt.widget(rt.context());
    assert.equal(view.error, undefined);
    assert.equal(rt.requests.length, 2);
    assert.equal(rt.requests[1].options.method, 'GET');
    assert.equal(rt.canceled.length, 2);
  }

  // Same-origin redirect works
  {
    const rt = createRuntime();
    rt.setResponder((url) => {
      if (!url.includes('step=2')) {
        return rt.makeResponse({ header: null, status: 302, extraHeaders: { Location: '/api/v1/client/subscribe?step=2&token=' + secretToken } });
      }
      return rt.makeResponse({ header: userinfo() });
    });
    const view = await rt.widget(rt.context());
    assert.equal(view.error, undefined);
    assert.equal(rt.requests.length, 2);
  }

  // Cross-origin redirect fails closed without leaking URL
  {
    const rt = createRuntime();
    rt.setResponder(() => rt.makeResponse({ header: null, status: 302, extraHeaders: { Location: 'https://cdn.other.test/sub' } }));
    const view = await rt.widget(rt.context({ lang: 'zh' }));
    assert.match(view.error, /其他域名/);
    assert.equal(rt.requests.length, 1);
  }
});

test('interactive actions switch 7D / 30D / Trend views without network and sync live on demand', async () => {
  const rt = createRuntime();
  let dl = 10 * GB;
  rt.setResponder(() => rt.makeResponse({ header: userinfo(1 * GB, dl, 100 * GB) }));

  await rt.widget(rt.context({ lang: 'zh' }));
  assert.equal(rt.requests.length, 1);

  // Switch to 30d bar chart (zero network calls)
  let res = await rt.action(rt.context({ lang: 'zh', actionName: 'view', params: { view: '30d' } }));
  assert.equal(rt.requests.length, 1);
  assert.equal(res.view.body.find((b) => b.type === 'chart').values.length, 30);

  // Switch to trend line chart (zero network calls)
  res = await rt.action(rt.context({ lang: 'zh', actionName: 'view', params: { view: 'trend' } }));
  assert.equal(rt.requests.length, 1);
  assert.equal(res.view.body.find((b) => b.type === 'chart').kind, 'line');

  // Manual sync fetches immediately even 10 seconds later, updating today's usage
  dl = 13.5 * GB;
  res = await rt.action(rt.context({ lang: 'zh', time: start + 10000, actionName: 'sync' }));
  assert.equal(rt.requests.length, 2);
  assert.match(res.toast, /已更新/);
  const todayStat = res.view.body.find((b) => b.type === 'stats').items[1];
  assert.equal(todayStat.value, '3.5');
  assert.equal(todayStat.unit, 'GB');

  // Invalid action throws localized error
  await assert.rejects(rt.action(rt.context({ lang: 'en', actionName: 'unknown' })), /Unsupported action/);
});

test('midnight proportional split, multi-hour same-day recovery, reset day countdown and daily budget', async () => {
  const rt = createRuntime();
  rt.setWidgets([{
    id: 'w1',
    widget: 'sub',
    config: { url: fakeURL, zone: 'Asia/Shanghai', resetDay: 15 },
  }]);

  // 2026-11-07 23:30 Asia/Shanghai = 2026-11-07 15:30 UTC
  const t2330 = Date.UTC(2026, 10, 7, 15, 30, 0);
  // 2026-11-08 00:30 Asia/Shanghai = 2026-11-07 16:30 UTC (crosses local midnight symmetrically!)
  const t0030 = t2330 + HOUR;
  // 2026-11-08 08:30 Asia/Shanghai = 8 hours later on the same calendar day
  const t0830 = t0030 + 8 * HOUR;

  let usedDl = 10 * GB;
  rt.setResponder(() => rt.makeResponse({ header: userinfo(0, usedDl, 100 * GB, Math.floor((t2330 + 180 * DAY) / 1000)) }));
  await rt.schedule(rt.context({ time: t2330 }));

  // +2 GB across 23:30 -> 00:30: 1 GB allocated to Nov 7, 1 GB allocated to Nov 8
  usedDl += 2 * GB;
  await rt.schedule(rt.context({ time: t0030 }));
  let saved = rt.storage.get('sub:w1');
  const nov7 = saved.days.find((d) => d[0] === '2026-11-07')[1];
  const nov8AfterMidnight = saved.days.find((d) => d[0] === '2026-11-08')[1];
  assert.equal(nov7 + nov8AfterMidnight, 2 * GB);
  assert.ok(Math.abs(nov7 - GB) < 2 * 1024 * 1024);

  // +4 GB over an 8-hour gap on the same day (2026-11-08): 100% preserved!
  usedDl += 4 * GB;
  await rt.schedule(rt.context({ time: t0830 }));
  saved = rt.storage.get('sub:w1');
  const nov8Total = saved.days.find((d) => d[0] === '2026-11-08')[1];
  assert.ok(Math.abs(nov8Total - 5 * GB) < 2 * 1024 * 1024);

  // Render on 2026-11-08 with resetDay=15 -> 7 days until reset, daily budget shown
  const view = await rt.widget(rt.context({ time: t0830, lang: 'zh' }));
  const stats = view.body.find((b) => b.type === 'stats').items;
  assert.equal(stats[2].label, '距重置');
  assert.equal(stats[2].value, '7');
  assert.equal(stats[2].unit, '天');
  assert.match(json(view), /日均可用/);
});

test('upstream failures preserve prior snapshot with yellow tone; expired/over-quota subscriptions show pink alert tone', async () => {
  const rt = createRuntime();
  await rt.widget(rt.context({ time: start }));

  // Upstream fails after TTL expires -> keeps cached data, sets yellow tone, hides raw error URL
  rt.setResponder(() => { throw new Error(fakeURL); });
  const staleView = await rt.widget(rt.context({ time: start + 20 * 60000, lang: 'zh' }));
  assert.equal(staleView.error, undefined);
  assert.equal(staleView.tone, 'yellow');
  assert.match(staleView.body[0].text, /缓存数据/);
  assert.doesNotMatch(json(staleView), new RegExp(secretToken));

  // Expired subscription -> pink tone
  const rtExp = createRuntime();
  rtExp.setResponder(() => rtExp.makeResponse({ header: userinfo(1 * GB, 2 * GB, 100 * GB, Math.floor((start - DAY) / 1000)) }));
  const expView = await rtExp.widget(rtExp.context({ time: start, lang: 'en' }));
  assert.equal(expView.tone, 'pink');
  assert.match(json(expView), /Expired/);
});

test('validation and host capability gates fail closed before making network requests', async () => {
  const rt = createRuntime();
  rt.setWidgets([{ id: 'w1', widget: 'sub', config: { url: '' } }]);
  const emptyView = await rt.widget(rt.context({ lang: 'zh' }));
  assert.equal(emptyView.error, undefined);
  assert.match(json(emptyView.body), /编辑小组件/);

  for (const badCfg of [
    { url: 'not-a-url' },
    { url: 'ftp://sub.example.test/a' },
    { url: 'https://user:pass@sub.example.test/a' },
    { url: 'https://sub.example.test/a#frag' },
    { url: 'https://*.example.test/a' },
    { url: fakeURL, zone: 'Invalid/Zone' },
    { url: fakeURL, resetDay: 0 },
    { url: fakeURL, resetDay: 32 },
  ]) {
    rt.setWidgets([{ id: 'w1', widget: 'sub', config: badCfg }]);
    const v = await rt.widget(rt.context());
    assert.ok(v.error);
    await rt.schedule(rt.context());
  }
  assert.equal(rt.requests.length, 0);

  for (const capabilities of [{}, { secretFetch: true }, { scheduleWidgetFetch: true }]) {
    const legacy = createRuntime({ capabilities });
    const v = await legacy.widget(legacy.context());
    assert.match(v.error, /Update Genkan/);
    assert.equal(legacy.requests.length, 0);
  }
});

test('200 instances fit within the 224 KiB shared storage budget with bounded 4-worker concurrency', async () => {
  let clockNow = start;
  let active = 0;
  let peak = 0;
  let pendingBatch = [];
  class FakeClock extends Date {
    static now() { return clockNow; }
  }

  const rt = createRuntime({ clock: FakeClock });
  const ids = Array.from({ length: 200 }, (_, i) => `inst-${String(i).padStart(3, '0')}`);
  rt.storage.set('meta-note', 'x'.repeat(8000));
  rt.storage.set('sub:deleted-orphan', { stale: true });
  rt.setWidgets(ids.map((id, i) => ({
    id,
    widget: 'sub',
    config: { url: `${fakeURL}&slot=${i}`, zone: 'UTC' },
  })));

  rt.setResponder((url) => new Promise((resolve) => {
    active++;
    peak = Math.max(peak, active);
    const slot = Number(new URL(url).searchParams.get('slot'));
    pendingBatch.push(() => {
      active--;
      resolve(rt.makeResponse({ header: userinfo(slot * 1024, 2048, 100 * GB) }));
    });
    if (pendingBatch.length === 1) {
      setImmediate(() => {
        clockNow += 2000;
        for (const fn of pendingBatch.splice(0)) fn();
      });
    }
  }));

  let remaining = 200;
  for (let pass = 0; remaining > 0 && pass < 10; pass++) {
    clockNow = start + pass * 60000;
    const out = await rt.schedule(rt.context({ time: clockNow }));
    remaining = out.pending;
  }

  assert.equal(remaining, 0);
  assert.equal(peak, 4);
  assert.equal(rt.storage.has('sub:deleted-orphan'), false);
  assert.equal(rt.requests.length, 200);

  const usedBytes = [...rt.storage].reduce((sum, [k, v]) => sum + Buffer.byteLength(k + JSON.stringify(v)), 0);
  assert.ok(usedBytes <= 224 * 1024, `budget exceeded: ${usedBytes}`);
  assert.equal(rt.storage.get('sub:inst-199').snap.u, 199 * 1024);
});
