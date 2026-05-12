import { BaseAgent } from '../base-agent'
import { AgentContext } from '../types'
import type { Script } from '../../models/script'
import type { CharacterCardOutput } from '../../models/character'
import type { SceneDesign } from '../../models/scene'
import type { Storyboard } from '../../models/storyboard'

const SYSTEM_PROMPT = `你是一位后期合成师，负责将前期所有产出整合为可交付的制作包。

你的工作流程：
1. 收集编剧的角色和场景信息
2. 收集角色设计师的角色卡（含 imagePrompt）
3. 收集场景设计师的场景描述（含 imagePrompt）
4. 收集导演的分镜表（含各镜头的 imagePrompt）
5. 收集摄影指导的机位/灯光方案
6. 整合所有信息，生成统一的制作清单
7. 为每个资源生成可直接用于 AI 生图的 prompt

输出格式（JSON）：
{
  "productionTitle": "制作标题",
  "assetInventory": {
    "characterCount": 角色数,
    "sceneCount": 场景数,
    "shotCount": 镜头数,
    "totalDuration": 预计总时长(秒)
  },
  "imageGenerationQueue": [
    {
      "id": "资源ID",
      "type": "character | scene | shot",
      "name": "资源名",
      "prompt": "完整的 AI 生图 prompt（中文，包含画风、构图、光线、色彩）",
      "negativePrompt": "负面 prompt（不希望出现的元素）",
      "size": "square | landscape | portrait",
      "style": "画风（如 写实/中国古风/赛博朋克 等）",
      "priority": 1-5,
      "referenceNotes": "参考说明"
    }
  ],
  "videoShotList": [
    {
      "shotId": "对应镜头ID",
      "shotNumber": 镜头号,
      "sceneId": "场景ID",
      "description": "镜头描述",
      "motionPrompt": "视频动作描述（英文，适合 Seedance）",
      "duration": 秒数,
      "sourceImageId": "使用的图片资源ID",
      "cameraParams": {
        "lens": "镜头",
        "aperture": "光圈",
        "movement": "运动方式"
      }
    }
  ],
  "productionNotes": "制作备注"
}`

export default class PostProductionAgent extends BaseAgent {
  role = 'post_production' as const
  systemPrompt = SYSTEM_PROMPT

  protected async run(ctx: AgentContext): Promise<{ data: unknown; summary: string }> {
    const script = ctx.getArtifact<Script>('screenwriter')
    const characters = ctx.getArtifact<CharacterCardOutput>('character_designer')
    const scenes = ctx.getArtifact<SceneDesign>('scene_designer')
    const storyboard = ctx.getArtifact<Storyboard>('director')
    const cinematography = ctx.getArtifact<unknown>('cinematographer')

    // 收集所有上游产出
    const upstreamData = {
      script: script ? { title: script.title, genre: (script as any).genre, characterCount: script.characters?.length, sceneCount: script.scenes?.length } : null,
      characters: characters?.characters?.map((c: any) => ({
        name: c.name,
        role: c.role,
        imagePrompt: c.imagePrompt,
        appearance: c.appearance,
      })) ?? [],
      scenes: (scenes as any)?.scenes?.map((s: any) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        imagePrompt: s.imagePrompt,
      })) ?? [],
      storyboard: storyboard?.shots?.map((s: any) => ({
        id: s.id,
        shotNumber: s.shotNumber,
        description: s.description,
        imagePrompt: s.imagePrompt,
        duration: s.duration,
      })) ?? [],
      cinematography: (cinematography as any)?.shots?.map((s: any) => ({
        shotId: s.shotId,
        lens: s.lens,
        aperture: s.aperture,
      })) ?? [],
    }

    // 用 LLM 整合生成制作包
    const result = await this.thinkJson(ctx, [
      {
        role: 'user',
        content: `请根据以下所有上游 Agent 的产出，整合生成后期制作包：

${JSON.stringify(upstreamData, null, 2)}

要求：
- 为每个角色、场景、镜头生成完整的 imagePrompt（如果上游已有则参考优化）
- imagePrompt 要详细到可以直接用于 AI 生图
- 为每个镜头生成适合 Seedance 视频生成的 motionPrompt（英文）
- 标注每个资源的优先级（主要角色/关键场景优先）
- 如果某项上游产出缺失，对应部分留空即可`,
      },
    ])

    const data = result as any
    const imgCount = data.imageGenerationQueue?.length ?? 0
    const shotCount = data.videoShotList?.length ?? 0

    // 尝试调用 Gateway 生成一张示例图（如果 API 已配置）
    let generationNote = ''
    if (data.imageGenerationQueue?.length > 0) {
      const firstAsset = data.imageGenerationQueue[0]
      try {
        const imgResult = await ctx.gateway.generateImage({
          prompt: firstAsset.prompt,
          size: firstAsset.size || 'portrait',
          style: firstAsset.style,
        })
        firstAsset.generatedUrl = imgResult.url
        generationNote = `已生成 ${firstAsset.name} 的示例图`
      } catch (err) {
        generationNote = `图像 API 尚未配置（${String(err).slice(0, 60)}），prompt 已就绪待生成`
      }
    }

    return {
      data,
      summary: `后期制作包完成：${imgCount} 个图像资源 + ${shotCount} 个视频镜头${generationNote ? ' — ' + generationNote : ''}`,
    }
  }
}
