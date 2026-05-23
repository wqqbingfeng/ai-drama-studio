import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Script } from '../../models/script'

const SYSTEM_PROMPT = `你是一位顶级的道具与资产设计师。负责为影视剧规划并设计所有关键道具、武器、车辆等资产。

你的任务：
1. 研读剧本，提出所有关键的剧情道具（MacGuffin）、交通工具、核心武器或特殊物品。
2. 结合整体世界观风格，给出道具设计的视觉规范。
3. 提供用于后续 AI 渲染生成资产图的 prompt。

输出格式（JSON）：
{
  "props": [
    {
      "id": "prop_1",
      "name": "道具名称",
      "category": "武器 / 交通 / 关键物品 / 场景装饰",
      "appearance": "详细的外观材质描述",
      "functionality": "在剧中的功能与作用",
      "backstory": "道具背后的故事（如有）",
      "imagePrompt": "用于 AI 生成道具美术概念图的生图提示词（必须体现极高细节与清晰背景）"
    }
  ]
}
`

export default class PropDesignerAgent extends BaseAgent {
  role = 'prop_designer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    
    // Default fallback script string if unavailable
    const content = script 
      ? JSON.stringify(script, null, 2)
      : '根据一般科幻或奇幻设定设计几个核心道具。'

    interface PropsResult {
      props?: Array<Record<string, unknown>>
    }

    const result = await this.thinkJson<PropsResult>(ctx, [
      {
        role: 'user',
        content: `请为以下内容提取并设计核心道具与资产：\n\n${content}`,
      },
    ])

    return {
      data: result,
      summary: `完成 ${result.props?.length || 0} 个核心道具与资产的设计`,
    }
  }
}
