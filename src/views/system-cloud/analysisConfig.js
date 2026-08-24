/**
 * 智能分析两个页面（任务网可视化 / 事中规划）的数据来源配置
 *
 * 由 .env 环境变量控制（改完需重启 dev server / 重新 build 生效）：
 *   VUE_APP_ANALYSIS_SOURCE = 'mock'（默认）→ 使用本地模拟数据（mockData.js 自绘图表）
 *                          = 'real'  → 对接真实服务，iframe 嵌入服务端返回的 HTML 页面
 *   VUE_APP_ANALYSIS_SERVER = 'http://39.101.73.142:8090'（real 模式的服务地址）
 *
 * 真实服务接口：
 *   POST /api/visual/          任务网可视化（input_json 必填）
 *   POST /api/in-process/page  事中规划（input_json 可不传，不传用服务器当前数据）
 */

export const ANALYSIS_REAL = process.env.VUE_APP_ANALYSIS_SOURCE === 'real'

export const ANALYSIS_SERVER = (process.env.VUE_APP_ANALYSIS_SERVER || '')
  .trim()
  .replace(/\/+$/, '')

/** 任务网可视化默认输入（对齐外部接口字段约定） */
export function defaultVisualInput() {
  return JSON.stringify({
    zzrwxx: {RWMC: '远洋标准打击任务'},
    taskNodes: [],
    zzrwmbs: [],
    zzrwpts: [],
    wlllzts: [],
    sslxxs: []
  })
}

/** 事中规划默认输入（可不传，用服务器当前数据） */
export function defaultInProcessInput() {
  return JSON.stringify({zzrwxx: {RWMC: '远洋标准打击任务'}})
}

/**
 * 从真实服务拉取 HTML 页面并注入 iframe（POST + srcdoc + <base> 方案）
 * @param {HTMLIFrameElement} iframe
 * @param {string} path 接口路径，如 '/api/visual/'
 * @param {string} inputJson 输入 JSON 字符串
 */
export async function loadRealPage(iframe, path, inputJson) {
  if (!ANALYSIS_SERVER) {
    throw new Error('未配置 VUE_APP_ANALYSIS_SERVER')
  }
  const resp = await fetch(ANALYSIS_SERVER + path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({input_json: inputJson || ''})
  })
  if (!resp.ok) {
    throw new Error('HTTP ' + resp.status)
  }
  // 页面静态资源/数据接口都是 /static、/api 绝对路径，需补 <base> 指向服务地址
  const html = (await resp.text()).replace(
    /<head[^>]*>/i,
    m => m + '<base href="' + ANALYSIS_SERVER + '/">'
  )
  iframe.srcdoc = html
}
