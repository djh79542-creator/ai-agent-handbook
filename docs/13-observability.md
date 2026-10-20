# 13 · 可观测性与运维

> Tracing, routing, cost & latency　|　工程层 · 可靠、可观测、可控　|　高频考点 · 上手门槛低 · 权重 ●●●●○

## 工程类比

agent 的 APM：trace 的最小单位不是 HTTP 请求，而是一次推理。

> 传统监控只能告诉你「慢了、错了」。agent 要回答的是「第 12 步为什么选了这个工具、当时上下文里有什么、花了多少 token」——这决定了你能不能修问题。

## 动效图解

![可观测：trace 的单位是一次推理](figures/tracing.png)

**可观测：trace 的单位是一次推理**

1. run 级：总步数、总 token、总成本。这是你向业务汇报的那一层。
2. step1：prefill 6.1k 花了多久？缓存命中多少？前缀顺序不对，这里就会明显变贵变慢。
3. 工具调用耗时与错误率要单独看。并行调用在瀑布图上是重叠的条形——串行就是白扔的延迟。
4. step2 的输入为什么比 step1 大？工具输出没瘦身，成本就会在这里指数式膨胀。
5. finish_reason 一定要记录：length 表示被截断，那是「输出被切了」而不是「模型答错了」。
6. 聚合看板按任务类型分桶。没有这些数据，任何优化提案都只是意见。

> 动效结论：能重放的 trace 才有用：固定温度、记录模型版本与参数、mock 外部副作用。

网页版里这段可以逐帧播放：[「可观测性与运维」动效图解](../index.html#/m/observability)。

## 核心概念

### trace 结构

run → step → (llm call | tool call | retrieval | subagent)，父子关联并携带模型版本、参数、输入输出、token、耗时。**能重放的 trace 才有用。**

### 关键指标

任务成功率、步数分布、P50/P95 延迟、每任务成本、工具错误率、缓存命中率、输出截断率、人工介入率。**成本与步数要按任务类型分桶。**

### 模型路由与分级

按难度分派：小模型做分类/抽取/摘要，大模型做规划与疑难。路由本身要么规则化、要么用极便宜的判别器，并记录「路由决策」便于回溯。

### 重试与降级

限流/超时用指数退避重试；输出校验失败时把报错回喂重试；持续失败降级到备用模型或人工。所有重试都要计入成本。

### 成本优化清单

prompt cache 前缀设计、裁剪工具输出、并行化调用、限制 max_tokens、结构化输出减少返工、离线任务走 batch 折扣、路由到小模型。**先测量再优化。**

### 留存与合规

全量存 prompt/completion 有隐私与成本压力 → 分级采样、字段脱敏、按用户与环境设保留期。

### 工具生态

LangSmith / Langfuse / Arize Phoenix，或直接按 OpenTelemetry GenAI 语义约定自建。**框架可换，span 语义要自己定清楚。**

## 最小可用代码

> 一个装饰器把每次推理变成可重放的 span，成本统计顺手就出来了。

```python
@tracer.span("llm")            # span 带：model, temperature, tool_names
def call_llm(msgs, **kw):
    t0 = time(); res = client.chat.completions.create(messages=msgs, **kw)
    span.record(
        ttft_ms=first_token_ms(res), dur_ms=(time() - t0) * 1000,
        in_tok=res.usage.prompt_tokens, out_tok=res.usage.completion_tokens,
        cached_tok=cached_tokens(res.usage),                 # 缓存命中情况
        finish=res.choices[0].finish_reason,                 # length 说明被截断
    )
    return res

# 每日看板：按 task_type 分桶的 cost / steps / 成功率 / 工具错误率 top5

```

文件名：`tracing.py`

## 常见坑

- 只记录最终答案，不记录中间上下文——出问题时完全无法归因。
- 把用户隐私数据全量落盘进 trace 平台。
- 重试不计入成本与延迟，看板数字比现实好看得多。
- 没有 finish_reason 监控，输出被截断当成「模型答错」排查半天。
- 换模型只改配置字符串，没和版本、评测分数关联，无法回滚。

## 面试怎么问

**Q13.1　线上 agent 突然变贵 3 倍，怎么查？**

A：按任务类型拆成本曲线，看是步数增加、上下文变长还是缓存命中率下降；再对齐发布记录（prompt/工具/模型版本变更）。三个最常见根因：工具输出膨胀、压缩策略退化、prompt 前缀被打碎导致缓存失效。

**Q13.2　怎么设计模型路由？**

A：用便宜判别器或规则把任务分难度桶，记录每次路由决策与实际成功率，定期用评测集校准阈值；失败链路配重试与降级模型，并保证同一任务的路由可复现。

**Q13.3　agent 的 P95 延迟怎么降？**

A：减少输出长度（结构化而非散文）、并行独立工具调用、裁剪 prefill 规模、提高缓存命中、探索型子任务放小模型或异步、长任务改流式与增量反馈。

## 上手练习

- [ ] 加 span 记录，做一张「每步 token 占用」瀑布图，找出最贵的三步。
- [ ] 统计一周内缓存命中率与成本的关系，验证调整前缀顺序带来的收益。

---

← 上一节：[12. 评测体系](12-evals.md)

下一节：[14. 安全、护栏与人工介入](14-safety.md) →

