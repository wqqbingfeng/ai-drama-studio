import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Plus, RefreshCw, 
  User, CheckCircle2, Clapperboard, Edit3, Film, Video, Shapes, 
  MessageSquare, Settings, ArrowRight, X, Clock, 
  Scissors, Trash2, Copy, GraduationCap
} from 'lucide-react'
import { useProductionStore } from '../../state/store'
import { createGateway } from '../../gateway'
import { CustomAgent, loadStoredAgents, saveStoredAgents } from '../../models/agents-list'
import { AgentLabels } from '../../models/production'
import { useGlobalTheme } from '../../utils/theme'

type HomePageTab = 'home' | 'projects' | 'production' | 'market' | 'assets' | 'history'

export function HomePage({ setTab }: { setTab: (tab: HomePageTab) => void }) {
  const { theme } = useGlobalTheme()
  // Store synchronization
  const isRunning = useProductionStore((s) => s.isRunning)
  const currentAgent = useProductionStore((s) => s.currentAgent)

  // Local state for Custom Agents synchronized from shared library
  const [agents, setAgents] = useState<CustomAgent[]>(() => loadStoredAgents())

  // Listen for real-time synchronization from other panels (custom event)
  useEffect(() => {
    const handleAgentsSync = () => {
      setAgents(loadStoredAgents())
    }
    window.addEventListener('filmai-agents-updated', handleAgentsSync)
    return () => window.removeEventListener('filmai-agents-updated', handleAgentsSync)
  }, [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentRole, setNewAgentRole] = useState('screenwriter')
  const [newAgentDesc, setNewAgentDesc] = useState('')
  const [newAgentPrompt, setNewAgentPrompt] = useState('')
  const [newAgentIcon, setNewAgentIcon] = useState<'director' | 'writer' | 'storyboard' | 'character' | 'video' | 'editing' | 'custom'>('custom')

  // Chat single agent modal state
  const [activeAgent, setActiveAgent] = useState<CustomAgent | null>(null)
  const [chatPrompt, setChatPrompt] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArtifact, setGeneratedArtifact] = useState<string>('')
  
  // Custom Execution records (combination of mock and real single-agent executions)
  const [localRecords, setLocalRecords] = useState<Array<{
    id: string
    taskName: string
    agentName: string
    project: string
    status: 'running' | 'success' | 'failed'
    duration: string
    startTime: string
    output?: string
  }>>(() => [
    {
      id: '1020',
      taskName: '分镜设计任务 #1020',
      agentName: '导演 Agent (Filmmaker Chief)',
      project: '《未来之战》',
      status: 'running' as const,
      duration: '—',
      startTime: '2026-05-22 14:32:11',
      output: '分镜设计脚本 V3:\n\n[镜头 1] 远景（Wide Shot）\n- 画面：荒废的末日赛博都市。巨幅全息霓虹广告明暗闪烁，映在积水中。\n- 运动：镜头缓慢由高向低俯冲。\n- 音效：低沉的风声混杂远处的警报。\n\n[镜头 2] 特写（Close Up）\n- 画面：主角凌空跃下。雨水飞溅。'
    },
    {
      id: '1019',
      taskName: '视频生成任务 #1019',
      agentName: '视频生成 Agent (Frame Engine)',
      project: '《未来之战》',
      status: 'success' as const,
      duration: '1h 22m',
      startTime: '2026-05-21 12:15:33',
      output: '科幻未来废土城市关卡与概念美术图：\n主色调：荒野黄昏/赛博暗夜霓虹。包含高低错落的吊桥、废弃磁悬浮轨道、中央裂缝反应堆...'
    },
    {
      id: '1017',
      taskName: '剪辑任务 #1017',
      agentName: '剪辑 Agent (Rhythm Master)',
      project: '《未来之战》',
      status: 'success' as const,
      duration: '18m',
      startTime: '2026-05-20 10:21:05',
      output: '全片多轨道精调音频与视频剪接：\n音频背景乐使用《地心重力》氛围纯音乐；交叉剪辑反击与逃脱场景，完美匹配节奏鼓点...'
    }
  ])

  // Action: Create and save custom Agent
  const handleCreateAgent = () => {
    if (!newAgentName.trim()) return
    const palettes: string[] = [
      'from-[#10B981] to-[#3B82F6]',
      'from-[#F59E0B] to-[#EF4444]',
      'from-[#8B5CF6] to-[#EC4899]',
      'from-[#4F46E5] to-[#06B6D4]',
      'from-[#EC4899] to-[#F43F5E]'
    ]
    const randomPalette = palettes[Math.floor(Math.random() * palettes.length)]

    const newAgent: CustomAgent = {
      id: `custom-${Date.now()}`,
      name: newAgentName,
      role: newAgentRole,
      description: newAgentDesc || '自定义的专属AI辅助模块',
      systemPrompt: newAgentPrompt || '你是一个专业高效的影视创作辅助助手。',
      iconType: newAgentIcon,
      avatarColor: randomPalette,
      avatarChar: newAgentName.slice(0, 2),
      previouslyUsed: true,
      grade: 'A',
      capabilityScores: { creativity: 85, speed: 85, orchestration: 80, fidelity: 90 },
      workHistory: [
        `新员工入职注册考核 (2026-05)`
      ]
    }
    const updated = [...agents, newAgent]
    setAgents(updated)
    saveStoredAgents(updated)
    
    // Clear inputs and close modal
    setNewAgentName('')
    setNewAgentDesc('')
    setNewAgentPrompt('')
    setNewAgentIcon('custom')
    setShowAddModal(false)
  }

  // Action: Delete custom Agent
  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = agents.filter(a => a.id !== id)
    setAgents(updated)
    saveStoredAgents(updated)
  }

  // Navigation jump helper for bidirectional jumping
  const handleJumpToAgentMarket = (agentId: string) => {
    localStorage.setItem('filmai-selected-agent-id', agentId)
    setTab('market')
  }

  // Active Individual Agent execution logic
  const handleRunSingleAgent = async () => {
    if (!chatPrompt.trim() || !activeAgent) return

    // Update Chat History
    const userMsg = { role: 'user' as const, text: chatPrompt }
    setChatHistory(prev => [...prev, userMsg])
    setChatPrompt('')
    setIsGenerating(true)

    try {
      // Build a gateway client on-the-fly
      let endpoint = ''
      let apiKey = ''
      let model: string | undefined = 'gemini-2.0-flash (Studio Free)'
      try {
        const raw = localStorage.getItem('ai-drama-studio-config')
        if (raw) {
          const parsed = JSON.parse(raw)
          endpoint = parsed.endpoint || ''
          apiKey = parsed.apiKey || ''
          const savedModel = localStorage.getItem('ai-drama-studio-selected-model')
          model = savedModel || parsed.model || 'gemini-2.0-flash (Studio Free)'
        }
      } catch (err) {
        console.error(err)
      }

      // Force free trial Gemini model and API key during the test phase
      model = model && model.includes('gemini') ? model : 'gemini-2.0-flash (Studio Free)'
      endpoint = ''
      apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

      const gateway = createGateway({ endpoint, apiKey, model })
      
      const promptContext = `
        现在你是 ${activeAgent.name}, 你的系统设定是: "${activeAgent.systemPrompt}"
        对于我提出的关于电影《未来之战》或您的专项方向的要求，请给出极其专业、详实的影视行业标准格式建议与实际产出。
        
        用户具体创意指令: "${chatPrompt}"
      `

      const response = await gateway.think(
        `你是专攻于以下能力的电影AI员工：${activeAgent.description}. 系统提示设定: ${activeAgent.systemPrompt}`,
        [{ role: 'user', content: promptContext }],
        { temperature: 0.7 }
      )

      const botMsg = { role: 'assistant' as const, text: response }
      setChatHistory(prev => [...prev, botMsg])
      setGeneratedArtifact(response)

      // Mark this agent as "previouslyUsed: true" if it wasn't
      if (!activeAgent.previouslyUsed) {
        const updated = agents.map(a => a.id === activeAgent.id ? { ...a, previouslyUsed: true } : a)
        setAgents(updated)
        saveStoredAgents(updated)
      }

      // Add dynamic test run entry to individual work history
      const updatedList = loadStoredAgents().map(a => {
        if (a.id === activeAgent.id) {
          const freshHistory = [...(a.workHistory || [])]
          const newEntry = `在总览工作台执行单体创意提示任务 - "${chatPrompt.slice(0, 16)}..." (2026-05)`
          if (!freshHistory.includes(newEntry)) {
            freshHistory.unshift(newEntry)
          }
          return { ...a, previouslyUsed: true, workHistory: freshHistory }
        }
        return a
      })
      saveStoredAgents(updatedList)
      setAgents(updatedList)

      // Insert an execution record into the logs
      const newRecord = {
        id: String(Date.now()).slice(-4),
        taskName: `${activeAgent.name} 单独创作调用 #${String(Date.now()).slice(-4)}`,
        agentName: activeAgent.name,
        project: '《未来之战》',
        status: 'success' as const,
        duration: '5s',
        startTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        output: response
      }
      setLocalRecords(prev => [newRecord, ...prev])

    } catch (err) {
      console.error(err)
      const errResponse = `AI 执行失败: ${String(err)}。这可能是由于网络通信异常或速率受限。`
      setChatHistory(prev => [...prev, { role: 'assistant', text: errResponse }])
    } finally {
      setIsGenerating(false)
    }
  }

  // Details popover modal state
  const [focusedOutput, setFocusedOutput] = useState<{ title: string; agent: string; content: string } | null>(null)

  return (
    <div className={`h-full flex flex-col overflow-y-auto ${theme.bgMain} ${theme.textMain} custom-scrollbar`}>
      
      {/* Upper Layout: Horizontal split into Left Content & Right Queue sidebar */}
      <div className="flex flex-1 flex-col lg:flex-row gap-6 p-6 min-h-0 w-full max-w-[1600px] mx-auto">
        
        {/* Main Dashboard Area (Left Part) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Section 1: Dashboard Greeting banner matching mockup styling */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <h2 className={`text-[22px] font-display font-semibold ${theme.textTitle} tracking-tight`}>AI影视化总览工作台</h2>
              <p className={`text-[13px] ${theme.textMuted}`}>统一配置、测试、协同影视部门，全流程统筹创作进展</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setTab('production')}
                className={`flex items-center gap-1.5 px-4 py-2 border ${theme.borderColor} hover:bg-black/5 ${theme.textMain} rounded-xl transition-all text-[13px]`}
              >
                <Plus size={15} />
                新建工作流
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className={`flex items-center gap-1.5 px-4 py-2 ${theme.accentBg} ${theme.accentBgHover} text-white font-medium rounded-xl transition-all shadow-md text-[13px]`}
              >
                <Plus size={15} />
                聘用新 AI 员工
              </button>
            </div>
          </div>

          {/* Section 2: 当前项目 / 流程概览 Horizontal Timeline Grid */}
          <div className={`border ${theme.borderColor} ${theme.bgCard} rounded-2xl p-5 shadow-sm`}>
            <h3 className={`text-[14px] font-medium ${theme.textTitle} mb-5`}>当前项目开发状态</h3>
            
            {/* Timeline Row */}
            <div className="flex items-center justify-between overflow-x-auto py-2 px-1 min-w-[700px] custom-scrollbar gap-2">
              {[
                { label: '创意策划', state: 'checked', icon: <CheckCircle2 size={15} /> },
                { label: '剧本生成', state: 'checked', icon: <CheckCircle2 size={15} /> },
                { label: '分镜设计', state: isRunning && currentAgent === 'director' ? 'active' : 'active', icon: <Clapperboard size={14} /> },
                { label: '角色设定', state: isRunning && currentAgent === 'character_designer' ? 'active' : 'upcoming', icon: <User size={14} /> },
                { label: '场景生成', state: isRunning && currentAgent === 'scene_designer' ? 'active' : 'upcoming', icon: <Shapes size={14} /> },
                { label: '视频生成', state: isRunning && currentAgent === 'cinematographer' ? 'active' : 'upcoming', icon: <Video size={14} /> },
                { label: '剪辑合成', state: isRunning && currentAgent === 'post_production' ? 'active' : 'upcoming', icon: <Scissors size={14} /> },
                { label: '大片发布', state: 'upcoming', icon: <ArrowRight size={14} /> },
              ].map((step, idx, arr) => (
                <div key={idx} className="flex items-center flex-1 last:flex-none" id={`step-node-${idx}`}>
                  {/* Circle + Label node */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step.state === 'checked' 
                        ? 'bg-green-500/10 border border-green-500 text-green-500' 
                        : step.state === 'active'
                          ? `border-2 ${theme.accentBorder} ${theme.bgInput} ${theme.accentText} shadow-sm`
                          : `border ${theme.borderColor} ${theme.bgInput} text-gray-400`
                     }`} id={`step-icon-${idx}`}>
                      {step.icon}
                    </div>
                    <span className={`text-[12px] whitespace-nowrap ${step.state === 'active' ? `${theme.accentText} font-medium` : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
 
                  {/* Intersecting Arrow line */}
                  {idx < arr.length - 1 && (
                    <div className={`flex-1 mx-3 border-t border-dashed ${theme.borderColor} relative flex items-center justify-center`} id={`step-line-${idx}`}>
                      <div className={`absolute w-1 h-1 ${theme.borderColor} rounded-full`}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 核心 Agent 模块 Grid */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-[14px] font-medium ${theme.textTitle} flex items-center gap-2`}>
                <span>在岗 AI 职业员工库 ({agents.length}名)</span>
                <span className={`text-[11px] ${theme.textMuted} ${theme.bgInput} px-2 py-0.5 rounded-md border ${theme.borderColor}`}>数据共通</span>
              </h3>
              <button 
                onClick={() => setTab('market')}
                className={`text-[12px] ${theme.accentText} hover:opacity-80 transition-all flex items-center gap-1 font-medium`}
                id="btn-goto-market"
              >
                进入管理 & 能力测试中心
                <ArrowRight size={13} />
              </button>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((ag) => {
                const isActive = isRunning && currentAgent === ag.role
                return (
                  <div 
                    key={ag.id}
                    id={`agent-card-${ag.id}`}
                    className={`relative p-5 ${theme.bgCard} border rounded-2xl transition-all group hover:opacity-95 flex flex-col justify-between min-h-[190px] ${
                      isActive 
                        ? `border-2 ${theme.accentBorder} shadow-[0_4px_24px_rgba(59,130,246,0.1)]` 
                        : `${theme.borderColor} shadow-sm`
                    }`}
                  >
                    <div>
                      {/* Top status indicator row */}
                      <div className="flex justify-between items-start mb-3">
                        {/* Custom Name Profile Avatar with special colors */}
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-full border ${theme.borderColor} ${theme.bgPanel} flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-gray-400`}>
                            <User size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-[13.5px] font-semibold ${theme.textTitle} transition-colors truncate`}>{ag.name}</h4>
                            <span className={`text-[10px] ${theme.textMuted} font-mono tracking-wider uppercase block`}>{ag.role}</span>
                          </div>
                        </div>
 
                        {/* Status + Grade indicators */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded ${theme.accentBgMuted} border ${theme.borderColor} ${theme.accentText} font-bold text-[10px] uppercase`}>
                            {ag.grade || 'A'}
                          </span>
                          
                          {isActive ? (
                            <span className={`flex items-center gap-1 px-2 py-0.5 ${theme.accentBgMuted} border ${theme.borderColor} ${theme.accentText} text-[10px] rounded-full font-medium`}>
                              进行中
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 px-2 py-0.5 ${theme.bgInput} border ${theme.borderColor} ${theme.textMuted} text-[10px] rounded-full`}>
                              待命
                            </span>
                          )}
 
                          {ag.id.startsWith('custom-') && (
                            <button 
                              onClick={(e) => handleDeleteAgent(ag.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-400 transition-opacity font-bold"
                              title="解雇员工"
                              id={`delete-agent-${ag.id}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
 
                      {/* Description Text */}
                      <p className={`text-[11.5px] ${theme.textMuted} mt-2.5 leading-relaxed line-clamp-2`} title={ag.description}>
                        {ag.description}
                      </p>
 
                      {/* Work summary indicator */}
                      <div className={`mt-3 flex items-center gap-1.5 text-[10px] ${theme.textMuted}`}>
                        <Clock size={11} className="opacity-70" />
                        <span className="truncate">履历: {ag.workHistory?.[0] || '暂无工作记录'}</span>
                      </div>
                    </div>
 
                    {/* Bottom Actions Row */}
                    <div className={`mt-4 pt-3 border-t ${theme.borderColor} flex items-center justify-between`}>
                      <button
                        onClick={() => handleJumpToAgentMarket(ag.id)}
                        className={`text-[11px] ${theme.accentText} hover:opacity-80 transition-colors flex items-center gap-1 font-medium`}
                      >
                        <GraduationCap size={12} />
                        履历与AI评测
                      </button>
 
                      <button 
                        onClick={() => {
                          setActiveAgent(ag)
                          setChatHistory([])
                          setGeneratedArtifact('')
                        }}
                        className={`px-3 py-1.5 ${theme.accentBg} ${theme.accentBgHover} text-white rounded-xl transition-all text-[11px] font-medium flex items-center gap-1 shadow-sm shadow-blue-500/5`}
                        id={`btn-launch-agent-${ag.id}`}
                      >
                        <MessageSquare size={11} />
                        发起创作
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 4: 运行记录 Dark Table */}
          <div className={`border ${theme.borderColor} ${theme.bgCard} rounded-2xl overflow-hidden mb-6 shadow-sm`}>
            <div className={`px-5 py-4 border-b ${theme.borderColor} flex justify-between items-center`}>
              <h3 className={`text-[14px] font-medium ${theme.textTitle}`}>历史创作与评测记录</h3>
              <button onClick={() => setTab('history')} className={`text-gray-400 hover:${theme.accentText} transition-colors text-[11.5px] font-medium`} id="btn-view-all-history">查看全部</button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className={`border-b ${theme.borderColor} text-gray-400 font-medium bg-black/5`}>
                    <th className="px-6 py-3">创作任务名称</th>
                    <th className="px-5 py-3">执行 AI 员工</th>
                    <th className="px-5 py-3">所属项目</th>
                    <th className="px-5 py-3">当前状态</th>
                    <th className="px-5 py-3">生成耗时</th>
                    <th className="px-5 py-3">调用时间</th>
                    <th className="px-6 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderColor} text-gray-500`}>
                  {/* Dynamic running task overlay first */}
                  {isRunning && (
                    <tr className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                      <td className={`px-6 py-4 font-medium ${theme.textMain} flex items-center gap-2`}>
                        <RefreshCw size={13} className={`${theme.accentText} animate-spin`} />
                        全局工作流电影生成中
                      </td>
                      <td className={`px-5 py-4 ${theme.accentText}`}>{AgentLabels[currentAgent || 'orchestrator']}</td>
                      <td className="px-5 py-4 text-gray-400">《未来之战》</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded ${theme.accentBgMuted} border ${theme.borderColor} ${theme.accentText} font-medium`}>执行中</span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono">排队中...</td>
                      <td className="px-5 py-4 text-xs font-mono">此刻触发</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 cursor-not-allowed text-[11px]" disabled>查看中</button>
                      </td>
                    </tr>
                  )}

                  {/* Standard logs from state plus local static records */}
                  {localRecords.map((rec) => (
                    <tr key={rec.id} className={`hover:bg-black/5 transition-colors border-b last:border-b-0 ${theme.borderColor}`} id={`record-row-${rec.id}`}>
                      <td className={`px-6 py-4 ${theme.textMain} font-medium`}>{rec.taskName}</td>
                      <td className={`px-5 py-4 ${theme.textMain} opacity-95`}>{rec.agentName}</td>
                      <td className="px-5 py-4 text-gray-400">{rec.project}</td>
                      <td className="px-5 py-4">
                        {rec.status === 'running' ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium border border-blue-500/20 font-sans">进行中</span>
                        ) : rec.status === 'success' ? (
                          <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium border border-green-500/20 font-sans">成功</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium border border-red-500/20 font-sans">失败</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-gray-400">{rec.duration}</td>
                      <td className="px-5 py-4 font-mono text-gray-400 text-[11px]">{rec.startTime}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setFocusedOutput({ title: rec.taskName, agent: rec.agentName, content: rec.output || '暂无详细文本' })}
                          className={`text-gray-400 hover:${theme.accentText} transition-colors font-medium hover:underline text-[11px]`}
                          id={`btn-view-result-${rec.id}`}
                        >
                          查阅成果
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Workspace Operations Sidebar (Right Part) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
          
          {/* Box 1: 任务队列 Task Queue */}
          <div className={`border ${theme.borderColor} ${theme.bgCard} rounded-2xl p-5 shadow-sm`} id="task-queue-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-[14px] font-semibold ${theme.textTitle}`}>剧组生产任务队列</h3>
              <span className={`text-[11px] ${theme.textMuted}`}>排队中</span>
            </div>
            
            {/* Queue flow lists */}
            <div className="flex flex-col gap-3">
              {[
                { name: '视频生成任务 #1024', sub: '分镜_15_雨夜追逐', time: '3分钟', status: 'queued' },
                { name: '场景生成任务 #1023', sub: '城市废墟_黄昏', time: '8分钟', status: 'queued' },
                { name: '分镜设计任务 #1020', sub: '第三幕_冲突升级', time: '12分钟', status: 'running' },
                { name: '剪辑任务 #1021', sub: '第一幕_剪辑', time: '等待中', status: 'pending' },
              ].map((item, idx) => (
                <div key={idx} className={`flex items-start justify-between p-3 rounded-xl bg-black/5 border ${theme.borderColor}`} id={`queue-item-${idx}`}>
                  <div className="flex items-start gap-2.5">
                    {/* Circle indicators */}
                    <div className="mt-1.5 shrink-0">
                      {item.status === 'running' ? (
                        <div className={`w-2 h-2 rounded-full ${theme.accentBg} animate-ping`} />
                      ) : item.status === 'queued' ? (
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    {/* Task Info */}
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-[12.5px] font-medium ${theme.textMain}`}>{item.name}</span>
                      <span className="text-[10px] text-gray-400">{item.sub}</span>
                    </div>
                  </div>
                  {/* Queue countdown badge */}
                  <div className="text-right flex flex-col gap-0.5 shrink-0">
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${theme.bgInput} ${theme.textMuted}`}>
                      {item.status === 'running' ? '进行中' : item.status === 'queued' ? '排队' : '等待'}
                    </span>
                    <span className="text-[9.5px] font-mono text-gray-400">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          {/* Box 2: 系统状态 */}
          <div className={`border ${theme.borderColor} ${theme.bgCard} rounded-2xl p-5 shadow-sm`} id="engine-status-box">
            <h3 className={`text-[14px] font-semibold ${theme.textTitle} mb-4`}>创作引擎负荷</h3>
            
            <div className={`flex flex-col gap-4 text-[12px] ${theme.textMuted}`}>
              <div className="flex justify-between items-center">
                <span>智能网关状态</span>
                <span className="flex items-center gap-1.5 text-green-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  就绪 (Gemini 2.5)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>并发调用数</span>
                <span className="flex items-center gap-1.5 text-green-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  正常 (0/10)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>本地员工状态</span>
                <span className="flex items-center gap-1.5 text-green-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  良好 (已连通)
                </span>
              </div>
              
              <div className={`pt-2 border-t ${theme.borderColor} mt-1 flex flex-col gap-1.5`}>
                <div className={`flex justify-between ${theme.textTitle} items-center mb-0.5`}>
                  <span className="text-[11.5px] font-medium">资源占用</span>
                  <span className="font-mono text-[11px]">42%</span>
                </div>
                {/* Visual Progress bar */}
                <div className={`w-full ${theme.bgInput} h-1.5 rounded-full overflow-hidden border ${theme.borderColor}`}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '42%' }} 
                    className={`${theme.accentBg} h-full rounded-full`} 
                  />
                </div>
              </div>
            </div>
          </div>


        </div>

      </div>

      {/* --- Dialog Modals Below --- */}

      {/* MODAL 1: Individual Agent Chat Executor Modal */}
      <AnimatePresence>
        {activeAgent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="agent-workspace-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0D11] border border-[#23232D] w-full max-w-[1100px] h-[85vh] rounded-3xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C1C25] bg-[#121216]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border ${theme.borderColor} ${theme.bgPanel} flex items-center justify-center text-gray-400 overflow-hidden`}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#eee]">{activeAgent.name} 独立工作室</h3>
                    <p className="text-xs text-[#666675]">{activeAgent.description}</p>
                  </div>
                </div>
                <button onClick={() => setActiveAgent(null)} className="p-1.5 rounded-lg bg-[#1D1D24] border border-[#2A2A38] text-[#888] hover:text-[#fff] hover:bg-[#2c2c3a] transition-all" id="btn-close-agent-workspace">
                  <X size={18} />
                </button>
              </div>

              {/* Three-Column Workspace */}
              <div className="flex-1 flex min-h-0 bg-[#0A0A0D]">
                
                {/* Column A (Left): Prompts Setting (25% width) */}
                <div className="w-1/4 border-r border-[#1C1C25] p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    <Settings size={13} className="text-[#BFA162]" />
                    <span>系统级设定 (System Prompt)</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-1">
                    <textarea 
                      value={activeAgent.systemPrompt}
                      onChange={(e) => {
                        const updated = agents.map(a => a.id === activeAgent.id ? { ...a, systemPrompt: e.target.value } : a)
                        setAgents(updated)
                        setActiveAgent({ ...activeAgent, systemPrompt: e.target.value })
                        saveStoredAgents(updated)
                      }}
                      className="w-full flex-1 bg-[#111116] border border-[#22222D] rounded-xl p-3 text-[12.5px] leading-relaxed text-[#ddd] focus:outline-none focus:border-[#E2AB46] resize-none custom-scrollbar font-sans"
                      placeholder="定义该 AI 部门的系统行为约束..."
                    />
                    <div className="text-[10px] text-[#555] leading-relaxed">
                      * 修改将在后续单独执行中直接生效。所有生成直接走您关联项目的 **免费 Gemini 额度**。
                    </div>
                  </div>
                </div>

                {/* Column B (Center): Chat Messaging interface (40% width) */}
                <div className="w-2/5 border-r border-[#1C1C25] flex flex-col justify-between min-h-0 relative">
                  
                  {/* Messages list */}
                  <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                        <MessageSquare size={36} className="text-gray-700 mb-3 stroke-1" />
                        <p className="text-[13px] font-medium text-[#999]">暂无聊天记录</p>
                        <p className="text-xs text-[#555] mt-1 pr-4 pl-4 leading-relaxed">
                          在此给出更契合的分镜、剧本等指示，例如：
                          <span className="block italic text-[#BFA162] mt-1 font-mono">"根据剧本生成更详实的人物动作与镜头轨迹"</span>
                        </p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`} id={`chat-msg-${i}`}>
                          <div className={`p-3.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-[#BFA162] text-[#121214] font-medium rounded-tr-sm' 
                              : 'bg-[#18181F] text-[#ddd] border border-[#22222A] rounded-tl-sm'
                          }`}>
                            <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                          </div>
                          <span className="text-[9.5px] text-[#444] mt-1 font-mono">{msg.role === 'user' ? '用户设计' : 'AI产出'}</span>
                        </div>
                      ))
                    )}

                    {/* Pending state */}
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-xs text-[#E2AB46] bg-[#1a150c] border border-[#E2AB46]/10 p-3 rounded-2xl max-w-[80%] self-start animate-pulse">
                        <RefreshCw size={13} className="animate-spin" />
                        和免费 AI 引擎进行对话并生成方案中...
                      </div>
                    )}
                  </div>

                  {/* Typing bar */}
                  <div className="p-4 border-t border-[#1C1C25] bg-[#111116] flex gap-2">
                    <input 
                      type="text"
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isGenerating) handleRunSingleAgent()
                      }}
                      disabled={isGenerating}
                      className="flex-1 bg-[#1A1A1F]/80 border border-[#23232C] rounded-xl px-4 py-2 text-sm text-[#eee] focus:outline-none focus:border-[#E2AB46]"
                      placeholder="键入自定义指示，点击 '执行' 工作..."
                      id="input-chat-prompt"
                    />
                    <button 
                      onClick={handleRunSingleAgent}
                      disabled={isGenerating || !chatPrompt.trim()}
                      className="px-4 py-2 bg-[#BFA162] hover:bg-[#D5B064] text-[#121214] font-medium text-sm rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5"
                      id="btn-send-chat"
                    >
                      <Play size={13} fill="currentColor" />
                      执行
                    </button>
                  </div>
                </div>

                {/* Column C (Right): Live Output Preview Document (35% width) */}
                <div className="w-1/3 p-5 flex flex-col gap-3 overflow-y-auto custom-scrollbar bg-[#0C0C0F]/60">
                   <div className="flex justify-between items-center text-xs font-semibold text-[#888] uppercase tracking-wider border-b border-[#23232D] pb-3 shrink-0">
                     <span className="flex items-center gap-1.5">
                       <Film size={13} className="text-[#E2AB46]" />
                       生成产出成果集
                     </span>
                     {generatedArtifact && (
                       <button 
                         onClick={() => {
                            navigator.clipboard.writeText(generatedArtifact)
                            alert('产出格式文件已复制到剪贴板！')
                         }}
                         className="flex items-center gap-1 hover:text-[#e5e5e5] px-2 py-1 bg-[#1C1C25] rounded text-[10px] transition-colors border border-white/5"
                         id="btn-copy-chat-output"
                       >
                         <Copy size={11} />
                         复制内容
                       </button>
                     )}
                   </div>

                   {/* Generated draft sheet */}
                   {generatedArtifact ? (
                     <pre className="text-[12.5px] leading-relaxed text-[#ccc] whitespace-pre-wrap font-sans bg-[#131317]/80 p-4 rounded-xl border border-white/5">
                        {generatedArtifact}
                     </pre>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-600">
                       <Edit3 size={32} className="text-gray-800 mb-3 stroke-1" />
                       <p className="text-[12px] font-medium text-[#777]">暂无生成产出</p>
                       <p className="text-[10px] text-[#555] mt-1 pr-2 pl-2">
                         在左侧聊天栏发起一次独立执行，生成的具体台词、方案 or 分镜等高价值成果将在此优雅渲染，并沉淀入库。
                       </p>
                     </div>
                   )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Create Custom Agent Builder */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="employ-modal">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-[#121215] border border-[#2A2A35] p-6 w-full max-w-lg rounded-2xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-[#eee]">面试并招聘新门类 AI 影视职员</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-[#666] hover:text-[#fff] transition-colors" id="btn-close-employ-modal"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#666] mb-2 font-medium">职员名字与代号 (如: 调色大师 Agent) *</label>
                  <input 
                    type="text" 
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="例如: 概念原画 Agent, 旁白配音 Agent"
                    className="w-full bg-[#18181F] rounded-xl border border-[#23232C] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E2AB46] text-[#eee]"
                    id="input-new-agent-name"
                  />
                </div>

                {/* Grid choice mapping */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#666] mb-2 font-medium">绑定的底层模块</label>
                    <select 
                      value={newAgentRole}
                      onChange={(e) => setNewAgentRole(e.target.value)}
                      className="w-full bg-[#18181F] rounded-xl border border-[#23232C] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E2AB46] text-[#eee]"
                      id="select-new-agent-role"
                    >
                      <option value="screenwriter">编剧部门 (文学撰写)</option>
                      <option value="character_designer">角色画像 (美术策划)</option>
                      <option value="scene_designer">场景建模 (地图设计)</option>
                      <option value="director">导演分镜 (视觉分镜)</option>
                      <option value="cinematographer">摄影指导 (视频渲染)</option>
                      <option value="post_production">后期合成 (剪辑出片)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#666] mb-2 font-medium">视觉图标类型</label>
                    <select 
                      value={newAgentIcon}
                      onChange={(e) => setNewAgentIcon(e.target.value as 'director' | 'writer' | 'storyboard' | 'character' | 'video' | 'editing' | 'custom')}
                      className="w-full bg-[#18181F] rounded-xl border border-[#23232C] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E2AB46] text-[#eee]"
                      id="select-new-agent-icon"
                    >
                      <option value="director">导演标志 (Clapperboard)</option>
                      <option value="writer">编剧钢笔 (Edit Pen)</option>
                      <option value="storyboard">分镜功底 (Shapes)</option>
                      <option value="character">角色设计师 (Users)</option>
                      <option value="video">高精度摄影 (Video Cam)</option>
                      <option value="editing">音效剪接 (Scissors)</option>
                      <option value="custom">通用数算核心 (Cpu core)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#666] mb-2 font-medium">部门描述</label>
                  <input 
                    type="text" 
                    value={newAgentDesc}
                    onChange={(e) => setNewAgentDesc(e.target.value)}
                    placeholder="简述职能，控制在一句话之内..."
                    className="w-full bg-[#18181F] rounded-xl border border-[#23232C] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E2AB46] text-[#eee]"
                    id="input-new-agent-desc"
                  />
                </div>

                {/* Custom system Prompt instructions */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#666] mb-2 font-medium">系统提示设定 (Prompt) *</label>
                  <textarea 
                    value={newAgentPrompt}
                    onChange={(e) => setNewAgentPrompt(e.target.value)}
                    placeholder="系统运行此 Agent 时，为其下达底层的专业思维模型。例如：'你是一个专注奥斯卡级别的画面微调师...'"
                    className="w-full h-28 bg-[#18181F] rounded-xl border border-[#23232C] p-3 text-sm focus:outline-none focus:border-[#E2AB46] text-[#eee] resize-none custom-scrollbar"
                    id="input-new-agent-prompt"
                  />
                </div>

              </div>

              {/* Actions footer */}
              <div className="mt-6 flex justify-end gap-3 border-t border-[#1C1C25] pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border border-[#23232C] hover:bg-[#1C1C22] text-[#888] hover:text-[#fff] rounded-xl transition-colors"
                  id="btn-cancel-employ"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateAgent}
                  disabled={!newAgentName.trim()}
                  className="px-5 py-2 text-xs bg-[#BFA162] hover:bg-[#D5B064] text-[#121214] font-semibold rounded-xl transition-colors disabled:opacity-45"
                  id="btn-confirm-employ"
                >
                  通过初选并签约入库
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Detailed artifact viewer for Logs */}
      <AnimatePresence>
        {focusedOutput && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="artifact-viewer-modal">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-[#121215] border border-[#2A2A35] p-6 w-full max-w-2xl rounded-2xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#23232C] pb-3">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[10px] text-[#E2AB46] font-mono leading-none uppercase">剧本与分镜执行产出文件</span>
                   <h3 className="text-base font-semibold text-[#eee] mt-1">{focusedOutput.title} ({focusedOutput.agent})</h3>
                </div>
                <button onClick={() => setFocusedOutput(null)} className="text-[#666] hover:text-[#fff] transition-colors" id="btn-close-artifact-viewer"><X size={18} /></button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto custom-scrollbar p-1">
                <pre className="text-[13px] leading-relaxed text-[#bbb] whitespace-pre-wrap font-sans bg-[#16161B] p-4 rounded-xl border border-white/5">
                   {focusedOutput.content}
                </pre>
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(focusedOutput.content)
                    alert('内容已成功复制！')
                  }}
                  className="px-4 py-2 text-xs bg-[#1C1C25] border border-[#2a2a35] text-white hover:bg-[#252530] font-medium rounded-xl transition-all flex items-center gap-1"
                  id="btn-copy-artifact"
                >
                  <Copy size={12} />
                  复制内容
                </button>
                <button 
                  onClick={() => setFocusedOutput(null)}
                  className="px-4 py-2 text-xs bg-[#BFA162] hover:bg-[#D5B064] text-[#121214] font-semibold rounded-xl transition-colors"
                  id="btn-confirm-artifact"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
