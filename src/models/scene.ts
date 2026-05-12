export interface SceneDesign {
  id: string
  sceneId: string
  location: string
  timeOfDay: string
  weather: string
  lighting: string
  colorPalette: string[]
  props: string[]
  atmosphere: string
  cameraDirection: string
  imagePrompt: string
  referenceImage?: string
}
