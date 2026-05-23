import { BaseAgent, type AgentContext } from '../base-agent'
import type { AgentOutput } from '../../models/production'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位经验丰富的影视导演（兼 AI 视频生成总装师）。你负责根据前期统筹好的文字拆解和美术设计师提供的莫兰迪风格资产，指导“专门的AI视频生成员工”如何去生成视频，并制定具体标准的物理渲染规范。

你的核心工作职责：
1. **对接美术及分镜资产**：提取并充分阅读首席美术画师整合的莫兰迪角色描述、场景氛围、升级版分镜绘图 Prompt。
2. **制定 AI 视频生成渲染标准**：面向最先进的生成式视频大模型（如 Runway Gen-3, Sora, Luma, Kling 等），规划精密控制指令。
3. **分段视频动态排程（针对每集 15 秒一段）**：为每一段设定具体的生成基准，包括：
   - 运动幅度控制 (Motion Amplitude)
   - 相机镜头三轴运动路径 (Pan, Tilt, Zoom, Roll, Crane, Orbit)
   - 主角肌肉/表情变化细节与情感弧光微调
   - 特效交互程度 (VFX interaction rules)
   - 画面一致性种子设定和关键参数

输出格式要求（必须返回 JSON）：
{
  "productionTitle": "作品分镜视频生成总纲",
  "renderingStandards": {
    "engineTarget": "Kling 1.5 | Runway Gen-3 | Sora",
    "baseAspect": "16:9 | 9:16 (宽画幅或竖屏高大上比例)",
    "targetFPS": 24,
    "motionStrengthDefault": "3 (中等平滑运动，杜绝AI狂暴畸变)",
    "physicalConsistencyLevel": "极高 (遵循 Morandi 统一美术概念图起跳)"
  },
  "storyboards": [
    {
      "segmentId": "对应文字拆解段落段ID",
      "segmentNumber": 1,
      "description": "剧本情节描述",
      "videoSpecs": {
        "durationSeconds": 5,
        "cameraTrajectory": "例如：极平缓推入 (Zoom-in) 叠加左横移 (Pan left)，保持深景深",
        "motionSlider": 4,
        "physicsFidelity": "描述环境微粒（如尘埃或微弱风吹飞叶）与特定道具/特效实机配合标准"
      },
      "generativeVideoPrompt": "向 AI 视频生成器发出的精准英文咒语。包含动作发起细节、镜头控制流与 Morandi 静谧氛围风格词 (morphing, slow kinetic action, photorealistic cinematic cinematic lighting)",
      "actorConsistencyCommand": "对本镜中人物服饰/五官的连续性强制动作规则描述，防止人物跑偏变形"
    }
  ]
}
`

export default class DirectorAgent extends BaseAgent {
  role = 'director' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    if (!script) throw new Error('找不到剧本拆解，请先运行编剧 Agent')

    const artDesignerOutput = ctx.getArtifact<{
      visualStyleSummary?: string
      upgradedStoryboards?: Array<{ segmentId: string; segmentNumber: number; upgradedImagePrompt: string }>
    }>('art_designer')

    const result = await this.thinkJson(ctx, [
      {
        role: 'user',
        content: `请根据以下文字剧本拆解：\n${JSON.stringify(script, null, 2)}\n\n以及美术设计师提供的视觉资产与莫兰迪生图配方：\n${JSON.stringify(artDesignerOutput || {}, null, 2)}\n\n制定详细、专业的分分镜 AI 视频生成规格蓝图与动作执行标准，指导视频员工产出具备高级感的动态视频。`,
      },
    ])

    const boardArray = (result as { storyboards?: unknown[] }).storyboards || []
    return {
      data: result,
      summary: `AI分镜视频生成标准定制完成。已排产规划了 ${boardArray.length} 组15秒段落的动态生成咒语与运动轨迹约束。`,
    }
  }

  override async review(
    ctx: AgentContext,
    upstreamRole: string,
    _upstreamOutput: AgentOutput,
  ): Promise<string | null> {
    if (upstreamRole !== 'art_designer') return null
    const feedback = await this.think(ctx, [
      { role: 'user', content: `你是总导演。请评审美术设计师新交付的 Morandi 视觉资产提示词：\n\n${JSON.stringify(_upstreamOutput.data, null, 2)}\n\n如完全合格，请**仅回复"通过"**；如果有不相符或风格冲突，提供具体的修改建议。` },
    ], { temperature: 0.2 })
    return feedback.includes('通过') ? null : feedback
  }
}
