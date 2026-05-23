import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { SceneDesign } from '../../models/scene'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位专业的场景美术指导，负责为剧本设计核心场景的美术概念。

你的任务：
1. 分析剧本中的场景描述
2. 为每个场景设计视觉风格
3. 确定场景的色彩、光线、道具等

输出格式（JSON）：
{
  "scenes": [
    {
      "id": "scene_design_1",
      "sceneId": "对应剧本场景ID",
      "location": "场景地点",
      "timeOfDay": "日景/夜景/黄昏/黎明",
      "weather": "天气",
      "lighting": "光线设计",
      "colorPalette": ["主色", "辅色", "点缀色"],
      "props": ["道具1", "道具2"],
      "atmosphere": "氛围描述",
      "cameraDirection": "拍摄方向建议",
      "imagePrompt": "用于 AI 生图的详细 prompt"
    }
  ]
}`

export default class SceneDesignerAgent extends BaseAgent {
  role = 'scene_designer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    if (!script) throw new Error('找不到剧本，请先运行编剧 Agent')

    const result = await this.thinkJson<{ scenes: SceneDesign[] }>(ctx, [
      {
        role: 'user',
        content: `请为以下剧本中的每个场景进行视觉设计：\n\n${JSON.stringify(script, null, 2)}`,
      },
    ])

    return {
      data: result,
      summary: `完成 ${result.scenes.length} 个场景的设计`,
    }
  }
}
