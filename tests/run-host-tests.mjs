// Use a Go overlay so verification never writes tests into the host checkout.
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const host = resolve(process.argv[2] || join(root, '../genkan'));
const temp = mkdtempSync(join(tmpdir(), 'genkan-airport-sub-test-'));
try {
    const overlay = join(temp, 'overlay.json');
    writeFileSync(overlay, JSON.stringify({ Replace: {
            [join(host, 'internal/plugin/airport_subscription_external_test.go')]: join(root, 'tests/host/airport_subscription_test.go'),
        } }));
    const result = spawnSync('go', ['test', '-overlay', overlay, './internal/plugin', '-run', '^TestAirportSubscriptionRuntime', '-count=1', '-v'], {
        cwd: host, stdio: 'inherit', env: { ...process.env, AIRPORT_SUB_PLUGIN_SOURCE: join(root, 'plugins/airport-subscription.js') },
    });
    if (result.error)
        throw result.error;
    process.exitCode = result.status ?? 1;
}
finally {
    rmSync(temp, { recursive: true, force: true });
}
