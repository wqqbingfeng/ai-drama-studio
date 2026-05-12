import type { AgentRole } from './production'

export type TaskFlow = {
  role: AgentRole
  dependsOn: AgentRole[]
}[]

export const DEFAULT_PRODUCTION_FLOW: TaskFlow = [
  { role: 'screenwriter', dependsOn: [] },
  { role: 'character_designer', dependsOn: ['screenwriter'] },
  { role: 'scene_designer', dependsOn: ['screenwriter'] },
  { role: 'director', dependsOn: ['screenwriter', 'character_designer'] },
  { role: 'cinematographer', dependsOn: ['director'] },
  { role: 'post_production', dependsOn: ['cinematographer', 'scene_designer', 'character_designer'] },
]
