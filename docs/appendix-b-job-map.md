# 附录 B · 岗位地图：你的工程经验在哪一项上直接值钱

> WHERE YOU FIT

同一个「AI Agent 工程师」头衔下，实际是五种不同的工作。先选方向，再决定把哪几个模块做深。

> **在线交互版（岗位地图交互对比）：<https://ai-agent-knowledge-framework.pages.dev/#/jobs>**

> **关于「热度」：**下面是我基于常见 JD 的定性判断（哪类岗位出现得更频繁、要求更集中），不是统计数据。请以你目标城市/公司近 30 天的真实 JD 为准。

## 五类岗位对比

| 岗位 | 实际在做什么 | 招聘时看什么 | 切入成本 | 热度 |
| --- | --- | --- | --- | --- |
| **Agent 应用工程师**<br><sub>大模型应用工程师 / AI 应用开发 / LLM 应用</sub><br>[4. 工具调用](04-tool-calling.md) · [5. Agent 循环与推理范式](05-agent-loop.md) · [7. RAG 与知识接入](07-rag.md) · [8. 上下文工程](08-context-eng.md) · [3. 提示工程与结构化输出](03-prompting.md) | 把 agent 落到具体业务：工具接入、上下文组装、提示与结构化输出、效果调优 | 循环与护栏、工具设计、RAG、上下文工程、评测；能独立交付一个可用链路 | 低——你的工程能力直接复用，补的是概念与手感 | 最多 |
| **Agent 平台 / 基础设施**<br><sub>AI Infra（应用侧）/ 平台工程 / 工具与沙箱</sub><br>[10. 工具生态与协议](10-mcp-tools.md) · [11. 沙箱与执行环境](11-sandbox.md) · [13. 可观测性与运维](13-observability.md) · [9. 多智能体编排](09-multi-agent.md) | 给全公司提供 agent 底座：MCP 网关、沙箱与执行环境、模型路由、并发与配额、可观测 | 容器与隔离、协议、路由与降级、成本延迟治理、SDK 与开发者体验 | 低到中——最吃后端系统设计经验 | 中，上升 |
| **评测 / LLM Ops**<br><sub>Eval Engineer / 数据闭环 / 模型质量</sub><br>[12. 评测体系](12-evals.md) · [13. 可观测性与运维](13-observability.md) · [8. 上下文工程](08-context-eng.md) | 建评测集与判分体系、跑回归门禁、分析退化、做数据回流与人工校准 | 判分方式取舍、统计直觉（pass^k、方差）、LLM-as-judge 的偏差治理、可观测 | 低——常被当成「打杂」，做深了极稀缺 | 中，一线城市集中 |
| **算法工程师 · LLM 方向**<br><sub>后训练 / SFT / RL / 数据合成</sub><br>[12. 评测体系](12-evals.md) · [1. LLM 运行机制](01-llm-runtime.md) | 提升模型本身：领域后训练、agent 轨迹数据合成、奖励建模、推理能力优化 | 训练工程与分布式、论文复现、数据质量判断、评测设计 | 高——需要训练经验与数学基础，本框架只覆盖其工程侧 | 高门槛少量 |
| **AI 产品 / 解决方案 / FDE**<br><sub>AI PM / 前沿部署工程师 / 售前架构</sub><br>[5. Agent 循环与推理范式](05-agent-loop.md) · [12. 评测体系](12-evals.md) · [14. 安全、护栏与人工介入](14-safety.md) · [2. 上下文窗口与成本模型](02-context-window.md) | 判断哪些业务值得 agent 化、定义验收标准与人机协作、驻场把方案跑通 | 场景判断（workflow 还是 agent）、效果与成本权衡、演示与交付能力 | 低——技术判断力比写代码更重要 | 增长最快 |

## JD 关键词反查表

> 看到 JD 里出现左列的词，就直接去对应模块；这一表也能用来检查「我漏了哪块」。

| JD 里常见的写法 | 对应模块 |
| --- | --- |
| `ReAct / Plan-and-Execute / 推理范式` | [5. Agent 循环与推理范式](05-agent-loop.md) |
| `Function Calling / Tool Use / 工具编排` | [4. 工具调用](04-tool-calling.md) |
| `LangGraph / LangChain / OpenAI Agents SDK / AutoGen / CrewAI` | [5. Agent 循环与推理范式](05-agent-loop.md) |
| `RAG / 向量数据库 / Embedding / 重排 / 混合检索` | [7. RAG 与知识接入](07-rag.md) |
| `Agent 记忆 / 长期记忆 / MemGPT / Letta` | [6. 记忆系统](06-memory.md) |
| `上下文工程 / Context Engineering / 长任务压缩` | [8. 上下文工程](08-context-eng.md) |
| `MCP / Model Context Protocol / A2A` | [10. 工具生态与协议](10-mcp-tools.md) |
| `提示工程 / Prompt 优化 / 结构化输出 / JSON Schema` | [3. 提示工程与结构化输出](03-prompting.md) |
| `多智能体 / Multi-Agent / Orchestrator-Worker` | [9. 多智能体编排](09-multi-agent.md) |
| `沙箱 / 代码执行 / Browser Use / Computer Use / Coding Agent` | [11. 沙箱与执行环境](11-sandbox.md) |
| `评测 / Eval / LLM-as-judge / SWE-bench / GAIA / τ-bench` | [12. 评测体系](12-evals.md) |
| `可观测 / LangSmith / Langfuse / OpenTelemetry / 成本优化` | [13. 可观测性与运维](13-observability.md) |
| `安全 / 提示注入 / Guardrails / Human in the Loop` | [14. 安全、护栏与人工介入](14-safety.md) |
| `上下文窗口 / Token / 缓存 / 推理延迟` | [2. 上下文窗口与成本模型](02-context-window.md) |
| `微调 / LoRA / SFT / DPO / RLHF` | **算法侧，本框架不展开** |

## 把已有经验翻译成 agent 语言

> 简历与面试里最有力的一句话结构是：「我做过 X，所以在 agent 场景里我能直接负责 Y」。

| 你已经有的能力 | 在 agent 项目里对应的活 |
| --- | --- |
| **高并发服务与队列** | 工具调用并行化、限流退避、按任务分级的模型路由 |
| **缓存体系（Redis/CDN）** | prompt cache 前缀设计、语义缓存、检索结果复用 |
| **权限系统与审计日志** | 策略层默认拒绝、危险动作人工审批、调用审计 |
| **搜索 / 推荐召回排序** | RAG 的召回—融合—重排管线，recall@k 与 MRR |
| **APM / 链路追踪** | 以「一次推理」为单位的 trace、成本与步数看板 |
| **CI/CD 与测试金字塔** | 评测集 + 分数门禁 + 灰度 A/B + 影子流量 |
| **容器与 K8s** | 一次性沙箱、资源配额、快照回滚、环境即代码 |
| **分库分表 / 存储分层** | 记忆分层：上下文 / 会话状态 / 长期档案与 TTL |
| **前端流式渲染** | SSE 增量输出、TTFT 优化、中间状态可见性设计 |

## 三轮面试各考什么

### 技术一面　*概念与手感*

工具调用的真实往返、ReAct 与 workflow 的边界、pass@k 与 pass^k、MCP 与 function calling 的分层。答不出「模型不执行任何东西」这类底层事实会立刻减分。

### 技术二面　*系统设计与故障*

「设计一个客服 agent」类题目，以及追问：死循环怎么退出、上下文爆了怎么删、变贵了怎么排查、注入怎么防。**有可观测与评测数据的人在这一轮碾压。**

### 交叉 / 负责人面　*判断力*

哪些场景不该用 agent、怎么定义「做得好」、自主度给到哪一档、成本与效果的取舍怎么向业务解释。考的是决策而不是技术名词。

### 你的差异化　*建议主打*

三张牌：**评测体系**（能搭回归门禁）、**可观测与成本治理**（能拿数字说话）、**安全与权限**（能讲清爆炸半径）。这三项恰好是算法背景候选人的普遍短板。

