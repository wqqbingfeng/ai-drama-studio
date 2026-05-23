import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Script } from '../../models/script'
import type { AgentRole, AgentOutput } from '../../models/production'

const SYSTEM_PROMPT = `你是一位严苛、高标准、拥有 20 年一线影视工业制片经验的【总制片人】。

你的核心工作职责：
1. **审查与核对文字拆解工作**：深度核查编剧针对原素材拆解出的人物、场景、道具细则。评估戏剧张力是否满足、15秒分段运镜是否具有实机拍摄/渲染可行性。
2. **算力负载预算评估**：针对拆解出来的重要角色、多维场景、复杂特效（VFX），核算生成所需要的算力成本、渲染时间及高价值资产渲染级别（S+/A级）。
3. **把关制片计划与周期**：合理指定制作生命线和排程。
4. **颁发正式验收和签名交付许可**：作为上游到下游的“质量闸口”，若文字拆解有明显疏漏、常识冲突或缺乏电影感，指出修改意见；若质量达标，则正式签发“生产绿灯许可”，以便美术师无缝对接。

输出格式要求（必须返回 JSON）：
{
  "projectTitle": "项目名称",
  "auditReport": {
    "scriptBreakdownRating": "A+级 | S级 (文字拆解综合评估评分)",
    "characterDesignFeasibility": "对拆解好的核心人物描述给出可行性以及莫兰迪风格承接建议",
    "sceneDesignFeasibility": "对拆解好的场景高级感、光影、微小物理细节进行美学和材质审核意见",
    "storyboardValidation": "审查每15秒段落的节奏，确认分镜生图提示词是否满足光线构图摄影标准"
  },
  "budgetEstimate": {
    "renderingLoadRating": "轻度 / 中度 / 高度负载 (根据特效和道具数量判断)",
    "computeBudget": "预计渲染总时长或所需计算配额 (如 350 核小时)",
    "vfxComplexityCost": "道具/视觉特效生成算力等级 (低 | 中 | 极高)"
  },
  "requiredDepartments": [
    "首席美术设计师",
    "影视导演",
    "摄影指导",
    "后期包装团队"
  ],
  "schedule": [
    { "phase": "阶段名称 (如 美术资产设计)", "duration": "时长估算", "description": "工作内容描述及期望成果" }
  ],
  "gatesReview": {
    "isApproved": true,
    "signingAuthority": "制片人签字通过 / 已获绿灯许可",
    "notesForArtTeam": "写给后续美术部门、导演部门如何具体落地 Morandi 高级灰并根据文字分镜执行的至关重要批示"
  }
}
`

interface ProducerResult {
  projectTitle?: string
  auditReport?: {
    scriptBreakdownRating?: string
    characterDesignFeasibility?: string
    sceneDesignFeasibility?: string
    storyboardValidation?: string
  }
  budgetEstimate?: {
    renderingLoadRating?: string
    computeBudget?: string
    vfxComplexityCost?: string
  }
  requiredDepartments?: string[]
  schedule?: Array<{ phase: string; duration: string; description: string }>
  gatesReview?: {
    isApproved?: boolean
    signingAuthority?: string
    notesForArtTeam?: string
  }
}

export default class ProducerAgent extends BaseAgent {
  role = 'producer' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    if (!script) throw new Error('找不到剧本，请先运行编剧/文字拆解 Agent')

    const result = await this.thinkJson<ProducerResult>(ctx, [
      {
        role: 'user',
        content: `请对以下全套文字拆解方案进行深度制片统筹、预算负载评估与严格审批：\n\n${JSON.stringify(script, null, 2)}`,
      },
    ])

    const isApp = result.gatesReview?.isApproved ? '已审批通过，项目发放绿灯' : '发回修改'
    return {
      data: result,
      summary: `制片统筹与质量验收完成：${isApp}。算力评级：${result.budgetEstimate?.renderingLoadRating || '未知'}, 精确签字：${result.gatesReview?.signingAuthority || '待签'}`,
    }
  }

  override async review(
    ctx: AgentContext,
    upstreamRole: AgentRole,
    upstreamOutput: AgentOutput,
  ): Promise<string | null> {
    if (upstreamRole !== 'screenwriter') return null
    const feedback = await this.think(ctx, [
      {
        role: 'user',
        content: `你当前作为总制片人。请严格审核上游 编剧 刚刚产出的全套【剧本与15秒分段文字拆解】：\n\n${JSON.stringify(upstreamOutput.data, null, 2)}\n\n如果所有拆解（集数、15秒分镜、莫兰迪色柔和要素、道具、特效描述）完全极具张力、高专业度，请**只回复两个汉字："通过"**。如果有需要调整、增强电影感或者让分镜画幅生图参数更具体的，请给出针对性的高标准修改意见。`,
      },
    ], { temperature: 0.2 })

    return feedback.includes('通过') ? null : feedback
  }
}
