# 01 · LLM 运行机制

> How the model actually runs　|　基础层 · 模型为什么会这样　|　岗位核心能力 · 上手门槛低 · 权重 ●●●●●

## 工程类比

把它当成一个无状态的远程纯函数：输入一串 token，输出一个 token 的概率分布。

> 没有内存、没有会话、没有副作用。你要求的每次「记住」，都得你自己把历史重新当参数传进去；它的「思考」就是把下一个 token 猜出来。

## 动效图解

![一次推理只做一件事：预测下一个 token](figures/decode.png)

**一次推理只做一件事：预测下一个 token**

1. 文本先切成 token（子词整数 id）。长度限制与计费都按 token 算，中文约 1 字 = 1～2 token。
2. 一次前向只预测「下一个 token」的概率分布，而不是整段答案。
3. 采样从分布里挑一个。temperature / top_p 决定它敢不敢挑低概率项——工具参数宜低温。
4. 挑出的 token 追加回序列，再跑一次。所以输出长度直接决定解码耗时。
5. KV cache 复用已算过的键值；prompt 前缀保持不变才能命中缓存，省成本也降首字延迟。
6. 关键约束：它无状态。所谓「会话记忆」是你的系统在重传历史——这解释了 agent 为什么越跑越贵。

> 动效结论：延迟 = prefill（随输入长度）+ 解码步数 × 每 token 时间。想清楚这两段，优化方向就清楚了。

网页版里这段可以逐帧播放：[「LLM 运行机制」动效图解](../index.html#/m/llm-runtime)。

## 核心概念

### token 与分词　`tokenizer`

模型处理的是 subword 切分后的整数 id，不是字符。计费、长度限制、截断全都按 token 算。**中文常见 1 字 ≈ 1～2 token**，代码和 JSON 因为符号多也偏贵。

### 自回归解码　`autoregressive`

逐 token 生成，每步都要跑一次完整前向。所以**输出长度直接决定延迟**，首 token 延迟（TTFT）取决于输入长度，后续取决于生成长度。

### 采样参数

temperature / top_p / top_k 控制随机性，max_tokens 是**输出上限**不是超时，stop 是终止串，seed 只给近似可复现。工具参数、分类、抽取用低温；创意与探索才用高温。

### 无状态调用　`stateless`

服务端不保存你的会话。**所谓「对话状态」是你的数据库 + 每次重传的上下文**。这解释了为什么 agent 越跑越贵：历史在累积。

### KV cache 与 prompt caching

重复前缀的注意力键值可复用，命中后**成本和首 token 延迟显著下降**。工程含义：把稳定内容（system、工具定义、few-shot）放最前面，动态内容追加在末尾，别在中间改动。

### 能力是版本相关的

上下文长度、工具调用稳定性、推理能力随模型版本差异很大。**选型靠自己的评测集**，公开榜单只能当粗筛。

## 最小可用代码

> 先把 usage 打出来：不掌握 token 与延迟的关系，后面所有成本/性能优化都没有抓手。

```python
from openai import OpenAI
client = OpenAI()   # 同样适用于任何 OpenAI 兼容网关

msgs = [
    {"role": "system", "content": STABLE_SYSTEM + TOOLS_DOC},  # 稳定前缀 -> 可命中缓存
    {"role": "user", "content": question},                     # 动态内容放最后
]

stream = client.chat.completions.create(
    model="...", messages=msgs, temperature=0, max_tokens=1024, stream=True,
)
for ev in stream:
    if ev.choices[0].delta.content:
        print(ev.choices[0].delta.content, end="", flush=True)  # 边生成边推给前端

# 收尾一定记录 usage.prompt_tokens / completion_tokens / 首字延迟 TTFT

```

文件名：`stream_usage.py`

## 常见坑

- 把模型当数据库用：期望它「记得」上次说的话，实际是你没传。
- 以为 temperature=0 就绝对可复现：服务端批处理、浮点、MoE 路由都会带来抖动。
- 用 max_tokens 当超时控制：它截的是输出，不是墙钟时间。
- 在 prompt 中间插动态内容（时间戳、请求 id），把缓存前缀打碎。
- 流式响应只渲染文字，不记录 usage 和结束原因（length / stop）。

## 面试怎么问

**Q1.1　Agent 跑 30 步后变慢又变贵，为什么？怎么优化？**

A：每步都要把全部历史重新 prefill，token 随步数近似线性增长，成本与首字延迟同步上升。优化：裁剪/摘要工具结果、只保留必要历史、命中 prompt cache、把长产物写入文件而非塞回上下文、用子 agent 隔离上下文。

**Q1.2　为什么要精心安排 prompt 的拼接顺序？**

A：为了前缀缓存。稳定部分（system、工具 schema、few-shot）在前，动态部分在后，任何在稳定段中间的改动都会让缓存失效。

**Q1.3　上下文窗口 200k 够不够用？**

A：窗口是硬上限，但有效注意力远小于上限——填充率过高会明显退化（lost in the middle）。工程上把它当「注意力预算」而不是内存容量来管理。

## 上手练习

- [ ] 用 tokenizer 统计自己项目里一段 prompt 的 token 数，估一次调用的成本。
- [ ] temperature=0 固定输入跑 20 次，统计输出差异，建立「非确定性」的直觉。
- [ ] 打开流式输出，测量 TTFT 与总耗时随输入长度的变化曲线。

---

← 上一节：[00 · 全景](00-overview.md)

下一节：[2. 上下文窗口与成本模型](02-context-window.md) →

