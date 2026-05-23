const fs = require('fs')

let app = fs.readFileSync('src/App.tsx', 'utf-8')

app = app.replace(
  /<aside className="flex flex-col justify-center flex-shrink-0 z-20 bg-transparent py-4 pl-4 pr-2 h-full">[\s\S]*?<\/aside>/,
  `<aside className="flex flex-col justify-center flex-shrink-0 z-20 bg-transparent py-4 pl-4 pr-2 h-full">
        <div className={\`w-[56px] py-4 rounded-full bg-white shadow-sm border border-gray-200 flex flex-col items-center gap-4 transition-colors duration-200\`}>
          <button onClick={() => setTab('home')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'home' ? 'bg-gray-100 text-black shadow-sm flex-shrink-0' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0'}\`}>
            <Home size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('projects')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'projects' ? 'bg-gray-100 text-black shadow-sm flex-shrink-0' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0'}\`}>
            <Folder size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('production')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'production' ? 'bg-gray-100 text-black shadow-sm flex-shrink-0' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0'}\`}>
             <Layers size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('market')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'market' ? 'bg-gray-100 text-black shadow-sm flex-shrink-0' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0'}\`}>
            <Users size={18} strokeWidth={2} />
          </button>
          <button onClick={() => setTab('assets')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'assets' ? 'bg-gray-100 text-black shadow-sm flex-shrink-0' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0'}\`}>
            <ImageIcon size={18} strokeWidth={2} />
          </button>
          <div className="w-6 border-t border-gray-100 flex-shrink-0"></div>
          <button onClick={() => setTab('history')} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all \${tab === 'history' ? 'bg-gray-100 text-black shadow-sm flex-shrink-0' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0'}\`}>
            <Clock size={18} strokeWidth={2} />
          </button>
        </div>
      </aside>`
)
fs.writeFileSync('src/App.tsx', app)
