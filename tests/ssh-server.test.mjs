import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../plugins/ssh-server.js', import.meta.url), 'utf8');
const now = Date.UTC(2026, 10, 6, 8);
const sample = { hostname: 'test-server', kernel: '6.8', arch: 'x86_64', cores: 4, collectedAt: now,
  cpuPercent: 30, uptimeSeconds: 90061, load: [0.4, 0.3, 0.2],
  memory: { usedBytes: 6 * 1024 ** 3, totalBytes: 8 * 1024 ** 3, percent: 75 },
  disk: { mount: '/', usedBytes: 100 * 1024 ** 3, totalBytes: 250 * 1024 ** 3, percent: 40 },
  network: { rxBytesPerSecond: 2048, txBytesPerSecond: 1024 } };
function runtime(collect = async () => structuredClone(sample)) {
  const storage = new Map(), calls = [];
  const api = vm.runInNewContext(source.replace(/\bexport (?=(?:const|async function)\b)/g, '') + '\n;({messages, manifest, widget});', {
    Intl, Date, t: key => key,
    genkan: { ssh: { stats: async options => { calls.push(options); return collect(options); } } },
  });
  const ctx = (lang = 'en', at = now) => ({ now: at, locale: lang === 'zh' ? 'zh-CN' : 'en-US',
    t: (key, params = {}) => { assert.ok(key in api.messages[lang], key); return api.messages[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)); },
    instance: { config: { host: 'server.example', username: 'monitor', password: 'secret-test-password' },
      storage: { get: k => storage.get(k), set: (k, v) => storage.set(k, structuredClone(v)) } },
  });
  return { ...api, ctx, storage, calls };
}

test('permissions, catalog and secret fields', () => {
  const r = runtime();
  assert.equal(r.manifest.permissions.ssh, true);
  assert.equal(r.manifest.widgets[0].config.some(f => f.key === 'fingerprint'), false);
  assert.equal(r.manifest.permissions.fetch, undefined);
  assert.equal(r.manifest.widgets[0].refresh, 30);
  assert.equal(r.manifest.widgets[0].config.find(f => f.key === 'privateKey').multiline, true);
  assert.deepEqual(Object.keys(r.messages.en).sort(), Object.keys(r.messages.zh).sort());
  const catalog = JSON.parse(readFileSync(new URL('../genkan-plugins.json', import.meta.url)));
  assert.ok(catalog.plugins.includes('plugins/ssh-server.js'));
});
for (const lang of ['en', 'zh']) test(`${lang}: live data, localized units, and secrets stay out of views/storage`, async () => {
  const r = runtime();
  const view = await r.widget(r.ctx(lang));
  assert.equal(view.error, undefined);
  assert.equal(view.title, 'test-server');
  assert.equal(view.body[1].items[0].value, '30');
  assert.equal(view.body[1].items[1].value, '75');
  assert.equal(view.body[4].value, 0.75);
  assert.match(view.body[6].items[0].value, /2 KiB/);
  assert.match(view.body[8].text, /UTC/);
  assert.doesNotMatch(JSON.stringify([view, ...r.storage.values()]), /secret-test-password/);
  assert.equal(r.calls[0].password, 'secret-test-password');
});

test('history uses sample timestamps, caps size, resets after gaps/reboots and isolates hosts', async () => {
  let at = now;
  let uptime = 90061;
  const r = runtime(async () => ({ ...sample, collectedAt: at, uptimeSeconds: uptime }));
  for (let i = 0; i < 70; i++) { at = now + i * 30000; await r.widget(r.ctx('en', at)); }
  assert.equal(r.storage.get('snapshot').history.length, 60);
  at += 120000;
  let v = await r.widget(r.ctx('en', at));
  assert.equal(v.body[3].type, 'text');
  at += 30000;
  v = await r.widget(r.ctx('en', at));
  assert.equal(v.body[3].points.length, 2);
  uptime = 10; at += 30000;
  await r.widget(r.ctx('en', at));
  assert.equal(r.storage.get('snapshot').history.length, 1);
  const ctx = r.ctx('en', at); ctx.instance.config.host = 'other.example';
  await r.widget(ctx);
  assert.equal(r.storage.get('snapshot').history.length, 1);
});

test('offline fallback expires; host-key and auth failures never show saved success', async () => {
  let error;
  const r = runtime(async () => { if (error) throw new Error(error); return sample; });
  await r.widget(r.ctx());
  error = 'SSH_CONNECT';
  let v = await r.widget(r.ctx('zh', now + 60000));
  assert.equal(v.tone, 'yellow');
  assert.match(v.body[0].text, /连接中断/);
  assert.ok((await r.widget(r.ctx('en', now + 300000))).error);
  const c = r.ctx(); c.instance.config.host = 'other.example';
  assert.ok((await r.widget(c)).error);
  for (error of ['SSH_HOST_KEY', 'SSH_HANDSHAKE', 'SSH_KEY', 'SSH_DATA', 'private server exception secret']) {
    v = await r.widget(r.ctx()); assert.ok(v.error); assert.equal(v.body.length, 0);
    assert.doesNotMatch(JSON.stringify(v), /private server exception secret/);
  }
});

test('invalid results, missing setup and full storage degrade clearly', async () => {
  for (const data of [null, {}, { ...sample, cpuPercent: NaN }, { ...sample, collectedAt: now - 60000 }]) {
    const r = runtime(async () => data);
    assert.ok((await r.widget(r.ctx())).error); assert.equal(r.storage.size, 0);
  }
  const r = runtime(); const ctx = r.ctx(); ctx.instance.config = {};
  assert.ok((await r.widget(ctx)).error); assert.equal(r.calls.length, 0);
  const full = r.ctx(); full.instance.storage.set = () => { throw new Error('full'); };
  assert.equal((await r.widget(full)).error, undefined);
});

for (const method of ['password', 'privateKey']) test(`${method}: connects without a fingerprint and ignores legacy saved fingerprints`, async () => {
  const r = runtime();
  const ctx = r.ctx();
  if (method === 'privateKey') {
    delete ctx.instance.config.password;
    ctx.instance.config.privateKey = 'test-private-key';
  }
  assert.equal((await r.widget(ctx)).error, undefined);
  ctx.instance.config.fingerprint = 'obsolete-fingerprint';
  assert.equal((await r.widget(ctx)).error, undefined);
  assert.equal(r.calls.length, 2);
  for (const options of r.calls) {
    assert.equal(Object.hasOwn(options, 'fingerprint'), false);
    assert.ok(options[method]);
  }
});
