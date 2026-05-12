import { useState, useEffect } from 'react'
import { ProductionPage } from './ui/pages/ProductionPage'
import { AgentConsole } from './ui/pages/AgentConsole'
import { useProductionStore } from './state/store'
import { Home, Folder, Layers, Users, Image as ImageIcon, Clock, Settings, Search, Plus, Play, ChevronDown, Bell, HelpCircle, User } from 'lucide-react'

import { AgentMarket } from './ui/pages/AgentMarket'

type Tab = 'home' | 'projects' | 'production' | 'market' | 'assets' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('production')
  const [dark] = useState(true) // Enforce dark mode for technical tool aesthetic
  const isRunning = useProductionStore((s) => s.isRunning)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('dark', 'light')
    document.documentElement.classList.toggle('light', !dark)
    document.documentElement.style.colorScheme = 'dark'
  }, [dark])

  return (
    <div className="flex h-screen w-full bg-[#0E0E11] text-[#e5e5e5] font-sans overflow-hidden">
      {/* Sidebar Rail */}
      <aside className="w-20 border-r border-[#1C1C21] bg-[#121214] flex flex-col items-center py-6 justify-between z-20">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CD9D36] to-[#E2AB46] flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(205,157,54,0.3)]">
             <Layers size={20} className="text-[#121214]" />
          </div>

          <button
            onClick={() => setTab('home')}
            className={`flex flex-col items-center gap-1.5 w-full transition-all ${
              tab === 'home'
                ? 'text-[#E2AB46]'
                : 'text-[#66666e] hover:text-[#e5e5e5]'
            }`}
          >
            <Home size={22} strokeWidth={1.5} />
            <span className="text-[10px]">首页</span>
          </button>

          <button
            onClick={() => setTab('projects')}
            className={`flex flex-col items-center gap-1.5 w-full transition-all ${
              tab === 'projects'
                ? 'text-[#E2AB46]'
                : 'text-[#66666e] hover:text-[#e5e5e5]'
            }`}
          >
            <Folder size={22} strokeWidth={1.5} />
            <span className="text-[10px]">项目</span>
          </button>

          <button
            onClick={() => setTab('production')}
            className={`flex flex-col items-center justify-center gap-1.5 w-full py-2 transition-all ${
              tab === 'production'
                ? 'text-[#E2AB46] relative'
                : 'text-[#66666e] hover:text-[#e5e5e5]'
            }`}
          >
            {tab === 'production' && <div className="absolute left-0 w-1 h-8 bg-[#E2AB46] rounded-r-full" />}
            <Layers size={22} strokeWidth={1.5} />
            <span className="text-[10px]">工作流</span>
          </button>

          <button
            onClick={() => setTab('market')}
            className={`flex flex-col items-center gap-1.5 w-full transition-all ${
              tab === 'market'
                ? 'text-[#E2AB46]'
                : 'text-[#66666e] hover:text-[#e5e5e5]'
            }`}
          >
            <Users size={22} strokeWidth={1.5} />
            <span className="text-[10px]">Agent库</span>
          </button>

          <button
            onClick={() => setTab('assets')}
            className={`flex flex-col items-center gap-1.5 w-full transition-all ${
              tab === 'assets'
                ? 'text-[#E2AB46]'
                : 'text-[#66666e] hover:text-[#e5e5e5]'
            }`}
          >
            <ImageIcon size={22} strokeWidth={1.5} />
            <span className="text-[10px]">资产库</span>
          </button>

          <button
            onClick={() => setTab('history')}
            className={`flex flex-col items-center gap-1.5 w-full transition-all ${
              tab === 'history'
                ? 'text-[#E2AB46]'
                : 'text-[#66666e] hover:text-[#e5e5e5]'
            }`}
          >
            <Clock size={22} strokeWidth={1.5} />
            <span className="text-[10px]">历史</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1.5 text-[#66666e] hover:text-[#e5e5e5] transition-colors w-full"
          >
            <Settings size={22} strokeWidth={1.5} />
            <span className="text-[10px]">设置</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0E0E11] relative">
        {/* Header Ribbon */}
        <header className="h-16 border-b border-[#1C1C21] flex items-center px-6 justify-between shrink-0 bg-[#0E0E11] z-10 w-full relative">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <h1 className="font-display font-semibold tracking-wide text-[16px] text-[#e5e5e5]">
                  FilmAI Studio
                </h1>
             </div>
             
             <div className="flex items-center gap-2 text-[13px] text-[#66666e]">
                <span>项目</span>
                <span>/</span>
                <span>《未来之战》</span>
                <span>/</span>
                <span className="text-[#e5e5e5]">电影创作流程_v3</span>
             </div>
          </div>

          <div className="flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
               <input 
                 type="text" 
                 placeholder="搜索节点、Agent、素材、工作流..." 
                 className="w-full bg-[#1A1A1F] border border-[#2A2A35] rounded-full pl-9 pr-10 py-1.5 text-[13px] text-[#eee] focus:outline-none focus:border-[#E2AB46] transition-colors"
               />
               <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[#444] text-[10px] bg-[#222] px-1.5 py-0.5 rounded">
                 <span className="font-sans">⌘</span>
                 <span className="font-sans">K</span>
               </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm">
                <button className="flex items-center gap-1.5 px-4 py-1.5 bg-transparent border border-[#2A2A35] hover:bg-[#1A1A1F] text-[#e5e5e5] rounded-md transition-colors">
                  <Plus size={14} />
                  新建流程
                </button>
                <button className="flex items-center gap-1.5 px-5 py-1.5 bg-[#BFA162] hover:bg-[#D5B064] text-[#121214] font-medium rounded-md transition-colors">
                  <Play size={14} fill="currentColor" />
                  运行
                </button>
                <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1A1A1F] border border-[#2A2A35] hover:bg-[#22222A] text-[#e5e5e5] rounded-md transition-colors">
                  发布
                  <ChevronDown size={14} />
                </button>
             </div>
             
             <div className="w-[1px] h-4 bg-[#2A2A35] mx-2"></div>
             
             <div className="flex items-center gap-3 text-[#888]">
                <div className="relative cursor-pointer hover:text-[#e5e5e5] transition-colors">
                  <Bell size={18} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E2AB46] rounded-full text-[#121214] text-[8px] flex items-center justify-center font-bold">8</span>
                </div>
                <HelpCircle size={18} className="cursor-pointer hover:text-[#e5e5e5] transition-colors" />
                <div className="flex items-center gap-2 cursor-pointer hover:text-[#e5e5e5] transition-colors pl-2">
                  <div className="w-6 h-6 rounded-full bg-[#2A2A35] flex items-center justify-center flex-shrink-0">
                    <User size={14} />
                  </div>
                  <span className="text-[13px]">张导演</span>
                  <ChevronDown size={14} />
                </div>
             </div>
          </div>
        </header>

        {/* Page Routing */}
        <div className="flex-1 overflow-hidden relative">
          {tab === 'production' && <ProductionPage showSettings={showSettings} setShowSettings={setShowSettings} />}
          {tab === 'market' && <AgentMarket />}
          {tab === 'home' && (
            <div className="flex w-full h-full items-center justify-center text-[#666] flex-col gap-3">
              <Home size={48} strokeWidth={1} opacity={0.3} />
              <p className="text-sm">首页功能即将开启 (WIP)</p>
            </div>
          )}
          {tab === 'projects' && (
            <div className="flex w-full h-full items-center justify-center text-[#666] flex-col gap-3">
              <Folder size={48} strokeWidth={1} opacity={0.3} />
              <p className="text-sm">项目管理功能即将开启 (WIP)</p>
            </div>
          )}
          {tab === 'assets' && (
            <div className="flex w-full h-full items-center justify-center text-[#666] flex-col gap-3">
              <ImageIcon size={48} strokeWidth={1} opacity={0.3} />
              <p className="text-sm">资产收纳与管理即将开启 (WIP)</p>
            </div>
          )}
          {tab === 'history' && (
             <div className="flex w-full h-full items-center justify-center text-[#666] flex-col gap-3">
              <Clock size={48} strokeWidth={1} opacity={0.3} />
              <p className="text-sm">历史记录功能即将开启 (WIP)</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App


