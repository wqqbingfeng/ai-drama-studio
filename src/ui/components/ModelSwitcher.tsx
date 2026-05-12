import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Gauge, Check } from 'lucide-react'

interface ModelEntry {
  name: string
  speed?: number // ms
  error?: string
}

const PRESET_MODELS: string[] = [
  'gpt-5.5',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'claude-sonnet-4-20250514',
  'gpt-4o',
  'deepseek-v3',
  'qwen-max',
]

const SPEED_STORAGE_KEY = 'ai-drama-studio-models'
const SELECTED_KEY = 'ai-drama-studio-selected-model'

function loadModels(): ModelEntry[] {
  try {
    const raw = localStorage.getItem(SPEED_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return PRESET_MODELS.map((name) => ({ name }))
}

function saveModels(models: ModelEntry[]) {
  localStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify(models))
}

function loadSelected(): string {
  return localStorage.getItem(SELECTED_KEY) || 'gpt-5.5'
}

function saveSelected(model: string) {
  localStorage.setItem(SELECTED_KEY, model)
}

function speedColor(ms: number | undefined): string {
  if (ms === undefined) return 'text-text-muted'
  if (ms < 1500) return 'text-[oklch(0.55_0.15_160)]'
  if (ms < 4000) return 'text-[oklch(0.65_0.15_80)]'
  return 'text-[oklch(0.55_0.2_30)]'
}

function speedBarColor(ms: number | undefined): string {
  if (ms === undefined) return 'bg-border'
  if (ms < 1500) return 'bg-[oklch(0.55_0.15_160)]'
  if (ms < 4000) return 'bg-[oklch(0.65_0.15_80)]'
  return 'bg-[oklch(0.55_0.2_30)]'
}

function speedLabel(ms: number | undefined): string {
  if (ms === undefined) return '未测'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

interface ModelSwitcherProps {
  endpoint: string
  apiKey: string
  currentModel: string
  onSelectModel: (model: string) => void
}

export function ModelSwitcher({ endpoint, apiKey, currentModel, onSelectModel }: ModelSwitcherProps) {
  const [models, setModels] = useState<ModelEntry[]>(() => {
    const saved = loadModels()
    const savedNames = new Set(saved.map((m) => m.name))
    // 合并预设模型（不覆盖已有速度数据）
    const merged = [...saved]
    for (const preset of PRESET_MODELS) {
      if (!savedNames.has(preset)) {
        merged.push({ name: preset })
      }
    }
    return merged
  })
  const [newModelName, setNewModelName] = useState('')
  const [testing, setTesting] = useState(false)
  const [testProgress, setTestProgress] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 持久化
  useEffect(() => {
    saveModels(models)
  }, [models])

  const handleSelect = (name: string) => {
    saveSelected(name)
    onSelectModel(name)
  }

  const handleDelete = (name: string) => {
    setModels((prev) => prev.filter((m) => m.name !== name))
    // 如果删除的是当前选中的，回退到第一个
    if (currentModel === name && models.length > 1) {
      const next = models.find((m) => m.name !== name)?.name
      if (next) handleSelect(next)
    }
  }

  const handleAdd = () => {
    const name = newModelName.trim()
    if (!name) return
    if (models.some((m) => m.name === name)) {
      setNewModelName('')
      return
    }
    setModels((prev) => [...prev, { name }])
    setNewModelName('')
  }

  const normalizeEndpoint = (url: string): string => {
    // 代理路径不自动补全
    if (url.startsWith('/api/') || url.includes(':5174')) {
      return url
    }
    if (!url.includes('/v1/') && !url.endsWith('/chat/completions')) {
      if (url.endsWith('/')) url = url.slice(0, -1)
      return url + '/v1/chat/completions'
    }
    return url
  }

  const testOneModel = async (modelName: string, signal: AbortSignal): Promise<{ speed: number } | { error: string }> => {
    const body = {
      model: modelName,
      messages: [
        { role: 'system', content: 'Reply with exactly "OK" and nothing else.' },
        { role: 'user', content: 'Ping' },
      ],
      temperature: 0,
      max_tokens: 10,
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const url = normalizeEndpoint(endpoint)
    const start = performance.now()
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      })

      const elapsed = Math.round(performance.now() - start)

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        // 如果返回的是 HTML，说明端点地址不对
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          return { error: '端点返回了网页，请检查中转站地址格式' }
        }
        return { error: `HTTP ${res.status}${text ? ': ' + text.slice(0, 80) : ''}` }
      }

      // 先检查 Content-Type，防止把 HTML 当 JSON 解析
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('json')) {
        const text = await res.text().catch(() => '')
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          return { error: '端点返回了网页，请检查中转站地址格式' }
        }
        return { error: `非JSON响应 (${ct.slice(0, 40)})` }
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? data.response ?? ''
      if (!content && content !== '') {
        return { error: '空响应' }
      }

      return { speed: elapsed }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { error: '已取消' }
      }
      const msg = String(err)
      // SyntaxError about JSON means HTML returned as 200
      if (msg.includes('is not valid JSON') || msg.includes('Unexpected token')) {
        return { error: '端点返回了网页，请检查中转站地址格式' }
      }
      // Network errors (CORS, connection refused, etc.)
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return { error: `无法连接到 ${url}，检查 cc-switch 是否已开启路由，端口是否正确` }
      }
      return { error: msg.slice(0, 100) }
    }
  }

  const handleSpeedTest = useCallback(async () => {
    if (testing) return
    setTesting(true)

    const controller = new AbortController()
    abortRef.current = controller

    // 先清除之前的结果
    setModels((prev) => prev.map((m) => ({ ...m, speed: undefined, error: undefined })))

    for (const model of models) {
      if (controller.signal.aborted) break
      setTestProgress(model.name)

      const result = await testOneModel(model.name, controller.signal)

      setModels((prev) =>
        prev.map((m) => {
          if (m.name !== model.name) return m
          if ('speed' in result) {
            return { ...m, speed: result.speed, error: undefined }
          }
          return { ...m, speed: undefined, error: result.error }
        }),
      )
    }

    setTestProgress(null)
    setTesting(false)
    abortRef.current = null
  }, [models, endpoint, apiKey, testing])

  const handleCancelTest = () => {
    abortRef.current?.abort()
    setTesting(false)
    setTestProgress(null)
  }

  // 按速度排序：有速度的在前（快的优先），没测的按名字排
  const sorted = [...models].sort((a, b) => {
    if (a.speed !== undefined && b.speed !== undefined) return a.speed - b.speed
    if (a.speed !== undefined) return -1
    if (b.speed !== undefined) return 1
    return a.name.localeCompare(b.name)
  })

  // 找出最快模型作为基准（用于进度条百分比）
  const fastestSpeed = sorted.find((m) => m.speed !== undefined)?.speed ?? 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-[0.12em] text-text-muted">模型</label>
        <button
          onClick={testing ? handleCancelTest : handleSpeedTest}
          disabled={!endpoint || (!testing && models.length === 0)}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {testing ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.55_0.18_260)] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[oklch(0.55_0.18_260)]" />
              </span>
              取消测速
            </>
          ) : (
            <>
              <Gauge size={11} />
              测速
            </>
          )}
        </button>
      </div>

      <div className="max-h-[280px] overflow-y-auto space-y-1 border border-border">
        <AnimatePresence>
          {sorted.map((model) => {
            const isSelected = currentModel === model.name
            const isTesting = testProgress === model.name
            const barWidth = model.speed ? Math.min((model.speed / fastestSpeed) * 100, 100) : 0

            return (
              <div key={model.name}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
                    isSelected
                      ? 'bg-accent-subtle border-l-2 border-accent'
                      : 'border-l-2 border-transparent hover:bg-[#18181b]'
                  }`}
                  onClick={() => handleSelect(model.name)}
                >
                  {/* 选中指示器 */}
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-accent bg-accent' : 'border-border'
                  }`}>
                    {isSelected && <Check size={9} className="text-surface" strokeWidth={3} />}
                  </div>

                  {/* 模型名 + 速度/测试状态 */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="text-xs font-medium truncate">{model.name}</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                      {isTesting ? (
                        <span className="text-[10px] text-text-muted animate-pulse">测试中...</span>
                      ) : !model.error && (
                        <div className="flex items-center gap-1.5">
                          {model.speed !== undefined && (
                            <div className="w-10 h-1 bg-border rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${speedBarColor(model.speed)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(barWidth, 8)}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          )}
                          <span className={`text-[10px] tabular-nums font-medium ${speedColor(model.speed)}`}>
                            {speedLabel(model.speed)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(model.name)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-[oklch(0.55_0.2_30)] transition-all flex-shrink-0"
                      title="删除模型"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </motion.div>
                {/* 错误信息 — 展开为整行 */}
                {model.error && (
                  <div className="px-3 pb-2 -mt-1">
                    <p className="text-[10px] text-[oklch(0.55_0.2_30)] leading-relaxed break-all">{model.error}</p>
                  </div>
                )}
              </div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* 添加自定义模型 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newModelName}
          onChange={(e) => setNewModelName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="自定义模型名..."
          className="flex-1 bg-[#18181b] rounded-md border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newModelName.trim()}
          className="inline-flex items-center rounded-md gap-1 px-3 py-1.5 text-xs border border-border text-text-muted hover:text-text hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={11} />
          添加
        </button>
      </div>
    </div>
  )
}
