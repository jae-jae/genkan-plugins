# Genkan Plugins

English | [简体中文](README.zh-CN.md)

A collection of plugins for [Genkan](https://github.com/jae-jae/genkan).

![Codex Usage and Bitcoin Price widgets in Genkan](docs/images/genkan-widgets.png)

## Plugins

| Plugin | Description |
| --- | --- |
| [Codex Usage](plugins/codex-usage.js) | Shows your Codex subscription allowance, reset times, plan and available credits. Supports English and Chinese; refreshes every 5 minutes. |
| [Bitcoin Price](plugins/bitcoin-price.js) | Shows the Bitcoin price in USD or CNY, 24-hour change and update time. Supports English and Chinese; refreshes every 5 minutes. |
| [Stock Trend](plugins/stock-trend.js) | Shows index or stock quotes, daily changes and a price chart for the past day, month or year. Defaults to the Nasdaq Composite; supports English and Chinese; refreshes every 5 minutes. |
| [SSH Server](plugins/ssh-server.js) | Native SSH metrics for Linux: CPU, memory, root disk, network rates and history, refreshed every 30 seconds. Requires a Genkan build with SSH support. |

## Install

1. In Genkan, open **Settings → Plugins → Add → Third-party** and search for `genkan-plugins`.
2. Install a plugin and fill in its settings.
3. Enable it and add its widget to your page.

You can also install Codex Usage using this URL:

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/codex-usage.js
```

Bitcoin Price installation URL:

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/bitcoin-price.js
```

Stock Trend installation URL:

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/stock-trend.js
```

## Codex Usage settings

- **Access token:** After signing in to Codex with ChatGPT, copy the value at `~/.codex/auth.json → tokens.access_token`. Paste only the value, without quotes or other fields. Replace it when it expires. This is an account credential; keep it private and use a trusted Genkan instance.
- **Account ID:** Optional. Leave blank to use the account in the token.
- **Widget options:** Choose remaining or used allowance and a time zone. Defaults: remaining allowance, `Asia/Shanghai`.

The widget shows the quota windows returned by Codex. It queries only `chatgpt.com:443` and does not request bookmark permissions. It does not track ChatGPT chat messages or OpenAI API billing.

## Bitcoin Price settings

- **Quote currency:** USD by default; choose CNY in the widget settings to show the price in Chinese yuan.
- No API key is required. Prices and 24-hour changes come from CoinPaprika; update times are shown in UTC.

The plugin queries only `api.coinpaprika.com` and does not request bookmark permissions. It caches prices for 5 minutes. If a refresh fails, it shows the last saved price with a warning for up to one hour after the provider's update time. Older data produces an error instead of a price; provider data over 10 minutes old is marked as stale.

## Stock Trend settings

- **Ticker symbol:** Defaults to `^IXIC` (Nasdaq Composite). Use Yahoo Finance symbols such as `^NDX` (Nasdaq 100), `AAPL` or `MSFT` for other instruments.
- **Display name:** Optional. Leave blank to use the ticker or known index name.
- **Default chart period:** The past month by default; choose the past day, month or year. Administrators can also switch periods on the card. A one-day chart shows the latest available trading session.
- No API key is required. Quote times are shown in UTC, and prices may be delayed. Daily changes use the previous trading day's close, independently of the chart period. Chart colors follow the selected period's first-to-last price; prices are not adjusted for splits or dividends.

The plugin queries only `query1.finance.yahoo.com` and `query2.finance.yahoo.com`, with no bookmark permissions or embedded third-party pages. It caches one quote and chart per widget for 5 minutes. If a request fails, it can show the saved data for the same ticker and period with a cache-time warning; there is no maximum age for this fallback. Yahoo Finance's public chart endpoint may change or rate-limit requests.

## Add a plugin

Add its JavaScript file to `plugins/`, register it in `genkan-plugins.json`, and update both READMEs. See the [Genkan plugin guide](https://github.com/jae-jae/genkan/blob/main/docs/PLUGIN_DEV.md).

Run tests with Node.js 22 or later:

```bash
npm test
```

## SSH Server setup

Requires a Genkan build containing `genkan.ssh.stats()`; older builds show an upgrade message. Paste `plugins/ssh-server.js` into **Settings → Plugins → Add → Source**, keep it disabled, configure/test it, then enable and add the `resources` widget. You can also install it from the [plugin source URL](https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/ssh-server.js). The Genkan host must support the native SSH API before the widget can collect metrics.

1. Enter a host reachable from the Genkan server (bare hostname/IP; IPv6 without brackets), port (default 22), and an unprivileged user that can read `/proc`. No sudo is needed.
2. Supply either a password or a complete PEM/OpenSSH private key, plus its passphrase if encrypted. Clear the old credential when switching methods. All credentials are secret fields and stay blank after saving; they use Genkan's existing credential storage, without additional encryption at rest.
3. Add one instance per server, optionally with a display name. CPU history appears after the second sample, keeping up to 60 samples / 30 minutes. Sampling occurs while the widget is polled, not in a background job.

Requests **SSH resource-collection permission** only. This permits connections to supplied SSH hosts, including private networks, using supplied credentials; no HTTP or bookmark access is requested. Browsers never connect to SSH or run plugin code. The native API runs a fixed read-only script, skips server host-key verification without confirmation, and limits each call to 7 seconds.

Metrics cover visible Linux system resources, not necessarily container cgroup quotas. CPU uses a roughly one-second sample; memory is `MemTotal - MemAvailable`; disk is the root filesystem `/` with usage `used/(used+available)`; network sums non-loopback interfaces (bridge/veth may double-count). Requires sh, awk, cat, df, uname, tail, sleep and `/proc`; no remote agent. Windows/macOS, interface selection and other mount points are not supported.

Connection/timeout failures show a yellow saved-data state with the sample time, for at most five minutes. Authentication errors never fall back to saved success. Reboots or sampling gaps over 90 seconds start a new history segment. Cache contains no SSH credentials; full storage does not prevent live display.

Encrypted OpenSSH keys support up to 64 bcrypt rounds; higher costs return a clear error. Use a dedicated monitoring key.
