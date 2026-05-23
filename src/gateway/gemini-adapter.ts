import type { ChatMessage, ThinkOptions, ImagePrompt, ImageResult, VideoSpec, VideoResult } from './gateway'
import type { GatewayConfig } from './gateway'

export class GeminiAdapter {
  private config: GatewayConfig

  constructor(config: GatewayConfig) {
    this.config = config
  }

  private normalizeEndpoint(url: string): string {
    // 代理路径不自动补全
    if (url.startsWith('/api/') || url.includes(':5174')) {
      return url
    }
    if (!url.includes('/v1/') && !url.endsWith('/chat/completions')) {
      if (url.endsWith('/')) url = url.slice(0, -1)
      return url + '/v1/chat/completions'
    }
    return url
  }

  async think(
    system: string,
    messages: ChatMessage[],
    options?: ThinkOptions,
  ): Promise<string> {
    const { endpoint, apiKey } = this.config
    const rawModel = this.config.model || 'gemini-2.0-flash'
    let modelName = 'gemini-2.0-flash'
    
    // Map fictional or unsupported models to a known working model 
    if (rawModel.includes('pro')) {
      modelName = 'gemini-1.5-pro'
    } else if (rawModel.includes('flash') || rawModel.includes('gemini')) {
      modelName = 'gemini-2.0-flash'
    } else if (rawModel) {
      // For any other model from standard proxy
      modelName = rawModel
    }

    if (endpoint) {
      const normalizedEndpoint = this.normalizeEndpoint(endpoint)
      // 中转站模式 — 使用 OpenAI 兼容格式
      const body = {
        model: modelName,
        messages: [
          { role: 'system', content: system },
          ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        temperature: options?.temperature ?? 0.7,
        response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

      const res = await fetch(normalizedEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const contentType = res.headers.get('content-type') || ''
      const text = await res.text()

      if (!res.ok) {
        throw new Error(`中转站返回错误: HTTP ${res.status}\n${text.slice(0, 500)}`)
      }

      if (!contentType.includes('application/json') && !contentType.includes('json')) {
        throw new Error(
          `中转站返回了非 JSON 内容 (${contentType})，请检查中转站地址是否正确\n` +
          `响应内容前 200 字符: ${text.slice(0, 200)}`
        )
      }

      const data = JSON.parse(text)
      // 兼容 OpenAI 格式
      return data.choices?.[0]?.message?.content ?? data.response ?? ''
    }

    // 直连模式 — 直接调 Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        responseMimeType: options?.responseFormat === 'json' ? 'application/json' : 'text/plain',
      },
    }

    const res = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API 错误: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  generateImage(_prompt: ImagePrompt): Promise<ImageResult> {
    void _prompt;
    throw new Error('GPT Image 2 adapter required for image generation')
  }

  generateVideo(_spec: VideoSpec): Promise<VideoResult> {
    void _spec;
    throw new Error('Seedance adapter required for video generation')
  }
}
