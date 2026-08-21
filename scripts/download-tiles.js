#!/usr/bin/env node
/**
 * 轻量离线瓦片下载器（中国 + 台海区域）
 * ----------------------------------------
 * 功能：按 bbox(经纬度) + zoom 范围，从任意 XYZ 瓦片源下载 PNG/JPG
 *       到 public/tiles/{z}/{x}/{y}.png，供 Leaflet 本地加载。
 *
 * 用法：
 *   node scripts/download-tiles.js
 *
 * 配置项：见下方 TILE_SOURCE / BBOX / MIN_ZOOM / MAX_ZOOM / CONCURRENCY
 * 依赖：仅 Node 内置模块（https/http），无需安装任何包。
 *
 * 注意：
 *   - 请使用你自有/已授权下载的瓦片源地址（内网瓦片服务器、或合规的地图下载工具导出的 HTTP 服务）。
 *   - 下载量 = 各 zoom 级瓦片数之和，zoom 越高数量增长极快（每级约 4 倍），务必控制范围。
 *   - 断点续传：已存在的文件默认跳过（可设 FORCE=true 覆盖）。
 */
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')

/* ===================== 配置区 ===================== */

// 瓦片源模板，支持 {s}/{z}/{x}/{y} 占位。可用环境变量 TILE_SOURCE 覆盖。
// 高德栅格瓦片：style=8 路网 / 6 卫星影像 / 7 卫星+标注
// 默认源在本机已连通（OSM 被墙时可用）；生产请换成自有/已授权瓦片源。
const TILE_SOURCE =
  process.env.TILE_SOURCE ||
  'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
const SUBDOMAINS = (process.env.SUBDOMAINS || '01,02,03,04').split(',')
const USER_AGENT = 'Mozilla/5.0 (intranet-tile-downloader)'

// 下载范围 bbox（西, 南, 东, 北），可用环境变量 BBOX_WEST/BBOX_SOUTH/BBOX_EAST/BBOX_NORTH 覆盖
// 默认：中国 + 台海区域
const BBOX = {
  west: Number(process.env.BBOX_WEST || 73),
  south: Number(process.env.BBOX_SOUTH || 18),
  east: Number(process.env.BBOX_EAST || 135),
  north: Number(process.env.BBOX_NORTH || 54)
}

// 下载缩放级别（可用环境变量覆盖，如 MAX_ZOOM=8）
const MIN_ZOOM = Number(process.env.MIN_ZOOM || 4)
const MAX_ZOOM = Number(process.env.MAX_ZOOM || 14)

// 并发请求数
const CONCURRENCY = Number(process.env.CONCURRENCY || 6)
const FORCE = process.env.FORCE === 'true' // true 则重新下载已存在文件

// 输出子目录（tiles=路网 / sat=卫星影像）与扩展名
const OUT_SUBDIR = process.env.OUT_SUBDIR || 'tiles'
const EXT = process.env.EXT || 'png'

// 全球模式：GLOBAL=true 时下载全 z 级所有瓦片（覆盖全球），否则按 BBOX 范围
const GLOBAL = process.env.GLOBAL === 'true'

/* ===================== 核心逻辑 ===================== */

const OUT_DIR = path.resolve(__dirname, '..', 'public', OUT_SUBDIR)

function toTile(lon, lat, z) {
  const n = Math.pow(2, z)
  const x = ((lon + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const y = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
  return {x: Math.floor(x), y: Math.floor(y)}
}

function buildUrl(x, y, z) {
  const s = SUBDOMAINS[Math.floor(Math.random() * SUBDOMAINS.length)]
  return TILE_SOURCE.replace('{s}', s)
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y)
}

/** 计算某一 zoom 的瓦片范围（全球或 bbox） */
function rangeFor(z) {
  if (GLOBAL) {
    const n = Math.pow(2, z)
    return {x0: 0, y0: 0, x1: n - 1, y1: n - 1}
  }
  const tl = toTile(BBOX.west, BBOX.north, z)
  const br = toTile(BBOX.east, BBOX.south, z)
  return {x0: tl.x, y0: tl.y, x1: br.x, y1: br.y}
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, {headers: {'User-Agent': USER_AGENT}}, res => {
      if (res.statusCode >= 400) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} ${url}`))
      }
      if (
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume()
        return download(res.headers.location, dest).then(resolve, reject)
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        fs.mkdirSync(path.dirname(dest), {recursive: true})
        fs.writeFileSync(dest, Buffer.concat(chunks))
        resolve()
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => req.destroy(new Error('timeout ' + url)))
  })
}

async function main() {
  let total = 0
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const r = rangeFor(z)
    const jobs = []
    for (let x = r.x0; x <= r.x1; x++) {
      for (let y = r.y0; y <= r.y1; y++) {
        jobs.push({x, y, z})
      }
    }
    total += jobs.length
    console.log(`zoom ${z}: ${jobs.length} 片`)
  }
  const scope = GLOBAL
    ? '全球'
    : `${BBOX.west}~${BBOX.east}E, ${BBOX.south}~${BBOX.north}N`
  console.log(`共需下载 ${total} 片瓦片（${scope}）`)
  console.log(`输出目录: ${OUT_DIR}`)

  let done = 0
  let skipped = 0
  let failed = 0
  const queue = []
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const r = rangeFor(z)
    for (let x = r.x0; x <= r.x1; x++) {
      for (let y = r.y0; y <= r.y1; y++) {
        queue.push({x, y, z})
      }
    }
  }

  async function worker() {
    while (queue.length) {
      const {x, y, z} = queue.shift()
      const dest = path.join(OUT_DIR, String(z), String(x), `${y}.${EXT}`)
      if (!FORCE && fs.existsSync(dest)) {
        skipped++
        done++
        continue
      }
      const url = buildUrl(x, y, z)
      try {
        await download(url, dest)
        done++
      } catch (e) {
        failed++
        console.error(`  失败 ${z}/${x}/${y}: ${e.message}`)
      }
      if (done % 500 === 0 || done === total) {
        const pct = ((done / total) * 100).toFixed(1)
        console.log(
          `进度 ${pct}% (${done}/${total}) 失败${failed} 跳过${skipped}`
        )
      }
    }
  }

  const workers = Array.from({length: CONCURRENCY}, () => worker())
  await Promise.all(workers)
  console.log(
    `\n完成：成功 ${done - skipped} / 跳过 ${skipped} / 失败 ${failed}`
  )
  console.log(
    `输出: public/${OUT_SUBDIR}/{z}/{x}/{y}.${EXT}，前端 Leaflet 直接按 /${OUT_SUBDIR}/{z}/{x}/{y}.${EXT} 读取。`
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
