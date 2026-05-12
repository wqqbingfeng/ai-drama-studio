import { memo, useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Settings, CheckCircle2, XCircle, Loader2, Circle, Edit3, Plus, RotateCcw, MousePointer2, Hand, Share2, Maximize, SlidersHorizontal, MoreHorizontal, FileText, LayoutTemplate, Shapes, Clapperboard, Video, Mic, Scissors, Film, Users } from 'lucide-react'
import { AgentLabels } from '../../models/production'
import type { AgentRole, AgentOutput } from '../../models/production'
import { TaskFlow, DEFAULT_PRODUCTION_FLOW } from '../../models/workflow'
import { useProductionStore } from '../../state/store'

const getRoleIcon = (role: string) => {
  switch(role) {
    case 'screenwriter': return <Edit3 size={16} className="text-[#E2AB46]" />
    case 'character_designer': return <Users size={16} className="text-[#E2AB46]" />
    case 'scene_designer': return <Shapes size={16} className="text-[#51C49F]" />
    case 'director': return <Clapperboard size={16} className="text-[#9D52F5]" />
    case 'cinematographer': return <Video size={16} className="text-[#4EADF6]" />
    case 'post_production': return <Film size={16} className="text-[#F5679E]" />
    default: return <FileText size={16} className="text-[#E2AB46]" />
  }
}

const getRoleSubtext = (role: string) => {
  switch(role) {
    case 'screenwriter': return '剧本生成与优化'
    case 'character_designer': return '角色造型与设定'
    case 'scene_designer': return '场景概念与地图'
    case 'director': return '镜头调度与视听'
    case 'cinematographer': return '画面生成与渲染'
    case 'post_production': return '合成出片'
    default: return '数据处理'
  }
}

function statusIndicator(status?: string) {
  switch (status) {
    case 'done': return <><div className="w-2 h-2 rounded-full bg-[#34A853]"></div><span className="text-[#34A853]">已完成</span></>
    case 'failed': return <><div className="w-2 h-2 rounded-full bg-[#EA4335]"></div><span className="text-[#EA4335]">执行失败</span></>
    case 'running': return <><div className="w-2 h-2 rounded-full bg-[#E2AB46] animate-pulse"></div><span className="text-[#E2AB46]">执行中</span></>
    case 'pending': return <><div className="w-2 h-2 rounded-full bg-[#8AB4F8]"></div><span className="text-[#8AB4F8]">已就绪</span></>
    default: return <><div className="w-2 h-2 rounded-full bg-[#833AB4]"></div><span className="text-[#833AB4]">等待中</span></>
  }
}

export const AgentNode = memo(({ data }: any) => {
  const { role, status, isCurrent, onEdit, onConfig } = data

  const statusColor = status === 'done' 
    ? 'border-[#2A2A35]'
    : status === 'failed' 
      ? 'border-[#EA4335] shadow-[0_0_10px_rgba(234,67,53,0.2)]'
      : isCurrent 
        ? 'border-[#E2AB46] shadow-[0_0_15px_rgba(226,171,70,0.2)] animate-pulse'
        : 'border-[#2A2A35]'

  return (
    <div className={`relative px-4 py-4 pr-12 bg-[#1A1A1F] rounded-2xl border ${statusColor} min-w-[220px] transition-colors group`}>
      <Handle type="target" position={Position.Left} className="!bg-[#666] !w-2 !h-2 !border-0 !left-[-4px]" />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#22222A] flex items-center justify-center shrink-0">
           {getRoleIcon(role)}
        </div>
        <div className="flex flex-col gap-1">
           <span className="text-[14px] font-medium text-[#e5e5e5] leading-none">{AgentLabels[role as AgentRole] || role}</span>
           <span className="text-[11px] text-[#66666e] truncate max-w-[120px] leading-none">{getRoleSubtext(role)}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 mt-3 text-[11px]">
         {statusIndicator(isCurrent ? 'running' : status)}
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {status === 'done' && (
          <button 
             title="编辑产出"
             onClick={() => onEdit(role)} 
             className="text-[#666] hover:text-[#e5e5e5] transition-colors p-1"
          >
            <Edit3 size={12} />
          </button>
        )}
        <button 
           title="配置 Agent"
           onClick={() => onConfig(role)}
           className="text-[#666] hover:text-[#e5e5e5] transition-colors p-1"
        >
          <Settings size={12} />
        </button>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#666] !w-2 !h-2 !border-0 !right-[-4px]" />
    </div>
  )
})

const nodeTypes = {
  agentNode: AgentNode,
}

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, align: 'DL', ranksep: 120, nodesep: 80 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 240, height: 100 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 220 / 2,
        y: nodeWithPosition.y - 80 / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

interface WorkflowCanvasProps {
  flow: TaskFlow
  outputs: Record<AgentRole, AgentOutput | null>
  currentAgent: AgentRole | null
  logs: any[]
  onEdit: (role: AgentRole) => void
  onConfig: (role: AgentRole) => void
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  )
}

function WorkflowCanvasContent({ flow, outputs, currentAgent, logs, onEdit, onConfig }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const setFlow = useProductionStore(s => s.setFlow)
  const containerRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null)

  // Layout initialization
  useEffect(() => {
    const initialNodes: Node[] = flow.map((task) => {
      const output = outputs[task.role]
      const status = output ? output.status : currentAgent === task.role ? 'running' : 'pending'
      const isCurrent = currentAgent === task.role
      const message = logs.filter(l => l.agent === task.role).pop()?.message
      
      return {
        id: task.role,
        type: 'agentNode',
        data: { role: task.role, status, isCurrent, message, onEdit, onConfig },
        position: { x: 0, y: 0 },
      }
    })

    const initialEdges: Edge[] = flow.flatMap((task) => 
      task.dependsOn.map((dep, idx) => ({
        id: `${dep}-${task.role}-${idx}`,
        source: dep,
        target: task.role,
        type: 'smoothstep',
        animated: currentAgent === task.role,
        style: { stroke: '#44444c', strokeWidth: 1.5 }
      }))
    )

    // Prevent overriding dragged positions by only layouting if it's the first time
    // Actually, DAG layout overrides dragging unless we track if user dragged it.
    // For now, always re-layout on flow change.
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [flow, outputs, currentAgent, logs, onEdit, onConfig, setNodes, setEdges])

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#44444c', strokeWidth: 1.5 } }, eds))
    // Update store flow
    if (params.target && params.source) {
      setFlow(flow.map(f => {
        if (f.role === params.target) {
          return { ...f, dependsOn: [...new Set([...f.dependsOn, params.source as AgentRole])] }
        }
        return f
      }))
    }
  }, [flow, setEdges, setFlow])

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    // Reconstruct dependsOn based on remaining edges
    const deletedSources = deleted.map(d => ({ source: d.source, target: d.target }))
    setFlow(flow.map(f => {
      const depsToRemove = deletedSources.filter(d => d.target === f.role).map(d => d.source)
      if (depsToRemove.length > 0) {
        return { ...f, dependsOn: f.dependsOn.filter(dep => !depsToRemove.includes(dep)) }
      }
      return f
    }))
  }, [flow, setFlow])

  const handleContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    if (!containerRef.current) return
    const bounds = containerRef.current.getBoundingClientRect()
    setMenuPos({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    })
  }, [])

  const closeMenu = () => setMenuPos(null)

  const addAgentToCanvas = useCallback((role: AgentRole) => {
    if (!flow.some(f => f.role === role)) {
       setFlow([...flow, { role, dependsOn: [] }])
    }
    closeMenu()
  }, [flow, setFlow])

  const ALL_AGENTS_LIST: AgentRole[] = [
    'screenwriter',
    'character_designer',
    'scene_designer',
    'director',
    'cinematographer',
    'post_production',
  ]

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-default bg-[#0E0E11]">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         {/* Toolbar */}
         <div className="flex items-center bg-[#1A1A1F] border border-[#2A2A35] rounded-lg p-1 shadow-lg">
           <button className="p-1.5 rounded-md text-[#E2AB46] bg-[#2A2A35] hover:text-[#E2AB46] transition-colors"><MousePointer2 size={16} /></button>
           <button className="p-1.5 rounded-md text-[#888] hover:text-[#e5e5e5] hover:bg-[#2A2A35] transition-colors"><Hand size={16} /></button>
           <button className="p-1.5 rounded-md text-[#888] hover:text-[#e5e5e5] hover:bg-[#2A2A35] transition-colors"><Share2 size={16} /></button>
           <button className="p-1.5 rounded-md text-[#888] hover:text-[#e5e5e5] hover:bg-[#2A2A35] transition-colors"><Maximize size={16} /></button>
           <button className="p-1.5 rounded-md text-[#888] hover:text-[#e5e5e5] hover:bg-[#2A2A35] transition-colors"><SlidersHorizontal size={16} /></button>
           <button className="p-1.5 rounded-md text-[#888] hover:text-[#e5e5e5] hover:bg-[#2A2A35] transition-colors"><MoreHorizontal size={16} /></button>
         </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
        onPaneContextMenu={handleContextMenu}
        onClick={closeMenu}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="#2a2a35" gap={24} size={1} />
      </ReactFlow>

      {/* Minimap (mock) */}
      <div className="absolute bottom-4 right-4 z-10 w-32 h-20 bg-[#1A1A1F] border border-[#2A2A35] rounded-xl flex items-center justify-center p-2">
         {/* Simplified minimap visualization */}
         <div className="relative w-full h-full">
           <div className="absolute inset-0 border border-[#E2AB46] bg-[rgba(226,171,70,0.1)] rounded pointer-events-none z-10"></div>
           <div className="flex gap-1 h-full items-center justify-center opacity-40">
             <div className="w-3 h-2 bg-[#E2AB46] rounded-sm"></div>
             <div className="w-4 border-t border-[#666]"></div>
             <div className="flex flex-col gap-1">
               <div className="w-3 h-2 bg-[#51C49F] rounded-sm"></div>
               <div className="w-3 h-2 bg-[#9D52F5] rounded-sm"></div>
             </div>
             <div className="w-4 border-t border-[#666]"></div>
             <div className="w-3 h-2 bg-[#F5679E] rounded-sm"></div>
           </div>
           <Maximize size={10} className="absolute top-1 right-1 text-[#666]" />
         </div>
      </div>

      {/* Custom Context Menu */}
      {menuPos && (
        <div 
           className="absolute z-50 bg-[#18181b] border border-[#2a2a2a] rounded-xl shadow-2xl py-2 min-w-[180px] text-sm"
           style={{ top: menuPos.y, left: menuPos.x }}
        >
          <div className="px-3 py-1.5 text-[10px] text-[#666] font-medium uppercase tracking-[0.1em] mb-1">招募 Agent 到画布</div>
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {ALL_AGENTS_LIST.map(role => {
               const exists = flow.some(f => f.role === role)
               return (
                 <button 
                   key={role}
                   disabled={exists}
                   onClick={() => addAgentToCanvas(role)}
                   className="w-full text-left px-4 py-2 hover:bg-[#2a2a2a] flex items-center justify-between transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-[#e5e5e5]"
                 >
                   <span className="text-[13px]">{AgentLabels[role as AgentRole] || role}</span>
                   <Plus size={14} className={exists ? 'opacity-0' : 'text-[#888]'} />
                 </button>
               )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

