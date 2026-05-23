import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  onSave?: () => void
}

export function SettingsModal({ show, onClose, onSave }: SettingsModalProps) {
  const [model, setModel] = useState('gemini-2.0-flash (Studio Free)')
  const [endpoint, setEndpoint] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (show) {
      try {
        const data = localStorage.getItem('ai-drama-studio-config') || localStorage.getItem('filmai-config')
        if (data) {
          const parsed = JSON.parse(data)
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (parsed.model) setModel(parsed.model)
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (parsed.endpoint) setEndpoint(parsed.endpoint)
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (parsed.apiKey) setApiKey(parsed.apiKey)
        }
      } catch {
        // ignore
      }
    }
  }, [show])

  const handleSave = () => {
    try {
      localStorage.setItem('ai-drama-studio-config', JSON.stringify({ model, endpoint, apiKey }))
      localStorage.setItem('ai-drama-studio-selected-model', model)
      localStorage.setItem('filmai-config', JSON.stringify({ model, endpoint, apiKey }))
      window.dispatchEvent(new Event('filmai-config-updated'))
    } catch {
      // ignore
    }
    if (onSave) onSave()
    onClose()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#00000088] backdrop-blur text-[#e5e5e5] flex items-center justify-center z-[100]">
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.15 }} className="bg-[#0c0c0e] border border-[#2a2a2a] p-6 w-full max-w-md mx-4 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-semibold tracking-wide">模型设置参数</h2>
              <button onClick={onClose} className="text-[#666666] hover:text-[#e5e5e5] transition-colors p-1"><X size={18} /></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-2 font-medium">配置模型 / Base Model</label>
                <div className="flex gap-2">
                  <select 
                    value={model.includes('gemini') ? model : 'gemini-2.0-flash (Studio Free)'} 
                    onChange={(e) => {
                      setModel(e.target.value)
                      setEndpoint('')
                      setApiKey(import.meta.env.VITE_GEMINI_API_KEY || '')
                    }} 
                    className="flex-1 bg-[#141414] rounded-lg border border-[#2a2a2a] px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6321] transition-colors appearance-none"
                  >
                    <option value="gemini-2.0-flash (Studio Free)">Gemini 2.0 Flash (免费内置)</option>
                    <option value="gemini-1.5-pro (Studio Free)">Gemini 1.5 Pro (免费内置)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#141414] rounded-xl border border-[#2a2a2a]/40 text-xs text-gray-400 leading-relaxed space-y-2">
                <span className="text-[#E2AB46] font-semibold block">联调进行中 • 免费试用</span>
                <p>当前系统正处于高低能效协同测试阶段。为保障流畅的交互体验与流程跑通：</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#888]">
                  <li>外部模型连接选项（ChatGPT / Claude / DeepSeek）已暂时挂起</li>
                  <li>系统自动托管置顶了 <b>Google Studio 免费层级 Gemini 极速模型</b></li>
                  <li>由于所有请求自主通过共享免费试用额度，无需您配置中转地址及个人 API Key</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-8 gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-sm text-[#888] hover:text-[#ccc] transition-colors font-medium">取消</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm bg-[#FF6321] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium">保存设置</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
