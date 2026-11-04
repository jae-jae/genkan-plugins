# Genkan 插件

[English](README.md) | 简体中文

用于 [Genkan](https://github.com/jae-jae/genkan) 的插件集合。

![Genkan 中的 Codex 用量和比特币价格小组件](docs/images/genkan-widgets.png)

## 插件

| 插件 | 介绍 |
| --- | --- |
| [Codex 用量](plugins/codex-usage.js) | 显示 Codex 订阅额度、重置时间、套餐和可用点数，支持中英文，每 5 分钟刷新。 |
| [比特币价格](plugins/bitcoin-price.js) | 显示比特币的美元或人民币价格、24 小时涨跌幅和更新时间，支持中英文，每 5 分钟刷新。 |

## 安装

1. 在 Genkan 中打开「设置 → 插件 → 添加 → 第三方」，搜索 `genkan-plugins`。
2. 安装插件，填写插件设置。
3. 启用插件，将小组件添加到页面。

也可以通过以下地址安装 Codex 用量：

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/codex-usage.js
```

比特币价格的安装地址：

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/bitcoin-price.js
```

## Codex 用量设置

- **访问令牌：** 使用 ChatGPT 登录 Codex 后，从 `~/.codex/auth.json → tokens.access_token` 复制字段值。只粘贴值，不要带引号或其他字段，过期后重新填写。这是账户凭据，请妥善保管，仅用于可信的 Genkan 实例。
- **账户 ID：** 选填，留空使用令牌中的账户。
- **小组件选项：** 可切换剩余或已用额度，并设置时区。默认显示剩余额度，时区为 `Asia/Shanghai`。

小组件按 Codex 实际返回的额度窗口显示数据，仅请求 `chatgpt.com:443`，不申请书签权限。它不统计 ChatGPT 聊天消息数量或 OpenAI API 账单。

## 比特币价格设置

- **计价货币：** 默认显示美元价格，可在小组件设置中切换为人民币。
- 无需 API 密钥。价格及 24 小时涨跌幅来自 CoinPaprika，行情更新时间使用 UTC。

插件仅请求 `api.coinpaprika.com`，不申请书签权限，价格缓存 5 分钟。刷新失败时，会显示上次保存的价格并提示，但只保留数据源更新时间起一小时内的价格；超过一小时后显示错误。数据源超过 10 分钟未更新时会标注。

## 添加插件

将 JavaScript 文件放入 `plugins/`，在 `genkan-plugins.json` 中登记，并更新两份 README。开发方式见 [Genkan 插件指南](https://github.com/jae-jae/genkan/blob/main/docs/PLUGIN_DEV.md)。

使用 Node.js 22 或更高版本运行测试：

```bash
npm test
```
