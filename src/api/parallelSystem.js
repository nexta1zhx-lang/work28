import request from '@/utils/request'

/**
 * 6. 发送方案至平行系统
 * /rest/pxyxqq/page (POST)
 * @param {Object} data
 * @param {string} data.systemid   系统id
 * @param {string} data.taskid     任务id
 * @param {string} data.requestId  请求ID
 * @param {number} data.ConfirmMsg 0确认 1取消
 * @param {string} data.fzTaskId   方案任务id
 * @param {string} data.taskName   任务名称
 */
export function sendSchemeToParallel(data) {
  return request({
    url: '/rest/pxyxqq/page',
    method: 'post',
    data
  })
}

/**
 * 7. 平行系统推演方案和结果
 * /rest/zwEvalEnity/page (POST)
 * @param {Object} data
 * @param {string} data.systemid          系统id
 * @param {string} data.taskid            任务id
 * @param {string} data.netSchemeTaskId   最优推荐方案任务号
 * @param {string} data.netSchemeId       最优推荐方案ID
 * @param {string} data.netSchemeName     最优推荐方案名称
 * @param {number} data.netSchemeScore    分数
 * @param {Array}  data.ZwEvalEntities    推演评估结果列表
 *        [{ netSchemeTaskId, netSchemeId, netSchemeName, netSchemeScore,
 *           Dklyl 带宽利用率, Xxlyl 信息, Xdlyl 信道,
 *           Rwmzl 任务满足率, Ptzwl 平台在网率 }]
 */
export function submitDeductionResult(data) {
  return request({
    url: '/rest/zwEvalEnity/page',
    method: 'post',
    data
  })
}
