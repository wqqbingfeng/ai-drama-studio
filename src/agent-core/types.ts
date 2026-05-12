import type { AgentContext } from './base-agent'
import type { AgentRole, AgentOutput } from '../models/production'

export type { AgentContext }

export type AgentConstructor = new () => {
  role: AgentRole
  execute(ctx: AgentContext): Promise<AgentOutput>
}
