# Genkan 插件

[English](README.md) | 简体中文

用于 [Genkan](https://github.com/jae-jae/genkan) 的插件集合。

![Genkan 中的 Codex 用量和比特币价格小组件](docs/images/genkan-widgets.png)

## 插件

| 插件 | 介绍 |
| --- | --- |
| [Codex 用量](plugins/codex-usage.js) | 显示 Codex 订阅额度、重置时间、套餐和可用点数，支持中英文，每 5 分钟刷新。 |
| [比特币价格](plugins/bitcoin-price.js) | 显示比特币的美元或人民币价格、24 小时涨跌幅和更新时间，支持中英文，每 5 分钟刷新。 |
| [股票走势](plugins/stock-trend.js) | 显示指数或个股行情、日涨跌和最近一天／一个月／一年的走势图，默认纳斯达克综合指数，支持中英文，每 5 分钟刷新。 |
| [SSH 服务器](plugins/ssh-server.js) | 原生 SSH 采集 Linux 的 CPU、内存、根分区、网络速率与趋势，每 30 秒刷新；需要支持 SSH 的新版 Genkan。 |
| [机场订阅用量](plugins/subscription-usage.js) | 严格 TLS 校验，每小时记录订阅快照，展示 7／30 天趋势与每日可观测增量。 |

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

股票走势的安装地址：

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/stock-trend.js
```

SSH 服务器的安装地址（需要支持原生 SSH 的 Genkan 版本）：

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/ssh-server.js
```

机场订阅用量的本地安装（需要支持 `verifyTLS` 的 Genkan）：使用源文件 [plugins/subscription-usage.js](plugins/subscription-usage.js) 安装。本任务尚未发布此插件。

## Codex 用量设置

- **访问令牌：** 使用 ChatGPT 登录 Codex 后，从 `~/.codex/auth.json → tokens.access_token` 复制字段值。只粘贴值，不要带引号或其他字段，过期后重新填写。这是账户凭据，请妥善保管，仅用于可信的 Genkan 实例。
- **账户 ID：** 选填，留空使用令牌中的账户。
- **小组件选项：** 可切换剩余或已用额度，并设置时区。默认显示剩余额度，时区为 `Asia/Shanghai`。

小组件按 Codex 实际返回的额度窗口显示数据，仅请求 `chatgpt.com:443`，不申请书签权限。它不统计 ChatGPT 聊天消息数量或 OpenAI API 账单。

## 比特币价格设置

- **计价货币：** 默认显示美元价格，可在小组件设置中切换为人民币。
- 无需 API 密钥。价格及 24 小时涨跌幅来自 CoinPaprika，行情更新时间使用 UTC。

插件仅请求 `api.coinpaprika.com`，不申请书签权限，价格缓存 5 分钟。刷新失败时，会显示上次保存的价格并提示，但只保留数据源更新时间起一小时内的价格；超过一小时后显示错误。数据源超过 10 分钟未更新时会标注。

## 股票走势设置

- **股票或指数代码：** 默认 `^IXIC`（纳斯达克综合指数），也可填写 Yahoo Finance 代码，例如 `^NDX`（纳斯达克100指数）、`AAPL` 或 `MSFT`。
- **显示名称：** 选填，留空时使用股票代码或已知指数名称。
- **默认图表周期：** 默认最近一个月，可选择最近一天、一个月或一年。管理员也可直接点击卡片上的周期按钮。「1月」表示最近一个月，一日图显示最近可用交易时段。
- 无需 API 密钥。行情时间使用 UTC，价格可能延迟。日涨跌始终相对前一交易日收盘价计算，与图表周期无关；折线颜色反映所选区间首尾的价格方向，价格未做拆股或分红复权。

插件仅请求 `query1.finance.yahoo.com`、`query2.finance.yahoo.com`，不申请书签权限，不嵌入第三方网页。每个小组件缓存一份行情和走势，5 分钟内复用。请求失败时，可显示相同标的和周期的缓存并标注获取时间；此回退没有最大缓存年龄限制。Yahoo Finance 公开行情接口可能变更或限流。

## SSH 服务器设置

需要支持原生 SSH 的 Genkan 版本，旧版本会提示升级。每台 Linux 服务器添加一个小组件，无需安装远端 Agent 或使用 sudo。

- **主机：** 填写 Genkan 服务端可达的主机名或 IP，不含协议和端口；IPv6 地址不加方括号。
- **端口：** 默认 `22`。
- **用户：** 填写能读取 `/proc` 和根分区磁盘用量的 SSH 用户。
- **密码或私钥：** 选择一种认证方式。私钥需粘贴完整的 PEM/OpenSSH 内容，加密私钥另填口令；切换方式时清除原来的凭据。保存后不回显，使用 Genkan 现有存储机制，不额外加密磁盘上的配置。
- **显示名称：** 选填，留空时使用服务器主机名。

插件申请 SSH 资源采集权限，不申请 HTTP 或书签权限。连接时不确认或校验服务器主机密钥，每次执行固定的只读采集脚本，超时时间为 7 秒。

小组件显示 Linux 的 CPU、内存、根分区用量和网络总速率，不统计容器配额或其他挂载点；网桥和虚拟网卡可能导致网络流量重复计数。页面轮询时采集数据，第二次采样起显示 CPU 趋势，最多保留 30 分钟内的 60 个采样。连接失败时可显示 5 分钟内的缓存并标注采样时间；认证失败时直接显示错误。

## 机场订阅用量设置

`plugins/subscription-usage.js` 通过订阅服务的 `Subscription-Userinfo` 响应头读取上传、下载、配额与到期时间，每小时保存一次快照。支持最多 5 个独立小组件实例、中英文、7／30 天累计趋势及每日可观测增量；页面刷新每 5 分钟读取保存的数据，不会重复请求订阅服务。

**宿主要求：** Genkan 必须支持 `ConfigField.verifyTLS` 并提供 `genkan.capabilities.verifyTLS === true`。旧版本会显示升级提示并停止请求，不会降级为跳过证书校验。这项宿主能力需随本次宿主改动一起部署。

配置步骤：

1. 插件设置中的「授权来源 1–5」仅填写订阅服务的 HTTPS origin（协议、主机及可选端口），不带路径、查询参数、片段或用户名密码。不要把完整订阅链接填到这里。
2. 添加「机场订阅用量」小组件，选择对应来源，将完整订阅链接填入 **secret 类型的「订阅地址」**，再选填显示名。订阅地址的 origin 必须与来源匹配。
3. 图表默认 7 天，可在小组件设置切到 30 天；时区默认 `Asia/Shanghai`。修改订阅地址（包括令牌）或时区会重新建立历史。最多采样按实例 ID 排序的前 5 个实例，超限实例会显示提示。

网络只授权配置的 host:port，固定严格校验证书，不申请书签权限或 `permissions.fetch: ["*"]`。请求使用 `User-Agent: clash.meta`，先 HEAD；缺少有效计数或不支持 HEAD 时回退一次 GET。GET 仅取头并取消正文，不保存或展示节点内容。重定向被拒绝，请配置服务的最终 HTTPS 入口。401、403、429 不会立即重试。单个实例失败不影响其余实例。

已用量为 `upload + download`；两个字段缺失或非法时不记录新样本。`total=0` 显示不限量，缺少总配额显示未知；缺少或为零的到期时间显示未知，不推断续费周期。超额、到期与刷新失败会明确标记。失败时保留旧数据，并标注最后成功时间；超过两小时没有成功采样也会标旧。

累计趋势显示服务报告的计数快照。任一计数下降、失败或超过 90 分钟的采样缺口会切成新段，最多展示最近 3 段。每天的柱图只累计同一当地日期内连续、未重置的有效样本差值，排除跨午夜区间，不插值、不平摊停机期间流量。带 `*` 的日期均为部分观测，零只表示实际观测到无增长；没有有效区间的日期不画柱。最近观测日另显示覆盖小时数和区间数。**这不是精确账单统计，也不能回填安装前的历史。**

每实例独立存储，URL 不作为键或明文历史内容；仅保存 SHA-256 来源标识及数值状态。保留最近 7 天小时细节、最近 30 天每日聚合，每实例上限 40 KiB、5 实例合计不超过 200 KiB。已删除或超限实例的历史在下次调度清理。禁用插件或停止 Genkan 后不会继续采样。具有页面访问权限的访客可看到用量卡片，请按需配置 Genkan 访客访问权限。

本地验证：`npm test` 使用假数据；另可执行 `npm run test:host`，通过 Go overlay 在同级 `../genkan` 的真实 moejs 运行时中测试，不写入宿主测试文件。宿主 checkout 在其他位置时运行 `node tests/run-host-tests.mjs /path/to/genkan`。集成测试仅启动临时回环 HTTPS 服务并使用测试证书，不需要真实订阅或 Genkan token。

## 添加插件

将 JavaScript 文件放入 `plugins/`，在 `genkan-plugins.json` 中登记，并更新两份 README。开发方式见 [Genkan 插件指南](https://github.com/jae-jae/genkan/blob/main/skills/genkan/plugin-dev.md)。

使用 Node.js 22 或更高版本运行测试：

```bash
npm test
```
