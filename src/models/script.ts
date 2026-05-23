export interface ScriptCharacter {
  id: string
  name: string
  gender: string
  age: string
  personality: string
  appearance: string
  background: string
}

export interface SceneDialogue {
  characterId: string
  characterName: string
  line: string
  emotion?: string
}

export interface ScriptScene {
  id: string
  sceneNumber: number
  location: string
  time: string
  atmosphere: string
  content: string
  characters: string[]
  dialogues?: SceneDialogue[]
  detailedDescription?: string
}

export interface ScriptSegmentStoryboard {
  framing: string
  cameraMovement: string
  imagePrompt: string
}

export interface ScriptSegment {
  segmentId: string
  segmentNumber: number
  description: string
  propsAndVfx: string
  storyboard: ScriptSegmentStoryboard
}

export interface ScriptEpisode {
  episodeNumber: number
  title: string
  summary: string
  segments: ScriptSegment[]
}

export interface ScriptPropOrEffect {
  name: string
  category: 'prop' | 'vfx'
  features: string
}

export interface Script {
  title: string
  logline: string
  episodesCount?: number
  episodes?: ScriptEpisode[]
  characters: ScriptCharacter[]
  scenes: ScriptScene[]
  propsAndEffects?: ScriptPropOrEffect[]
  notes?: string
}
