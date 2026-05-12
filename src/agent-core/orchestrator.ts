import type { AgentRole, AgentOutput, ProductionPlan } from '../models/production'
import type { AgentContext } from './types'
import { BaseAgent, parseJsonStrict } from './base-agent'
import { useProductionStore } from '../state/store'

export class Orchestrator {
  private outputs = new Map<AgentRole, AgentOutput>()
  private progressCallbacks: Array<(agent: AgentRole, msg: string) => void> = []
  private gateway: AgentContext['gateway']
  private userInput = ''

  constructor(gateway: AgentContext['gateway']) {
    this.gateway = gateway
  }

  onProgress(cb: (agent: AgentRole, msg: string) => void) {
    this.progressCallbacks.push(cb)
  }

  getArtifact = <T>(agent: AgentRole): T | null => {
    const output = this.outputs.get(agent)
    return output?.data ? (output.data as T) : null
  }

  /** 获取所有产出 */
  getAllOutputs(): AgentOutput[] {
    return Array.from(this.outputs.values())
  }

  /** 手动设置某个 Agent 的产出（人工干预用） */
  setOutput(role: AgentRole, output: AgentOutput) {
    this.outputs.set(role, output)
  }

  /** 从指定 Agent 开始重跑（清空下游后重新执行） */
  async runFrom(startRole: AgentRole): Promise<AgentOutput[]> {
    const flow = useProductionStore.getState().flow
    // 清空从 startRole 开始的所有 Agent 产出
    const startIndex = flow.findIndex((s) => s.role === startRole)
    if (startIndex === -1) throw new Error(`未知角色: ${startRole}`)

    for (let i = startIndex; i < flow.length; i++) {
      this.outputs.delete(flow[i].role)
    }

    // 重新执行从 startRole 开始的流水线
    return this.executeFlow(startIndex)
  }

  async run(userInput: string): Promise<{ plan: ProductionPlan; outputs: AgentOutput[] }> {
    this.userInput = userInput
    const plan = await this.createPlan(userInput)
    this.emitProgress('orchestrator', `制作计划已生成：《${plan.title}》，共 ${plan.tasks.length} 个任务`)
    const outputs = await this.executeFlow(0)
    return { plan, outputs }
  }

  private async executeFlow(startIndex: number): Promise<AgentOutput[]> {
    const allOutputs: AgentOutput[] = []
    const flow = useProductionStore.getState().flow

    for (let i = startIndex; i < flow.length; i++) {
      const step = flow[i]

      // 如果该 Agent 已有产出（人工干预设置的），跳过执行但保留后续互审
      if (this.outputs.has(step.role)) {
        const existing = this.outputs.get(step.role)!
        allOutputs.push(existing)
        this.emitProgress(step.role, `已跳过（使用现有产出）`)
        continue
      }

      const depsMet = step.dependsOn.every((d) => this.outputs.has(d))
      if (!depsMet) {
        this.emitProgress(step.role, '依赖未满足，跳过')
        continue
      }

      this.emitProgress(step.role, '开始执行...')

      const instance = await this.loadAgent(step.role)
      const ctx = this.makeContext(step.role)

      const output = await instance.execute(ctx)
      this.outputs.set(step.role, output)
      allOutputs.push(output)

      if (output.status === 'done') {
        this.emitProgress(step.role, `完成：${output.summary}`)
      } else {
        this.emitProgress(step.role, `失败：${output.error}`)
        continue
      }

      // 审核环节：让接下来依赖此产出的 Agent 审核
      await this.runReviews(step.role, i)
    }

    return allOutputs
  }

  /** 下游 Agent 审核上游产出，如有问题则重跑上游 */
  private async runReviews(completedRole: AgentRole, currentIndex: number) {
    const flow = useProductionStore.getState().flow
    for (let i = currentIndex + 1; i < flow.length; i++) {
      const reviewer = flow[i]
      if (!reviewer.dependsOn.includes(completedRole)) continue

      const instance = await this.loadAgent(reviewer.role)
      const ctx = this.makeContext(reviewer.role)
      const upstreamOutput = this.outputs.get(completedRole)
      if (!upstreamOutput) continue

      this.emitProgress(reviewer.role, `审核 ${completedRole} 的产出...`)
      const feedback = await instance.review(ctx, completedRole, upstreamOutput)

      if (feedback) {
        this.emitProgress(reviewer.role, `${completedRole} 需要修改：${feedback.slice(0, 100)}...`)
        // 重新执行上游 Agent，传入反馈
        const upstreamInstance = await this.loadAgent(completedRole)
        const upstreamCtx = this.makeContext(completedRole)
        upstreamCtx.reviewFeedback = feedback

        this.emitProgress(completedRole, '根据反馈重新修改...')
        const retry = await upstreamInstance.execute(upstreamCtx)
        this.outputs.set(completedRole, retry)
        this.emitProgress(completedRole, retry.status === 'done' ? `修改完成：${retry.summary}` : `修改失败：${retry.error}`)
      } else {
        this.emitProgress(reviewer.role, `${completedRole} 审核通过`)
      }
    }
  }

  private async loadAgent(role: AgentRole): Promise<BaseAgent> {
    const filename = role.replace(/_/g, '-')
    const { default: AgentClass } = await import(`./agents/${filename}.ts`)
    const agent = new AgentClass() as BaseAgent

    // Apply overriding configs
    const config = useProductionStore.getState().agentConfigs[role]
    if (config?.systemPrompt) {
      agent.systemPrompt = config.systemPrompt
    }

    return agent
  }

  private makeContext(role: AgentRole): AgentContext {
    return {
      productionId: this.userInput,
      role,
      gateway: this.gateway,
      getArtifact: this.getArtifact,
      onProgress: (msg) => this.emitProgress(role, msg),
      reviewFeedback: '',
    }
  }

  private emitProgress(agent: AgentRole, msg: string) {
    this.progressCallbacks.forEach((cb) => cb(agent, msg))
  }

  private async createPlan(userInput: string): Promise<ProductionPlan> {
    const text = await this.gateway.think(
      `你是一位经验丰富的影视制片人。分析用户的需求，制定制作计划。
      返回 JSON 格式：
      {
        "title": "项目名称",
        "genre": "类型",
        "logline": "一句话梗概",
        "tasks": [
          { "id": "task_1", "agent": "screenwriter", "description": "编写剧本", "dependsOn": [], "status": "pending" },
          { "id": "task_2", "agent": "character_designer", "description": "设计角色", "dependsOn": ["screenwriter"], "status": "pending" },
          { "id": "task_3", "agent": "scene_designer", "description": "场景设计", "dependsOn": ["screenwriter"], "status": "pending" },
          { "id": "task_4", "agent": "director", "description": "分镜设计", "dependsOn": ["screenwriter"], "status": "pending" },
          { "id": "task_5", "agent": "cinematographer", "description": "摄影方案", "dependsOn": ["director"], "status": "pending" },
          { "id": "task_6", "agent": "post_production", "description": "后期合成", "dependsOn": ["cinematographer", "scene_designer", "character_designer"], "status": "pending" }
        ]
      }`,
      [{ role: 'user', content: userInput }],
      { temperature: 0.5, responseFormat: 'json' },
    )

    return parseJsonStrict<ProductionPlan>(text)
  }
}
