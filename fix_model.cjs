const fs = require('fs')

let code = fs.readFileSync('src/ui/components/ModelSwitcher.tsx', 'utf-8')
if (!code.includes("import { createGateway }")) {
  code = "import { createGateway } from '../../gateway'\n" + code;
}

code = code.replace(
  /const testOneModel = async \(modelName: string[\s\S]*?const url = normalizeEndpoint\(endpoint\)[\s\S]*?const start = performance\.now\(\)[\s\S]*?return \{ error: msg\.slice\(0, 100\) \}\n\s*\}/,
  `const testOneModel = async (modelName: string, signal: AbortSignal): Promise<{ speed: number } | { error: string }> => {
    const start = performance.now()
    try {
      const g = createGateway({
        endpoint: endpoint,
        apiKey: apiKey,
        model: modelName
      })
      
      const res = await g.think(
        'Reply with OK',
        [{ role: 'user', content: 'Ping' }],
        { temperature: 0.1 }
      )

      if (signal.aborted) return { error: '已取消' }
      return { speed: Math.round(performance.now() - start) }
    } catch (err) {
      if (signal.aborted) return { error: '已取消' }
      return { error: String(err).slice(0, 100) }
    }
  }`
)

fs.writeFileSync('src/ui/components/ModelSwitcher.tsx', code)
