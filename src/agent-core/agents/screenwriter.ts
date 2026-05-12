import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位专业的编剧，擅长将创意构思或故事梗概发展成完整的剧本。

你的工作流程：
1. 分析用户提供的想法或剧本素材
2. 如果已有剧本初稿，进行润色和完善
3. 如果没有完整剧本，根据用户描述创作完整剧本

输出格式要求（必须返回 JSON）：
{
  "title": "剧名",
  "logline": "一句话梗概",
  "characters": [
    {
      "id": "char_1",
      "name": "角色名",
      "gender": "性别",
      "age": "年龄",
      "personality": "性格描述",
      "appearance": "外貌描述",
      "background": "背景故事"
    }
  ],
  "scenes": [
    {
      "id": "scene_1",
      "sceneNumber": 1,
      "location": "场景地点",
      "time": "日/夜",
      "atmosphere": "氛围",
      "content": "场景描述",
      "characters": ["角色ID"],
      "dialogues": [
        {
          "characterId": "char_1",
          "characterName": "角色名",
          "line": "对白内容",
          "emotion": "情绪"
        }
      ]
    }
  ]
}

注意：
- 每个场景需要包含足够丰富的视觉描述，方便后续导演和角色设计师参考
- 对白要符合角色性格
- 场景数量控制在 3-8 场（短片）或 8-15 场（长片）`

export default class ScreenwriterAgent extends BaseAgent {
  role = 'screenwriter' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const userMsg = ctx.reviewFeedback
      ? `请根据以下反馈意见修改剧本：\n反馈：${ctx.reviewFeedback}\n\n当前剧本：\n${JSON.stringify(ctx.getArtifact('screenwriter'), null, 2)}`
      : `请根据以下素材创作剧本：\n\n${ctx.productionId}`

    const script = await this.thinkJson<Script>(ctx, [
      { role: 'user', content: userMsg },
    ])

    const sceneCount = script.scenes?.length ?? 0
    return {
      data: script,
      summary: `完成剧本《${script.title}》，共 ${script.characters?.length ?? 0} 个角色，${sceneCount} 场戏`,
    }
  }
}
