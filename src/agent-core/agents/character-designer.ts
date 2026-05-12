import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { CharacterCardOutput } from '../../models/character'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位资深角色设计师，负责为剧本中的每个角色创建详细的角色卡。

你的任务：
1. 分析剧本中的角色描述
2. 为每个角色创建完整的角色卡
3. 确保角色形象一致且丰满

角色卡必须包含详细的外貌描述、性格特征、背景故事，以及用于后续生图的 prompt。

输出格式（JSON）：
{
  "characters": [
    {
      "id": "char_1",
      "name": "角色名",
      "gender": "性别",
      "age": "年龄",
      "role": "protagonist | antagonist | supporting | minor",
      "personality": ["性格特征1", "性格特征2"],
      "appearance": {
        "height": "身高",
        "build": "体型",
        "face": "脸型描述",
        "hair": "发型发色",
        "eyes": "眼型瞳色",
        "clothing": "服饰风格",
        "distinctiveFeatures": ["特征1", "特征2"]
      },
      "voice": {
        "tone": "音色",
        "speechStyle": "说话风格"
      },
      "background": "背景故事",
      "motivation": "核心动机",
      "relationships": [
        { "characterName": "相关角色", "relation": "关系描述" }
      ],
      "imagePrompt": "用于 AI 生图的详细 prompt"
    }
  ]
}

注意：
- imagePrompt 要足够详细，包括画风、构图、光线等
- 角色关系要基于剧本内容
- 外貌特征要一致且可辨识`

export default class CharacterDesignerAgent extends BaseAgent {
  role = 'character_designer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    if (!script) throw new Error('找不到剧本，请先运行编剧 Agent')

    const result = await this.thinkJson<CharacterCardOutput>(ctx, [
      {
        role: 'user',
        content: `请为以下剧本中的角色创建角色卡：\n\n${JSON.stringify(script, null, 2)}`,
      },
    ])

    return {
      data: result,
      summary: `完成 ${result.characters.length} 个角色的设计`,
    }
  }
}
