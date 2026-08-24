/**
 * 智能分析（本地模拟）共享假数据生成
 * 字段对齐外部接口 input_json 约定：zzrwxx / taskNodes / zzrwmbs / zzrwpts / wlllzts / sslxxs
 * 供两个独立页面共用：任务网可视化（TaskNetVisualization.vue）、事中规划（InProcessPlanning.vue）
 */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

export const LINK_STATUS = {正常: '#22c55e', 告警: '#f59e0b', 中断: '#ef4444'}
export const PLAN_STATE_COLOR = {
  执行中: '#22c55e',
  已规划: '#38bdf8',
  待规划: '#475569'
}

const PLATFORM_SEED = [
  {PTID: 'PT-01', PTMC: '预警指挥机', PTZL: '空中预警'},
  {PTID: 'PT-02', PTMC: '编队指挥舰', PTZL: '海上指挥'},
  {PTID: 'PT-03', PTMC: '察打一体无人机群', PTZL: '侦察打击'},
  {PTID: 'PT-04', PTMC: '光学侦察卫星', PTZL: '天基侦察'},
  {PTID: 'PT-05', PTMC: '电子战飞机', PTZL: '电子对抗'},
  {PTID: 'PT-06', PTMC: '精确打击机群', PTZL: '空中打击'}
]

const TARGET_SEED = [
  {MBID: 'MB-11', MBMC: '敌驱逐舰编队', MBDJ: '重点', MBZT: '锁定'},
  {MBID: 'MB-12', MBMC: '岸基警戒雷达站', MBDJ: '重点', MBZT: '跟踪'},
  {MBID: 'MB-13', MBMC: '区域防空阵地', MBDJ: '一般', MBZT: '跟踪'},
  {MBID: 'MB-14', MBMC: '海上指挥中心', MBDJ: '重点', MBZT: '锁定'}
]

const NODE_SEED = [
  {JDID: 'JD-01', JDMC: '侦察探测', JDLX: '感知'},
  {JDID: 'JD-02', JDMC: '情报融合处理', JDLX: '处理'},
  {JDID: 'JD-03', JDMC: '指挥决策', JDLX: '决策'},
  {JDID: 'JD-04', JDMC: '火力打击', JDLX: '行动'},
  {JDID: 'JD-05', JDMC: '毁伤评估', JDLX: '评估'}
]

const LINK_PAIRS = [
  ['PT-01', 'PT-02', '指挥链路'],
  ['PT-01', 'PT-03', '侦察数据链'],
  ['PT-02', 'PT-06', '打击指挥链'],
  ['PT-03', 'PT-04', '卫星数传链'],
  ['PT-03', 'PT-05', '目标指示链'],
  ['PT-05', 'PT-06', '电子对抗链'],
  ['PT-04', 'PT-02', '情报回传链']
]

const FORCE_SEED = [
  {SSID: 'SS-21', SSMC: '远程打击编队', SSRS: 24, SSZD: '待命'},
  {SSID: 'SS-22', SSMC: '预警探测分队', SSRS: 8, SSZD: '待命'},
  {SSID: 'SS-23', SSMC: '电子对抗分队', SSRS: 12, SSZD: '待命'}
]

// 任务节点 -> 作战平台 关联（用于连线）
export const NODE_PLATFORM_MAP = {
  'JD-01': ['PT-01', 'PT-03', 'PT-04'],
  'JD-02': ['PT-02', 'PT-05'],
  'JD-03': ['PT-01', 'PT-02'],
  'JD-04': ['PT-06', 'PT-03'],
  'JD-05': ['PT-01', 'PT-04']
}

// 作战平台 -> 打击目标 关联
export const PLATFORM_TARGET_MAP = {
  'PT-06': ['MB-11', 'MB-14'],
  'PT-03': ['MB-13'],
  'PT-02': ['MB-14'],
  'PT-05': ['MB-13']
}

const PHASE_SEED = [
  {name: '侦察探测', dur: 30},
  {name: '情报融合处理', dur: 20},
  {name: '指挥决策', dur: 15},
  {name: '火力打击', dur: 60},
  {name: '毁伤评估', dur: 30}
]

function formatMinute(min) {
  const h = String(8 + Math.floor(min / 60)).padStart(2, '0')
  const m = String(min % 60).padStart(2, '0')
  return `${h}:${m}`
}

function buildPlans(platforms, links) {
  const phases = PHASE_SEED.map((p, i) => ({
    name: p.name,
    dur: p.dur,
    state:
      i === 0 ? '执行中' : i === PHASE_SEED.length - 1 ? '待规划' : '已规划'
  }))

  let start = 0
  const plans = []
  phases.forEach((ph, i) => {
    const pt = pick(platforms.filter(p => p.PTZT === '在线'))
    const link = pick(links)
    plans.push({
      JHID: 'JH-' + String(i + 1).padStart(3, '0'),
      PHASE: ph.name,
      PTMC: pt ? pt.PTMC : '—',
      LINK: `${link.source}↔${link.target}(${link.type})`,
      START: formatMinute(start),
      END: formatMinute(start + ph.dur),
      startMin: start,
      durMin: ph.dur,
      STATE: ph.state
    })
    start += ph.dur
  })

  return {phases, plans}
}

/**
 * 生成一整套本地模拟数据
 */
export function generateMockData() {
  const generatedAt = new Date().toLocaleTimeString('zh-CN')

  // 作战任务信息 zzrwxx
  const zzrwxx = {
    ZZRWXXID: 'ZRWXX-2026-0001',
    ZZRWID: 'ZRW-2026-0001',
    RWMC: '远洋标准打击任务',
    RWYXJ: 1,
    STARTTIME: '2026-08-23 08:00:00',
    RWSJ: 240,
    SSLY: '海上远程打击'
  }

  // 任务节点 taskNodes
  const taskNodes = NODE_SEED.map(n => ({...n}))

  // 打击目标 zzrwmbs
  const targets = TARGET_SEED.map(t => ({...t}))

  // 作战平台 zzrwpts（随机 1 个离线）
  const platforms = PLATFORM_SEED.map((p, i) => ({
    ...p,
    PTZT: i === rand(0, PLATFORM_SEED.length - 1) ? '离线' : '在线'
  }))

  // 数据链链路状态 wlllzts（正常/告警/中断）
  const links = LINK_PAIRS.map(([source, target, type]) => {
    const r = Math.random()
    let status = '正常'
    if (r > 0.85) status = '中断'
    else if (r > 0.68) status = '告警'
    return {
      source,
      target,
      type,
      status,
      statusText: status,
      latency: rand(8, 120)
    }
  })

  // 实施力量信息 sslxxs
  const forces = FORCE_SEED.map(f => ({...f}))

  // 事中规划
  const {phases, plans} = buildPlans(platforms, links)

  return {
    generatedAt,
    zzrwxx,
    taskNodes,
    targets,
    platforms,
    links,
    forces,
    phases,
    plans
  }
}
