# 10 · 工具生态与协议

> MCP, A2A and the tool ecosystem　|　系统层 · 编排与生态　|　高频考点 · 上手门槛低 · 权重 ●●●●○

## 工程类比

MCP 之于 agent，类似 LSP / USB-C：把「工具、数据、提示」从每个应用的私有胶水变成标准协议。

> 在模型侧它仍然是普通的 function calling；MCP 解决的是工具从哪里来、如何被发现和协商、由谁执行——是集成层问题，不是能力层问题。

## 动效图解

![MCP 解决集成层：工具从哪来、怎么发现、由谁执行](figures/mcp.png)

**MCP 解决集成层：工具从哪来、怎么发现、由谁执行**

1. 模型这一侧没有任何变化：它仍然只是输出 tool_calls 意图。
2. 运行时把调用交给对应的 client。工具不再硬编码在你的代码里。
3. 协议提供三类原语：可执行的 tools、可读的 resources、可复用的 prompts，并支持动态发现。
4. 一次实现，多处复用：同一个 server 能被不同 agent 应用接入，这就是「USB-C」的意义。
5. 关键分层：MCP 不提升模型能力，只降低集成成本。能力上限仍然由模型与上下文决定。
6. 安全代价要认账：第三方 server 等于外部代码拿到你的上下文与执行权。要白名单、版本锁定、只读降级、全量审计。

> 动效结论：自建时把内部 API 网关包成一个按意图聚合的 server，比铺几十个零散 server 好得多。

网页版里这段可以逐帧播放：[「工具生态与协议」动效图解](../index.html#/m/mcp-tools)。

## 核心概念

### 三个角色　`host / client / server`

**host**：你的 agent 应用；**client**：host 内与单个 server 保持连接的连接器；**server**：对外暴露能力的一端。一次实现，多个应用复用。

### server 暴露什么

三类原语：**tools**（可执行动作）、**resources**（可读取的数据/文件）、**prompts**（可复用模板）。传输走本地 stdio 或远程 HTTP。

### 与 function calling 的分层

模型只认工具 schema 与 tool_calls；MCP 负责动态发现（list / subscribe）、参数协商、结果规范化。**这个分层是常考点**。

### 生态与自建

官方与社区 server 已覆盖数据库、代码仓库、文件、浏览器、可观测平台等。自建时优先把**内部 API 网关包成一个 server**，而不是几十个零散 server。

### 安全面

第三方 server 等于把数据与执行权交给外部代码：需要**来源白名单、只读降级、危险操作审批、调用审计**。已知真实风险包括工具描述注入、同名工具混淆、恶意 server 窃取上下文。

### agent 间协作

MCP 解决「agent ↔ 工具/数据」；agent 之间的任务协作是另一层（A2A 一类协议：能力卡片、任务生命周期、跨进程消息）。了解分层即可。

### 工具设计准则

按**用户意图**而非 API 端点划粒度；返回结构化精简数据；错误信息可行动；单个 server 内工具数控制在小几十以内并分组。

## 最小可用代码

> 写一个最小 MCP server：描述给模型看，返回值给代码用。

```python
from mcp.server.fastmcp import FastMCP
server = FastMCP("order-service")

@server.tool()
def get_order(order_id: str) -> dict:
    """按订单号查询状态与物流。仅用于已知订单号的场景；
    用户只给了手机号时先用 search_orders，不要猜订单号。"""
    o = repo.find(order_id)
    if not o:
        return {"ok": False, "error": "NOT_FOUND", "hint": "确认订单号，或改用 search_orders"}
    return {"ok": True, "status": o.status, "eta": o.eta,   # 只回模型需要的字段
            "items_count": len(o.items)}
```

文件名：`mcp_server.py`

## 常见坑

- 把内部 REST 的 60 个端点一比一映射成 60 个工具，模型选择困难。
- 工具返回整个 ORM 对象的序列化结果，把内部字段和敏感数据交给模型。
- 随手安装第三方 server，等于给它读取全部上下文的权限。
- 以为 MCP 提升了模型能力——它只降低集成成本，上限还是模型。

## 面试怎么问

**Q10.1　MCP 和 function calling 什么区别？**

A：function calling 是模型输出结构化调用意图的能力（模型 ↔ 运行时）；MCP 是运行时如何发现、协商、调用外部工具与数据的协议（运行时 ↔ 生态）。前者是能力，后者是集成标准。

**Q10.2　接入第三方 MCP server 你担心什么？**

A：数据外流与权限过宽、工具描述被注入从而操纵 agent 行为、供应链变更（server 更新即行为变更）。对策：白名单与版本锁定、只读降级、危险动作人工审批、全量调用审计。

**Q10.3　怎么给 agent 设计一个好工具？**

A：面向意图聚合、描述写清使用与不适用场景、参数用枚举与强类型、返回瘦身且带引用、错误可行动、幂等或走审批。

## 上手练习

- [ ] 把项目里一个内部服务包成 MCP server，只暴露 3 个按意图划分的工具，并写清「不适用场景」。
- [ ] 审查一个第三方 server 的工具描述，找出可被注入或诱导的措辞。

---

← 上一节：[9. 多智能体编排](09-multi-agent.md)

下一节：[11. 沙箱与执行环境](11-sandbox.md) →

