export interface Shot {
  id: string
  shotNumber: number
  sceneId: string
  description: string
  cameraAngle: string
  cameraMovement: string
  framing: 'wide' | 'full' | 'medium' | 'close-up' | 'extreme-close-up'
  charactersInShot: string[]
  dialogue: string
  duration: number
  lighting: string
  mood: string
  imagePrompt: string
}

export interface Storyboard {
  title: string
  shots: Shot[]
}
