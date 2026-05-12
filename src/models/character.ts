export interface CharacterCard {
  id: string
  name: string
  gender: string
  age: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  personality: string[]
  appearance: {
    height: string
    build: string
    face: string
    hair: string
    eyes: string
    clothing: string
    distinctiveFeatures: string[]
  }
  voice: {
    tone: string
    speechStyle: string
  }
  background: string
  motivation: string
  relationships: { characterName: string; relation: string }[]
  imagePrompt: string
  referenceImage?: string
}

export interface CharacterCardOutput {
  characters: CharacterCard[]
}
