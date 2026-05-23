import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'

const SYSTEM_PROMPT = `你是一位高阶摄影指导与电影重工业 AI 视频生成大模型调校师。你的职责是把控每个镜头的视觉深度，为视频渲染员工输出一套电影级的实拍标准参数。

你的主要职责：
1. **调和画面光影与胶片质感**：使用业界标杆的镜头与光线参数（Arri, Cooke S4/i prime, soft diffuse sunlight, gentle haze, volume fog）。
2. **制定AI视频运动标准格式（镜头控制指令）**：
   - 包含运动强度 (Motion Amplitude)
   - 视频帧率 (FPS)
   - 相机三维推拉摇移、虚实焦段过渡
   - 多场景色调对准 (Color Matching)
   - 包含面向 AI 视频生片（Luma Dream Machine, Kling AI, Runway Gen-3）的最佳高保真提示词配方。

输出格式（JSON）：
{
  "projectSettings": {
    "cameraEquipment": "IMAX Camera & Arri Alexa LF",
    "lutProfile": "Morandi Soft Saturated Matte LUT",
    "lightingStandard": "Cinematic soft bounce light & back rim-lights"
  },
  "shots": [
    {
      "shotId": "对应镜头/分部段ID",
      "lensAndAperture": "焦距与光圈 (例如: 50mm Anamorphic Lens, f/2.0)",
      "cameraHeightAndTrajectory": "摄影高度与平面运镜路径",
      "motionFactor": "运动系数值 (1-5)",
      "lightingSetup": "专场打光细节",
      "videoPromptOverride": "融合了摄影用光、胶片颗粒、低饱和色彩配方的最终 AI 视频英文生片咒语"
    }
  ]
}
`

export default class CinematographerAgent extends BaseAgent {
  role = 'cinematographer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const directorOutput = ctx.getArtifact<{
      storyboards?: Array<{ segmentId: string; segmentNumber: number }>
    }>('director')

    const result = await this.thinkJson(ctx, [
      {
        role: 'user',
        content: `请为以下导演设计的分镜头与视频制作规范：\n\n${JSON.stringify(directorOutput || {}, null, 2)}\n\n设计出重工业级的摄影光学对焦方案、微观打光标准、与 AI 视频引擎渲染指令。`,
      },
    ])

    const shotCount = (result as { shots?: unknown[] }).shots?.length || 0
    return {
      data: result,
      summary: `摄影与视频生成技术指导参数包制定完成。已输出 ${shotCount} 组高保真电影变焦与画面质感控制流。`,
    }
  }
}
