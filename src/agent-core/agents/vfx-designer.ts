import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位顶级的视觉特效总监（VFX Supervisor）。负责规划与设计影视剧中的所有关键视效环节。

你的任务：
1. 深入分析剧本和分镜需求，识别所有需要 CG、流体、粒子、爆破、魔法幻境等数字特效的段落。
2. 为每一个关键特效镜头设计视觉呈现方案、风格走向以及实现难度评估。
3. 协助导演在"实拍"与"特效"间取得平衡，并为每一场特效戏提供用于 AI 视频生成的视觉与动态 Prompt。

输出格式（JSON）：
{
  "vfxSequences": [
    {
      "id": "vfx_1",
      "sceneRef": "对应场景/镜头编号",
      "effectType": "爆炸 / 魔法 / CG生物 / 环境延伸 / 粒子流体等",
      "visualDescription": "详细的画面效果描述",
      "moodAndTone": "特效画面的情绪色彩",
      "technicalComplexity": "Low / Medium / High / Ultra",
      "videoPrompt": "用于 AI 视频生成的动态 Prompt（强调物理动效与光影逻辑）"
    }
  ]
}
`

export default class VfxDesignerAgent extends BaseAgent {
  role = 'vfx_designer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    const content = script 
      ? JSON.stringify(script, null, 2)
      : '基于现有故事背景，制定视觉特效规划。'

    interface VfxResult {
      vfxSequences?: Array<Record<string, unknown>>
    }

    const result = await this.thinkJson<VfxResult>(ctx, [
      {
        role: 'user',
        content: `请为以下内容提取并设计视觉特效(VFX)方案：\n\n${content}`,
      },
    ])

    return {
      data: result,
      summary: `规划完成，共计 ${result.vfxSequences?.length || 0} 个核心视效序列`,
    }
  }
}
