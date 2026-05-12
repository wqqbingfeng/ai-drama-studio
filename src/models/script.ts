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
  dialogues: SceneDialogue[]
}

export interface Script {
  title: string
  logline: string
  characters: ScriptCharacter[]
  scenes: ScriptScene[]
  notes?: string
}
