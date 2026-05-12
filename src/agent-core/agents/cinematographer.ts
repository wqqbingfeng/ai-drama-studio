import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Storyboard } from '../../models/storyboard'

const SYSTEM_PROMPT = `你是一位摄影指导，负责为导演的分镜头脚本确定具体的摄影参数。

你的任务：
1. 分析每个镜头的叙事需求
2. 确定最佳的机位和镜头参数
3. 确保镜头语言服务于故事表达

输出格式（JSON）：
{
  "shots": [
    {
      "shotId": "对应镜头ID",
      "lens": "镜头焦距（如 50mm / 85mm / 24-70mm）",
      "aperture": "光圈（如 f/1.8 / f/2.8 / f/8）",
      "cameraHeight": "机位高度",
      "distance": "拍摄距离",
      "lightingSetup": "布光方案",
      "colorGrade": "色调倾向",
      "notes": "摄影备注"
    }
  ]
}`

export default class CinematographerAgent extends BaseAgent {
  role = 'cinematographer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const storyboard = ctx.getArtifact<Storyboard>('director')
    if (!storyboard) throw new Error('找不到分镜表，请先运行导演 Agent')

    const result = await this.thinkJson(ctx, [
      {
        role: 'user',
        content: `请为以下分镜设计摄影方案：\n\n${JSON.stringify(storyboard, null, 2)}`,
      },
    ])

    return {
      data: result,
      summary: `完成 ${storyboard.shots.length} 个镜头的摄影方案`,
    }
  }
}
