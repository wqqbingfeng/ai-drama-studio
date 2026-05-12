import { AgentRole, AgentLabels } from '../../models/production'
import { History } from 'lucide-react'

interface LogEntry {
  agent: AgentRole
  message: string
  timestamp: number
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-text-muted">
      <History size={24} className="mb-3 opacity-40" />
      <p className="text-xs">暂无日志</p>
    </div>
  )
}

export function Timeline({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) return <EmptyState />

  return (
    <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-[12px] bg-[#09090b] p-4 text-[#a1a1aa]">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 leading-relaxed mb-1">
          <span className="text-[#52525b] shrink-0">
            [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
          </span>
          <span className="text-[#818cf8] shrink-0 w-24">
            {AgentLabels[log.agent]}
          </span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  )
}
