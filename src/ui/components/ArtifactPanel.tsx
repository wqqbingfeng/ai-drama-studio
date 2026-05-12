import { motion } from 'framer-motion'
import type { AgentOutput } from '../../models/production'
import { AgentRole, AgentLabels } from '../../models/production'
import { FileCode, Play, Image as ImageIcon, Text, Scissors } from 'lucide-react'

// Use some placeholder images for the different types of artifacts to mimic the reference image
const roleImageMap: Record<string, { src: string, type: 'video' | 'image' | 'text', count: string }> = {
  screenwriter: { src: '', type: 'text', count: '10.5k 字' },
  character_designer: { src: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&fit=crop', type: 'image', count: '18 张' },
  scene_designer: { src: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&fit=crop', type: 'image', count: '32 张' },
  director: { src: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400&fit=crop', type: 'image', count: '42 张' },
  cinematographer: { src: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=400&fit=crop', type: 'video', count: '1080p' },
  post_production: { src: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&fit=crop', type: 'video', count: '4K' },
}

function ArtifactCard({ output, version }: { output: AgentOutput, version: number }) {
  const role = output.agent
  const meta = roleImageMap[role] || { src: '', type: 'text', count: '1 文档' }
  const label = AgentLabels[role]

  // Some mock names corresponding to the reference
  const nameMap: Record<string, string> = {
    screenwriter: '剧本原稿',
    character_designer: '角色设定集',
    scene_designer: '场景概念图',
    director: '分镜稿',
    cinematographer: '视频素材库',
    post_production: '预告片粗剪'
  }
  
  const title = nameMap[role] || label

  return (
    <div className="flex flex-col gap-3 group cursor-pointer w-[240px] shrink-0">
      <div className="w-full aspect-[16/9] rounded-xl bg-[#1A1A1F] border border-[#2A2A35] group-hover:border-[#E2AB46] transition-colors overflow-hidden relative shadow-sm">
        {meta.src ? (
          <img src={meta.src} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#444]">
            <Text size={32} />
          </div>
        )}

        {meta.type === 'video' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
              <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                 <Play size={14} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded border border-white/10 text-[10px] text-white font-mono">
              {role === 'post_production' ? '03:15' : '00:28'}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h4 className="text-[14px] text-[#e5e5e5] font-medium leading-none">{title} v{version}</h4>
        <p className="text-[11px] text-[#66666e] leading-none flex items-center gap-1.5 mt-1">
          {meta.type === 'video' ? '视频' : meta.type === 'image' ? '图片' : '文本'} 
          <span className="w-1 h-1 rounded-full bg-[#333]"></span> 
          {meta.count}
        </p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-text-muted">
      <FileCode size={24} className="mb-3 opacity-40" />
      <p className="text-xs">等待各 Agent 产出...</p>
    </div>
  )
}

export function ArtifactPanel({ outputs }: { outputs: Record<string, AgentOutput | null> }) {
  const doneOutputs = Object.entries(outputs).filter(
    ([, o]) => o?.status === 'done' && o.data,
  )

  if (doneOutputs.length === 0) return <EmptyState />

  return (
    <div className="flex gap-4 overflow-x-auto custom-scrollbar w-full h-full p-2 pb-4">
      {doneOutputs.map(([_, output], idx) => (
        <ArtifactCard key={output!.id} output={output!} version={idx + 1} />
      ))}
    </div>
  )
}
