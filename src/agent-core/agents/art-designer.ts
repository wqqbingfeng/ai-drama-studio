import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位首席美术设计师（Chief Art Designer），负责电影全套视觉资产的美学定调。

你专注于将文字拆解（角色特征、场景特征、重要道具与特效、以及分镜图的原始提示词）升级为影视级别的【莫兰迪美学资产标准设计包】。

你的工作要点：
1. **统一美学风格**：全片基于莫兰迪低饱和色系 (Morandi Color System) —— 运用高级优雅的驼色、雾霾蓝、松石绿、藕粉、大理石灰和烟灰。色彩过渡柔和、富有颗粒质感、低对比度。
2. **角色原画资产细化**：对接拆解的人物特征，深化出角色服饰层级、面容光影，输出一致性的生图提示词。
3. **场景氛围图资产细化**：深化场景的空间、纵深、物理反光和材质质感。
4. **道具与特效资产细化**：描述特种戏剧道具/特效的物理外形、反射光谱和做旧肌理。
5. **分镜图视觉升级（核心）**：对接编剧规划的15秒镜头段落与原始提示词，加入专业的莫兰迪色影调、Arri电影变焦成像、漫反射柔光配方、黄金分割摄影构图、和高质感一致性细节，产出影视成品生图提示词。

输出格式要求（必须返回 JSON）：
{
  "visualStyleSummary": "莫兰迪奢华低饱和高级灰美学风格阐述",
  "characters": [
    {
      "id": "角色ID (如 char_01)",
      "name": "角色名",
      "MorandiColorScheme": "对应角色的专属色盘 (如: 驼色、大理石灰与雾霾蓝)",
      "refinedClothing": "细化后的高级刺绣、磨损服饰材质肌理描述",
      "imagePrompt": "莫兰迪柔和灰色调，专业电影肖像，高质量，低饱和色，用于生成完美肖像的一致性 prompt"
    }
  ],
  "scenes": [
    {
      "id": "场景ID (如 scene_01)",
      "name": "场景地名",
      "colorPalette": ["莫兰迪色1", "莫兰迪色2"],
      "lightingSetup": "环境漫折射、柔和日光柱、浅景深",
      "atmosphere": "情绪与低饱和度深度氛围描述",
      "imagePrompt": "低饱和度莫兰迪色系，精美电影剧照，空间透视立体，微暗光，极致详细场景 prompt"
    }
  ],
  "propsAndEffects": [
    {
      "name": "道具/特效名称",
      "appearance": "在原文字基础上，充溢着莫兰迪灰、微弱的反光质感和高雅的工业拉丝等微观细节",
      "imagePrompt": "静物特写，低饱和莫兰迪色调，柔和暗边光，极致详细资产 prompt"
    }
  ],
  "upgradedStoryboards": [
    {
      "segmentId": "对应15秒分段段落ID (如 ep1_seg1)",
      "segmentNumber": 1,
      "upgradedImagePrompt": "融合莫兰迪灰调色盘 (Morandi muted styling), 摄影机深景深成像, 极光漫散射, 影视金奖构图与镜头焦段细节的最终终极大画幅生图/气氛提示词"
    }
  ]
}
`

interface ArtDesignerResult {
  visualStyleSummary: string
  characters: Array<{
    id: string
    name: string
    MorandiColorScheme: string
    refinedClothing: string
    imagePrompt: string
  }>
  scenes: Array<{
    id: string
    name: string
    colorPalette: string[]
    lightingSetup: string
    atmosphere: string
    imagePrompt: string
  }>
  propsAndEffects: Array<{
    name: string
    appearance: string
    imagePrompt: string
  }>
  upgradedStoryboards: Array<{
    segmentId: string
    segmentNumber: number
    upgradedImagePrompt: string
  }>
}

export default class ArtDesignerAgent extends BaseAgent {
  role = 'art_designer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    if (!script) throw new Error('找不到剧本拆解，请先运行编剧 Agent')

    const result = await this.thinkJson<ArtDesignerResult>(ctx, [
      {
        role: 'user',
        content: `请根据以下文字拆解成果，将其整体包装并生成高雅、高大上的莫兰迪低饱和色系统一美学资产标准设计包（含角色原画设计、场景原图、道具细节、及各分段分镜视觉提示词完美重塑）：\n\n${JSON.stringify(script, null, 2)}`,
      },
    ])

    const charCount = result.characters?.length || 0
    const sceneCount = result.scenes?.length || 0
    const boardsCount = result.upgradedStoryboards?.length || 0

    return {
      data: result,
      summary: `莫兰迪视觉美术大师任务执行成功。生成了 ${charCount} 个核心人物造型卡、${sceneCount} 个莫兰迪场景气氛基调、以及 ${boardsCount} 组经过美学重组的分镜视觉图最终提示词(Image Prompt)。`,
    }
  }
}
