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

## 添加插件

将 JavaScript 文件放入 `plugins/`，在 `genkan-plugins.json` 中登记，并更新两份 README。开发方式见 [Genkan 插件指南](https://github.com/jae-jae/genkan/blob/main/docs/PLUGIN_DEV.md)。

使用 Node.js 22 或更高版本运行测试：

```bash
npm test
```

## SSH 服务器设置

本插件需要包含 `genkan.ssh.stats()` 的 Genkan 主程序，旧版本会提示升级。当前源文件可在「设置 → 插件 → 添加 → 源码」中粘贴安装，**先保持禁用**，配置并测试成功后启用，再添加 `resources` 小组件。也可使用[插件源码地址](https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/ssh-server.js)安装；Genkan 主程序必须支持原生 SSH API 才能采集资源信息。

1. **主机、端口、用户：** 填写 Genkan 服务端可达的 SSH 主机（不含协议/端口，IPv6 不加方括号），默认端口 22。使用可读取 `/proc` 的普通用户，无需 sudo。
2. **认证：** 密码和完整 PEM/OpenSSH 私钥二选一。加密私钥另填口令；切换认证方式时清除原来的凭据。密码、私钥、口令均是 secret 字段，保存后不回显；使用 Genkan 现有凭据存储机制，不额外加密磁盘上的配置。
3. **每台服务器一个实例：** 可自定义名称。首次采样后显示读数，第二次起显示 CPU 趋势；最近 60 个采样最多覆盖 30 分钟，页面未轮询时不后台采集。

插件仅申请 **SSH 资源采集权限**，可用提供的凭据连接指定 SSH 主机，包括内网；不申请 HTTP/书签权限。浏览器不直接连接 SSH，也不执行插件代码。原生接口只执行固定只读脚本，跳过服务器主机密钥校验，无需确认，每次最多 7 秒。

统计范围：Linux 系统可见资源（不保证为容器 cgroup 配额）；CPU 为约 1 秒采样；内存为 `MemTotal - MemAvailable`；磁盘是根分区 `/`，占用百分比按 `used/(used+available)` 计算；网络为所有非回环接口合计，bridge/veth 可能重复计数。需要 sh、awk、cat、df、uname、tail、sleep 和 `/proc`，不需要安装远端 Agent。不支持 Windows/macOS、网卡选择或其他磁盘挂载点。

连接失败/超时会标黄并显示采样时间，最多回退到 5 分钟内的数据；认证错误不会回退为旧的成功状态。重启或超过 90 秒的采样间隔会重开趋势，避免连出虚假的连续曲线。实例缓存不包含 SSH 凭据；存储空间不足时仍显示实时读数。

加密 OpenSSH 私钥最多支持 64 轮 bcrypt；超出时明确报错，建议使用单独的监控密钥。
