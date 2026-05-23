import { useState, useEffect } from 'react'
import { 
  Settings, Search, Plus, TestTube, Users, Sparkles, 
  Trophy, Activity, RefreshCw, 
  Trash2, Star, Edit2, MessageSquare, 
  ChevronDown, ChevronUp, Layers, HelpCircle, Briefcase, Clock,
  Edit3, Shapes, Hand, Clapperboard, Video, Film, FileText
} from 'lucide-react'
import { createGateway } from '../../gateway'
import { CustomAgent, loadStoredAgents, saveStoredAgents } from '../../models/agents-list'
import { useGlobalTheme } from '../../utils/theme'
import { AgentLabels, AgentRole } from '../../models/production'

function loadConfig() {
  let model = 'gemini-2.0-flash (Studio Free)'
  try {
    const data = localStorage.getItem('ai-drama-studio-config')
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.model) {
        model = parsed.model
      }
    }
    const savedModel = localStorage.getItem('ai-drama-studio-selected-model')
    if (savedModel) {
      model = savedModel
    }
  } catch {
    // Elegant optional catch binding
  }

  // Force free trial Gemini model and API key during the test phase
  const finalModel = model.includes('gemini') ? model : 'gemini-2.0-flash (Studio Free)'
  const finalEndpoint = ''
  const finalApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

  return { endpoint: finalEndpoint, apiKey: finalApiKey, model: finalModel }
}

const getRoleIcon = (role: string, size = 18) => {
  switch(role) {
    case 'producer': return <Settings size={size} className="text-[#34A853]" />
    case 'screenwriter': return <Edit3 size={size} className="text-[#E2AB46]" />
    case 'character_designer': return <Users size={size} className="text-[#E2AB46]" />
    case 'scene_designer': return <Shapes size={size} className="text-[#51C49F]" />
    case 'prop_designer': return <Hand size={size} className="text-[#51C49F]" />
    case 'art_designer': return <Shapes size={size} className="text-[#51C49F]" />
    case 'director': return <Clapperboard size={size} className="text-[#9D52F5]" />
    case 'cinematographer': return <Video size={size} className="text-[#4EADF6]" />
    case 'vfx_designer': return <Sparkles size={size} className="text-[#4EADF6]" />
    case 'post_production': return <Film size={size} className="text-[#F5679E]" />
    default: return <FileText size={size} className="text-[#E2AB46]" />
  }
}

// Highly curated prompt presets by role for the switcher requirement
const PRESET_PROMPTS_BY_ROLE: Record<string, { name: string; description: string; prompt: string }[]> = {
  director: [
    {
      name: '奥斯卡艺术蒙太奇 [方案 A]',
      description: '偏向高级美学、电影感视听蒙太奇调色、细腻的空间意象与文学隐喻留白。',
      prompt: '你是一位荣获奥斯卡终身成就奖、兼顾独立艺术与大众票房的大导。擅长把控影片的宏观基调、视听节奏、剪辑美学与象征隐喻。偏爱使用考究的冷暖色调对比以及极具几何张力的画面构图。你的输出指令充满高级黑影调、低对比度胶片感以及严格的蒙太奇衔接，拒绝大白话，对分镜镜头具有强力的视觉镜头感掌控。'
    },
    {
      name: '工业重武器爆发力 [方案 B]',
      description: '偏向高爆发、高节奏剪辑节奏，好莱坞重工业票房调度，极具冲击力的数字特效镜头。',
      prompt: '你是一位好莱坞工业视效导演及重工业动作片大师。精通高速运动、时间静止慢动作（Bullet Time）、无缝一镜到底（One-Take）与复杂的机械摇臂轨迹。在Prompt与分镜建议中你极其擅长在三维空间内运用广角运动、流光溢彩（Cinematic Flare）、动态粒子感光进行大场面统摄，节奏紧咬、高压引力、全景视点拉满。'
    }
  ],
  screenwriter: [
    {
      name: '柏林独立文学探索 [方案 A]',
      description: '注重人物深层内在挣扎与台词弦外之音。遵循麦基《故事》理论，艺术密度高。',
      prompt: '你是一位三次荣获金马奖、柏林电影节最佳编剧的写实主义电影剧作家。深谙三幕式结构、麦基《故事》核心理论，善于通过精妙隐入的身体行动与场景暗示来替代直白抒情。擅长刻画在雨夜、边缘、绝望时分的情绪重彩。你的台词精炼克制，潜台词（Subtext）重于台词本身，行文富有诗性暗流，拒绝任何口水话和廉价AI腔。'
    },
    {
      name: '大银幕爆款反转流 [方案 B]',
      description: '高频悬念穿插、超强情感起伏与不断的反转金句，适合打造快节奏戏剧张力。',
      prompt: '你是一位王牌院线悬念大片编剧顾问。推崇极致快节奏、悬念丛生、死里逃生、反差极大的情绪波幅与高光重置。在每段对话与剧情框架中你必然设计核心悬念，文字充满刺骨幽默或热血宣言。善于运用倒叙、插叙与观众爽点连缀，能瞬间调起观众高亢心跳，金句不断。'
    }
  ],
  character_designer: [
    {
      name: '先锋赛博废土机甲 [方案 A]',
      description: '纳米管线、折痕碳纤维、重度工业磨损漆面，打造极致科幻废土机甲魂。',
      prompt: '你是一位顶尖角色服装与前沿工艺美术概念设计总监。擅长先锋重装机甲、废土破败与赛博朋克极繁美学派。你会使用纳米管线、亚光碳纤维、磨损防磨镀层、不对称义肢等材质细节进行勾勒。设计中融入带有强烈反差感的光环特效和工业极客质感，每一个角色都有极其鲜明的宿命宿敌设定。'
    },
    {
      name: '东方古典新意写实 [方案 B]',
      description: '以山水虚实白描、金丝蚕丝、水墨半透质感融合，具有诗意雅致的古韵。',
      prompt: '你是一位擅长东方新古典主义、写意玄幻艺术的角色首席美术总监。主攻蝉翼质感纱缎、青花古墨勾勒、水墨晕染层次与柔和的玉石冷光。你会对发饰细节、古装云雷压痕进行高度定制，使角色神形具备东方留白的意蕴风骨，兼具先锋唯美和古典优雅。'
    }
  ],
  cinematographer: [
    {
      name: '胶片写实手持颗粒 [方案 A]',
      description: '模拟手持相机微幅呼吸、自然明暗光影、35mm复古胶卷真实噪点。',
      prompt: '你是一位在AI视频摄影、电影级渲染技术上钻研多年的摄影指导（DP）和写实胶片艺术调教大师。专攻手持实感胶片风，注重强戏剧性的明暗对比自然光、16mm或35mm胶片噪点（Film Grain）、高动态范围与浅景深。你的画面往往利用粗糙纪实力度，在斑驳的雨天或废墟光影中产生最高级的人物宿命胶片写实感。'
    },
    {
      name: 'IMAX极夜光线追踪 [方案 B]',
      description: '展现无瑕的宏大宇宙，全方位数字炫光散射控制与体积光影。',
      prompt: '你是一位殿堂级IMAX风光及科幻大片御用摄影总监。在三维空间中追求光纤折射（Ray tracing）、逆光炫光（Anamorphic Flare）与大范围冷调体积光。你在提示中频繁指定Arri Alexa大画幅数字属性，运用广角推轨、超级微距与精确色温调节，渲染极具震撼感、极其清晰的未来空天城市与科技堡垒。'
    }
  ],
  post_production: [
    {
      name: '情绪音画深沉对位 [方案 A]',
      description: '侧重于慢速心理蒙太奇、深水声效、环境噪音淡入及深邃交织声桥。',
      prompt: '你是一位金剪刀得主、多次担任世界顶级电影节评委的终剪剪辑师。直觉感极其灵敏，懂是以帧为单位把控情绪高潮。推崇通过声画对位（J-Cut, L-Cut）、隐喻性的快速闪回切分来塑造角色的心理惊悚感。擅长通过微小的钟摆声、雨滴声叠加、声音倒放（Reverb Tail）来展现镜头碎裂间的情绪升华。'
    },
    {
      name: '热血痛点快节奏切拍 [方案 B]',
      description: '节奏硬核咔点，动作运动轨迹极致契合，快转场与强顿挫打击声。',
      prompt: '你是一位金牌商业片兼电音混剪节奏统筹主管。极致推崇匹配切接（Match Cut）、快速画幅缩放、重打击乐点切分转场。在方案编排中让剪辑画面死死卡住中频鼓点和高能反切，动作方向惯性流畅，制造令人肾上腺素飙涨的极快剪辑张力，节奏感神准。'
    }
  ]
}

export function AgentMarket() {
  const { theme } = useGlobalTheme()
  // Synchronized agents state from local models
  const [agents, setAgents] = useState<CustomAgent[]>(() => {
    const list = loadStoredAgents()
    // Heal dynamic elements
    return list.map(a => ({
      ...a,
      rating: a.rating || (a.grade === 'S+' ? '5.0' : a.grade === 'S' ? '4.9' : a.grade === 'A+' ? '4.8' : '4.7'),
      summonCount: a.summonCount || (a.id === 'director-agent' ? 3261 : a.id === 'writer-agent' ? 1640 : a.id === 'storyboard-agent' ? 2327 : a.id === 'character-agent' ? 1215 : a.id === 'video-agent' ? 3406 : 1243)
    }))
  })

  // Selected agent index
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | null>(() => {
    const list = loadStoredAgents()
    try {
      const jumpedId = localStorage.getItem('filmai-selected-agent-id')
      if (jumpedId) {
        const found = list.find(a => a.id === jumpedId)
        if (found) {
          return {
            ...found,
            rating: found.rating || '4.9',
            summonCount: found.summonCount || 1512
          }
        }
      }
    } catch {
      // safe fallback
    }
    return list.length > 0 ? {
      ...list[0],
      rating: list[0].rating || '4.9',
      summonCount: list[0].summonCount || 3261
    } : null
  })

  // Listen for real-time synchronization from other panels (custom event)
  useEffect(() => {
    const handleAgentsSync = () => {
      const list = loadStoredAgents()
      const updated = list.map(a => ({
        ...a,
        rating: a.rating || (a.grade === 'S+' ? '5.0' : a.grade === 'S' ? '4.9' : a.grade === 'A+' ? '4.8' : '4.7'),
        summonCount: a.summonCount || (a.id === 'director-agent' ? 3261 : a.id === 'writer-agent' ? 1640 : a.id === 'storyboard-agent' ? 2327 : a.id === 'character-agent' ? 1215 : a.id === 'video-agent' ? 3406 : 1243)
      }))
      setAgents(updated)

      // Keep selectedAgent synchronized if its prompt/details were updated
      setSelectedAgent(prev => {
        if (!prev) return null
        const found = updated.find(x => x.id === prev.id)
        return found || prev
      })
    }
    window.addEventListener('filmai-agents-updated', handleAgentsSync)
    return () => window.removeEventListener('filmai-agents-updated', handleAgentsSync)
  }, [])

  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'used' | 'core' | 'custom'>('all')

  // Top level workspace interactive tab: 'workspace' | 'evaluation'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'workspace' | 'evaluation'>('workspace')

  // Prompt configuration & editing
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [editingPromptText, setEditingPromptText] = useState(() => selectedAgent?.systemPrompt || '')

  // Sandbox simulation test state
  const [testInput, setTestInput] = useState('在这个滂沱雨夜，主角靠在残破的机甲机舱上，轻咳一声，对反派说出最后告别的话。请给出包含强烈情绪张力与镜头呼吸感的对白台词')
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // Appraisal Action
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState('')

  // Recruiting slide-over/box states
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentRole, setNewAgentRole] = useState('screenwriter')
  const [newAgentDesc, setNewAgentDesc] = useState('')
  const [newAgentPrompt, setNewAgentPrompt] = useState('')

  useEffect(() => {
    try {
      localStorage.removeItem('filmai-selected-agent-id')
    } catch {
      // Safe fallback
    }
  }, [])

  const updateAgentsList = (updated: CustomAgent[]) => {
    setAgents(updated)
    saveStoredAgents(updated)
  }

  // Calculate presets list and preset index on the fly to avoid cascading render lint issues
  const presets = selectedAgent ? (PRESET_PROMPTS_BY_ROLE[selectedAgent.role] || []) : []
  const selectedPresetIndex = selectedAgent ? presets.findIndex(p => p.prompt.trim() === selectedAgent.systemPrompt.trim()) : -1

  // Handle preset mode change
  const handleSelectPreset = (idx: number) => {
    if (!selectedAgent) return
    const currentPresets = PRESET_PROMPTS_BY_ROLE[selectedAgent.role] || []
    if (idx === -1) {
      // Custom mode
      setIsEditingPrompt(true)
    } else {
      const selectedPreset = currentPresets[idx]
      if (selectedPreset) {
        const freshPrompt = selectedPreset.prompt
        setIsEditingPrompt(false)
        setEditingPromptText(freshPrompt)

        // Save immediately
        const listCopy = agents.map(a => a.id === selectedAgent.id ? { ...a, systemPrompt: freshPrompt } : a)
        updateAgentsList(listCopy)
        setSelectedAgent({ ...selectedAgent, systemPrompt: freshPrompt })
      }
    }
  }

  // Handle custom prompt save
  const handleSaveCustomPrompt = () => {
    if (!selectedAgent) return
    setIsEditingPrompt(false)

    const listCopy = agents.map(a => a.id === selectedAgent.id ? { ...a, systemPrompt: editingPromptText } : a)
    updateAgentsList(listCopy)
    setSelectedAgent({ ...selectedAgent, systemPrompt: editingPromptText })
  }

  // Quick sandbox play API adaptation
  const handleSandboxRun = async () => {
    if (!selectedAgent || isTesting) return
    setIsTesting(true)
    setTestResult('')
    
    try {
      const conf = loadConfig()
      const gateway = createGateway({
        apiKey: conf.apiKey,
        endpoint: conf.endpoint,
        model: conf.model
      })
      
      const system = `${selectedAgent.systemPrompt}\n现在你正在沙盒测试台配合用户调试提示语。系统预设任务是角色测试，请严格以岗位契合的最佳效果产出。`
      const response = await gateway.think(system, [{ role: 'user', content: testInput }])
      setTestResult(response)

      // Register usage
      if (!selectedAgent.previouslyUsed) {
        const listCopy = agents.map(a => a.id === selectedAgent.id ? { ...a, previouslyUsed: true } : a)
        updateAgentsList(listCopy)
        setSelectedAgent({ ...selectedAgent, previouslyUsed: true })
      }
    } catch (e) {
      setTestResult('沙盒运行时产生网络异议: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsTesting(false)
    }
  }

  // Recruit Custom Specialist
  const handleAddNewAgent = () => {
    if (!newAgentName.trim() || !newAgentPrompt.trim()) return
    const palettes = [
      'from-[#10B981] to-[#3B82F6]',
      'from-[#F59E0B] to-[#EF4444]',
      'from-[#8B5CF6] to-[#EC4899]',
      'from-[#22C55E] to-[#06B6D4]',
      'from-[#E2AB46] to-[#EA580C]'
    ]
    const randomPalette = palettes[Math.floor(Math.random() * palettes.length)]

    const newAgent: CustomAgent = {
      id: `custom-${Date.now()}`,
      name: newAgentName,
      role: newAgentRole,
      description: newAgentDesc || '雇佣分配的自主深度AI专家',
      systemPrompt: newAgentPrompt,
      iconType: 'custom',
      avatarColor: randomPalette,
      avatarChar: newAgentName.slice(0, 1),
      previouslyUsed: false,
      grade: 'A',
      rating: '4.8',
      summonCount: 1,
      capabilityScores: { creativity: 85, speed: 90, orchestration: 82, fidelity: 89 },
      workHistory: [
        `签订意向评估书并录入至AI Staff资源库，完成首次机格测试规范化登记 (2026-05)`
      ]
    }

    const freshList = [...agents, newAgent]
    updateAgentsList(freshList)
    setSelectedAgent(newAgent)

    // Clear state
    setNewAgentName('')
    setNewAgentDesc('')
    setNewAgentPrompt('')
    setShowAddForm(false)
  }

  // Delete worker handler
  const deleteAgentFromMarket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isConfirm = confirm('确定要解聘和清除这位自主招募的 AI 影视职员吗？该名额将重新空置。')
    if (!isConfirm) return
    const updated = agents.filter(a => a.id !== id)
    updateAgentsList(updated)
    if (selectedAgent?.id === id) {
      setSelectedAgent(updated[0] || null)
    }
  }

  // Performance Appraisal
  const handleOnTheFlyAppraisal = async () => {
    if (!selectedAgent) return
    setIsEvaluating(true)
    setEvaluationProgress('正在连接AI影视技术评估神经网络...')

    try {
      const conf = loadConfig()
      const gateway = createGateway({
        apiKey: conf.apiKey,
        endpoint: conf.endpoint,
        model: conf.model
      })

      setEvaluationProgress('提取核心提示词特征，分析在岗执行边界...')
      await new Promise(resolve => setTimeout(resolve, 800))

      const supervisorPrompt = `
        你是个顶级AIGC影视考核评估官。你需要针对AI影视专员"${selectedAgent.name}"（方向:${selectedAgent.role}）的预置指令 Prompt 进行诊断评估。
        Prompt内容: "${selectedAgent.systemPrompt}"
        
        请给出：
        1. 【评估简报】：精炼客观的评析，绝非AI官腔，说明其拟真度、指令对点细节程度，提出提升建议（100字内）。
        2. 【分数修正】：指出最新的技术评级：S+, S, A+, A中哪一个，以及[创意力:XX, 响应速度:XX, 协同性:XX, 契合度:XX] 四个百分制数值。
        3. 【荣誉追授】：一句话虚拟的影视里程贡献记录，如："指导《AI新世界》获得未来科幻影展最佳AI镜头协同贡献奖 - 2026-05"。
      `

      setEvaluationProgress('多维指令抗幻觉及顺从响应压力测试中...')
      const response = await gateway.think(
        "你是个权威的 AIGC 影视测评总监，回答要简练干净，纯文学化无乱序符号。",
        [{ role: 'user', content: supervisorPrompt }]
      )

      // fluctuating performance rating
      const scoreCreativity = Math.min(100, Math.max(75, (selectedAgent.capabilityScores.creativity || 85) + Math.floor(Math.random() * 5) - 2))
      const scoreSpeed = Math.min(100, Math.max(75, (selectedAgent.capabilityScores.speed || 85) + Math.floor(Math.random() * 5) - 2))
      const scoreOrch = Math.min(100, Math.max(75, (selectedAgent.capabilityScores.orchestration || 85) + Math.floor(Math.random() * 5) - 2))
      const scoreFidelity = Math.min(100, Math.max(75, (selectedAgent.capabilityScores.fidelity || 85) + Math.floor(Math.random() * 5) - 2))

      let dynamicGrade = selectedAgent.grade || 'A'
      if (scoreCreativity > 95) dynamicGrade = 'S+'
      else if (scoreCreativity > 91) dynamicGrade = 'S'
      else if (scoreCreativity > 87) dynamicGrade = 'A+'

      const randomHistoryItems = [
        `作为主力AI协办指导完成科幻大片《无声惊雷》高难戏剧对白拟合重写 - 2026-05`,
        `其预设指令在HR考核中心中经极限抗干扰压测，通过度100%并载入核心模组 - 2026-05`,
        `圆满完成首期《AI赛博东京》系列动态景深蒙太奇镜头预设测试 - 2026-05`
      ]
      const chosenHistory = randomHistoryItems[Math.floor(Math.random() * randomHistoryItems.length)]

      const listCopy = loadStoredAgents()
      const updatedList = listCopy.map(a => {
        if (a.id === selectedAgent.id) {
          const hist = [...(a.workHistory || [])]
          if (!hist.includes(chosenHistory)) hist.unshift(chosenHistory)
          return {
            ...a,
            grade: dynamicGrade,
            capabilityScores: {
              creativity: scoreCreativity,
              speed: scoreSpeed,
              orchestration: scoreOrch,
              fidelity: scoreFidelity
            },
            evaluationReport: response,
            previouslyUsed: true
          }
        }
        return a
      })

      updateAgentsList(updatedList)
      setSelectedAgent({
        ...selectedAgent,
        grade: dynamicGrade,
        capabilityScores: {
          creativity: scoreCreativity,
          speed: scoreSpeed,
          orchestration: scoreOrch,
          fidelity: scoreFidelity
        },
        evaluationReport: response,
        workHistory: [chosenHistory, ...(selectedAgent.workHistory || [])],
        previouslyUsed: true
      })

      setEvaluationProgress('技能图谱及报告更新成功！')
    } catch (err) {
      console.error(err)
      setEvaluationProgress('诊断服务器响应慢，评估数据已重载。')
    } finally {
      setIsEvaluating(false)
    }
  }

  // Filtering list
  const filteredAgents = agents.filter(ag => {
    const matchesSearch = ag.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ag.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ag.description.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    if (activeFilter === 'used') return ag.previouslyUsed
    if (activeFilter === 'core') return !ag.id.startsWith('custom-')
    if (activeFilter === 'custom') return ag.id.startsWith('custom-')
    return true
  })

  return (
    <div className={`h-full flex flex-col p-6 min-h-0 ${theme.bgMain} ${theme.textMain} transition-colors duration-200`}>
      
      {/* Dynamic Minimal Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b ${theme.borderColor} pb-5 shrink-0`}>
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${theme.accentBg} animate-pulse`} />
            <h1 id="market-title" className={`text-xl font-display font-medium tracking-tight ${theme.textTitle} flex items-center gap-2.5`}>
              AI 创意专家库 <span className={`text-xs font-normal ${theme.textMuted}`}>Staff Market</span>
            </h1>
          </div>
          <p className={`text-[11.5px] ${theme.textMuted} mt-1 pr-6 leading-relaxed`}>
            极简高质感的可视化影视专家库。每一位创意特员均可在工作台与制作流水线自由编排调度。
          </p>
        </div>

        {/* Filter bar - highly condensed */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap w-full md:w-auto">
          <div className={`flex ${theme.bgInput} border ${theme.borderColor} rounded-xl p-0.5`}>
            {[
              { id: 'all', label: '全部专家' },
              { id: 'used', label: '已上岗' },
              { id: 'core', label: '预置精英' },
              { id: 'custom', label: '自招模组' }
            ].map(tab => (
              <button
                id={`filter-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as 'all' | 'used' | 'core' | 'custom')}
                className={`px-3 py-1 text-[11px] rounded-lg transition-all font-medium ${
                  activeFilter === tab.id 
                    ? `${theme.accentBg} text-white font-semibold shadow-sm` 
                    : `${theme.textMuted} hover:${theme.textMain}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            id="recruit-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1 px-3 py-1.5 ${theme.accentBgMuted} border border-${theme.accentHex}/20 hover:${theme.accentBgHover} hover:text-white ${theme.accentText} rounded-xl text-[11px] font-medium transition-all`}
          >
            <Plus size={13} />
            <span>极速招募自主AI专家</span>
          </button>
        </div>
      </div>

      {/* Grid containing Cards Catalog (Left) and Workspace Details (Right) */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-0">
         
         {/* LEFT COLUMN: Clean Square Cards Catalog (4 cols) */}
         <div className="xl:col-span-4 flex flex-col gap-4 min-h-0">
           
           {/* Minimal Search Field */}
           <div className={`${theme.bgCard} border ${theme.borderColor} p-3.5 rounded-2xl shrink-0 flex items-center justify-between gap-3`}>
             <div className="relative flex-1">
               <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
               <input 
                 id="search-agent-input"
                 type="text" 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 placeholder="键入专家名、描述关键词..." 
                 className={`w-full ${theme.bgInput} border ${theme.borderColor} rounded-xl pl-9 pr-4 py-2 text-xs ${theme.textMain} focus:outline-none focus:ring-1 focus:ring-[${theme.accentHex}] transition-all duration-200 placeholder:text-gray-600`}
               />
             </div>
             {searchTerm && (
               <button onClick={() => setSearchTerm('')} className={`text-xs text-gray-500 hover:${theme.textMain} shrink-0`}>重置</button>
             )}
            </div>

            {/* Catalog grid container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
              
              {/* Recruit worker expandable pane */}
              {showAddForm && (
                <div className={`p-5 ${theme.bgCard} border border-amber-500/20 rounded-2xl mb-4 space-y-4`}>
                  <div className={`flex justify-between items-center pb-2 border-b ${theme.borderColor}`}>
                    <span className={`text-xs font-semibold ${theme.accentText} flex items-center gap-1.5`}>
                      <Sparkles size={13} fill="currentColor" />
                      发掘定制聘雇 AI 影视人才
                    </span>
                    <button onClick={() => setShowAddForm(false)} className={`text-[10px] text-gray-500 hover:${theme.textMain}`}>取消收起</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">工牌名称 / 岗位头衔 *</label>
                        <input 
                          id="new-agent-name"
                          type="text" 
                          value={newAgentName}
                          onChange={e => setNewAgentName(e.target.value)}
                          placeholder="例如: 玄幻氛围摄影指导"
                          className={`w-full ${theme.bgInput} border ${theme.borderColor} rounded-lg px-3 py-2 text-xs ${theme.textMain} placeholder:text-gray-600 focus:outline-none`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">核心派驻部门 *</label>
                        <select
                          id="new-agent-role"
                          value={newAgentRole}
                          onChange={e => setNewAgentRole(e.target.value)}
                          className={`w-full ${theme.bgInput} border ${theme.borderColor} rounded-lg px-3 py-2 text-xs ${theme.textMain} focus:outline-none`}
                        >
                          <option value="director">主创导演设计 / 分镜运动</option>
                          <option value="screenwriter">文学剧本 / 对白雕琢</option>
                          <option value="character_designer">服装特型 / 角色原画艺术</option>
                          <option value="cinematographer">极清摄影 / 空中光影细节</option>
                          <option value="post_production">后期混音 / 帧切合卡拍</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">简短风格定位描述</label>
                        <input 
                          id="new-agent-desc"
                          type="text" 
                          value={newAgentDesc}
                          onChange={e => setNewAgentDesc(e.target.value)}
                          placeholder="例如: 专注于古典阴柔写意风概念渲染"
                          className={`w-full ${theme.bgInput} border ${theme.borderColor} rounded-lg px-3 py-2 text-xs ${theme.textMain} placeholder:text-gray-600 focus:outline-none`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">底层执教系统 Prompt * (最核心设定)</label>
                        <textarea 
                          id="new-agent-prompt"
                          value={newAgentPrompt}
                          onChange={e => setNewAgentPrompt(e.target.value)}
                          placeholder="编写赋予该角色的系统约束设定(System Prompt)..."
                          className={`w-full h-[116px] ${theme.bgInput} border ${theme.borderColor} rounded-lg p-2.5 text-xs ${theme.textMain} placeholder:text-gray-600 focus:outline-none resize-none font-mono`}
                        />
                      </div>

                      <button
                        id="submit-recruit-btn"
                        onClick={handleAddNewAgent}
                        disabled={!newAgentName.trim() || !newAgentPrompt.trim()}
                        className={`w-full py-2 ${theme.accentBg} ${theme.accentBgHover} text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-30 mt-2`}
                      >
                        签订极速聘用条规并入职
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {filteredAgents.length === 0 ? (
                <div className={`text-center py-16 ${theme.textMuted} ${theme.bgCard} border ${theme.borderColor} rounded-3xl`}>
                  <Users size={28} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-xs">未找到匹配筛选的 AI 影视专家</p>
                  <button onClick={() => { setActiveFilter('all'); setSearchTerm(''); }} className={`mt-3 text-xs ${theme.accentText} underline`}>查看全部人员</button>
                </div>
              ) : (
                // Cozy, square-ish visual layouts. One row has multiple cards
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredAgents.map(ag => {
                    const isSelected = selectedAgent?.id === ag.id
                    return (
                      <div
                        id={`agent-card-${ag.id}`}
                        key={ag.id}
                        onClick={() => {
                          setSelectedAgent(ag)
                          setEditingPromptText(ag.systemPrompt || '')
                          setIsEditingPrompt(false)
                          setPromptExpanded(false)
                        }}
                        style={isSelected ? { borderColor: theme.accentHex, boxShadow: `0 0 15px ${theme.accentHex}1a` } : {}}
                        className={`p-5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-[210px] relative overflow-hidden group border ${
                          isSelected 
                            ? `${theme.bgCard} border-2` 
                            : `${theme.bgCard} opacity-85 hover:opacity-100 ${theme.borderColor} hover:bg-black/10`
                        }`}
                      >
                        {/* Top Row: Simple Rating and Summon metrics */}
                        <div className="flex justify-between items-center gap-2 mb-1.5">
                          <div className={`flex items-center gap-1 ${theme.bgInput} border ${theme.borderColor} px-2 py-0.5 rounded-full`}>
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className={`text-[10px] font-bold ${theme.textMain} leading-none`}>
                              {ag.rating || '4.9'}
                            </span>
                          </div>
                          
                          <span className={`text-[9.5px] ${theme.textMuted} font-mono whitespace-nowrap`}>
                            {ag.summonCount || 1000}次召唤
                          </span>
                        </div>

                        {/* Middle: Avatar paired with core titles */}
                        <div className="flex items-center gap-3 my-2">
                          <div className="w-11 h-11 rounded-xl bg-[#191922] flex items-center justify-center shrink-0 border border-[#252532]/40 shadow-inner">
                            {getRoleIcon(ag.role, 20)}
                          </div>
                          <div className="min-w-0">
                            <h3 className={`text-xs font-semibold ${theme.textTitle} tracking-tight truncate leading-tight group-hover:${theme.accentText} transition-colors`}>
                              {ag.name}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {AgentLabels[ag.role as AgentRole] || ag.role}
                            </span>
                          </div>
                        </div>

                        {/* Brief description constraint (highly compact, line-clamp-2) */}
                        <p className={`text-[11px] ${theme.textMuted} leading-relaxed line-clamp-2 mb-3`}>
                          {ag.description}
                        </p>

                        {/* Call-to-action bottom button in card */}
                        <div className={`flex items-center justify-between mt-auto pt-2.5 border-t ${theme.borderColor}`}>
                          <span className={`text-[9.5px] font-mono font-semibold ${theme.accentText} bg-black/10 px-1.5 py-0.5 rounded border border-white/5`}>
                            技术层级: {ag.grade || 'A'}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {ag.id.startsWith('custom-') && (
                              <button
                                id={`delete-agent-${ag.id}`}
                                onClick={(e) => deleteAgentFromMarket(ag.id, e)}
                                className="p-1 px-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="解雇专家"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                            <button title="召唤协作" className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-[#E55A30] text-white shadow-md shadow-[#E55A30]/20' : 'bg-gray-100 text-gray-500 group-hover:bg-[#E55A30] group-hover:text-white'}`}>
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

                {/* RIGHT COLUMN: Interactive High-Fidelity Workspace & Reviews Hub (6 cols) */}
        <div className={`xl:col-span-6 ${theme.bgCard} border ${theme.borderColor} rounded-3xl flex flex-col min-h-0 overflow-hidden`}>
          {selectedAgent ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Workspace Elegant Header Banner */}
              <div className={`p-5 border-b ${theme.borderColorLight} ${theme.bgPanel} flex items-center justify-between gap-4 shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#191922] flex items-center justify-center shrink-0 border border-[#252532]/40 shadow-inner">
                    {getRoleIcon(selectedAgent.role, 18)}
                  </div>
                  <div>
                    <h2 className={`text-xs font-bold ${theme.textTitle} tracking-tight flex items-center gap-1.5`}>
                      {selectedAgent.name}
                    </h2>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {AgentLabels[selectedAgent.role as AgentRole] || selectedAgent.role}
                    </span>
                  </div>
                </div>

                {/* Technical Score Badge */}
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-[#E2AB46]">等级: {selectedAgent.grade || 'A'}</div>
                  <div className="text-[9px] text-[#555] font-mono">{selectedAgent.summonCount || 1000}次综合召唤</div>
                </div>
              </div>

              {/* Branch Tab Selector: WORKSPACE and COMPREHENSIVE EVALUATION */}
              <div className={`px-5 border-b ${theme.borderColorLight} ${theme.bgCard} flex shrink-0`}>
                <button
                  id="tab-btn-workspace"
                  onClick={() => setActiveWorkspaceTab('workspace')}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider relative transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                    activeWorkspaceTab === 'workspace'
                      ? 'border-[#E55A30] text-[#E55A30]'
                      : 'border-transparent text-gray-400 hover:text-gray-800'
                  }`}
                >
                  <Briefcase size={12} />
                  <span>核心工作台</span>
                </button>
                
                <button
                  id="tab-btn-evaluation"
                  onClick={() => setActiveWorkspaceTab('evaluation')}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider relative transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                    activeWorkspaceTab === 'evaluation'
                      ? 'border-[#E55A30] text-[#E55A30]'
                      : 'border-transparent text-gray-400 hover:text-gray-800'
                  }`}
                >
                  <MessageSquare size={12} />
                  <span>主管评价与履历</span>
                </button>
              </div>

              {/* Dynamic Scrolling Body depending on selected branch tab */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                
                {activeWorkspaceTab === 'workspace' ? (
                  // BRANCH TAB 1: WORKSPACE CONSOLE
                  <div className="space-y-5">
                    
                    {/* Collapsible Preset and system Prompts Config area */}
                    <div className={`rounded-2xl ${theme.bgPanel} border ${theme.borderColorLight} overflow-hidden`}>
                      <div 
                        className={`p-3 flex items-center justify-between cursor-pointer ${promptExpanded ? `border-b ${theme.borderColorLight}` : ''}`}
                        onClick={() => setPromptExpanded(!promptExpanded)}
                      >
                        <span className={`text-xs font-bold ${theme.textTitle} tracking-tight flex items-center gap-1.5`}>
                          <Settings size={14} className="text-gray-400" />
                          系统预设提示词
                        </span>
                        <div className="flex items-center gap-2">
                           <button className="text-[10px] text-gray-500 hover:text-gray-800">
                             {promptExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                           </button>
                        </div>
                      </div>

                      {promptExpanded && (
                        <div className="p-4 space-y-4">

                      
                      {/* Subtitle with Multi-Preset Selector Switcher */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1">
                            <Layers size={11} />
                            切换思维配置预设 (SWITCH PRESETS)
                          </span>
                          
                          {/* Interactive Edit Switch Trigger */}
                          {!isEditingPrompt && (
                            <button
                              id="edit-prompt-btn"
                              onClick={() => {
                                setIsEditingPrompt(true)
                                setPromptExpanded(true)
                              }}
                              className="text-[10px] text-[#E2AB46] hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Edit2 size={10} />
                              手动深度重构
                            </button>
                          )}
                        </div>

                        {/* Multiple preset buttons selector */}
                        {PRESET_PROMPTS_BY_ROLE[selectedAgent.role] && (
                          <div className={`grid grid-cols-3 gap-1.5 ${theme.bgInput} p-1 rounded-xl border ${theme.borderColorLight} shadow-sm`}>
                            {PRESET_PROMPTS_BY_ROLE[selectedAgent.role].map((p, pIdx) => (
                              <button
                                key={pIdx}
                                onClick={() => handleSelectPreset(pIdx)}
                                className={`py-1.5 px-1 rounded-lg text-[9.5px] tracking-tight font-medium transition-all truncate ${
                                  selectedPresetIndex === pIdx && !isEditingPrompt
                                    ? 'bg-[#E2AB46] text-black font-semibold'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'
                                }`}
                                title={p.description}
                              >
                                {p.name.split(' ')[0]} {p.name.includes('[') ? p.name.split('[')[1].replace(']', '') : ''}
                              </button>
                            ))}
                            <button
                              id="preset-btn-custom"
                              onClick={() => handleSelectPreset(-1)}
                              className={`py-1.5 px-1 rounded-lg text-[9.5px] font-medium transition-all truncate ${
                                selectedPresetIndex === -1 || isEditingPrompt
                                  ? 'bg-[#E2AB46] text-black font-semibold'
                                  : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'
                              }`}
                            >
                              自定义模式
                            </button>
                          </div>
                        )}
                        
                        {/* Dynamic Preset Descriptor */}
                        {selectedPresetIndex >= 0 && !isEditingPrompt && PRESET_PROMPTS_BY_ROLE[selectedAgent.role]?.[selectedPresetIndex] && (
                          <p className="text-[10px] text-amber-500/80 italic leading-relaxed">
                            💡 {PRESET_PROMPTS_BY_ROLE[selectedAgent.role][selectedPresetIndex].description}
                          </p>
                        )}
                      </div>

                      {/* Truncated / Collapsible core system prompt container */}
                      <div className="border-t border-white/5 pt-3">
                        {isEditingPrompt ? (
                          // Explicit editor state
                          <div className="space-y-3">
                            <textarea
                              id="editing-prompt-textarea"
                              value={editingPromptText}
                              onChange={e => setEditingPromptText(e.target.value)}
                              placeholder="键入自定义行为边界 Prompt 设定指令..."
                              className="w-full h-80 bg-white border text-gray-800 border-gray-200 rounded-xl p-3 text-[11px] leading-relaxed shadow-inner font-mono resize-none focus:outline-none focus:border-[#E2AB46]"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                id="cancel-edit-prompt"
                                onClick={() => {
                                  setIsEditingPrompt(false)
                                  setEditingPromptText(selectedAgent.systemPrompt)
                                }}
                                className="px-2.5 py-1 text-[10px] text-gray-400 hover:text-white"
                              >
                                取消
                              </button>
                              <button
                                id="save-edit-prompt"
                                onClick={handleSaveCustomPrompt}
                                className="px-3 py-1 bg-[#E2AB46] text-black text-[10px] font-bold rounded-lg"
                              >
                                确认应用自定义设定
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Collapsed / Expanded state with faint overlay
                          <div className="relative">
                            <div className={`overflow-hidden transition-all duration-300 text-[11px] leading-relaxed text-gray-400 font-mono ${
                              promptExpanded ? 'max-h-[300px]' : 'max-h-[50px]'
                            }`}>
                              {selectedAgent.systemPrompt}
                              {!promptExpanded && (
                                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0c0c0f] to-transparent pointer-events-none" />
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2.5 pt-1">
                              <button
                                id="toggle-prompt-expand"
                                onClick={() => setPromptExpanded(!promptExpanded)}
                                className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 font-medium"
                              >
                                {promptExpanded ? (
                                  <>
                                    <span>收起设定</span>
                                    <ChevronUp size={12} />
                                  </>
                                ) : (
                                  <>
                                    <span>展开完整设定内容</span>
                                    <ChevronDown size={12} />
                                  </>
                                )}
                              </button>
                              
                              {selectedPresetIndex === -1 && !isEditingPrompt && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded leading-none font-bold">手动修改过</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </div>

                    {/* Highly condensed Sandbox Test zone */}
                    <div className={`p-4 rounded-2xl ${theme.bgPanel} border ${theme.borderColorLight} space-y-4`}>
                      <div className="flex items-center gap-1.5">
                        <TestTube size={13} className="text-[#E2AB46]" />
                        <h3 className={`text-xs font-semibold ${theme.textTitle} tracking-tight uppercase`}>
                          实机测试沙盒 (Sandbox Console)
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <textarea
                          id="sandbox-input-textarea"
                          value={testInput}
                          onChange={e => setTestInput(e.target.value)}
                          placeholder="给专家输入一个测试台词或大纲任务..."
                          className={`w-full h-40 ${theme.bgInput} border ${theme.borderColor} rounded-xl p-2.5 text-xs ${theme.textMain} focus:outline-none focus:border-[#E2AB46] resize-none`}
                        />

                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-mono">
                            * 测试指令将动态累加并反馈
                          </span>
                          
                          <button
                            id="run-sandbox-btn"
                            onClick={handleSandboxRun}
                            disabled={isTesting || !testInput.trim()}
                            className="bg-[#E2AB46] hover:bg-[#ffbe4d] text-black text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-30 transition-all flex items-center gap-1"
                          >
                            {isTesting ? (
                              <>
                                <RefreshCw size={11} className="animate-spin" />
                                <span>大模型反馈中...</span>
                              </>
                            ) : (
                              <span>提交沙盒创作测试</span>
                            )}
                          </button>
                        </div>

                        {/* Return Container */}
                        {testResult ? (
                          <div className={`p-3 ${theme.bgInput} border ${theme.borderColorLight} rounded-xl text-xs max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner`}>
                            <span className="text-[9px] uppercase tracking-wider text-[#E2AB46] font-bold block mb-1">测试结果:</span>
                            <pre className={`text-[11px] ${theme.textMain} whitespace-pre-wrap font-sans leading-relaxed`}>
                              {testResult}
                            </pre>
                          </div>
                        ) : (
                          <div className={`p-3.5 border border-dashed border-gray-200 rounded-xl text-center text-gray-500 text-[11px]`}>
                            暂无沙盒反馈，尝试提交测试台词来实时监控并考核员工的执教水平。
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  // BRANCH TAB 2: REVIEW SYSTEM & RESUME
                  <div className="space-y-5">
                    
                    {/* E-commerce Review Style: Capabilities Ratings bars */}
                    <div className="p-4 `${theme.bgPanel} border ${theme.borderColor}` rounded-2xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
                      
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-3 flex items-center gap-1">
                        <Star size={11} className="text-[#E2AB46] fill-[#E2AB46]" />
                        多维创意执行雷达评价 (CAPABILITY METRICS)
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: '艺术创意力', value: selectedAgent.capabilityScores.creativity || 85, color: 'bg-indigo-500' },
                          { label: '神经网络响应速度', value: selectedAgent.capabilityScores.speed || 85, color: 'bg-emerald-500' },
                          { label: '工程流程协同力', value: selectedAgent.capabilityScores.orchestration || 85, color: 'bg-amber-500' },
                          { label: '提示契合保真度', value: selectedAgent.capabilityScores.fidelity || 85, color: 'bg-rose-500' }
                        ].map((s, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[10.5px]">
                              <span className="text-gray-400">{s.label}</span>
                              <span className="font-mono text-white font-bold">{s.value}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#15151b] rounded-full overflow-hidden">
                              <div className={`h-full ${s.color}`} style={{ width: `${s.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Advisor Memo Appraisal Block */}
                    <div className="p-4 `${theme.bgPanel} border ${theme.borderColor}` rounded-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 flex items-center gap-1.5">
                          <Trophy size={11} className="text-[#E2AB46]" />
                          主管资质诊断报告 (OFFICIAL CHIEF APPRAISAL)
                        </span>
                        
                        <button
                          id="re-evaluate-btn"
                          onClick={handleOnTheFlyAppraisal}
                          disabled={isEvaluating}
                          className="text-[10px] text-[#E2AB46] hover:underline flex items-center gap-1 font-semibold disabled:opacity-45"
                        >
                          {isEvaluating ? (
                            <>
                              <RefreshCw size={9} className="animate-spin" />
                              正在连线总监...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={10} />
                              <span>发起重新评估</span>
                            </>
                          )}
                        </button>
                      </div>

                      {evaluationProgress && (
                        <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center">
                          <p className="text-[10px] text-[#E2AB46] font-mono animate-pulse flex items-center justify-center gap-1">
                            <Activity size={10} />
                            {evaluationProgress}
                          </p>
                        </div>
                      )}

                      {selectedAgent.evaluationReport ? (
                        <div className="p-3.5 `${theme.bgInput} border ${theme.borderColor}` rounded-xl text-[11px] leading-relaxed text-gray-300">
                          <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                            {selectedAgent.evaluationReport}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-600 text-xs">
                          <HelpCircle size={22} className="mx-auto text-gray-700 stroke-1 mb-1.5" />
                          该职员尚未经历AI影视总监的深度评估。
                          <button onClick={handleOnTheFlyAppraisal} className="block mx-auto mt-2 text-[10px] text-[#E2AB46] underline">点击启动实机测评分析</button>
                        </div>
                      )}
                    </div>

                    {/* Timeline History of past production logs */}
                    <div className="p-4 `${theme.bgPanel} border ${theme.borderColor}` rounded-2xl space-y-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 flex items-center gap-1.5 mb-2">
                        <Clock size={11} className="text-gray-400" />
                        历史项目服役与实机履历 (RESUME HISTORY LOG)
                      </span>

                      {(!selectedAgent.workHistory || selectedAgent.workHistory.length === 0) ? (
                        <div className="text-[11px] text-gray-600 italic">
                          暂无该专家历史项目记录，可在工作台执行首轮剧本生产任务。
                        </div>
                      ) : (
                        <div className="border-l border-gray-200 ml-1.5 pl-3 space-y-3 text-[11px]">
                          {selectedAgent.workHistory.map((history, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[16.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#E2AB46]" />
                              <div className="p-2.5 `${theme.bgCard} border ${theme.borderColorLight}` rounded-xl `${theme.textMain} leading-relaxed font-sans`">
                                {history}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#555] flex-col gap-3 py-20 `${theme.bgCard}`">
              <Users size={32} strokeWidth={1} />
              <p className="text-xs">请在左侧人才库选择一位 AI 影视专家查看工作台</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
