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
| [Subscription Usage](plugins/subscription-usage.js) | Hourly subscription snapshots, 7/30-day trends and observed daily increases with verified TLS. |

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

SSH Server installation URL (requires a Genkan build with native SSH support):

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/ssh-server.js
```

Subscription Usage installation URL (requires a Genkan build with `verifyTLS` support):

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/subscription-usage.js
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

## SSH Server settings

Requires a Genkan build with native SSH support; older versions show an upgrade message. Add one widget per Linux server. No remote agent or sudo is needed.

- **Host:** A hostname or IP reachable from the Genkan server, without a scheme or port. Omit brackets for IPv6 addresses.
- **Port:** Defaults to `22`.
- **User:** An SSH user that can read `/proc` and the root filesystem's disk usage.
- **Password or private key:** Supply one authentication method. Paste the complete PEM/OpenSSH private key and provide its passphrase if encrypted. Clear the previous credential when switching methods. Saved credentials are not displayed again; they use Genkan's existing storage without additional encryption at rest.
- **Display name:** Optional. Leave blank to use the server hostname.

The plugin requests SSH resource-collection permission, with no HTTP or bookmark access. It connects directly without confirming or verifying the server host key. Each collection runs a fixed read-only script with a 7-second timeout.

The widget shows Linux CPU, memory, root filesystem usage and combined network rates. Container quotas and other mount points are not covered; bridge and virtual interfaces may cause network traffic to be counted more than once. CPU history starts with the second sample and keeps up to 60 samples over 30 minutes while the page polls the widget. Connection failures can show saved readings for up to five minutes, marked with their sample time; authentication failures show an error instead.

## Subscription Usage settings

Requires a Genkan build with `verifyTLS` support and a subscription service that returns `Subscription-Userinfo`. Supports up to five subscriptions, sampled hourly, with English/Chinese cards and 7/30-day charts.

- **Allowed origin:** In plugin settings, enter the HTTPS scheme, host and optional port only, without a path or token.
- **Subscription URL:** In each widget, select that origin and paste the full private URL into the secret field. Use the final HTTPS URL; certificates are verified and redirects are refused.
- **Chart options:** Choose a display name, 7/30-day range and time zone (default `Asia/Shanghai`). Changing the URL or time zone starts a new history.

Failed updates retain the last reading and mark it stale. Daily increases cover only observed intervals; gaps and counter resets are excluded, so these are not billing totals. History starts after setup, and sampling pauses while Genkan or the plugin is stopped.

## Add a plugin

Add its JavaScript file to `plugins/`, register it in `genkan-plugins.json`, and update both READMEs. See the [Genkan plugin guide](https://github.com/jae-jae/genkan/blob/main/skills/genkan/plugin-dev.md).

Run tests with Node.js 22 or later:

```bash
npm test
```

For Subscription Usage integration tests against a sibling `../genkan` checkout, run `npm run test:host`.
