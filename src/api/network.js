import request from '@/utils/request'

export function findTree(ZZRWWLID) {
  return request({
    url: `rest/zzrwwl/findTree/${ZZRWWLID}`,
    method: 'get'
  })
}
export function wlzt(data) {
  return request({
    url: `rest/wlzt/page`,
    method: 'post',
    data
  })
}
/**
 * 查询指定网络(wlh)的网络拓扑数据
 * GET /rest/wlzt/{wlh}
 * @param {number} wlh - 网络号
 */
export function wlztTopology(wlh) {
  return request({
    url: `rest/wlzt/${wlh}`,
    method: 'get'
  })
}
export function xxlltj(data) {
  return request({
    url: `rest/xxlltj/page`,
    method: 'post',
    data
  })
}
export function xxfsjg(data) {
  return request({
    url: `rest/xxfsjg/page`,
    method: 'post',
    data
  })
}
export function wlllDetect(data) {
  return request({
    url: '/rest/wlllDetect/page',
    method: 'post',
    data
  })
}

/**
 * 查询所有网络链路
 * GET /rest/wlzyztyd/wllls
 */
export function getNetworkList() {
  return request({
    url: '/rest/wlzyztyd/wllls',
    method: 'get'
  })
}

/**
 * 网络异常诊断信息（最新）
 * GET /rest/wlllDetect/latest/{WLH}/{LLH}
 * @param {number} wlh  - 网络号
 * @param {number} llh  - 链路号
 */
export function getNetworkLatestDetect(wlh, llh) {
  return request({
    url: `/rest/wlllDetect/latest/${wlh}/${llh}`,
    method: 'get'
  })
}

/**
 * 网络最近10分钟诊断信息
 * GET /rest/wlllDetect/tenMiniutes/{WLH}/{LLH}
 * @param {number} wlh  - 网络号
 * @param {number} llh  - 链路号
 */
export function getNetworkTenMinutes(wlh, llh) {
  return request({
    url: `/rest/wlllDetect/tenMiniutes/${wlh}/${llh}`,
    method: 'get'
  })
}

/**
 * 预测网络状态信息
 * GET /rest/wlllDetect/predict/{WLH}/{LLH}
 * @param {number} wlh  - 网络号
 * @param {number} llh  - 链路号
 */
export function getNetworkPredict(wlh, llh) {
  return request({
    url: `/rest/wlllDetect/predict/${wlh}/${llh}`,
    method: 'get'
  })
}
