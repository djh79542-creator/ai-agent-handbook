# 09 · 多智能体编排

> Multi-agent systems　|　系统层 · 编排与生态　|　加分项 · 门槛较高 · 权重 ●●●○○

## 工程类比

多智能体 = 微服务 + 消息总线：拆分换来上下文隔离与并行，代价是通信损耗和调试难度。

> 和微服务一样，过早拆分是多数团队踩的坑。先做单体 + 好工具，确实撞到上下文/权限/并行瓶颈再拆。

## 动效图解

![多智能体：拆的是上下文与权限，不是人设](figures/topology.png)

**多智能体：拆的是上下文与权限，不是人设**

1. 主管只做三件事：把任务拆成可独立验证的子问题、派发、合并结论。它不亲自干活。
2. 拆分的正当理由只有三个：上下文噪声需要隔离、工具权限需要分开、子任务可以并行。
3. 每个 worker 有自己的上下文窗口与工具白名单——这才是并行带来的真实收益。
4. 回传必须是结构化结论（答案 + 证据 + 置信度 + 未决问题），不是全量历史。传历史 = 成本相乘。
5. 低置信度要触发重做或仲裁，而不是直接采纳——否则上游幻觉会被下游当事实放大。
6. 共享产物要单写者或带版本合并。两个 worker 同时写同一文件，是这类系统最常见的低级事故。
7. 如果任务本身单 agent 就能做对，多 agent 只会更贵、更难调试。先上 trace，再考虑拆。

> 动效结论：收益 = 上下文隔离 + 并行；代价 = 通信损耗 + 调试难度。和微服务完全同构。

网页版里这段可以逐帧播放：[「多智能体编排」动效图解](../index.html#/m/multi-agent)。

## 核心概念

### 四种拓扑

**orchestrator-worker**（主管拆解分发，最常用）、**pipeline**（顺序交接）、**handoff**（对等转交，如客服转技术支持）、**blackboard**（共享状态各自认领）。

### 按什么拆

按**上下文噪声**拆（探索型任务隔离）、按**工具与权限**拆（只读 vs 可写）、按**可并行性**拆（独立子任务）。不要按「角色人设」拆——三个扮演产品/开发/测试的 agent 互相吹捧只是浪费 token。

### 通信契约

agent 之间传**结构化结论**（schema 化的结果 + 依据 + 未决问题），不传全量历史。契约不清是多 agent 系统崩坏的起点。

### 并行与聚合

map-reduce 式扇出扇入；fan-in 需要裁决策略（投票、评分、主管合并），并处理部分失败。

### 典型失败模式

交接中上下文丢失、两个 agent 互相甩锅形成环、成本随 agent 数相乘、上游幻觉被下游当事实放大（错误放大）。

### 共享状态与写冲突

多 agent 写同一份产物会互相覆盖。要么单写者（主管持有唯一编辑权），要么带版本号的合并。

### 可观测优先

必须能看清「哪一步是哪个 agent 做的、输入输出是什么」，否则无法调试。先上 trace，再上多 agent。

## 最小可用代码

> worker 返回结构化结论，主管只做分解与合并——这是最稳的多 agent 形态。

```python
WORKER_OUT = {
    "type": "object",
    "required": ["answer", "evidence", "confidence", "open_questions"],
    "properties": {
        "answer":   {"type": "string"},
        "evidence": {"type": "array", "items": {"type": "string"}},  # 可回溯
        "confidence": {"type": "number"},
        "open_questions": {"type": "array"}                          # 主管据此决定是否再派
    }
}

def orchestrate(task, subtasks):
    with ThreadPoolExecutor(max_workers=4) as ex:
        results = list(ex.map(lambda s: worker(s, out_schema=WORKER_OUT), subtasks))
    weak = [r for r in results if r["confidence"] < 0.6]
    if weak and not exhausted(task):
        results += orchestrate_replan(task, weak)   # 低置信度重做，而不是直接采纳
    return merge_by_schema(task, results)
```

文件名：`orchestrator.py`

## 常见坑

- 给每个 agent 一段人设 prompt，却没有不同的工具集或上下文——等于白拆。
- 交接时把整段历史转发，成本相乘，噪声也相乘。
- 没有全局预算，agent 之间互相调用形成失控递归。
- worker 直接写共享文件，两个 worker 互相覆盖。
- 把「多 agent」当卖点写进方案，但任务本身单 agent 就能 95% 完成。

## 面试怎么问

**Q9.1　单 agent 还是多 agent，你怎么判断？**

A：看三点：上下文是否会互相污染、工具权限是否需要隔离、子任务能否并行且可独立验证。若都不成立，用单 agent + 多工具，成本更低更好调试。

**Q9.2　多 agent 系统怎么调试？**

A：每个 agent 独立 trace + 全局 run id 串联；固定随机性与外部副作用以支持重放；给交接消息加 schema 校验，把「契约违反」显式报错而不是继续跑。

**Q9.3　如何防止错误被下游放大？**

A：传递时带证据与置信度、下游要求可核验引用、低置信度触发重做或仲裁、最终结果由验证环节（测试/规则/评审）把关。

## 上手练习

- [ ] 实现一个 orchestrator-worker：3 个并行 worker 处理不同子问题，主管合并并处理低置信度。
- [ ] 记录一次多 agent 失败案例，画出消息流，指出信息在哪一跳丢失。

---

← 上一节：[8. 上下文工程](08-context-eng.md)

下一节：[10. 工具生态与协议](10-mcp-tools.md) →

