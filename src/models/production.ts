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
  | 'producer'
  | 'screenwriter'
  | 'character_designer'
  | 'scene_designer'
  | 'prop_designer'
  | 'art_designer'
  | 'director'
  | 'cinematographer'
  | 'vfx_designer'
  | 'post_production'

export const AgentLabels: Record<AgentRole, string> = {
  orchestrator: '调度管家',
  producer: '制片人',
  screenwriter: '首席编剧',
  character_designer: '角色主设计师',
  scene_designer: '场景美术指导',
  prop_designer: '道具与资产设计师',
  art_designer: '首席美术设计师',
  director: '影视导演',
  cinematographer: '摄影指导',
  vfx_designer: '视觉特效总监',
  post_production: '剪辑与后期包装',
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
