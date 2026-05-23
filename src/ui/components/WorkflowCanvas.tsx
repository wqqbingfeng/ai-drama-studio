import { useState } from 'react'
import {
  Settings, Edit3, Plus, Hand, FileText, Shapes,
  Clapperboard, Video, Film, Users, Sparkles,
  CheckCircle2, AlertCircle, Loader2, Play, Trash2, ChevronDown, Check
} from 'lucide-react'
import { AgentLabels } from '../../models/production'
import type { AgentRole, AgentOutput } from '../../models/production'
import { TaskFlow } from '../../models/workflow'
import { useProductionStore } from '../../state/store'

const getRoleIcon = (role: string) => {
  switch(role) {
    case 'producer': return <Settings size={18} className="text-[#34A853]" />
    case 'screenwriter': return <Edit3 size={18} className="text-[#E2AB46]" />
    case 'character_designer': return <Users size={18} className="text-[#E2AB46]" />
    case 'art_designer': return <Shapes size={18} className="text-[#51C49F]" />
    case 'scene_designer': return <Shapes size={18} className="text-[#51C49F]" />
    case 'prop_designer': return <Hand size={18} className="text-[#51C49F]" />
    case 'director': return <Clapperboard size={18} className="text-[#9D52F5]" />
    case 'cinematographer': return <Video size={18} className="text-[#4EADF6]" />
    case 'vfx_designer': return <Sparkles size={18} className="text-[#4EADF6]" />
    case 'post_production': return <Film size={18} className="text-[#F5679E]" />
    default: return <FileText size={18} className="text-[#E2AB46]" />
  }
}

const getRoleSubtext = (role: string) => {
  switch(role) {
    case 'producer': return '制片统一审核与验收协调'
    case 'screenwriter': return '全集剧本拆解与15s分镜规划'
    case 'character_designer': return '角色概念特质描述与画质词'
    case 'art_designer': return '全景美术统一设计规划与提示词描述'
    case 'scene_designer': return '场景概念氛围描述与定位'
    case 'prop_designer': return '核心道具美术资产生成特征'
    case 'director': return '分镜镜头提示词、视角调度'
    case 'cinematographer': return '各段分镜提示词、光影质感'
    case 'vfx_designer': return '重要道具动效与CG技术定义'
    case 'post_production': return '最终视听合成与成品输出'
    default: return '数据处理'
  }
}

interface LogItem {
  id?: string
  agent: string
  message: string
  timestamp?: string | number
}

interface WorkflowCanvasProps {
  flow: TaskFlow
  outputs: Record<AgentRole, AgentOutput | null>
  currentAgent: AgentRole | null
  logs: LogItem[]
  onEdit: (role: AgentRole) => void
  onConfig: (role: AgentRole) => void
  onRerun?: (role: AgentRole) => void
}

export function WorkflowCanvas({ flow, outputs, currentAgent, logs, onEdit, onConfig, onRerun }: WorkflowCanvasProps) {
  const setFlow = useProductionStore(s => s.setFlow)
  const flowMode = useProductionStore(s => s.flowMode)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [activeDepDropdown, setActiveDepDropdown] = useState<AgentRole | null>(null)

  const ALL_AGENTS_LIST: AgentRole[] = [
    'producer',
    'screenwriter',
    'art_designer',
    'character_designer',
    'scene_designer',
    'prop_designer',
    'director',
    'cinematographer',
    'vfx_designer',
    'post_production',
  ]

  const getDeptRoles = (deptId: string): AgentRole[] => {
    let deptStandards: AgentRole[] = []
    if (deptId === 'script_and_planning') {
      deptStandards = ['producer', 'screenwriter']
    } else if (deptId === 'art_and_assets') {
      deptStandards = flowMode === 'streamlined' ? ['art_designer'] : ['character_designer', 'scene_designer', 'prop_designer']
    } else if (deptId === 'visual_production') {
      deptStandards = flowMode === 'streamlined' ? ['director', 'post_production'] : ['director', 'cinematographer', 'vfx_designer', 'post_production']
    }

    const deptAllPossible = deptId === 'script_and_planning' 
      ? ['producer', 'screenwriter']
      : deptId === 'art_and_assets'
        ? ['art_designer', 'character_designer', 'scene_designer', 'prop_designer']
        : ['director', 'cinematographer', 'vfx_designer', 'post_production']

    const extraInFlow = flow
      .map(f => f.role)
      .filter(r => deptAllPossible.includes(r) && !deptStandards.includes(r))

    return Array.from(new Set([...deptStandards, ...extraInFlow]))
  }

  const DEPARTMENTS = [
    {
      id: 'script_and_planning',
      title: '1. 剧本策划部 (Scripting Group)',
      borderColor: 'border-[#E2AB46]/20',
      titleColor: 'text-[#E2AB46]',
      roles: getDeptRoles('script_and_planning')
    },
    {
      id: 'art_and_assets',
      title: '2. 美术设计部 (Art Assets Group)',
      borderColor: 'border-[#51C49F]/20',
      titleColor: 'text-[#51C49F]',
      roles: getDeptRoles('art_and_assets')
    },
    {
      id: 'visual_production',
      title: '3. 视频镜头部 (Directing & Video)',
      borderColor: 'border-[#4EADF6]/20',
      titleColor: 'text-[#4EADF6]',
      roles: getDeptRoles('visual_production')
    }
  ]

  const addAgentToFlow = (role: AgentRole) => {
    if (!flow.some(f => f.role === role)) {
      setFlow([...flow, { role, dependsOn: [] }])
    }
    setShowAddMenu(false)
  }

  const removeAgentFromFlow = (role: AgentRole) => {
    setFlow(flow
      .filter(f => f.role !== role)
      .map(f => ({
        ...f,
        dependsOn: f.dependsOn.filter(d => d !== role)
      }))
    )
  }

  const toggleDependency = (role: AgentRole, dependency: AgentRole) => {
    const task = flow.find(f => f.role === role)
    if (!task) return
    const isAlreadyDep = task.dependsOn.includes(dependency)
    const newDepends = isAlreadyDep
      ? task.dependsOn.filter(d => d !== dependency)
      : [...task.dependsOn, dependency]

    setFlow(flow.map(f => f.role === role ? { ...f, dependsOn: newDepends } : f))
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0C] text-[#D4D4D8] overflow-y-auto custom-scrollbar p-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#1A1A22] mb-6 gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2AB46]"></span>
            AIGC 智能剧组流水线控制台
          </h2>
          <p className="text-[#666] text-xs mt-1">
            实时调参、多岗位协同，由 AI 统筹完成文字拆解、美术设定和视频镜头的智能规划。
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-3 relative shrink-0">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A24] text-xs text-white border border-[#2d2d3d] rounded-xl hover:bg-[#252535] transition-colors"
          >
            <Plus size={14} />
            招募 AI 员工加盟剧组
          </button>
          
          {showAddMenu && (
            <div className="absolute top-11 right-0 z-50 bg-[#121216] border border-[#26262e] rounded-xl shadow-2xl py-2 min-w-[200px] text-xs">
              <div className="px-3 py-2 text-[#555] font-semibold border-b border-[#1a1a22] mb-1">选择并解锁 AI 岗位</div>
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                {ALL_AGENTS_LIST.map(role => {
                  const recruited = flow.some(f => f.role === role)
                  return (
                    <button
                      key={role}
                      disabled={recruited}
                      onClick={() => addAgentToFlow(role)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-[#1C1C24] flex items-center justify-between transition-colors ${
                        recruited ? 'text-[#444] cursor-not-allowed' : 'text-[#E5E5E5]'
                      }`}
                    >
                      <span>{AgentLabels[role] || role}</span>
                      {recruited ? (
                        <span className="text-[10px] text-[#E2AB46]">已进组</span>
                      ) : (
                        <Plus size={12} className="text-[#888]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Phases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {DEPARTMENTS.map(dept => {
          return (
            <div key={dept.id} className={`flex flex-col border ${dept.borderColor} bg-[#0D0D10]/50 rounded-2xl p-4 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#20202a]/40">
                <span className={`text-xs font-bold tracking-wide ${dept.titleColor}`}>{dept.title}</span>
                <span className="text-[10px] text-[#555] font-mono">
                  {flow.filter(f => dept.roles.includes(f.role)).length} 个活跃
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {dept.roles.map(role => {
                  const task = flow.find(f => f.role === role)
                  const output = outputs[role]
                  const isCurrent = currentAgent === role
                  const status = output ? output.status : isCurrent ? 'running' : task ? 'pending' : 'not_recruited'

                  // If not yet recruited
                  if (status === 'not_recruited') {
                    return (
                      <div
                        key={role}
                        className="border border-dashed border-[#1B1B22] rounded-2xl p-4 py-8 flex flex-col items-center justify-center text-center bg-[#070709]/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#15151a] flex items-center justify-center opacity-40 mb-2">
                          {getRoleIcon(role)}
                        </div>
                        <span className="text-xs text-[#555] font-medium">{AgentLabels[role] || role}</span>
                        <p className="text-[10px] text-[#444] mt-1 max-w-[150px] leading-relaxed">
                          当前电影流水线未启用此 AIGC 协同。
                        </p>
                        <button
                          onClick={() => addAgentToFlow(role)}
                          className="mt-3 px-3 py-1 bg-[#15151c] text-[10px] border border-[#22222b] text-[#888] rounded-lg hover:text-white hover:border-[#333342] transition-colors"
                        >
                          一键招募进组
                        </button>
                      </div>
                    )
                  }

                  // Active Agent Card
                  const lastLog = logs.filter(l => l.agent === role).pop()?.message || ''

                  return (
                    <div
                      key={role}
                      className={`relative border rounded-2xl bg-[#111115] p-4 transition-all ${
                        isCurrent 
                          ? 'border-[#E2AB46] bg-[#141412] shadow-[0_0_15px_rgba(226,171,70,0.05)]' 
                          : status === 'failed'
                            ? 'border-red-500/30'
                            : status === 'done'
                              ? 'border-[#1E1E26] hover:border-[#2D2D3D]'
                              : 'border-[#15151B]'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#191922] flex items-center justify-center shrink-0 border border-[#252532]/40">
                            {getRoleIcon(role)}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white tracking-wide">
                              {AgentLabels[role] || role}
                            </h4>
                            <p className="text-[10px] text-[#666] truncate mt-0.5 max-w-[150px]">
                              {getRoleSubtext(role)}
                            </p>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center">
                          {isCurrent || status === 'running' ? (
                            <span className="flex items-center gap-1 text-[10px] text-[#E2AB46] bg-[#E2AB46]/10 px-2 py-0.5 rounded-full font-medium">
                              <Loader2 size={10} className="animate-spin" />
                              进行中
                            </span>
                          ) : status === 'done' ? (
                            <span className="flex items-center gap-1 text-[10px] text-[#34A853] bg-[#34A853]/10 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 size={10} />
                              通过验收
                            </span>
                          ) : status === 'failed' ? (
                            <span className="flex items-center gap-1 text-[10px] text-[#EA4335] bg-[#EA4335]/10 px-2 py-0.5 rounded-full font-medium">
                              <AlertCircle size={10} />
                              失败
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-[#888] bg-[#1A1A22] px-2 py-0.5 rounded-full font-medium">
                              就绪
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dependencies Toggler */}
                      <div className="mt-3.5 pt-3.5 border-t border-[#1C1C26]/60 flex items-center justify-between text-[11px] relative">
                        <span className="text-[#555] font-medium flex items-center gap-1">
                          前置工作依赖
                        </span>
                        
                        <button
                          onClick={() => setActiveDepDropdown(activeDepDropdown === role ? null : role)}
                          className="flex items-center gap-1 text-[#aaa] hover:text-white font-medium transition-colors"
                        >
                          <span className="max-w-[140px] truncate">
                            {task?.dependsOn.length === 0 
                              ? '无依赖 (首发启动)' 
                              : task?.dependsOn.map(d => AgentLabels[d] || d).join(', ')
                            }
                          </span>
                          <ChevronDown size={11} className={`transition-transform duration-200 ${activeDepDropdown === role ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dependency Dropdown Popover */}
                        {activeDepDropdown === role && (
                          <div className="absolute bottom-7 right-0 z-50 bg-[#16161C] border border-[#292936] rounded-xl shadow-2xl py-2 w-[220px] transition-all">
                            <div className="px-3 py-1.5 text-[10px] text-[#666] font-semibold border-b border-[#20202a] mb-1">配置前置数据交互</div>
                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                              {flow.filter(f => f.role !== role).map(f => {
                                const isChecked = task?.dependsOn.includes(f.role)
                                return (
                                  <button
                                    key={f.role}
                                    onClick={() => toggleDependency(role, f.role)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-[#20202F]/80 flex items-center justify-between text-xs text-[#E5E5E5] transition-colors"
                                  >
                                    <span>{AgentLabels[f.role] || f.role}</span>
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                      isChecked ? 'bg-[#E2AB46] border-[#E2AB46]' : 'border-[#444]'
                                    }`}>
                                      {isChecked && <Check size={10} className="text-black" strokeWidth={3} />}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="mt-1.5 border-t border-[#20202a] pt-1.5 px-3 flex justify-end">
                              <button
                                onClick={() => setActiveDepDropdown(null)}
                                className="px-2 py-0.5 bg-[#252532] text-[9px] text-[#A0A0AB] hover:text-white rounded transition-colors"
                              >
                                完成设置
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Realtimer monospaced logs inside the card */}
                      {lastLog && (
                        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-[#070709] border border-[#16161D] font-mono text-[10px] text-[#888] leading-normal break-all">
                          <span className="text-[#E2AB46] mr-1.5">●</span>
                          {lastLog}
                        </div>
                      )}

                      {/* Card Actions Footer */}
                      <div className="mt-3.5 pt-3 border-t border-[#1C1C26]/40 flex items-center justify-between gap-2">
                        {/* Settings Button */}
                        <button
                          onClick={() => onConfig(role)}
                          className="flex items-center gap-1 text-[11px] text-[#888] hover:text-white transition-colors py-1 px-2.5 bg-[#17171E] hover:bg-[#20202B]/80 rounded-lg border border-[#22222b]/50"
                        >
                          <Settings size={12} />
                          配置特质
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Run/Rerun Button */}
                          {onRerun && (
                            <button
                              onClick={() => onRerun(role)}
                              title="从此岗位开始，链条重跑生成下游资产"
                              className="flex items-center gap-1 text-[11px] text-[#E2AB46] bg-[#E2AB46]/5 hover:bg-[#E2AB46]/10 hover:text-white border border-[#E2AB46]/20 py-1 px-2.5 rounded-lg transition-colors font-medium"
                            >
                              <Play size={10} fill="currentColor" />
                              一键重调
                            </button>
                          )}

                          {/* Edit Output Button */}
                          {status === 'done' && (
                            <button
                              onClick={() => onEdit(role)}
                              className="flex items-center gap-1 text-[11px] text-white bg-[#34A853]/10 hover:bg-[#34A853]/20 border border-[#34A853]/30 py-1 px-2.5 rounded-lg transition-colors"
                            >
                              <FileText size={12} />
                              编辑产出
                            </button>
                          )}

                          {/* Delete from flow */}
                          <button
                            onClick={() => removeAgentFromFlow(role)}
                            title="撤销进组/移出工作链"
                            className="text-[#555] hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
