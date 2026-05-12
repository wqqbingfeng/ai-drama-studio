import { useState } from 'react'
import { Search, Plus, TestTube, Settings2, Users } from 'lucide-react'
import { useProductionStore } from '../../state/store'
import { AgentLabels, AgentRole } from '../../models/production'
import { createGateway } from '../../gateway'

function loadConfig() {
  try {
    const data = localStorage.getItem('AIS_STUDIO_CONFIG')
    if (data) return JSON.parse(data)
  } catch (e) {}
  return {
    endpoint: '',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-pro (Studio Free)'
  }
}

export function AgentMarket() {
  const { agentConfigs, setAgentConfig } = useProductionStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // Use default agents as base list + any custom stored ones
  const defaultAgents: AgentRole[] = [
    'screenwriter',
    'character_designer',
    'scene_designer',
    'director',
    'cinematographer',
    'post_production',
  ]
  const agentsKeys = Array.from(new Set([...defaultAgents, ...Object.keys(agentConfigs)]))

  const handleTestAgent = async (role: AgentRole) => {
    if (!testInput.trim()) return
    setIsTesting(true)
    setTestResult('')
    
    try {
      const config = agentConfigs[role]
      const conf = loadConfig()
      const gateway = createGateway({
        apiKey: conf.apiKey,
        endpoint: conf.endpoint,
        model: conf.model === 'gemini-2.5-pro (Studio Free)' ? 'gemini-2.5-pro' : conf.model
      })
      
      const system = config?.systemPrompt || 'You are ' + (AgentLabels[role] || role)
      
      const response = await gateway.think(system, [{ role: 'user', content: testInput }])
      setTestResult(response)
    } catch (e: any) {
      setTestResult('Test Failed: ' + e.message)
    } finally {
      setIsTesting(false)
    }
  }

  const selectedConfig = selectedAgent ? agentConfigs[selectedAgent] : null
  const selectedName = selectedAgent ? (AgentLabels[selectedAgent as AgentRole] || selectedAgent) : ''

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h1 className="text-xl font-display font-medium text-white">AI 人才市场 (Agent Market)</h1>
        <p className="text-sm text-[#666] mt-1">招募、培训 (预设词管理) 与单体测试</p>
      </div>
      
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0">
        {/* Left Side: Agent List */}
        <div className="col-span-1 xl:col-span-3 flex flex-col gap-4 bg-[#0c0c0e] border border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm">
           <div className="p-4 border-b border-[#1a1a1a]">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜索 Agent 角色..." 
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#eee] focus:outline-none focus:border-[#FF6321] transition-colors"
                />
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
             {agentsKeys.filter(k => (AgentLabels[k as AgentRole] || k).includes(searchTerm)).map(role => (
               <button
                 key={role}
                 onClick={() => setSelectedAgent(role as AgentRole)}
                 className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                   selectedAgent === role 
                     ? 'bg-[#1f1f1f] text-white border border-[#2a2a2a]' 
                     : 'text-[#888] hover:bg-[#141414] hover:text-[#eee] border border-transparent'
                 }`}
               >
                 <span className="text-sm">{AgentLabels[role as AgentRole] || role}</span>
                 <Settings2 size={14} className={selectedAgent === role ? 'text-[#FF6321]' : 'opacity-0 group-hover:opacity-100'} />
               </button>
             ))}
             <button className="w-full text-left px-3 py-2.5 rounded-lg text-[#666] hover:bg-[#141414] border border-dashed border-[#2a2a2a] mt-2 flex items-center gap-2 transition-colors">
               <Plus size={14} />
               <span className="text-sm">招募自定义 Agent</span>
             </button>
           </div>
        </div>

        {/* Right Side: Training & Testing Console */}
        <div className="col-span-1 xl:col-span-9 flex flex-col gap-4 min-h-0">
          {selectedAgent ? (
            <>
              {/* Training Area */}
              <div className="flex-1 bg-[#0c0c0e] border border-[#1a1a1a] rounded-xl overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0a0a0a]">
                   <h2 className="text-sm font-medium text-white flex items-center gap-2">
                     <Settings2 size={16} /> 培训：{selectedName}
                   </h2>
                 </div>
                 <div className="p-4 flex-1 flex flex-col overflow-hidden">
                   <label className="block text-xs uppercase tracking-wider text-[#666] mb-2">系统预设词 (System Prompt)</label>
                   <textarea
                      value={selectedConfig?.systemPrompt || ''}
                      onChange={e => setAgentConfig(selectedAgent, { ...selectedConfig, systemPrompt: e.target.value })}
                      placeholder="在这里输入角色的设定、技能要求、输出格式要求等..."
                      className="w-full flex-1 bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-[13px] text-[#eee] resize-none focus:outline-none focus:border-[#FF6321] transition-colors leading-relaxed font-mono custom-scrollbar"
                   />
                 </div>
              </div>

              {/* Testing Area */}
              <div className="flex-none h-[40%] min-h-[250px] bg-[#0c0c0e] border border-[#1a1a1a] rounded-xl overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0a0a0a]">
                   <h2 className="text-sm font-medium text-white flex items-center gap-2">
                     <TestTube size={16} /> 考核测试
                   </h2>
                 </div>
                 <div className="p-4 flex-1 grid grid-cols-2 gap-4 min-h-0">
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-xs text-[#666]">测试用例 (User Input)</label>
                      <textarea
                        value={testInput}
                        onChange={e => setTestInput(e.target.value)}
                        placeholder="输入一段要求该角色的测试文本..."
                        className="w-full flex-1 bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-sm text-[#eee] resize-none focus:outline-none focus:border-[#FF6321] transition-colors"
                      />
                      <button
                        onClick={() => handleTestAgent(selectedAgent)}
                        disabled={isTesting || !testInput.trim()}
                        className="absolute bottom-3 right-3 px-4 py-1.5 bg-[#FF6321] text-white text-xs rounded-md disabled:opacity-50 hover:bg-[#E55A1F] transition-colors"
                      >
                        {isTesting ? '产出中...' : '开始测试'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 overflow-hidden">
                      <label className="text-xs text-[#666]">输出产物 (Output)</label>
                      <div className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 overflow-y-auto custom-scrollbar">
                        {testResult ? (
                          <pre className="text-[13px] text-[#bbb] whitespace-pre-wrap font-sans">{testResult}</pre>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#444] text-sm">
                            尚未运行测试
                          </div>
                        )}
                      </div>
                    </div>
                 </div>
              </div>
            </>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-[#666] flex-col gap-3">
               <Users size={48} strokeWidth={1} opacity={0.3} />
               <p className="text-sm">选择左侧的 Agent 开始培训与测试</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
