import { IGateway, ImagePrompt, ImageResult } from './gateway'

export class GptImageAdapter implements IGateway {
  async think(): Promise<string> {
    throw new Error('Gemini adapter required for text reasoning')
  }

  async generateImage(_prompt: ImagePrompt): Promise<ImageResult> {
    void _prompt;
    // TODO: implement GPT Image 2 API call
    // 需要 API endpoint 和 key
    throw new Error('GPT Image 2 not yet configured')
  }

  async generateVideo(): Promise<{ url: string }> {
    throw new Error('Seedance adapter required for video generation')
  }
}
