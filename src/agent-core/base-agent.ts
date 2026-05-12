import type { AgentRole, AgentOutput } from '../models/production'
import type { IGateway, ChatMessage } from '../gateway'

export interface AgentContext {
  productionId: string
  role: AgentRole
  gateway: IGateway
  getArtifact: <T>(agent: AgentRole) => T | null
  onProgress: (summary: string) => void
  reviewFeedback?: string
}

export abstract class BaseAgent {
  abstract role: AgentRole
  abstract systemPrompt: string

  async execute(ctx: AgentContext): Promise<AgentOutput> {
    const startTime = new Date().toISOString()
    ctx.onProgress('开始工作...')

    try {
      const result = await this.run(ctx)
      ctx.onProgress(result.summary)

      return {
        id: `${this.role}-${Date.now()}`,
        agent: this.role,
        taskId: ctx.productionId,
        status: 'done',
        data: result.data,
        summary: result.summary,
        startedAt: startTime,
        completedAt: new Date().toISOString(),
      }
    } catch (err) {
      return {
        id: `${this.role}-${Date.now()}`,
        agent: this.role,
        taskId: ctx.productionId,
        status: 'failed',
        data: null,
        summary: '执行失败',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        error: String(err),
      }
    }
  }

  protected abstract run(ctx: AgentContext): Promise<{ data: unknown; summary: string }>

  /** 审核上游 Agent 的产出，返回修改建议或 null（无修改） */
  async review(
    ctx: AgentContext,
    upstreamRole: AgentRole,
    upstreamOutput: AgentOutput,
  ): Promise<string | null> {
    return null // 默认不审核
  }

  protected async think(
    ctx: AgentContext,
    messages: ChatMessage[],
    options?: { temperature?: number },
  ): Promise<string> {
    return ctx.gateway.think(this.systemPrompt, messages, options)
  }

  protected async thinkJson<T>(
    ctx: AgentContext,
    messages: ChatMessage[],
  ): Promise<T> {
    const text = await ctx.gateway.think(this.systemPrompt, messages, {
      temperature: 0.3,
      responseFormat: 'json',
    })
    return parseJsonStrict<T>(text)
  }
}

/** 清理 markdown 代码块包裹后解析 JSON */
export function parseJsonStrict<T>(raw: string): T {
  let cleaned = raw.trim()
  // 去掉 ```json ... ``` 包裹
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/, '')
  }
  // 去掉 ``` ... ``` 包裹（无语言标识）
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```\s*$/, '')
  }
  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error(`JSON 解析失败，返回内容:\n${raw.slice(0, 500)}`)
  }
}
