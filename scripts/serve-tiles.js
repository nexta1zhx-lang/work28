#!/usr/bin/env node
/**
 * 本地瓦片静态服务（开发用）
 * ------------------------
 * 瓦片已从 public/ 移出（避免 copy-webpack-plugin 处理 5.8 万个文件导致构建 OOM），
 * 开发时用本脚本在 8090 端口提供 /sat 与 /sat_gd 瓦片，
 * 再配合 vue.config.js 里 devServer.proxy 把 /sat、/sat_gd 转发到这里。
 *
 * 用法：
 *   npm run serve:tiles      # 或 node scripts/serve-tiles.js
 *   端口可用环境变量 TILE_PORT 覆盖
 *
 * 目录结构约定（tiles-data/ 已被 gitignore）：
 *   tiles-data/sat/{z}/{x}/{y}.jpg
 *   tiles-data/sat_gd/{z}/{x}/{y}.jpg
 *
 * 生产环境请改用 Nginx 托管（见 deploy/nginx.conf），本脚本仅用于开发。
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.env.TILE_PORT || 8090)
const ROOT = path.resolve(__dirname, '..', 'tiles-data')

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

if (!fs.existsSync(ROOT)) {
  console.error(`[tiles] 未找到瓦片目录: ${ROOT}`)
  console.error(
    '[tiles] 请先执行 node scripts/download-tiles.js 下载瓦片，或把瓦片放到 tiles-data/ 下。'
  )
  process.exit(1)
}

const server = http.createServer((req, res) => {
  // 仅支持 GET/HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    return res.end('Method Not Allowed')
  }

  // 去掉查询串（?v=5）并规范化路径，防目录穿越
  let urlPath
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0])
  } catch (e) {
    res.writeHead(400)
    return res.end('Bad Request')
  }
  const rel = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join(ROOT, rel)

  // 必须落在 ROOT 内
  if (!filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403)
    return res.end('Forbidden')
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404)
      return res.end('Not Found')
    }
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': stat.size
    })
    if (req.method === 'HEAD') return res.end()
    fs.createReadStream(filePath).pipe(res)
  })
})

server.listen(PORT, () => {
  console.log(`[tiles] 瓦片静态服务已启动: http://localhost:${PORT}`)
  console.log(`[tiles] 根目录: ${ROOT}`)
  console.log(`[tiles] 示例: http://localhost:${PORT}/sat/9/391/189.jpg`)
})
