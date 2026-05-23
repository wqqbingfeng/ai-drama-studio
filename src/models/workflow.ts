import type { AgentRole } from './production'

export type TaskFlow = {
  role: AgentRole
  dependsOn: AgentRole[]
}[]

export const DEFAULT_PRODUCTION_FLOW: TaskFlow = [
  { role: 'screenwriter', dependsOn: [] },
  { role: 'producer', dependsOn: ['screenwriter'] },
  
  { role: 'character_designer', dependsOn: ['producer'] },
  { role: 'scene_designer', dependsOn: ['producer'] },
  { role: 'prop_designer', dependsOn: ['producer'] },
  
  { role: 'director', dependsOn: ['character_designer', 'scene_designer', 'prop_designer'] },
  { role: 'cinematographer', dependsOn: ['director'] },
  { role: 'vfx_designer', dependsOn: ['director'] },
  
  { role: 'post_production', dependsOn: ['cinematographer', 'vfx_designer'] },
]

export const STREAMLINED_PRODUCTION_FLOW: TaskFlow = [
  { role: 'screenwriter', dependsOn: [] },
  { role: 'producer', dependsOn: ['screenwriter'] },
  { role: 'art_designer', dependsOn: ['producer'] },
  { role: 'director', dependsOn: ['art_designer'] },
  { role: 'post_production', dependsOn: ['director'] },
]

