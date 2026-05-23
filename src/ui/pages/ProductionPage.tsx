import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, RotateCcw, Check } from 'lucide-react'
import { useProductionStore } from '../../state/store'
import { WorkflowCanvas } from '../components/WorkflowCanvas'
import { Orchestrator } from '../../agent-core/orchestrator'
import { createGateway } from '../../gateway'
import type { AgentRole } from '../../models/production'
import { AgentLabels } from '../../models/production'
import { loadStoredAgents, saveStoredAgents } from '../../models/agents-list'
import { useGlobalTheme } from '../../utils/theme'

const ALL_AGENTS: AgentRole[] = [
  'producer',
  'screenwriter',
  'character_designer',
  'scene_designer',
  'prop_designer',
  'director',
  'cinematographer',
  'vfx_designer',
  'post_production',
]

const STORAGE_KEY = 'ai-drama-studio-config'

function loadConfig() {
  let model = 'gemini-2.0-flash (Studio Free)'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.model) {
        model = parsed.model
      }
    }
    const savedModel = localStorage.getItem('ai-drama-studio-selected-model')
    if (savedModel) {
      model = savedModel
    }
  } catch (err) {
    console.warn('Failed to read config from localStorage in ProductionPage:', err)
  }

  // Force free trial Gemini model and API key during the test phase
  const finalModel = model.includes('gemini') ? model : 'gemini-2.0-flash (Studio Free)'
  const finalEndpoint = ''
  const finalApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

  return { endpoint: finalEndpoint, apiKey: finalApiKey, model: finalModel }
}

export function ProductionPage() {
  const { theme } = useGlobalTheme()
  const [inputText, setInputText] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputText(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setInputText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  const [endpoint, setEndpoint] = useState(loadConfig().endpoint)
  const [apiKey, setApiKey] = useState(loadConfig().apiKey)
  const [model, setModel] = useState(loadConfig().model)
  const [editJson, setEditJson] = useState('')
  
  const [configRole, setConfigRole] = useState<AgentRole | null>(null)
  const [editPrompt, setEditPrompt] = useState('')

  const [marketAgents, setMarketAgents] = useState(() => loadStoredAgents())
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  useEffect(() => {
    const handleConfigUpdate = () => {
      const conf = loadConfig()
      setEndpoint(conf.endpoint)
      setApiKey(conf.apiKey)
      setModel(conf.model)
    }
    const handleAgentsSync = () => {
      setMarketAgents(loadStoredAgents())
    }
    window.addEventListener('filmai-config-updated', handleConfigUpdate)
    window.addEventListener('filmai-agents-updated', handleAgentsSync)
    return () => {
      window.removeEventListener('filmai-config-updated', handleConfigUpdate)
      window.removeEventListener('filmai-agents-updated', handleAgentsSync)
    }
  }, [])

  const flow = useProductionStore((s) => s.flow)
  const flowMode = useProductionStore((s) => s.flowMode)
  const setFlowMode = useProductionStore((s) => s.setFlowMode)
  const outputs = useProductionStore((s) => s.outputs)
  const logs = useProductionStore((s) => s.logs)
  const isRunning = useProductionStore((s) => s.isRunning)
  const currentAgent = useProductionStore((s) => s.currentAgent)
  const editingOutput = useProductionStore((s) => s.editingOutput)
  const setAgentConfig = useProductionStore((s) => s.setAgentConfig)

  const setPlan = useProductionStore((s) => s.setPlan)
  const setAgentOutput = useProductionStore((s) => s.setAgentOutput)
  const addLog = useProductionStore((s) => s.addLog)
  const setRunning = useProductionStore((s) => s.setRunning)
  const setCurrentAgent = useProductionStore((s) => s.setCurrentAgent)
  const setNotification = useProductionStore((s) => s.setNotification)
  const setEditingOutput = useProductionStore((s) => s.setEditingOutput)
  const clearDownstreamOutputs = useProductionStore((s) => s.clearDownstreamOutputs)
  
  const openConfig = useCallback((role: AgentRole) => {
    setConfigRole(role)
    const agents = loadStoredAgents()
    setMarketAgents(agents)

    // Check bound agent in localStorage safely
    let savedId: string | null = null
    try {
      savedId = localStorage.getItem(`filmai-bound-agent-${role}`)
    } catch {
      // Safe fallback
    }
    const matching = agents.filter(a => a.role === role)
    const active = savedId ? agents.find(a => a.id === savedId) : null
    const chosen = active || matching[0] || null

    setSelectedAgentId(chosen ? chosen.id : 'custom_override')

    const currentPrompt = useProductionStore.getState().agentConfigs[role]?.systemPrompt 
      || chosen?.systemPrompt 
      || ''
    setEditPrompt(currentPrompt)
  }, [setMarketAgents])

  const saveConfigAndClose = () => {
    if (configRole) {
      setAgentConfig(configRole, { systemPrompt: editPrompt })
      
      // Save selection association in localStorage safely
      try {
        localStorage.setItem(`filmai-bound-agent-${configRole}`, selectedAgentId)
      } catch {
        // Safe fallback
      }
      
      if (selectedAgentId !== 'custom_override') {
        const freshAgents = loadStoredAgents().map(a => {
          if (a.id === selectedAgentId) {
            return { ...a, systemPrompt: editPrompt }
          }
          return a
        })
        saveStoredAgents(freshAgents)
        setMarketAgents(freshAgents)
      }

      setConfigRole(null)
    }
  }

  const updateAgentsWorkHistoryOnSuccess = (outputsList: { agent: string }[], ideaText: string) => {
    try {
      const stored = loadStoredAgents()
      let changed = false
      const updated = stored.map(a => {
        const hasOutput = outputsList.find(o => o.agent === a.role)
        if (hasOutput) {
          let boundId: string | null = null
          try {
            boundId = localStorage.getItem(`filmai-bound-agent-${a.role}`)
          } catch {
            // Safe fallback
          }
          const isTarget = boundId ? (a.id === boundId) : (stored.find(x => x.role === a.role)?.id === a.id)
          if (isTarget) {
            const freshHistory = [...(a.workHistory || [])]
            const titleLimit = ideaText.trim().replace(/\n/g, ' ').slice(0, 16)
            const newEntry = `参与电影《未来之战》编排主线：提供 ${AgentLabels[a.role as AgentRole] || a.role} 专属制作交付 - "${titleLimit}..." (2026-05)`
            if (!freshHistory.includes(newEntry)) {
              freshHistory.unshift(newEntry)
            }
            changed = true
            return { ...a, previouslyUsed: true, workHistory: freshHistory }
          }
        }
        return a
      })
      if (changed) {
        saveStoredAgents(updated)
        setMarketAgents(updated)
      }
    } catch (err) {
      console.warn('Failed to update agent history:', err)
    }
  }

  const handleStart = async () => {
    if (!inputText.trim()) return
    await runPipeline(inputText)
  }

  const handleRerunFrom = useCallback(async (role: AgentRole) => {
    clearDownstreamOutputs(role)
    setEditingOutput(null)
    const gateway = createGateway({ endpoint, apiKey, model: model || undefined })
    const orchestrator = new Orchestrator(gateway)

    orchestrator.onProgress((agent, msg) => {
      addLog(agent, msg)
      if (agent !== 'orchestrator') setCurrentAgent(agent)
    })

    for (const r of ALL_AGENTS) {
      const existing = useProductionStore.getState().outputs[r]
      if (existing) orchestrator.setOutput(r, existing)
    }

    setRunning(true)
    try {
      const newOutputs = await orchestrator.runFrom(role)
      newOutputs.forEach((o) => setAgentOutput(o.agent, o))
      setNotification(`从 ${AgentLabels[role]} 重新执行完成`)
      updateAgentsWorkHistoryOnSuccess(newOutputs, '一键回溯重做任务')
    } catch (err) {
      addLog('orchestrator', '执行失败')
      setNotification(`错误: ${String(err)}`)
    } finally {
      setRunning(false)
      setCurrentAgent(null)
    }
  }, [endpoint, apiKey, model, addLog, clearDownstreamOutputs, setAgentOutput, setCurrentAgent, setEditingOutput, setNotification, setRunning])

  const runPipeline = async (input: string) => {
    setRunning(true)
    setCurrentAgent('orchestrator')

    const gateway = createGateway({ endpoint, apiKey, model: model || undefined })
    const orchestrator = new Orchestrator(gateway)

    orchestrator.onProgress((agent, msg) => {
      addLog(agent, msg)
      if (agent !== 'orchestrator') setCurrentAgent(agent)
    })

    try {
      const { plan, outputs: agentOutputs } = await orchestrator.run(input)
      setPlan(plan)
      agentOutputs.forEach((o) => setAgentOutput(o.agent, o))
      setNotification(`完成 — ${agentOutputs.length} 个 Agent 参与`)
      updateAgentsWorkHistoryOnSuccess(agentOutputs, input)
    } catch (err) {
      addLog('orchestrator', '执行失败')
      setNotification(`错误: ${String(err)}`)
    } finally {
      setRunning(false)
      setCurrentAgent(null)
    }
  }

  const openEditor = useCallback((output: typeof editingOutput) => {
    if (!output?.data) return
    setEditJson(JSON.stringify(output.data, null, 2))
    setEditingOutput(output)
  }, [setEditingOutput])

  const handleEditArtifact = useCallback((role: AgentRole) => {
    const output = useProductionStore.getState().outputs[role]
    if (!output || output.status !== 'done') return
    openEditor(output)
  }, [openEditor])


  const saveEditAndRerun = () => {
    if (!editingOutput) return
    const role = editingOutput.agent
    try {
      const parsed = JSON.parse(editJson)
      const updated = { ...editingOutput, data: parsed, status: 'done' as const }
      setAgentOutput(role, updated)
      setEditingOutput(null)
      handleRerunFrom(role)
    } catch {
      setNotification('JSON 格式错误，请检查')
    }
  }


  return (
    <div className={`h-full flex-1 flex flex-col relative w-full pb-0 ${theme.bgMain}`}>
      {/* Edit Agent Output Modal */}
      <AnimatePresence>
        {editingOutput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#00000088] backdrop-blur flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }} className="bg-[#0c0c0e] border border-[#2a2a2a] w-full max-w-3xl mx-4 h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#0c0c0e]">
                <h2 className="text-sm font-display font-semibold tracking-wide">编辑 {AgentLabels[editingOutput.agent]} 产出</h2>
                <button onClick={() => setEditingOutput(null)} className="text-[#666] hover:text-[#e5e5e5] transition-colors"><X size={18} /></button>
              </div>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="flex-1 bg-[#050505] text-[#a1a1aa] p-6 text-sm font-mono leading-relaxed resize-none focus:outline-none"
              />
              <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#2a2a2a] bg-[#0c0c0e]">
                <button onClick={() => setEditingOutput(null)} className="px-5 py-2 text-sm text-[#888] hover:text-white transition-colors">取消</button>
                <button onClick={saveEditAndRerun} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[#1a1a1a] border border-[#333] hover:border-[#666] text-white rounded-lg transition-all">
                  <Play size={14} className="text-[#00FF00]" />
                  保存并从此重新执行
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Agent System Prompt Modal */}
      <AnimatePresence>
        {configRole && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#00000088] backdrop-blur flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }} className="bg-[#0c0c0e] border border-[#2a2a2a] w-full max-w-3xl mx-4 h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#0c0c0e]">
                <h2 className="text-sm font-display font-semibold tracking-wide flex items-center gap-2">
                   配置 Agent 原设: <span className="text-[#FF6321]">{AgentLabels[configRole] || configRole}</span>
                </h2>
                <button onClick={() => setConfigRole(null)} className="text-[#666] hover:text-[#e5e5e5] transition-colors"><X size={18} /></button>
              </div>
              
              {/* Agent library binding selection */}
              <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">绑定在岗 AI 职业员工:</span>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setSelectedAgentId(nextId)
                      if (nextId !== 'custom_override') {
                        const targetAgent = marketAgents.find(a => a.id === nextId)
                        if (targetAgent) {
                          setEditPrompt(targetAgent.systemPrompt)
                        }
                      }
                    }}
                    className="bg-[#18181F] border border-[#23232C] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#E2AB46]"
                  >
                    {marketAgents.filter(a => a.role === configRole).map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.grade}) {a.id.startsWith('custom-') ? '【自主招募】' : ''}
                      </option>
                    ))}
                    <option value="custom_override">直接深度自定义 (不关联在岗角色)</option>
                  </select>
                </div>
                
                {(() => {
                  const activeBoundAgent = marketAgents.find(a => a.id === selectedAgentId)
                  if (activeBoundAgent && selectedAgentId !== 'custom_override') {
                    return (
                      <div className="flex items-center gap-2 bg-[#17171C] px-3 py-1.5 rounded-xl border border-white/5 text-xs self-start sm:self-auto">
                        <div className={`w-5 h-5 rounded bg-gradient-to-tr ${activeBoundAgent.avatarColor} flex items-center justify-center text-[11px] font-bold`}>
                          {activeBoundAgent.avatarChar}
                        </div>
                        <span className="text-gray-300 font-medium">{activeBoundAgent.name}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded leading-none">{activeBoundAgent.grade}级</span>
                      </div>
                    )
                  }
                  return (
                    <span className="text-[11px] text-gray-500 italic">自主手工定制模式</span>
                  )
                })()}
              </div>

              <div className="px-6 py-3 bg-[#111] text-[12px] text-[#aaa] border-b border-[#2a2a2a] flex items-center gap-2">
                <Check size={14} className="text-[#00FF00]" />
                如果你想自定义该 Agent 的工作模式，请在此修改 System Prompt。
              </div>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="在此输入新的系统指令覆盖代码内置指令..."
                className="flex-1 bg-[#050505] text-[#ccc] p-6 text-[13px] font-mono leading-relaxed resize-none focus:outline-none"
              />
              <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#2a2a2a] bg-[#0c0c0e]">
                <button onClick={() => setConfigRole(null)} className="px-5 py-2 text-sm text-[#888] hover:text-white transition-colors">取消</button>
                <button onClick={saveConfigAndClose} className="px-6 py-2 text-sm bg-[#FF6321] text-white rounded-lg hover:opacity-90 font-medium transition-opacity">
                  保存配置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex h-full w-full max-h-screen">
         {/* Left Side: Script Input Panel */}
         <div className={`w-[320px] shrink-0 border-r ${theme.borderColor} ${theme.bgCard} flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.15)]`}>
            <div className={`p-4 px-5 border-b ${theme.borderColor} shrink-0 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <h2 className={`text-[15px] font-medium ${theme.textTitle}`}>剧本输入</h2>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <button className={`hover:${theme.textMain} transition-colors`}><RotateCcw size={14} /></button>
                <button className={`hover:${theme.textMain} transition-colors`}>?<span className="sr-only">help</span></button>
              </div>
            </div>

           <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
             {/* Paste Script */}
             <div className="flex flex-col gap-2">
               <h3 className={`text-[12px] ${theme.textMain}`}>粘贴剧本</h3>
               <div className="relative">
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder="在此粘贴您的剧本内容...&#10;支持纯文本格式，如包含场景、角色、对白等信息，AI将自动解析并生成创作流程。"
                   rows={10}
                   className={`w-full ${theme.bgInput} border ${theme.borderColor} rounded-xl p-4 text-[13px] ${theme.textMain} leading-relaxed resize-none focus:outline-none focus:border-amber-500 transition-colors`}
                   disabled={isRunning}
                 />
                 <span className="absolute bottom-3 right-4 text-[10px] text-[#444]">{inputText.length} / 100000</span>
               </div>
               <div>
                  <button 
                    onClick={() => setInputText('')} 
                    className={`mt-1 px-3 py-1.5 text-[11px] ${theme.textMuted} ${theme.bgInput} border ${theme.borderColor} hover:${theme.textMain} rounded-md transition-colors`}
                  >
                    清空
                  </button>
               </div>
             </div>

             {/* Upload file */}
             <div className="flex flex-col gap-2">
               <h3 className={`text-[12px] ${theme.textMain}`}>或上传剧本文件 <span className="text-gray-500">( .txt / .fdx )</span></h3>
               <input
                 type="file"
                 ref={fileInputRef}
                 className="hidden"
                 accept=".txt,.fdx"
                 onChange={handleFileChange}
                 disabled={isRunning}
               />
               <div
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
                 onClick={() => !isRunning && fileInputRef.current?.click()}
                 className={`w-full min-h-[85px] border border-dashed rounded-xl flex flex-col justify-center items-center p-3 gap-1.5 transition-all text-center cursor-pointer ${
                   isDragging 
                     ? 'border-amber-500 bg-amber-500/5' 
                     : `${theme.borderColor} hover:border-amber-500 ${theme.bgInput}`
                 } ${isRunning ? 'opacity-40 pointer-events-none' : ''}`}
               >
                 {uploadedFile ? (
                   <div className="flex flex-col items-center gap-1.5 w-full">
                     <div className="flex items-center gap-2 max-w-full px-2">
                       <Check size={14} className="text-emerald-500 shrink-0" />
                       <span className={`text-[12px] font-medium truncate ${theme.textMain}`}>
                         {uploadedFile.name}
                       </span>
                     </div>
                     <span className="text-[10px] text-gray-500 font-mono">
                       ({(uploadedFile.size / 1024).toFixed(1)} KB)
                     </span>
                     <button
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation()
                         handleRemoveFile()
                       }}
                       className="text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer underline decoration-dotted mt-1"
                     >
                       移出文件
                     </button>
                   </div>
                 ) : (
                   <>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                       <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                       <polyline points="17 8 12 3 7 8"></polyline>
                       <line x1="12" y1="3" x2="12" y2="15"></line>
                     </svg>
                     <span className={`text-[12px] font-medium ${theme.textMain}`}>
                       拖拽或点击上传文件
                     </span>
                     <span className="text-[10px] text-gray-500">
                       支持拖放或选择电脑本地文件
                     </span>
                   </>
                 )}
               </div>
             </div>

             {/* Settings */}
             <div className="flex flex-col gap-4 mt-2">
               <h3 className="text-[12px] text-[#e5e5e5]">解析与流程设置</h3>
               <div className="flex flex-col gap-2">
                 <span className="text-[13px] text-gray-400">岗位架构模式</span>
                 <div className="grid grid-cols-2 gap-2 bg-[#17171C]/50 p-1.5 rounded-xl border border-white/5 font-sans">
                   <button
                     onClick={() => setFlowMode('default')}
                     disabled={isRunning}
                     className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                       flowMode === 'default'
                         ? 'bg-[#E2AB46] text-black shadow-md font-semibold'
                         : 'text-[#888] hover:text-white hover:bg-white/5'
                     }`}
                   >
                     专业版 (9岗位)
                   </button>
                   <button
                     onClick={() => setFlowMode('streamlined')}
                     disabled={isRunning}
                     className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                       flowMode === 'streamlined'
                         ? 'bg-[#E2AB46] text-black shadow-md font-semibold'
                         : 'text-[#888] hover:text-white hover:bg-white/5'
                     }`}
                   >
                     精简版 (5岗位)
                   </button>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[13px] text-[#888]">剧本语言</span>
                 <select className={`${theme.bgInput} border ${theme.borderColor} rounded-md px-3 py-1 text-[13px] ${theme.textMain} focus:outline-none focus:border-amber-500`}>
                   <option>中文</option>
                   <option>English</option>
                 </select>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[13px] text-[#888]">自动识别场景与角色</span>
                 <div className="w-8 h-4 bg-[#E2AB46] rounded-full relative cursor-pointer">
                   <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-[2px] top-[2px]"></div>
                 </div>
               </div>
             </div>

             <button
                onClick={handleStart}
                disabled={isRunning || !inputText.trim()}
                className={`w-full mt-4 py-3 ${theme.accentBg} ${theme.accentBgHover} text-white font-medium rounded-xl transition-colors active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none text-sm`}
              >
                {isRunning ? '解析中...' : '解析剧本'}
              </button>
           </div>
         </div>

         {/* Right Side: Graph & Artifacts */}
         <div className={`flex-1 flex flex-col min-w-0 h-full p-4 gap-4 ${theme.bgMain}`}>
           {/* Top: Workflow Canvas */}
           <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex-1 border ${theme.borderColor} ${theme.bgCard} rounded-2xl flex flex-col overflow-hidden`}>
             <div className={`flex-1 w-full ${theme.bgCard} relative overflow-hidden`}>
                <WorkflowCanvas 
                  flow={flow} 
                  outputs={outputs} 
                  currentAgent={currentAgent} 
                  logs={logs} 
                  onEdit={handleEditArtifact}
                  onConfig={openConfig}
                  onRerun={handleRerunFrom}
                />
             </div>
           </motion.section>

           
         </div>
      </div>
      
      {/* Scrollbar styling for entire DOM context injected if needed, standard tailwind handles mostly. */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}} />
    </div>
  )
}
