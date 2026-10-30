# himuro-kafe

多 Agent 工作台：把「群聊」当视图，把任务板当协议。

Hermes（WSL 网关）、DSH（扇）、Codex（CLI）三个 harness 通过任务文件与类型化事件协作；人只在验收门出现。

## 状态

设计草案阶段，协议尚未定稿。

- 设计文档：[`docs/plan.md`](docs/plan.md)
- 当前里程碑：M0（目录协议 + CLI，手工跑通一个任务）

## 目录（规划中）

```
workbench/
  tasks/<id>.md          # 任务 front-matter + 验收标准
  events/<id>.jsonl      # append-only，类型化事件
  artifacts/<id>/        # 产物本体
  agents/<name>/offset   # 各 agent 读游标
  config.yaml            # 预算、超时、worker 能力表
```

## 一句话原则

界面可以像群聊，协议不能像群聊。agent 之间只传结构化事件与产物指针，不传自由文本。
