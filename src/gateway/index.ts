import type { GatewayConfig, IGateway, ChatMessage, ThinkOptions, ImagePrompt, ImageResult, VideoSpec, VideoResult } from './gateway'

export type { IGateway, GatewayConfig, ChatMessage, ThinkOptions, ImagePrompt, ImageResult, VideoSpec, VideoResult }

export function createGateway(config: GatewayConfig): IGateway {
  return new GatewayRouter(config)
}

class GatewayRouter implements IGateway {
  private config: GatewayConfig

  constructor(config: GatewayConfig) {
    this.config = { ...config }
    if (!this.config.apiKey) {
      this.config.apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
    }
  }

  async think(system: string, messages: ChatMessage[], options?: ThinkOptions): Promise<string> {
    const { GeminiAdapter } = await import('./gemini-adapter')
    const gemini = new GeminiAdapter(this.config)
    return gemini.think(system, messages, options)
  }

  async generateImage(prompt: ImagePrompt): Promise<ImageResult> {
    const { GptImageAdapter } = await import('./gpt-image-adapter')
    const adapter = new GptImageAdapter()
    return adapter.generateImage(prompt)
  }

  async generateVideo(spec: VideoSpec): Promise<VideoResult> {
    const { SeedanceAdapter } = await import('./seedance-adapter')
    const adapter = new SeedanceAdapter()
    return adapter.generateVideo(spec)
  }
}
