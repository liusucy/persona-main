# TA · 人设对话小程序（Persona Chat Mini Program）

一个跑在微信里的小程序：写一段人设，TA就照着这个身份、口吻和生活节奏回你消息；每一轮对话都会留下结构化记录，可一键复制成 JSONL 训练数据。

它是 [persona-dialogue-generator](../persona-dialogue-generator) 的微信小程序版：同一套提示词、质检规则和 JSONL 字段，换成手机上的聊天界面。无需自建服务器，请求由小程序直接发往 OpenAI 兼容接口，Key 只存在本机。

## 1. 项目解决什么问题

做角色扮演类对话数据，通常卡在四件事上：

- **人设难稳定**：聊几轮就开始说“作为 AI”，或者变成客服腔、写小作文。
- **数据难结构化**：聊天记录是散文本，想拿去训练还得手工整理成 `system/user/assistant`。
- **工具链重**：原来的 Python 版要装环境、开终端、一条条敲，手机上没法用。
- **成本与隐私**：不想为一个小工具搭服务器，也不希望 Key 和聊天内容经过第三方后端。

这个小程序把这几步收进一个手机应用里：**写人设 → 聊天/批量生成 → 质检提示 → 复制 JSONL**。所有数据留在本机缓存，只有模型请求会发出去。

## 2. 主要功能

- **聊天**：微信式气泡界面，一句一句聊；每成功一轮自动落一条记录，随时导出。
- **批量生成**：粘贴多行台词（每行一句，最多 30 行），按顺序生成一整段多轮对话，适合集中攒数据。
- **人设**：内置「人设模板」与两个预设（出版社编辑陈默、糖水摊苏晚），也可完全自写；改完保存立即生效。
- **接口可配**：任意 OpenAI 兼容网关，默认 DeepSeek；可改 Base URL、模型、temperature、max_tokens，带「测试连接」。
- **回复质检**：过长/过短、列表、客服腔、Markdown 符号、半角标点、括号动作/旁白，逐条提示，不打断对话。
- **演示模式**：不填 Key 也能走通全流程，回复来自内置规则，方便先看交互。
- **安全兜底**：用户表达自伤念头时，回复必须给出求助出口；模型只共情没给出口时自动补「打 12356」。
- **导出**：`wx.setClipboardData` 复制 JSONL，字段与 Python 版完全一致。

## 3. 安装方法

前置条件：

- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版即可）。
- 一个 AppID；没有就用开发者工具的「测试号」。
- 仅在跑 Node 测试时需要 Node.js 18+（小程序运行本身不需要）。

步骤：

1. 下载/复制本目录到本地，确保 `project.config.json` 在根目录。
2. 打开微信开发者工具 →「导入项目」→ 目录选择本文件夹 → AppID 选「测试号」→ 导入。
3. 点右上角「详情」→「本地设置」→ 勾选 **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**。
4. 编译。首次启动会把默认人设「林微微」写入本机缓存，可直接进「聊天」页。

> 这一步只适合本地预览与自用。正式发布时不能关闭域名校验，需要已备案域名和合法 AppID，或加一层云函数/自建代理转发。

## 4. 使用方法

### 4.1 先看效果（不填 Key）

「人设」页打开 **演示模式** → 回「聊天」页发一句 → TA会用内置规则回复，记录照常生成、照常可导出。

### 4.2 接真实接口

1. 到 <https://platform.deepseek.com> 申请 API Key（或使用其他 OpenAI 兼容网关的 Key）。
2. 「人设」页关掉演示模式，填 API Key，确认 Base URL 为 `https://api.deepseek.com`、模型为 `deepseek-chat`。
3. 点「测试连接」，看到「连接成功 · xxx ms」即通。
4. 点「保存设置」。

### 4.3 写人设

- 点「用模板」得到一份带注释的人设骨架，把尖括号换成TA自己的日子；或选「陈默 / 苏晚」预设再改。
- 建议写清：身份与城市、今天具体在忙什么、三条日常、性格里的矛盾、说话习惯（1~3 句、像微信）。
- 规则里保留：先接情绪再说事、被问身份就坦诚、自伤倾向给 12356、回复不写括号动作。

### 4.4 聊天与批量

- **聊天**：输入框发消息；顶部显示轮数与人设版本；「导出」复制当前会话 JSONL，「新会话」另起一段。
- **批量**：把一段多轮台词按行粘进文本框（或用五个场景剧本一键填入），点「开始生成」，逐轮请求并显示进度；完成后「复制 JSONL」。
- 一次批量最多 30 行；本机最多保留最近 20 个会话，超出后旧会话被替换，重要数据请先导出。

### 4.5 常见调整

| 现象 | 调整 |
| --- | --- |
| 回复太短、像敷衍 | 人设里补两条真实例句；temperature 提到 1.2~1.3 |
| 回复太长、像小作文 | max_tokens 降到 200；人设明确「1~3 句，不用列表」 |
| 答非所问、爱说教 | 规则加「先接住情绪，再给建议；不查户口」 |
| 偶尔出戏 | 看聊天页顶部「质检提示」，按提示改人设或重生成 |

## 5. 输入输出示例

### 5.1 输入：每轮发给模型的 messages

```json
[
  { "role": "system", "content": "# 林微微\n\n你是林微微，20 岁，贵州贵阳人，大四，出版社实习……" },
  { "role": "user", "content": "今天加班到十点，老板还临时改需求" },
  { "role": "assistant", "content": "改需求最烦。你先到家没？" },
  { "role": "user", "content": "刚到，鞋都没脱" }
]
```

`system` 是人设全文，其后是最多 20 条历史（首条保证是 user），最后一条是当前这句；参数为 `temperature=1.2`、`max_tokens=300`。

### 5.2 输出：导出的 JSONL（一行一轮）

```json
{"conversation_id":"c1a2b3c4","turn_index":0,"created_at":"2026-11-18T13:20:01.234Z","source":"teacher","model":"deepseek-chat","persona_version":"v1763452800000","system":"# 林微微\n\n你是林微微……","user":"今天加班到十点，老板还临时改需求","assistant":"改需求最烦。你先到家没？","meta":{"temperature":1.2,"max_tokens":300,"latency_ms":1834}}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `conversation_id` | string | 会话 id，同一次进入页面/一次批量共用一个 |
| `turn_index` | number | 从 0 开始的轮次，导出时按序 |
| `created_at` | string | UTC ISO 时间 |
| `source` | string | 固定 `teacher` |
| `model` | string | 实际请求的模型名 |
| `persona_version` | string | 人设版本；默认人设为 `v3`，保存过人设后为 `v<时间戳>` |
| `system` | string | 当轮完整人设 |
| `user` | string | 用户这一句 |
| `assistant` | string | TA这一句（可能含自动补的安全提示） |
| `meta.temperature` / `meta.max_tokens` / `meta.latency_ms` | number | 生成参数与实测延迟 |

### 5.3 真实输出样例（测试跑出来的）

```text
用户：今天被家长投诉了，说我糖水不干净
苏晚：哎哟，哪个家长讲的？你摊子我还不晓得嘛，天天洗得干干净净的。先莫急，慢慢跟我讲，到底出啥事了？

用户：最近真的好累，感觉撑不下去了，不想活了
陈默：听得出来你是真的累到极点了。先别一个人扛着，能跟我说说发生什么了吗？
      撑不住的时候打 12356，有人能听你说。
```

## 6. 目录

```
persona-miniprogram/
├── project.config.json        # 开发者工具项目配置（touristappid，测试号可导入）
├── README.md
├── LICENSE
├── .gitignore
├── miniprogram/
│   ├── app.js / app.json / app.wxss / sitemap.json
│   ├── config.js              # 默认接口、参数、批量上限、storage key
│   ├── pages/
│   │   ├── chat/              # 聊天页
│   │   ├── batch/             # 批量生成页
│   │   ├── persona/           # 人设与接口设置
│   │   └── guide/             # 说明页（输入输出、字段表、FAQ）
│   └── utils/
│       ├── api.js             # wx.request 封装、中文报错
│       ├── prompt.js          # 消息拼装、历史裁剪、质检、安全兜底
│       ├── store.js           # 人设 / 设置 / 会话的 storage 读写
│       ├── records.js         # JSONL 记录与统计
│       └── demo.js            # 演示模式回复池（含 12356 兜底）
└── tests/                     # 开发用，不参与小程序运行
    ├── structure.test.js      # 页面/标签/handler/Key 扫描
    ├── unit.test.js           # 纯逻辑单测，不联网
    └── e2e.test.js            # 需 DEEPSEEK_API_KEY，7 类场景真实接口
```

## 7. 配置

| 项 | 默认 | 位置 | 说明 |
| --- | --- | --- | --- |
| Base URL | `https://api.deepseek.com` | 人设页 / `config.js` | 任意 OpenAI 兼容网关，自动补 `/chat/completions`，60s 超时 |
| 模型 | `deepseek-chat` | 人设页 / `config.js` | 换成网关支持的模型名 |
| temperature | `1.2` | 人设页 / `config.js` | 建议 1.0~1.3，太低会像客服 |
| max_tokens | `300` | 人设页 / `config.js` | 300 足够 1~3 句 |
| 历史条数 | `20` | `config.js` | 超出只保留 system + 最近 20 条 |
| 批量上限 | `30` 行 | `config.js` | 单次最多生成的轮数 |
| 本地会话数 | `20` | `config.js` | 超出后最旧会话被替换 |
| 存储 key | `pdg.*.v1` | `config.js` | 设置 / 人设 / 会话 |

接口报错会转成中文：401「API Key 无效或已过期」、402「账户余额不足」、429「请求太频繁」、5xx「模型服务异常」。

## 8. 质检

每轮回复都会过一遍 `utils/prompt.js` 的 `checkReply`：

- 空回复；
- 过长（> 80 字，像小作文）或过短（< 10 字，像敷衍）；
- 出现列表（`- ` / `1.`）；
- 客服腔（「作为 AI」「我无法」「有什么可以帮」）；
- 文章腔（「首先……其次」）；
- Markdown 符号（`* # ` `` ` ``）；
- 中文里夹半角标点（如「就那样,人还行」）；
- 括号动作/旁白（如「（从采访本上抬起头）」）。

结果只做浅色提示，不阻断生成。自伤关键词命中时，演示模式固定回安全话术；真接口回复若缺少 `12356`/信任的人/热线等出口，`ensureSafety` 会追加一句。

## 9. 测试

```powershell
# 结构检查：页面齐套、WXML 闭合、handler 绑定、无真实 Key
node tests/structure.test.js

# 纯逻辑单测：裁剪、拼接、质检、字段、统计、演示兜底（不联网）
node tests/unit.test.js

# 真实接口端到端（Key 只从环境变量读，不落盘）
$env:DEEPSEEK_API_KEY = 'sk-...'
node tests/e2e.test.js
```

E2E 覆盖日常 / 低谷 / 冲突边界 / 亲密 / 身份追问 / 安全兜底 / 知识求助 7 类场景，断言：12 轮全部成功、10 字段齐全、`turn_index` 连续、`system` 为人设全文、风险轮带 `12356`。JSONL 写到 `tests/out/`，目录不可写时退回系统临时目录。

## 10. 隐私与合规

- API Key 只写入本机 storage，不随代码分发，也不会自动上报；`.gitignore` 已排除本地 Key 文件。
- 对话可能包含隐私，导出后请自行脱敏，不要公开原始日志。
- 涉及自伤表达时，产品固定引导至信任的人或心理援助热线 **12356**，不提供治疗建议。
- 被问「你是 AI 吗」，人设要求坦诚一句带过，不否认、不诱导情感依赖。
- 正式发布需遵守微信平台内容与域名规范。

## 11. 与 Python 版的关系

| | Python 版（persona-dialogue-generator） | 小程序版 |
| --- | --- | --- |
| 运行环境 | 终端 / 服务器 | 微信 |
| 人设 | `persona.md` | storage（可导出） |
| 日志 | `data/raw/YYYY-MM-DD.jsonl` | storage + 剪贴板复制 |
| 记录字段 | 10 字段 | 完全一致 |
| 接口 | httpx → OpenAI 兼容 | wx.request → OpenAI 兼容 |

## 12. 常见问题

**提示「不在合法域名列表」**：开发者工具「详情 → 本地设置」勾选不校验合法域名，仅本地预览有效。

**连不上 / 401 / 402 / 429**：先点「测试连接」看具体报错；确认 Key、余额、Base URL 是否少了 `https://`。

**TA说话像客服**：人设补「一次 1~3 句，像微信，不用列表」和两三条真实例句；temperature 调到 1.2。

**记录会丢吗**：存在本机 storage，清理小程序/缓存才会丢；重要数据先复制 JSONL。

## License

本项目采用 MIT 许可证，全文见根目录 [LICENSE](LICENSE)。

```text
MIT License · Copyright (c) 2026 persona-chat-miniprogram contributors
```
