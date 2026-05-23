const fs = require('fs')

// 1. Rewrite App.tsx sidebar
let app = fs.readFileSync('src/App.tsx', 'utf-8')

app = app.replace(
  /<div className=\{\`w-\[64px\] py-6 rounded-full \$\{theme\.bgSidebar\} shadow-sm border \$\{theme\.borderColorLight\} flex flex-col items-center gap-6 transition-colors duration-200\`\}>[\s\S]*?<\/div>/,
  `<div className={\`w-[56px] py-4 rounded-full bg-white shadow-sm border border-gray-200 flex flex-col items-center gap-4 transition-colors duration-200\`}>
          <button onClick={() => setTab('home')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'home' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}\`}>
            <Home size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('projects')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'projects' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}\`}>
            <Folder size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('production')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'production' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}\`}>
             <Layers size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('market')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'market' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}\`}>
            <Users size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('assets')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'assets' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}\`}>
            <ImageIcon size={18} strokeWidth={2} />
          </button>
          <div className="w-6 border-t border-gray-100 my-0.5"></div>
          <button onClick={() => setTab('history')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'history' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}\`}>
            <Clock size={18} strokeWidth={2} />
          </button>
        </div>`
)
fs.writeFileSync('src/App.tsx', app)

// 2. Rewrite AgentMarket.tsx
let market = fs.readFileSync('src/ui/pages/AgentMarket.tsx', 'utf-8')

// Grid cols for left column:
market = market.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">/,
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'
)

// Agent card details
market = market.replace(
  /<div className=\{\`w-11 h-11 rounded-full bg-gradient-to-tr \$\{ag\.avatarColor \|\| 'from-\[\#4F46E5\] to-\[\#06B6D4\]'\} flex items-center justify-center text-xl shadow-inner border border-white\/10 shrink-0\`\}>\n\s*\{ag\.avatarChar \|\| '👤'\}\n\s*<\/div>/g,
  `<div className="w-11 h-11 rounded-full border border-gray-200 bg-white shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
  </div>`
)

market = market.replace(
  /<span className=\{\`text-\[9px\] \$\{theme\.textMuted\} uppercase mt-0\.5 block font-semibold truncate tracking-wider\`\}>\n\s*\{ag\.role === 'screenwriter' \? '编剧戏剧部' : ag\.role === 'director' \? '主创导演部' : ag\.role === 'character_designer' \? '服装角色部' : ag\.role === 'cinematographer' \? '高精摄影部' : '后期混音剪辑'\}\n\s*<\/span>/,
  ""
)

market = market.replace(
  /<span className=\{\`text-\[11px\] font-semibold transition-all px-3 py-1 rounded-lg \$\{\n\s*isSelected\n\s*\? \`\$\{theme\.accentBg\} text-white font-semibold\`\n\s*: \`\$\{theme\.bgInput\} \$\{theme\.textMain\} group-hover:\$\{theme\.accentBg\} group-hover:text-white\`\n\s*\}\`\}>\n\s*召唤协作\n\s*<\/span>/,
  `<button title="召唤协作" className={\`w-8 h-8 rounded-full flex items-center justify-center transition-all \${isSelected ? 'bg-[#E55A30] text-white shadow-md shadow-[#E55A30]/20' : 'bg-gray-100 text-gray-500 group-hover:bg-[#E55A30] group-hover:text-white'}\`}>
    <Plus size={16} />
  </button>`
)

// Remove "履历: 暂无..." (actually not clearly found in the component, maybe we should just search right column)
// Replace the avatar in the Right Column
market = market.replace(
  /<div className=\{\`w-10 h-10 rounded-full bg-gradient-to-tr \$\{selectedAgent\.avatarColor\} flex items-center justify-center text-xl shadow-lg shrink-0\`\}>\n\s*\{selectedAgent\.avatarChar\}\n\s*<\/div>/,
  `<div className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
  </div>`
)
market = market.replace(
  /<span className="text-\[9\.5px\] font-mono text-gray-500 uppercase font-semibold leading-none">\n\s*\{selectedAgent\.role === 'screenwriter' \? 'DRA-WRITER' : 'FILM-COORDINATOR'\}\n\s*<\/span>/,
  ""
)


// Right Column styling
market = market.replace(
  /className="xl:col-span-5 bg-\[\#09090b\] border border-\[\#16161a\] rounded-3xl flex flex-col min-h-0 overflow-hidden"/,
  'className={`xl:col-span-5 ${theme.bgCard} border ${theme.borderColor} rounded-3xl flex flex-col min-h-0 overflow-hidden`}'
)
market = market.replace(
  /className="p-5 border-b border-\[\#141416\] bg-\[\#0c0c0f\] flex items-center justify-between gap-4 shrink-0"/,
  'className={`p-5 border-b ${theme.borderColorLight} ${theme.bgPanel} flex items-center justify-between gap-4 shrink-0`}'
)
market = market.replace(
  /className="text-xs font-bold text-white tracking-tight flex items-center gap-1\.5"/,
  'className={`text-xs font-bold ${theme.textTitle} tracking-tight flex items-center gap-1.5`}'
)
market = market.replace(
  /className="px-5 border-b border-\[\#141416\] bg-\[\#09090b\] flex shrink-0"/,
  'className={`px-5 border-b ${theme.borderColorLight} ${theme.bgCard} flex shrink-0`}'
)
// Tabs in Right Column
market = market.replace(
  /border-transparent text-\[\#6e6e74\] hover:text-white/g,
  'border-transparent text-gray-400 hover:text-gray-800'
)

// The workspace box
market = market.replace(
  /className="p-4 rounded-2xl bg-\[\#0c0c0f\] border border-\[\#16161a\] space-y-4"/g,
  'className={`p-4 rounded-2xl ${theme.bgPanel} border ${theme.borderColorLight} space-y-4`}'
)

market = market.replace(
  /className="grid grid-cols-3 gap-1\.5 bg-\[\#121216\] p-1 rounded-xl border border-white\/5"/,
  'className={`grid grid-cols-3 gap-1.5 ${theme.bgInput} p-1 rounded-xl border ${theme.borderColorLight} shadow-sm`}'
)
market = market.replace(
  /text-gray-400 hover:text-white hover:bg-white\/5/g,
  'text-gray-500 hover:text-gray-800 hover:bg-black/5'
)

// textarea for editing prompt
market = market.replace(
  /bg-\[\#121216\] border border-\[\#2e2e38\] rounded-xl p-3 text-\[11px\] leading-relaxed text-\[\#eee\]/g,
  'bg-white border text-gray-800 border-gray-200 rounded-xl p-3 text-[11px] leading-relaxed shadow-inner'
)
// height of edit
market = market.replace(/h-32/, 'h-80')
// textarea for sandbox
market = market.replace(/h-16/, 'h-40')


// sandbox result area
market = market.replace(
  /className="p-3 bg-\[\#070709\] border border-\[\#1a1a20\] rounded-xl text-xs max-h-\[160px\] overflow-y-auto custom-scrollbar"/,
  'className={`p-3 ${theme.bgInput} border ${theme.borderColorLight} rounded-xl text-xs max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner`}'
)
market = market.replace(
  /className="text-\[11px\] text-gray-300 whitespace-pre-wrap font-sans leading-relaxed"/,
  'className={`text-[11px] ${theme.textMain} whitespace-pre-wrap font-sans leading-relaxed`}'
)
market = market.replace(
  /className="p-3\.5 border border-dashed border-\[\#1a1a22\] rounded-xl text-center text-gray-600 text-\[11px\]"/,
  'className={`p-3.5 border border-dashed border-gray-200 rounded-xl text-center text-gray-500 text-[11px]`}'
)

fs.writeFileSync('src/ui/pages/AgentMarket.tsx', market)
