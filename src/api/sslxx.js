import request from '@/utils/request'

/**
 * ===================================================================
 * 杀伤链信息 (sslxx) 查询 API — 独立模块，不复用原有杀伤链代码
 * ===================================================================
 * 请求路径: /rest/sslxx/page
 * 用途: 分页查询杀伤链基础信息（目标、执行阶段、状态、告警等）
 * 说明: request.js 已配置 baseURL + token 拦截 + 响应码处理，
 *       各方法只需提供具体路径（含 /rest 前缀），返回 res 即响应体。
 */

/**
 * 杀伤链信息分页查询
 * @param {Object} params - 查询条件
 *   RWMC                      任务名称（模糊）
 *   MBMC                      目标名称（模糊）
 *   MBID                      目标标识（模糊）
 *   KILLCHAIN_STATE           状态 (1 正常执行 / 2 态势异常 / 3 流程完成 / 4 指挥中止)
 *   KILLCHAIN_EXECUTEPHASE    执行阶段 (0 发现 / 1 定位 / 2 跟踪 / 3 瞄准 / 4 打击 / 5 评估)
 * @param {Object} pagination  分页参数 { pageNum, pageSize }
 * @returns {Promise} 响应体（分页数据位于 res.data.list 或 res.data.records）
 */
export function getSslxxPage(params = {}, {pageNum = 1, pageSize = 20} = {}) {
  return request.post('/rest/sslxx/page', {
    pageNum,
    pageSize,
    params
  })
}

/**
 * 杀伤链信息详情查询
 * @param {String|Number} killchainId - 杀伤链 ID (KILLCHAIN_ID)
 * @returns {Promise} 响应体（详情位于 res.data）
 */
export function getSslxxDetail(killchainId) {
  return request.get(`/rest/sslxx/KILLCHAIN_ID/${killchainId}`)
}

/**
 * 杀伤链运行态势分页查询
 * @param {Object} params - 查询条件
 *   ZZRWID        作战任务ID
 *   RWMC          任务名称
 *   KILLCHAIN_ID  杀伤链编号
 * @param {Object} pagination 分页参数 { pageNum, pageSize }
 * @returns {Promise} 响应体（分页数据位于 res.data.list 或 res.data.records）
 */
export function getSslyxPage(params = {}, {pageNum = 1, pageSize = 10} = {}) {
  return request.post('/rest/sslyx/page', {
    pageNum,
    pageSize,
    params
  })
}

/**
 * 杀伤链群组分页查询
 * @param {Object} params - 查询条件
 *   ZZRWID 作战任务ID / RWMC 任务名称 / KILLCHAIN_ID 杀伤链ID
 *   MBID 目标ID / MBMC 目标名称
 * @returns {Promise} 响应体（分页数据位于 res.data.list 或 res.data.records）
 */
export function getSslqzPage(params = {}, {pageNum = 1, pageSize = 10} = {}) {
  return request.post('/rest/sslqz/page', {
    pageNum,
    pageSize,
    params
  })
}

/**
 * 杀伤链群组成员分页查询
 * 注意：后端 /rest/sslqzcy/page 仅读取 ZZRWID / RWMC / KILLCHAIN_ID / KILLCHAIN_EXECUTEPHASE
 * （SSLQZID / QZZRW 虽在 Mapper 支持，但 Rest 未读取，传了会被忽略）
 * @param {Object} params - 查询条件
 *   ZZRWID 作战任务ID / RWMC 任务名称 / KILLCHAIN_ID 杀伤链ID / KILLCHAIN_EXECUTEPHASE 阶段
 * @returns {Promise} 响应体
 */
export function getSslqzcyPage(
  params = {},
  {pageNum = 1, pageSize = 100} = {}
) {
  return request.post('/rest/sslqzcy/page', {
    pageNum,
    pageSize,
    params
  })
}
