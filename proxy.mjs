// cc-switch 本地代理 — 处理 OPTIONS 预检 + 转发 POST
// 启动: node proxy.mjs
// cc-switch 有 CORS 响应头但拒绝 OPTIONS 预检，浏览器因此拦截所有请求
// 这个代理在中间处理 OPTIONS，转发 POST 到 cc-switch
import http from 'http'

const PROXY_PORT = 5174
const TARGET = { host: '127.0.0.1', port: 15721, path: '/v1/chat/completions' }

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('{}')
    return
  }

  // 读取请求体
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks)

    const proxyReq = http.request(
      {
        hostname: TARGET.host,
        port: TARGET.port,
        path: TARGET.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(body.length),
          ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*',
        })
        proxyRes.pipe(res)
      },
    )

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
      }
      res.end(JSON.stringify({ error: `cc-switch 代理错误: ${err.message}` }))
    })

    proxyReq.write(body)
    proxyReq.end()
  })
})

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.error(`[cc-switch proxy] http://127.0.0.1:${PROXY_PORT} → http://${TARGET.host}:${TARGET.port}${TARGET.path}`)
})
