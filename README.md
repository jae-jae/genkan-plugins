# Genkan Plugins

English | [简体中文](README.zh-CN.md)

A collection of plugins for [Genkan](https://github.com/jae-jae/genkan).

## Plugins

| Plugin | Description |
| --- | --- |
| [Codex Usage](plugins/codex-usage.js) | Shows your Codex subscription allowance, reset times, plan and available credits. Supports English and Chinese; refreshes every 5 minutes. |
| [Bitcoin Price](plugins/bitcoin-price.js) | Shows the Bitcoin price in USD or CNY, 24-hour change and update time. Supports English and Chinese; refreshes every 5 minutes. |

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

## Codex Usage settings

- **Access token:** After signing in to Codex with ChatGPT, copy the value at `~/.codex/auth.json → tokens.access_token`. Paste only the value, without quotes or other fields. Replace it when it expires. This is an account credential; keep it private and use a trusted Genkan instance.
- **Account ID:** Optional. Leave blank to use the account in the token.
- **Widget options:** Choose remaining or used allowance and a time zone. Defaults: remaining allowance, `Asia/Shanghai`.

The widget shows the quota windows returned by Codex. It queries only `chatgpt.com:443` and does not request bookmark permissions. It does not track ChatGPT chat messages or OpenAI API billing.

## Bitcoin Price settings

- **Quote currency:** USD by default; choose CNY in the widget settings to show the price in Chinese yuan.
- No API key is required. Prices and 24-hour changes come from CoinPaprika; update times are shown in UTC.

The plugin queries only `api.coinpaprika.com` and does not request bookmark permissions. It caches prices for 5 minutes. If a refresh fails, it shows the last saved price with a warning for up to one hour after the provider's update time. Older data produces an error instead of a price; provider data over 10 minutes old is marked as stale.

## Add a plugin

Add its JavaScript file to `plugins/`, register it in `genkan-plugins.json`, and update both READMEs. See the [Genkan plugin guide](https://github.com/jae-jae/genkan/blob/main/docs/PLUGIN_DEV.md).

Run tests with Node.js 22 or later:

```bash
npm test
```
