import request from '@/utils/request-maintenance'

/**
 * 告警信息分页查询（与 mainPage 一致的请求格式）
 * @param {Object} data - 分页参数 + 查询条件
 */
export function warnInfoPage(data) {
  return request({
    url: '/rest/warnInfo',
    method: 'get',
    params: {
      start: ((data.pageNum || 1) - 1) * (data.pageSize || 20),
      length: data.pageSize || 20,
      draw: 1,
      ...data
    }
  })
}

/**
 * 获取最新告警信息（用于登录后的全局提醒）
 * 默认查最新 10 条告警，由前端按时间过滤
 */
export function getLatestWarnInfo() {
  return request({
    url: '/rest/warnInfo',
    method: 'get',
    params: {
      start: 0,
      length: 10,
      draw: 1
    }
  })
}

/**
 * 查询指定平台的告警信息（地图点位点击展示）
 * @param {string|number} ptid 平台ID (PTID)
 */
export function getPtWarnInfos(ptid) {
  return request({
    url: `/rest/warnInfo/ptWarnInfos/${ptid}`,
    method: 'get'
  })
}
