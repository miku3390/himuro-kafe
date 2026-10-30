# 多 Agent 工作台 · 设计草案 v0.1

> 一句话：**界面像群聊，协议像任务板。** 群聊只是人类阅读的视图，agent 之间靠任务文件 + 类型化事件协作。

## 1. 问题与边界

现状：Hermes（WSL，常驻网关）、DSH（扇，Windows）、Codex（CLI）各跑各的，跨 harness 没有协作面。

目标：发布任务 → 分派 → 执行 → 汇报 → 验收。全程可观察、可中断、可回溯。

非目标（第一版明确不做）：
- agent 之间自由聊天（群聊只做展示）
- 多机分布式调度
- 细粒度权限系统
- 无人值守长时间自主运行（会撞审批死锁，见 §9）

## 2. 架构

三层，自下而上：

```
协议层   workbench/ 目录 + wb CLI（任务、事件、产物）
适配层   worker 适配器：DSH / Codex / Hermes
视图层   TUI（dsh-tui 插件）+ 可选飞书通知
```

数据布局：

```
workbench/
  tasks/<id>.md          # front-matter + 验收标准 + 产物指针
  events/<id>.jsonl      # append-only，类型化
  artifacts/<id>/        # 产物本体
  agents/<name>/offset   # 各 agent 的读游标
  config.yaml            # 预算、超时、worker 能力表
```

## 3. 任务对象

front-matter：

```yaml
id: T-0007
title: 给 X 模块加 Y
status: open | claimed | in_progress | blocked | review | done | failed
owner: dsh | codex | hermes | null
created: 2026-10-31T00:00:00+08:00
lease_until: 2026-10-31T00:30:00+08:00
deps: [T-0005]
acceptance:
  - build 通过
  - 测试数 >= 40 且全绿
artifacts: [artifacts/T-0007/patch.diff]
budget_tokens: 200000
```

body 写背景、约束、不要碰的文件。

## 4. 事件（封闭集合）

`task.created` · `task.claimed` · `task.heartbeat` · `artifact.added` · `question` · `task.blocked` · `review.requested` · `review.approved` · `review.rejected` · `task.done` · `lease.expired`

统一字段：`ts / type / task / actor / payload`。

规则：

- 写前校验：只有 owner 能发 `heartbeat / artifact.added / question`
- 产物必须落盘，事件里只放路径 + ≤200 字摘要，**不贴正文**
- 同一问题连问 3 次 → 自动 `task.blocked`，等人
- 同一任务同时只有一个 owner；lease 到期未心跳自动回收
- 验收只能由人签，或 hub 代签并标记 `approved_by: hub`

## 5. 调度循环

1. 人建任务（TUI 或 `wb add`）
2. Hub 每 N 秒扫描：`open` 且依赖已 `done` → 按能力表选 worker → `claim`（写 owner + lease）
3. Worker 执行：读任务 → 干活 → 写产物 → 发事件 → `review.requested`
4. Hub 做机器验收（文件存在、hash、跑验收命令）→ 过则 `done`，不过则带理由打回
5. 人只看事件流，在关键节点批准/改派

Hub 本身不需要是 agent：一段确定性脚本就够。扇或 Hermes 只负责「人话」环节（拆任务、写验收标准）。

## 6. Worker 适配器契约

统一入口：`run(task, workdir) -> {events, artifacts}`

| Worker | 调用方式 | 注意 |
|---|---|---|
| DSH | `dst run -p --cwd <workdir> "<prompt>"` | 需审批的动作会卡住，只给 read-only / workspace-write |
| Codex | `codex exec --cd <workdir> "<prompt>"` | 非交互，退出码 + 输出都要收 |
| Hermes | `hermes -z "<prompt>" --in <workdir>` | oneshot，工具/记忆都在，输出只有最终文本 |

适配器只负责：拼 prompt、跑进程、把结果包成事件。Hub 只认事件，不解析各家 stdout 的花样。

## 7. TUI 视图

做成 dsh-tui 插件，复用现成接缝，不另造 TUI：

- 全屏场景 `workbench`：左看板（open / claimed / review / done），中事件流（群聊观感），右任务详情 + 产物 diff
- 底栏字段：活动任务数、本日花费
- 键位：`Enter` 打开 · `a` 批准 · `r` 打回 · `p` 暂停某 worker
- 先只读上线，操作面板后置

## 8. 里程碑

- **M0（1 天）**：目录协议 + CLI（add / claim / event / list），三个 agent 手工跑通一个任务
- **M1（1–2 天）**：Hub 循环 + 三个适配器 + lease/验收/打回
- **M2（2–3 天）**：TUI 插件只读视图
- **M3**：飞书通知（Hermes gateway 已有 feishu 平台），审批走飞书
- **M4（可选）**：共享记忆改成 HTTP 单实例 MCP；预算自动止损

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| token 爆炸 | 每任务预算；产物只传指针；禁止广播式自由文本 |
| 不收敛 | 事件集合封闭；question 升级；hub 超时强制打回 |
| 审批死锁 | worker 默认 read-only/workspace-write；越权操作转人工，不自动批准 |
| 跨平台路径 | 统一用相对 workdir；WSL 侧用 `/mnt/d/...`，Windows 侧用 `D:\...`，适配器内部转换 |
| 适配器脆弱 | 双通道：退出码 + 事件文件；stdout 只做日志 |

## 10. 待决

1. Hub 放哪：Windows 的 DSH 进程里，还是 WSL 的 Hermes 里（后者更接近「常驻」）
2. 总线形态：起步用文件（简单、可 diff），量大再换 HTTP
3. 要不要引入 A2A 协议：先不，自家协议跑通再说
4. 许可证

---

## 附：环境事实（2026-10-31 核对）

- DSH 0.2.1-rc.3 + dsh-tui 0.17.0；MCP 客户端支持 stdio / streamable-http，**stdio 每个客户端各起一个进程**，共享状态必须用 HTTP 单实例
- DSH 有动态工具更新：工具可在会话中途以 `tool-addition` 记录加入，`deferLoading: true` 标记延迟声明，默认 `deepseek-flash` 是 `addition-only`（能加不能删）
- Codex 0.163.0，`codex exec` 非交互、`codex mcp` 管 MCP
- Hermes：systemd 常驻 gateway，平台含 Telegram/Discord/WhatsApp/Weixin/Signal/QQ/元宝/**飞书**；`hermes serve` 为 JSON-RPC/WebSocket（默认 9119）
- dsh-tui 插件接缝：`ctx.tuiScenes` 全屏场景 · `ctx.tuiPanels` 侧栏 · `ctx.tuiStatus` 底栏字段
