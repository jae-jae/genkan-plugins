# genkan-plugins

用于 [Genkan](https://github.com/jae-jae/genkan) 的插件集合。插件独立存放在 `plugins/`，后续新增插件也会在这里介绍。

## 插件列表

| 插件 | ID | 功能 | 源码 |
| --- | --- | --- | --- |
| [Codex 用量](#codex-用量) | `codex-usage` | 显示 ChatGPT 订阅中的 Codex 剩余额度、重置时间和套餐信息，支持中英文。 | [codex-usage.js](plugins/codex-usage.js) |

## 安装

在 Genkan 的「设置 → 插件 → 添加 → 第三方」中搜索 `genkan-plugins`，选择需要的插件。仓库使用 `genkan-plugin` 主题供插件市场发现；新仓库可能需要等待 GitHub 建立索引，Genkan 的市场缓存约为 10 分钟。

也可以使用插件的原始文件地址安装。Codex 用量的地址是：

```text
https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/codex-usage.js
```

通过 REST API 安装时，向 `POST /api/plugins` 发送以下 JSON，先保持插件禁用：

```json
{
  "url": "https://raw.githubusercontent.com/jae-jae/genkan-plugins/main/plugins/codex-usage.js",
  "enable": false
}
```

配置完成后，调用 `POST /api/plugins/codex-usage/test`，请求体为 `{"hook":"widget","target":"usage","lang":"zh"}`。确认 `ok: true`，且 `error`、`result.error` 均为空，再启用插件并添加小组件。接口认证方式见 [Genkan 开发指南](https://github.com/jae-jae/genkan/blob/main/docs/PLUGIN_DEV.md)。

## Codex 用量

查询 ChatGPT 订阅账户的 Codex 用量，在 Genkan 页面显示剩余或已用百分比、额度重置时间、套餐，以及接口提供的点数余额。默认每 5 分钟刷新，支持中英文和自定义时区。

额度窗口以接口实际返回的数据为准，例如 5 小时或 7 天。某个套餐未返回固定额度窗口时，小组件会说明暂无该项数据，不会将其显示为 100% 剩余。这里展示的是订阅中的 Codex 用量，不包含 OpenAI API 的用量账单或 ChatGPT 网页聊天的各模型消息计数。

### 插件配置

在「设置 → 插件 → Codex 用量」中填写：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `access_token` | 是 | ChatGPT/Codex 登录访问令牌，使用 `secret` 字段保存。不要填写 OpenAI API key。 |
| `account_id` | 否 | 指定 ChatGPT 账户或工作区 ID。留空时尝试读取令牌中的账户信息。 |

### 获取 access_token

使用 ChatGPT 账户登录 Codex 后，如果采用文件存储登录凭据，可从以下位置获取：

```text
~/.codex/auth.json → tokens.access_token
```

只复制这个字段的字符串值，不要带引号、字段名、其他 JSON 内容或终端输出。已设置 `CODEX_HOME` 时，文件位于 `$CODEX_HOME/auth.json`。使用系统凭据库保存登录信息的环境可能没有这个文件，详情见 [Codex 身份验证说明](https://learn.chatgpt.com/docs/auth?surface=cli)。

令牌过期后，需要在插件设置中更新。本插件不读取或保存 `refresh_token`，也不会自动续期。

### 小组件配置

启用插件后，在页面添加「Codex 用量」小组件，组件 ID 为 `usage`。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `timezone` | `Asia/Shanghai` | 重置时间和更新时间使用的 IANA 时区，如 `Europe/London`。 |
| `mode` | `remaining` | `remaining` 显示剩余额度，`used` 显示已用额度。 |

同一插件下的小组件共用插件配置中的账户令牌。

### 权限与数据

- 网络权限仅开放 `chatgpt.com:443`，通过 HTTPS GET 请求读取 `/backend-api/wham/usage`。
- 不申请链接读写权限，不修改书签、工作区或账户设置。
- 令牌不写入插件源码，不在小组件输出或插件日志中显示；令牌只发送给 ChatGPT 用量接口。
- 插件行为是只读查询，但 `access_token` 本身是账户凭据。仅在可信的自托管 Genkan 实例中配置，不要提交登录文件或令牌到仓库。

插件依赖 ChatGPT/Codex 的服务端用量接口；接口或认证方式变化时，可能需要更新插件。

### 常见问题

| 提示 | 处理方式 |
| --- | --- |
| 令牌格式无效 / `invalid_jwt` | 重新复制 `tokens.access_token` 的值，检查是否带入引号、空格或其他字段。 |
| 令牌过期 | 更新插件设置中的访问令牌。 |
| HTTP 401 | 检查令牌是否有效，以及是否填写了正确的账户 ID。 |
| HTTP 403 | 检查账户访问权限及 Genkan 服务器到 ChatGPT 的网络。 |
| HTTP 429 | 等待几分钟后重试。 |
| 连接失败或超时 | 检查 Genkan 服务器的网络连接。单次请求最多等待 8 秒。 |

## 开发与测试

本地测试需要 Node.js 22 或更高版本，不需要安装第三方依赖：

```bash
npm test
```

测试使用模拟数据，不需要真实令牌；它们覆盖中英文、额度计算、重置时间、账户选择、输入格式和接口错误处理。连接真实账户时，仍需在自己的 Genkan 实例上调用 `/test` 并检查插件日志。

```text
genkan-plugins/
├── plugins/                 # 每个插件一个独立的 JavaScript 文件
├── tests/                   # 插件测试
├── genkan-plugins.json      # 插件市场扫描入口
├── package.json             # 测试命令
└── README.md                # 插件目录、介绍和使用说明
```

### 添加更多插件

1. 将独立插件文件放入 `plugins/`，使用唯一且稳定的 `manifest.id`，界面文字提供中英文 `messages`。
2. 在 `genkan-plugins.json` 的 `plugins` 数组中添加文件路径。
3. 更新本 README 的插件列表，并补充功能、安装地址、配置字段、权限和使用说明。
4. 在 `tests/` 中添加对应测试，运行 `npm test`。
5. 在 Genkan 上以 `enable:false` 安装，测试每个钩子并查看日志，通过后再启用。更新已发布插件时提高版本号，保持插件 ID 和配置字段兼容。

插件格式和开发流程见 [Genkan 插件开发指南](https://github.com/jae-jae/genkan/blob/main/docs/PLUGIN_DEV.md)。
