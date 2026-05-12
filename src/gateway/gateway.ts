export interface GatewayConfig {
  endpoint: string
  apiKey: string
  model?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ThinkOptions {
  temperature?: number
  responseFormat?: 'text' | 'json'
}

export interface ImagePrompt {
  prompt: string
  negativePrompt?: string
  size?: 'square' | 'landscape' | 'portrait'
  style?: string
  referenceImage?: string
}

export interface ImageResult {
  url: string
  alt: string
}

export interface VideoSpec {
  imageUrls: string[]
  motionPrompt: string
  duration?: number
}

export interface VideoResult {
  url: string
}

export interface IGateway {
  think(
    system: string,
    messages: ChatMessage[],
    options?: ThinkOptions,
  ): Promise<string>

  generateImage(prompt: ImagePrompt): Promise<ImageResult>
  generateVideo(spec: VideoSpec): Promise<VideoResult>
}
