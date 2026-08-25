#!/usr/bin/env node
/**
 * 构建后把瓦片从 tiles-data/ 复制到 dist/（可选，方案B）
 * -----------------------------------------------------
 * 适用：需要把瓦片与前端一起打进 dist/ 部署（单一静态目录）。
 * 若使用方案A（生产由 Nginx 直接托管瓦片数据目录，见 deploy/nginx.conf），
 * 则无需运行本脚本，dist 不会包含瓦片，构建产物更小。
 *
 * 用法：
 *   npm run build && npm run copy:tiles    # 或 npm run build:full
 *
 * 注意：本脚本只是普通文件复制，不经过 webpack 内存管线，不会触发 OOM。
 */
const fs = require('fs')
const path = require('path')

const SRC = path.resolve(__dirname, '..', 'tiles-data')
const DST = path.resolve(__dirname, '..', 'dist')

if (!fs.existsSync(SRC)) {
  console.error('[copy-tiles] 未找到瓦片目录，跳过:', SRC)
  process.exit(0)
}

console.log(`[copy-tiles] 复制 ${SRC} -> ${DST} ...`)
fs.cpSync(SRC, DST, {recursive: true})
console.log('[copy-tiles] 完成。')
