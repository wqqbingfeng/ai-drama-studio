import { useState, useEffect, useRef } from 'react'
import { ProductionPage } from './ui/pages/ProductionPage'
import { 
  Home, Folder, Layers, Users, Image as ImageIcon, Clock, Settings, 
  Bell, Palette, Check 
} from 'lucide-react'

import { SettingsModal } from './ui/components/SettingsModal'
import { AgentMarket } from './ui/pages/AgentMarket'
import { HomePage } from './ui/pages/HomePage'
import { useGlobalTheme } from './utils/theme'

type Tab = 'home' | 'projects' | 'production' | 'market' | 'assets' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [showSettings, setShowSettings] = useState(false)
  const { theme, switchTheme, presets } = useGlobalTheme()
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const themeSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Sync document element attributes with the initial theme
    if (theme.isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
  }, [theme])

  // Close theme selector clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target as Node)) {
        setShowThemeSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`flex h-screen w-full ${theme.bgMain} ${theme.textMain} font-sans overflow-hidden transition-colors duration-200`}>
      {/* Sidebar Rail */}
      <aside className="flex flex-col justify-center flex-shrink-0 z-20 bg-transparent py-4 pl-4 pr-2 h-full">
        <div className={`w-[56px] py-4 rounded-full ${theme.bgSidebar} shadow-sm border ${theme.borderColorLight} flex flex-col items-center gap-4 transition-colors duration-200`}>
          <button onClick={() => setTab('home')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tab === 'home' ? (theme.isDark ? 'bg-zinc-805 text-white shadow-md bg-white/10' : 'bg-gray-100 text-black shadow-sm') : (theme.isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} flex-shrink-0`}>
            <Home size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('projects')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tab === 'projects' ? (theme.isDark ? 'bg-zinc-805 text-white shadow-md bg-white/10' : 'bg-gray-100 text-black shadow-sm') : (theme.isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} flex-shrink-0`}>
            <Folder size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('production')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tab === 'production' ? (theme.isDark ? 'bg-zinc-805 text-white shadow-md bg-white/10' : 'bg-gray-100 text-black shadow-sm') : (theme.isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} flex-shrink-0`}>
             <Layers size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('market')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tab === 'market' ? (theme.isDark ? 'bg-zinc-805 text-white shadow-md bg-white/10' : 'bg-gray-100 text-black shadow-sm') : (theme.isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} flex-shrink-0`}>
            <Users size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('assets')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tab === 'assets' ? (theme.isDark ? 'bg-zinc-805 text-white shadow-md bg-white/10' : 'bg-gray-100 text-black shadow-sm') : (theme.isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} flex-shrink-0`}>
            <ImageIcon size={18} strokeWidth={2} />
          </button>
          <div className={`w-6 border-t ${theme.isDark ? 'border-white/5' : 'border-gray-100'} flex-shrink-0`}></div>
          <button onClick={() => setTab('history')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tab === 'history' ? (theme.isDark ? 'bg-zinc-805 text-white shadow-md bg-white/10' : 'bg-gray-100 text-black shadow-sm') : (theme.isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} flex-shrink-0`}>
            <Clock size={18} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        {/* Header Ribbon */}
        <header className="px-6 mt-6 mb-2 flex items-center justify-between shrink-0 z-10 w-full relative transition-colors duration-200">
          
          {/* Left Logo */}
          <div className="flex items-center gap-3 bg-transparent md:w-64 min-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E55A30] shadow-sm"></div>
              <div className={`w-1.5 h-1.5 rounded-full ${theme.isDark ? 'bg-white/80' : 'bg-black/80'}`}></div>
            </div>
            <h1 className={`font-display font-bold tracking-tight text-[18px] ${theme.textTitle}`}>
              MZOO STUDIO
            </h1>
          </div>

          {/* Center Tabs & Search */}
          <div className="flex flex-1 justify-center max-w-2xl px-4">
             <div className={`flex ${theme.bgSidebar} shadow-sm px-1.5 py-1.5 rounded-full items-center gap-1 border ${theme.borderColorLight}`}>
                <button className={`px-5 py-2 text-[14px] font-medium rounded-full transition-all ${tab === 'production' ? (theme.isDark ? 'bg-white/10 text-white shadow' : 'bg-black text-white shadow-md') : (theme.isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-gray-50')}`} onClick={() => setTab('production')}>工作台</button>
                <button className={`px-5 py-2 text-[14px] font-medium rounded-full transition-all flex items-center gap-1.5 ${tab === 'market' ? (theme.isDark ? 'bg-white/10 text-white shadow' : 'bg-black text-white shadow-md') : (theme.isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-gray-50')}`} onClick={() => setTab('market')}><Users size={15}/> 节点库</button>
                <button className={`px-5 py-2 flex items-center gap-1.5 text-[14px] font-medium rounded-full transition-all ${theme.isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`} onClick={() => setShowSettings(true)}>
                   <Settings size={15} /> 设置
                </button>
             </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 md:w-64 min-w-[200px]">
             <button className={`w-11 h-11 rounded-full ${theme.bgSidebar} shadow-sm flex items-center justify-center border ${theme.borderColorLight} transition-colors ${theme.isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900'}`}>
                <Bell size={20} />
             </button>
             
             {/* Theme Selector */}
             <div className="relative" ref={themeSelectorRef}>
                 <button 
                   onClick={() => setShowThemeSelector(!showThemeSelector)}
                   className={`w-11 h-11 rounded-full ${theme.bgSidebar} shadow-sm flex items-center justify-center border ${theme.borderColorLight} transition-colors ${theme.isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                   <Palette size={20} />
                 </button>
                 {showThemeSelector && (
                    <div className={`absolute right-0 top-14 w-64 rounded-2xl shadow-xl ${theme.bgSidebar} border ${theme.borderColorLight} p-2 z-50 text-left animate-in fade-in duration-100`}>
                      <div className={`px-3 py-2 border-b ${theme.borderColorLight} mb-2`}>
                        <span className={`text-[12px] font-medium ${theme.textTitle}`}>外观主题</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {presets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              switchTheme(preset.id)
                              setShowThemeSelector(false)
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${preset.id === theme.id ? (theme.isDark ? 'bg-white/10 text-white font-medium' : 'bg-black/5 text-black font-medium') : (theme.isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50')}`}
                          >
                            <span className="text-lg leading-none">{preset.icon}</span>
                            <span className="text-[13px]">{preset.name}</span>
                            {preset.id === theme.id && <Check size={14} className="ml-auto opacity-60" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
             </div>
             <div className={`h-11 px-1.5 py-1.5 rounded-full ${theme.bgSidebar} shadow-sm flex items-center border ${theme.borderColorLight} cursor-pointer transition-colors ml-1 ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-full bg-[#E55A30]/20 flex items-center justify-center overflow-hidden">
                   <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Uzui" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
             </div>
          </div>
        </header>

        {/* Page Routing */}
        <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
        <div className="flex-1 overflow-hidden relative">
          {tab === 'production' && <ProductionPage />}
          {tab === 'market' && <AgentMarket />}
          {tab === 'home' && <HomePage setTab={setTab} />}
          {tab === 'projects' && (
            <div className="flex w-full h-full items-center justify-center text-gray-500 flex-col gap-3">
              <Folder size={48} strokeWidth={1} opacity={0.3} />
              <p className="text-sm">项目管理功能即将开启 (WIP)</p>
            </div>
          )}
          {tab === 'assets' && (
            <div className="flex w-full h-full items-center justify-center text-gray-500 flex-col gap-3">
              <ImageIcon size={48} strokeWidth={1} opacity={0.3} />
              <p className="text-sm">资产收纳与管理即将开启 (WIP)</p>
            </div>
          )}
          {tab === 'history' && (
             <div className="flex w-full h-full items-center justify-center text-gray-500 flex-col gap-3">
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


