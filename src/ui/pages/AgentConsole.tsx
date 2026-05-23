import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, Clock, FileJson, Download,
  AudioLines, Palette, MapPin, Camera, Film, Clapperboard,
  CheckCircle2, XCircle, Circle, Loader2,
} from 'lucide-react'
import { useProductionStore } from '../../state/store'
import type { AgentRole, AgentOutput } from '../../models/production'
import { AgentLabels } from '../../models/production'

const ALL_AGENTS: AgentRole[] = [
  'producer', 'screenwriter', 'character_designer', 'scene_designer',
  'prop_designer', 'director', 'cinematographer', 'vfx_designer', 'post_production', 'art_designer',
]

const roleIcons: Record<AgentRole, typeof AudioLines> = {
  orchestrator: Clapperboard,
  producer: Clapperboard,
  screenwriter: AudioLines,
  character_designer: Palette,
  scene_designer: MapPin,
  prop_designer: Palette,
  director: Camera,
  cinematographer: Camera,
  vfx_designer: Camera,
  post_production: Film,
  art_designer: Palette,
}

function statusIcon(status: string) {
  switch (status) {
    case 'done': return <CheckCircle2 size={14} className="text-[oklch(0.55_0.15_160)]" />
    case 'failed': return <XCircle size={14} className="text-[oklch(0.55_0.2_30)]" />
    case 'running': return <Loader2 size={14} className="text-[oklch(0.55_0.18_260)] animate-spin" />
    default: return <Circle size={14} className="text-border" />
  }
}

function formatTime(iso?: string) {
  if (!iso) return '--'
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function AgentDetail({ role, output }: { role: AgentRole; output: AgentOutput | null }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = roleIcons[role]
  const status = output?.status ?? 'pending'

  const handleExport = () => {
    if (!output?.data) return
    const blob = new Blob([JSON.stringify(output.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${role}_${output.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border bg-[#18181b] rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent-subtle transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
        <Icon size={14} className="text-text-muted" />
        <span className="text-sm font-medium flex-1">{AgentLabels[role]}</span>
        {statusIcon(status)}
        <span className="text-[10px] text-text-muted w-12 text-right">
          {status === 'done' ? '完成' : status === 'failed' ? '失败' : status === 'running' ? '执行中' : '待执行'}
        </span>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Meta */}
              <div className="flex items-center gap-4 text-[10px] text-text-muted">
                <span className="flex items-center gap-1"><Clock size={10} />开始 {formatTime(output?.startedAt)}</span>
                <span className="flex items-center gap-1"><Clock size={10} />完成 {formatTime(output?.completedAt)}</span>
              </div>

              {/* Summary */}
              {output?.summary && (
                <p className="text-xs text-text leading-relaxed">{output.summary}</p>
              )}

              {/* Error */}
              {output?.error && (
                <p className="text-xs text-[oklch(0.55_0.2_30)] leading-relaxed bg-[oklch(0.55_0.2_30)/0.08] px-3 py-2">{output.error}</p>
              )}

              {/* JSON Data */}
              {!!output?.data && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-text-muted flex items-center gap-1">
                      <FileJson size={10} />产出数据
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport() }}
                      className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-text transition-colors"
                    >
                      <Download size={10} />
                      导出 JSON
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono leading-relaxed bg-[#09090b] p-3 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-border text-[#a1a1aa] rounded-md">
                    {JSON.stringify(output.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Empty */}
              {!output?.data && !output?.error && (
                <p className="text-xs text-text-muted">尚未产生数据</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PipelineGraph() {
  const outputs = useProductionStore((s) => s.outputs)
  const currentAgent = useProductionStore((s) => s.currentAgent)

  const edges = [
    ['screenwriter', 'character_designer'],
    ['screenwriter', 'scene_designer'],
    ['screenwriter', 'director'],
    ['character_designer', 'director'],
    ['director', 'cinematographer'],
    ['cinematographer', 'post_production'],
    ['scene_designer', 'post_production'],
    ['character_designer', 'post_production'],
  ]

  return (
    <div className="border border-border p-4 bg-[#0c0c0e] rounded-lg overflow-hidden">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-4">执行管线</h3>
      <div className="flex flex-wrap items-center gap-1.5">
        {ALL_AGENTS.map((role, i) => {
          const output = outputs[role]
          const isCurrent = currentAgent === role
          const color = output?.status === 'done'
            ? 'border-[oklch(0.55_0.15_160)] text-[oklch(0.55_0.15_160)]'
            : output?.status === 'failed'
              ? 'border-[oklch(0.55_0.2_30)] text-[oklch(0.55_0.2_30)]'
              : isCurrent
                ? 'border-[oklch(0.55_0.18_260)] text-[oklch(0.55_0.18_260)] animate-pulse'
                : 'border-border text-text-muted'

          return (
            <span key={role} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border text-[10px]">→</span>}
              <span className={`text-[10px] px-2 py-1 border ${color} whitespace-nowrap`}>
                {AgentLabels[role]}
              </span>
            </span>
          )
        })}
      </div>
      {/* Dependency legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-text-muted">
        {edges.map(([from, to]) => (
          <span key={from + to} className="opacity-60">
            {AgentLabels[from as AgentRole]} → {AgentLabels[to as AgentRole]}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AgentConsole() {
  const outputs = useProductionStore((s) => s.outputs)
  const plan = useProductionStore((s) => s.plan)
  const logs = useProductionStore((s) => s.logs)
  const hasData = Object.values(outputs).some(Boolean)

  const handleExportAll = () => {
    const allData: Record<string, unknown> = {}
    for (const role of ALL_AGENTS) {
      const o = outputs[role]
      if (o?.data) allData[role] = o.data
    }
    const blob = new Blob([JSON.stringify({ plan, outputs: allData, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `production_${plan?.title || 'export'}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Pipeline Graph */}
      <PipelineGraph />

      {/* Agent Details */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Agent 产出</h3>
          {hasData && (
            <button onClick={handleExportAll} className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-text transition-colors">
              <Download size={10} />
              导出全部
            </button>
          )}
        </div>

        {!hasData ? (
          <div className="border border-border p-8 text-center rounded-lg bg-[#0c0c0e]">
            <Clapperboard size={24} className="text-border mx-auto mb-3" />
            <p className="text-xs text-text-muted">暂无 Agent 产出，请先在制作页面开始一次制作</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ALL_AGENTS.map((role) => (
              <AgentDetail key={role} role={role} output={outputs[role] ?? null} />
            ))}
          </div>
        )}
      </div>

      {/* Log Timeline */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">执行日志</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-1 bg-[#09090b] font-mono text-[12px] text-[#a1a1aa]">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 leading-relaxed mb-1">
                  <span className="text-[#52525b] shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span className="text-[#818cf8] shrink-0 w-24">
                    {AgentLabels[log.agent]}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
