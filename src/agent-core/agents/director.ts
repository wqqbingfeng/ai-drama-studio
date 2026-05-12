import { BaseAgent, type AgentContext } from '../base-agent'
import type { AgentOutput } from '../../models/production'
import type { Storyboard } from '../../models/storyboard'
import type { Script } from '../../models/script'

const REVIEW_PROMPT = `你是一位经验丰富的导演，正在审核编剧的剧本。从以下角度提出修改建议：
1. 剧本的可视化程度 — 场景描述是否足够具体，能否直接用于分镜
2. 角色一致性 — 角色的言行是否一致
3. 节奏 — 场景长度和情绪节奏是否合理
4. 对白质量 — 对白是否符合角色性格

如果没有大问题，回复：无修改建议`

const SYSTEM_PROMPT = `你是一位经验丰富的影视导演，负责将剧本转化为详细的分镜头脚本。

你的任务：
1. 仔细阅读剧本的每一场戏
2. 将每场戏拆解为多个镜头
3. 确定每个镜头的构图、机位、运动方式

输出格式（JSON）：
{
  "title": "片名 - 分镜头脚本",
  "shots": [
    {
      "id": "shot_1",
      "shotNumber": 1,
      "sceneId": "对应场景ID",
      "description": "镜头内容描述",
      "cameraAngle": "俯拍/平拍/仰拍/过肩",
      "cameraMovement": "固定/推/拉/摇/移/跟",
      "framing": "wide | full | medium | close-up | extreme-close-up",
      "charactersInShot": ["角色名"],
      "dialogue": "该镜头中的对白",
      "duration": 秒数,
      "lighting": "光线描述",
      "mood": "情绪氛围",
      "imagePrompt": "用于 AI 生图的详细 prompt"
    }
  ]
}

注意：
- 每个场景拆解为 2-8 个镜头
- 镜头切换要流畅自然
- imagePrompt 要包含构图、光线、色彩、角色位置等细节
- 总镜头数控制在 15-40 个（视片长而定）`

export default class DirectorAgent extends BaseAgent {
  role = 'director' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    if (!script) throw new Error('找不到剧本，请先运行编剧 Agent')

    const result = await this.thinkJson<Storyboard>(ctx, [
      {
        role: 'user',
        content: `请为以下剧本创作分镜头脚本：\n\n${JSON.stringify(script, null, 2)}`,
      },
    ])

    return {
      data: result,
      summary: `完成分镜设计，共 ${result.shots.length} 个镜头`,
    }
  }

  override async review(
    ctx: AgentContext,
    upstreamRole: string,
    _upstreamOutput: AgentOutput,
  ): Promise<string | null> {
    if (upstreamRole !== 'screenwriter') return null
    const feedback = await this.think(ctx, [
      { role: 'user', content: `请审核以下剧本：\n${JSON.stringify(_upstreamOutput.data, null, 2)}` },
    ], { temperature: 0.3 })
    return feedback.includes('无修改建议') ? null : feedback
  }
}
