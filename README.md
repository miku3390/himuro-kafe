# Himuro Kafe

**Your AI, Under One Roof.**

面向个人用户的异构 AI Harness 管理与协作平台（Personal AI Harness Orchestration Platform）。

Kafe 不创造新的 Agent，也不取代现有 Harness，而是把不同的 AI 执行环境组织在一起，让它们围绕用户目标协作。用户拥有 AI，用户决定 AI 如何协作，Kafe 负责让这一切有序运行。

## 核心原则

- **Kafe 管全局，Harness 管内部**；用户始终拥有最终控制权。
- **Local-first**：任务、配置、索引和执行记录保存在本地，断网时核心任务管理仍可运行。
- **双路由**：人工指定与自动路由并存，共用同一个 Task Manager 与执行协议。
- 所有跨 Harness 协作都通过 Kafe 中转，不允许 Harness 绕过 Kafe 直接修改其他 Harness 的任务状态。
- 不支持的能力明确显示「不支持」，不伪造状态。
- 第一版采用模块化单体，不做微服务或分布式系统。

## 架构概览

```text
User Interface (Desktop UI / Web UI / CLI)
        |
Orchestrator              任务理解 / 计划生成 / 路由建议
        |
Kafe Core / Control Plane 确定性控制：Task / Execution / Event / Policy
        |
Harness Layer             Registry / Adapter / Process Manager
        +------+------+------+
      Codex  Hermes  DSH   Other

Data Layer                SQLite / Workspace / File Index / Git
```

详见《Himuro Kafe 项目计划书》第 4 节。

## MVP 0.1

**One Interface, Multiple Harnesses, One Workflow.**

必须实现：

- 注册至少两个不同的 Harness
- 启动、发送任务、读取输出、取消执行
- 手动指定 Harness + 基于规则的自动路由
- 统一任务状态、执行记录与产物管理
- 一个 Harness 的结果可交给另一个 Harness
- CLI 操作完整闭环

## 里程碑

| 优先级 | 里程碑 | 目标 |
|---|---|---|
| P0 | M0 Core 与 Harness Adapter | Kafe 能注册并启动一个外部 Harness |
| P0 | M1 统一操作与数据读取 | 发送任务、读取输出、查看历史和产物 |
| P0 | M2 Orchestrator | 用户输入目标，AI 生成计划并分派 |
| P1 | M3 多 Harness 协作 | Harness 间求助机制 |
| P1 | M4 通信与数据协议 | 私聊、广播、任务请求、事件、文件管理 |
| P2 | M5 UI 与 Git 集成 | 普通用户可通过界面管理项目 |
| P2 | M6 Harness Registry | 发现、安装、更新和卸载 Harness |

## 技术选型（第一版）

Python · Typer (CLI) · FastAPI · SQLite · YAML 配置 · Git 版本管理 · asyncio subprocess 进程管理。UI 后续选择 Tauri 或 Web UI。

## 当前状态

设计阶段。下一步优先编写：

1. `docs/protocol.md` — Harness / Task / Execution / Event / Artifact 契约（**最优先**）
2. `docs/vision.md` — 产品定位、用户价值与边界
3. `docs/architecture.md` — 模块职责、数据流和运行方式

随后将 `docs/plan.md` 升级为路线图。

## 文档

- 项目计划书（总纲）：[`../Himuro_Kafe_项目计划书.md`](../Himuro_Kafe_项目计划书.md)
- 当前草案：[`docs/plan.md`](docs/plan.md)
