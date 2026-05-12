import { IGateway, VideoSpec, VideoResult } from './gateway'

export class SeedanceAdapter implements IGateway {
  async think(): Promise<string> {
    throw new Error('Gemini adapter required for text reasoning')
  }

  async generateImage(): Promise<{ url: string; alt: string }> {
    throw new Error('GPT Image 2 adapter required for image generation')
  }

  async generateVideo(_spec: VideoSpec): Promise<VideoResult> {
    // TODO: implement Seedance 2.0 API call
    throw new Error('Seedance 2.0 not yet configured')
  }
}
