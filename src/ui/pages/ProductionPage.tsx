import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, RotateCcw, Eye, EyeOff, Check } from 'lucide-react'
import { useProductionStore } from '../../state/store'
import { ArtifactPanel } from '../components/ArtifactPanel'
import { Timeline } from '../components/Timeline'
import { WorkflowCanvas } from '../components/WorkflowCanvas'
import { Orchestrator } from '../../agent-core/orchestrator'
import { createGateway } from '../../gateway'
import type { AgentRole } from '../../models/production'
import { AgentLabels } from '../../models/production'

const ALL_AGENTS: AgentRole[] = [
  'screenwriter',
  'character_designer',
  'scene_designer',
  'director',
  'cinematographer',
  'post_production',
]

const STORAGE_KEY = 'ai-drama-studio-config'

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const savedModel = localStorage.getItem('ai-drama-studio-selected-model')
      return { endpoint: parsed.endpoint || '', apiKey: parsed.apiKey || '', model: savedModel || parsed.model || 'gpt-5.5' }
    }
  } catch (err) {
    console.error(err)
  }
  const savedModel = localStorage.getItem('ai-drama-studio-selected-model')
  return { endpoint: '', apiKey: '', model: savedModel || 'gpt-5.5' }
}

function saveConfig(config: { endpoint: string; apiKey: string; model: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function ProductionPage({ showSettings, setShowSettings }: { showSettings: boolean, setShowSettings: (v: boolean) => void }) {
  const [inputText, setInputText] = useState('')
  const [endpoint, setEndpoint] = useState(loadConfig().endpoint)
  const [apiKey, setApiKey] = useState(loadConfig().apiKey)
  const [model, setModel] = useState(loadConfig().model)
  const [editJson, setEditJson] = useState('')
  const [showKey, setShowKey] = useState(false)
  
  const [configRole, setConfigRole] = useState<AgentRole | null>(null)
  const [editPrompt, setEditPrompt] = useState('')

  const plan = useProductionStore((s) => s.plan)
  const flow = useProductionStore((s) => s.flow)
  const outputs = useProductionStore((s) => s.outputs)
  const logs = useProductionStore((s) => s.logs)
  const isRunning = useProductionStore((s) => s.isRunning)
  const currentAgent = useProductionStore((s) => s.currentAgent)
  const notification = useProductionStore((s) => s.notification)
  const editingOutput = useProductionStore((s) => s.editingOutput)
  const setAgentConfig = useProductionStore((s) => s.setAgentConfig)

  const setPlan = useProductionStore((s) => s.setPlan)
  const setAgentOutput = useProductionStore((s) => s.setAgentOutput)
  const addLog = useProductionStore((s) => s.addLog)
  const setRunning = useProductionStore((s) => s.setRunning)
  const setCurrentAgent = useProductionStore((s) => s.setCurrentAgent)
  const setNotification = useProductionStore((s) => s.setNotification)
  const reset = useProductionStore((s) => s.reset)
  const setEditingOutput = useProductionStore((s) => s.setEditingOutput)
  const clearDownstreamOutputs = useProductionStore((s) => s.clearDownstreamOutputs)

  const [bottomTab, setBottomTab] = useState<'preview' | 'logs' | 'versions'>('preview')

  const hasConfig = endpoint && apiKey

  const normalizeEndpoint = (url: string): string => {
    let trimmed = url.trim()
    if (!trimmed) return trimmed
    if (trimmed.startsWith('/api/') || trimmed.includes(':5174')) {
      return trimmed
    }
    if (!trimmed.includes('/v1/') && !trimmed.endsWith('/chat/completions')) {
      if (trimmed.endsWith('/')) trimmed = trimmed.slice(0, -1)
      return trimmed + '/v1/chat/completions'
    }
    return trimmed
  }

  const handleSaveSettings = () => {
    const normalized = normalizeEndpoint(endpoint)
    setEndpoint(normalized)
    saveConfig({ endpoint: normalized, apiKey, model })
    setShowSettings(false)
  }
  
  const openConfig = useCallback((role: AgentRole) => {
    setConfigRole(role)
    const currentPrompt = useProductionStore.getState().agentConfigs[role]?.systemPrompt || ''
    setEditPrompt(currentPrompt)
  }, [])

  const saveConfigAndClose = () => {
    if (configRole) {
      setAgentConfig(configRole, { systemPrompt: editPrompt })
      setConfigRole(null)
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

  const resetCanvas = useCallback(() => {
    useProductionStore.getState().setFlow(
      [
        { role: 'screenwriter', dependsOn: [] },
        { role: 'character_designer', dependsOn: ['screenwriter'] },
        { role: 'scene_designer', dependsOn: ['screenwriter'] },
        { role: 'director', dependsOn: ['character_designer', 'scene_designer'] },
        { role: 'cinematographer', dependsOn: ['director'] },
        { role: 'post_production', dependsOn: ['cinematographer'] }
      ]
    )
  }, [])

  return (
    <div className="h-full flex flex-col relative w-full pb-0 bg-[#0E0E11]">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#00000088] backdrop-blur text-[#e5e5e5] flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.15 }} className="bg-[#0c0c0e] border border-[#2a2a2a] p-6 w-full max-w-md mx-4 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-display font-semibold tracking-wide">模型设置参数</h2>
                <button onClick={() => setShowSettings(false)} className="text-[#666666] hover:text-[#e5e5e5] transition-colors p-1"><X size={18} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-2 font-medium">配置模型 / Base Model</label>
                  <div className="flex gap-2">
                    <select 
                      value={model} 
                      onChange={(e) => {
                        setModel(e.target.value)
                        if (e.target.value === 'gemini-2.5-pro (Studio Free)') {
                          setEndpoint('')
                          setApiKey(import.meta.env.VITE_GEMINI_API_KEY || '')
                        }
                      }} 
                      className="flex-1 bg-[#141414] rounded-lg border border-[#2a2a2a] px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6321] transition-colors appearance-none"
                    >
                      <option value="gemini-2.5-pro (Studio Free)">gemini-2.5-pro (Studio Free)</option>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="claude-3-5-sonnet-20240620">claude-3-5-sonnet</option>
                      <option value="deepseek-chat">deepseek-chat</option>
                      {/* Allow custom if not matching presets by injecting below */}
                      {!['gemini-2.5-pro (Studio Free)', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20240620', 'deepseek-chat'].includes(model) && (
                        <option value={model}>{model} (自定义)</option>
                      )}
                    </select>
                    <button
                      onClick={async () => {
                        try {
                          const start = Date.now()
                          const targetModel = model === 'gemini-2.5-pro (Studio Free)' ? 'gemini-2.5-pro' : model
                          const isStudioFree = model === 'gemini-2.5-pro (Studio Free)'
                          const testEndpoint = isStudioFree ? '' : normalizeEndpoint(endpoint)
                          
                          if (testEndpoint) {
                             await fetch(testEndpoint, {
                               method: 'POST',
                               headers: {
                                 'Content-Type': 'application/json',
                                 ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
                               },
                               body: JSON.stringify({
                                 model: targetModel,
                                 messages: [{ role: 'user', content: 'Ping' }],
                                 max_tokens: 5
                               })
                             }).then(res => { if (!res.ok) throw new Error('Status ' + res.status) })
                          } else {
                             const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`
                             await fetch(`${apiUrl}?key=${apiKey}`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                 contents: [{ role: 'user', parts: [{ text: 'Ping' }] }]
                               })
                             }).then(res => { if (!res.ok) throw new Error('Status ' + res.status) })
                          }
                          const elapsed = Date.now() - start
                          alert(`测速成功！延迟: ${elapsed}ms`)
                        } catch (err) {
                          alert(`测速失败: ${String(err)}`)
                        }
                      }}
                      className="px-4 py-2.5 text-[11px] border border-[#2a2a2a] bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] rounded-lg transition-colors whitespace-nowrap"
                    >
                      测速延时
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-2 font-medium">基座中转站地址</label>
                  <div className="flex gap-2">
                    <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://api.openai.com 或者中转地址" className="flex-1 bg-[#141414] rounded-lg border border-[#2a2a2a] px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6321] transition-colors" />
                    <button
                      onClick={() => setEndpoint('http://127.0.0.1:5174')}
                      className="px-3 py-2.5 text-[11px] border border-[#2a2a2a] bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] rounded-lg transition-colors whitespace-nowrap"
                    >
                      本地代理
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-2 font-medium">校验秘钥 (API Key)</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-[#141414] rounded-lg border border-[#2a2a2a] px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#FF6321] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

              </div>
              <div className="flex justify-end mt-8 border-t border-[#1a1a1a] pt-4">
                <button onClick={handleSaveSettings} className="px-6 py-2.5 text-sm bg-[#FF6321] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium">保存设置</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
         <div className="w-[320px] shrink-0 border-r border-[#1C1C21] bg-[#121214] flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
           <div className="p-4 px-5 border-b border-[#1C1C21] shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <h2 className="text-[15px] font-medium text-[#e5e5e5]">剧本输入</h2>
             </div>
             <div className="flex items-center gap-2 text-[#66666e]">
               <button className="hover:text-[#e5e5e5] transition-colors"><RotateCcw size={14} /></button>
               <button className="hover:text-[#e5e5e5] transition-colors">?<span className="sr-only">help</span></button>
             </div>
           </div>

           <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
             {/* Paste Script */}
             <div className="flex flex-col gap-2">
               <h3 className="text-[12px] text-[#e5e5e5]">粘贴剧本</h3>
               <div className="relative">
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder="在此粘贴您的剧本内容...&#10;支持纯文本格式，如包含场景、角色、对白等信息，AI将自动解析并生成创作流程。"
                   rows={10}
                   className="w-full bg-[#1A1A1F] border border-[#2A2A35] rounded-xl p-4 text-[13px] text-[#eee] leading-relaxed resize-none focus:outline-none focus:border-[#E2AB46] transition-colors"
                   disabled={isRunning}
                 />
                 <span className="absolute bottom-3 right-4 text-[10px] text-[#444]">{inputText.length} / 100000</span>
               </div>
               <div>
                  <button 
                    onClick={() => setInputText('')} 
                    className="mt-1 px-3 py-1.5 text-[11px] text-[#888] bg-[#1A1A1F] border border-[#2A2A35] hover:text-[#eee] hover:border-[#444] rounded-md transition-colors"
                  >
                    清空
                  </button>
               </div>
             </div>

             {/* Upload file */}
             <div className="flex flex-col gap-2">
               <h3 className="text-[12px] text-[#e5e5e5]">或上传剧本文件 <span className="text-[#666]">( .txt / .fdx )</span></h3>
               <button className="w-full py-3 border border-dashed border-[#2A2A35] hover:border-[#E2AB46] bg-[#1A1A1F] rounded-xl flex justify-center items-center gap-2 text-[#888] hover:text-[#E2AB46] transition-colors text-[13px]">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                 点击上传文件
               </button>
             </div>

             {/* Settings */}
             <div className="flex flex-col gap-4 mt-2">
               <h3 className="text-[12px] text-[#e5e5e5]">解析设置</h3>
               <div className="flex items-center justify-between">
                 <span className="text-[13px] text-[#888]">剧本语言</span>
                 <select className="bg-[#1A1A1F] border border-[#2A2A35] rounded-md px-3 py-1 text-[13px] text-[#eee] focus:outline-none focus:border-[#E2AB46]">
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
                className="w-full mt-4 py-3 bg-[#BFA162] hover:bg-[#D5B064] text-[#121214] font-medium rounded-xl transition-colors active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none text-sm"
              >
                {isRunning ? '解析中...' : '解析剧本'}
              </button>
           </div>
         </div>

         {/* Right Side: Graph & Artifacts */}
         <div className="flex-1 flex flex-col min-w-0 h-full p-4 gap-4 bg-[#0E0E11]">
           {/* Top: Workflow Canvas */}
           <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex-[3] border border-[#1C1C21] bg-[#121214] rounded-2xl flex flex-col overflow-hidden min-h-[400px]">
             <div className="flex-1 w-full bg-[#121214] relative overflow-hidden">
                <WorkflowCanvas 
                  flow={flow} 
                  outputs={outputs} 
                  currentAgent={currentAgent} 
                  logs={logs} 
                  onEdit={handleEditArtifact}
                  onConfig={openConfig}
                />
             </div>
           </motion.section>

           {/* Bottom: Produced Artifacts Viewer */}
           <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex-[2] border border-[#1C1C21] bg-[#121214] rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
             <div className="flex items-center justify-between border-b border-[#1C1C21] px-2 bg-[#121214] pt-2">
               <div className="flex">
                  <button onClick={() => setBottomTab('preview')} className={`px-4 py-2 border-b-2 text-[13px] hover:text-[#eee] transition-colors ${bottomTab === 'preview' ? 'border-[#E2AB46] text-[#E2AB46] font-medium' : 'border-transparent text-[#66666e]'}`}>产出预览</button>
                  <button onClick={() => setBottomTab('logs')} className={`px-4 py-2 border-b-2 text-[13px] hover:text-[#eee] transition-colors ${bottomTab === 'logs' ? 'border-[#E2AB46] text-[#E2AB46] font-medium' : 'border-transparent text-[#66666e]'}`}>执行日志</button>
                  <button onClick={() => setBottomTab('versions')} className={`px-4 py-2 border-b-2 text-[13px] hover:text-[#eee] transition-colors ${bottomTab === 'versions' ? 'border-[#E2AB46] text-[#E2AB46] font-medium' : 'border-transparent text-[#66666e]'}`}>版本记录</button>
               </div>
               <div className="flex items-center gap-2 pr-4">
                 <button className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1F] border border-[#2A2A35] hover:bg-[#22222A] text-[#888] hover:text-[#eee] rounded transition-colors text-[11px]">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                   打开输出目录
                 </button>
                 <button className="text-[#666] hover:text-[#eee]  w-6 h-6 flex items-center justify-center bg-[#1A1A1F] border border-[#2A2A35] rounded">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                 </button>
               </div>
             </div>
             <div className="p-0 overflow-y-auto flex-1 custom-scrollbar w-full relative bg-[#0E0E11]">
               {bottomTab === 'preview' && <div className="p-4"><ArtifactPanel outputs={outputs} /></div>}
               {bottomTab === 'logs' && <div className="p-4"><Timeline logs={logs} /></div>}
               {bottomTab === 'versions' && <div className="p-4 text-[#888] flex h-full justify-center items-center text-sm">暂无历史版本记录</div>}
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
