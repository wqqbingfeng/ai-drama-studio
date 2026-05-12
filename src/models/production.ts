export type ProductionStatus = 'idle' | 'planning' | 'in_progress' | 'review' | 'completed' | 'failed'

export interface ProductionPlan {
  id: string
  title: string
  genre: string
  logline: string
  tasks: ProductionTask[]
  createdAt: string
}

export interface ProductionTask {
  id: string
  agent: AgentRole
  description: string
  dependsOn: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export type AgentRole =
  | 'orchestrator'
  | 'screenwriter'
  | 'character_designer'
  | 'scene_designer'
  | 'director'
  | 'cinematographer'
  | 'post_production'

export const AgentLabels: Record<AgentRole, string> = {
  orchestrator: '制片人',
  screenwriter: '编剧',
  character_designer: '角色设计师',
  scene_designer: '场景设计师',
  director: '导演',
  cinematographer: '摄影指导',
  post_production: '后期合成',
}

export interface AgentOutput {
  id: string
  agent: AgentRole
  taskId: string
  status: 'pending' | 'running' | 'done' | 'failed'
  data: unknown
  summary: string
  startedAt?: string
  completedAt?: string
  error?: string
}
