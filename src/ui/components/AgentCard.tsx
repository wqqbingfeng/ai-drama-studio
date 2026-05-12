import { motion } from 'framer-motion'
import type { AgentOutput, AgentRole } from '../../models/production'
import { AgentLabels } from '../../models/production'
import { AudioLines, Clapperboard, Palette, MapPin, Camera, Film } from 'lucide-react'

const roleIcons: Record<AgentRole, typeof AudioLines> = {
  orchestrator: Clapperboard,
  screenwriter: AudioLines,
  character_designer: Palette,
  scene_designer: MapPin,
  director: Camera,
  cinematographer: Camera,
  post_production: Film,
}

const statusColor: Record<string, string> = {
  pending: 'bg-border',
  running: 'bg-[oklch(0.55_0.18_260)]',
  done: 'bg-[oklch(0.55_0.15_160)]',
  failed: 'bg-[oklch(0.55_0.2_30)]',
}

export function AgentCard({
  role,
  output,
  isActive,
  message,
}: {
  role: AgentRole
  output: AgentOutput | null
  isActive: boolean
  message?: string
}) {
  const status = output?.status ?? (isActive ? 'running' : 'pending')
  const Icon = roleIcons[role]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border rounded-lg p-3 flex flex-col gap-1 transition-colors ${
        isActive 
          ? 'border-accent bg-accent-subtle' 
          : 'border-border bg-[#18181b] hover:border-accent hover:bg-accent-subtle'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <Icon size={14} className="text-text-muted" />
          <span className={`w-2 h-2 rounded-full ${statusColor[status]} ${isActive ? 'animate-pulse' : ''}`} />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
          {AgentLabels[role]}
        </div>
        {isActive && (
          <div className="flex items-center gap-2 mt-1 text-[11px] text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            执行中
          </div>
        )}
        {output?.error && (
          <p className="text-error text-[11px] mt-1.5 leading-relaxed">{output.error}</p>
        )}
        {message && !output?.error && !isActive && (
          <p className="text-text-muted text-[11px] mt-1.5 leading-relaxed">{message}</p>
        )}
        {output?.summary && (
          <p className="text-[#f4f4f5] text-[13px] font-medium mt-1 leading-relaxed">{output.summary}</p>
        )}
      </div>
    </motion.div>
  )
}
