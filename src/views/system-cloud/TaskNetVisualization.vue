<template>
  <div class="screen-container">
    <!-- 顶部工具栏 -->
    <div class="top-search-header">
      <div class="search-flex">
        <span class="hub-title">
          <Icon
            icon="lucide:network"
            :size="15"
            style="vertical-align: -2px; margin-right: 5px"
          />
          任务网可视化{{ useReal ? '（真实服务）' : '（本地模拟）' }}
        </span>
      </div>
      <div class="monitor-legend">
        <span class="source-tag" :class="useReal ? 'real' : 'mock'">
          {{ useReal ? '真实服务' : '本地模拟' }}
        </span>
        <el-button
          type="primary"
          size="mini"
          icon="el-icon-refresh"
          class="action-btn"
          :loading="realLoading"
          @click="useReal ? loadReal() : regenerate()"
        >
          {{ useReal ? '重新加载页面' : '重新生成模拟数据' }}
        </el-button>
      </div>
    </div>

    <!-- 状态条 -->
    <div class="status-bar">
      <span class="status-dot ok"></span>
      <span class="status-text">{{ statusText }}</span>
      <span class="status-srv">{{ dataSummary }}</span>
    </div>

    <!-- 本地模拟模式：自绘图表 -->
    <div v-if="!useReal" class="main-body-layout">
      <!-- 左侧信息面板 -->
      <div class="left-panel">
        <div class="panel-header-summary">
          <span class="title">
            <Icon
              icon="lucide:swords"
              :size="15"
              style="vertical-align: middle; margin-right: 4px"
            />
            作战任务信息
          </span>
        </div>
        <div class="task-info-card">
          <div class="task-info-name">
            <span class="text-blue">{{ zzrwxx.RWMC }}</span>
            <span
              class="priority-tag"
              :class="zzrwxx.RWYXJ === 1 ? 'p-high' : 'p-normal'"
            >
              {{ zzrwxx.RWYXJ === 1 ? '一级任务' : '常规任务' }}
            </span>
          </div>
          <div class="task-info-grid">
            <div>
              任务ID：<span class="font-num text-cyan">{{
                zzrwxx.ZZRWID
              }}</span>
            </div>
            <div>
              所属域：<span class="text-green">{{ zzrwxx.SSLY }}</span>
            </div>
            <div>
              开始时间：<span>{{ zzrwxx.STARTTIME }}</span>
            </div>
            <div>
              任务时长：<span class="font-num text-cyan"
                >{{ zzrwxx.RWSJ }} 分钟</span
              >
            </div>
          </div>
        </div>

        <div class="panel-header-summary">
          <span class="title">
            <Icon
              icon="lucide:activity"
              :size="15"
              style="vertical-align: middle; margin-right: 4px"
            />
            态势统计
          </span>
        </div>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-num text-cyan font-num">{{
              platforms.length
            }}</span>
            <span class="stat-label">作战平台</span>
          </div>
          <div class="stat-item">
            <span class="stat-num text-rose font-num">{{
              targets.length
            }}</span>
            <span class="stat-label">打击目标</span>
          </div>
          <div class="stat-item">
            <span class="stat-num text-green font-num">{{
              normalLinkCount
            }}</span>
            <span class="stat-label">正常链路</span>
          </div>
          <div class="stat-item">
            <span class="stat-num text-orange font-num">{{
              warnLinkCount
            }}</span>
            <span class="stat-label">告警链路</span>
          </div>
        </div>

        <div class="panel-header-summary">
          <span class="title">
            <Icon
              icon="lucide:network"
              :size="15"
              style="vertical-align: middle; margin-right: 4px"
            />
            数据链链路状态
          </span>
        </div>
        <div class="link-scroll-box">
          <div
            v-for="link in links"
            :key="link.source + link.target"
            class="link-row"
            :class="'st-' + link.status"
          >
            <span class="link-dot"></span>
            <span class="link-pair font-num"
              >{{ link.source }}↔{{ link.target }}</span
            >
            <span class="link-type">{{ link.type }}</span>
            <span class="link-status">{{ link.statusText }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧网络拓扑 -->
      <div class="right-panel">
        <div class="right-panel-title">
          <span>任务网络拓扑</span>
          <span class="legend-inline">
            <span class="lg lg-ok"></span>正常
            <span class="lg lg-warn"></span>告警
            <span class="lg lg-err"></span>中断
          </span>
        </div>
        <div ref="netChart" class="chart-box"></div>
      </div>
    </div>

    <!-- 真实服务模式：iframe 嵌入外部 HTML 页面 -->
    <div v-else class="real-iframe-box">
      <iframe
        ref="realFrame"
        class="embed-frame"
        title="任务网可视化（真实服务）"
      ></iframe>
      <div v-if="realLoading" class="real-mask">
        <i class="el-icon-loading mask-icon"></i>
        <span>正在加载真实服务页面...</span>
      </div>
      <div v-if="realError" class="real-error">{{ realError }}</div>
    </div>
  </div>
</template>

<script>
/**
 * 任务网可视化（本地模拟）
 * 用 ECharts force 布局展示任务网络拓扑（任务/节点/平台/目标 + 数据链链路状态）
 */
import * as echarts from 'echarts'
import {
  generateMockData,
  LINK_STATUS,
  NODE_PLATFORM_MAP,
  PLATFORM_TARGET_MAP
} from './mockData'
import {
  ANALYSIS_REAL,
  ANALYSIS_SERVER,
  loadRealPage,
  defaultVisualInput
} from './analysisConfig'

export default {
  name: 'TaskNetVisualization',

  data() {
    return {
      zzrwxx: {},
      taskNodes: [],
      targets: [],
      platforms: [],
      links: [],
      forces: [],
      generatedAt: '',
      netChart: null,
      realLoading: false,
      realError: ''
    }
  },

  computed: {
    useReal() {
      return ANALYSIS_REAL
    },
    server() {
      return ANALYSIS_SERVER
    },
    normalLinkCount() {
      return this.links.filter(l => l.status === '正常').length
    },
    warnLinkCount() {
      return this.links.filter(l => l.status !== '正常').length
    },
    dataSummary() {
      if (ANALYSIS_REAL) {
        return (
          this.realError ||
          (this.realLoading
            ? '正在加载真实服务...'
            : '真实服务地址：' + ANALYSIS_SERVER)
        )
      }
      return `任务 ${this.platforms.length} 平台 / ${this.targets.length} 目标 / ${this.links.length} 链路`
    },
    statusText() {
      if (ANALYSIS_REAL) {
        return this.realError
          ? '真实服务加载失败'
          : '真实服务数据 · ' + ANALYSIS_SERVER
      }
      return '本地模拟数据 · ' + this.generatedAt
    }
  },

  mounted() {
    if (ANALYSIS_REAL) {
      this.$nextTick(() => this.loadReal())
    } else {
      this.regenerate()
    }
    window.addEventListener('resize', this.handleResize)
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.netChart) {
      this.netChart.dispose()
      this.netChart = null
    }
  },

  methods: {
    handleResize() {
      if (this.netChart) this.netChart.resize()
    },

    async loadReal() {
      const iframe = this.$refs.realFrame
      if (!iframe) return
      this.realLoading = true
      this.realError = ''
      try {
        await loadRealPage(iframe, '/api/visual/', defaultVisualInput())
      } catch (e) {
        this.realError = '页面加载失败：' + (e.message || e)
        console.error('[任务网可视化] 加载真实服务失败:', e)
      } finally {
        this.realLoading = false
      }
    },

    regenerate() {
      const data = generateMockData()
      this.generatedAt = data.generatedAt
      this.zzrwxx = data.zzrwxx
      this.taskNodes = data.taskNodes
      this.targets = data.targets
      this.platforms = data.platforms
      this.links = data.links
      this.forces = data.forces

      this.$nextTick(() => this.renderNetChart())
      this.$message.success('已重新生成任务网模拟数据')
    },

    renderNetChart() {
      const el = this.$refs.netChart
      if (!el || el.clientWidth === 0) return

      if (!this.netChart) {
        this.netChart = echarts.init(el)
      }

      const categories = [
        {name: '作战任务', itemStyle: {color: '#38bdf8'}},
        {name: '任务节点', itemStyle: {color: '#4ade80'}},
        {name: '作战平台', itemStyle: {color: '#60a5fa'}},
        {name: '打击目标', itemStyle: {color: '#fb7185'}}
      ]

      const nodes = [
        {
          id: 'task',
          name: this.zzrwxx.RWMC,
          symbolSize: 72,
          category: 0,
          value: '作战任务'
        }
      ]
      this.taskNodes.forEach(n => {
        nodes.push({
          id: n.JDID,
          name: n.JDMC,
          symbolSize: 32,
          category: 1,
          value: '任务节点'
        })
      })
      this.platforms.forEach(p => {
        nodes.push({
          id: p.PTID,
          name: p.PTMC,
          symbolSize: 36,
          category: 2,
          value: p.PTZT === '离线' ? '平台离线' : p.PTZL,
          itemStyle: p.PTZT === '离线' ? {color: '#64748b'} : undefined
        })
      })
      this.targets.forEach(t => {
        nodes.push({
          id: t.MBID,
          name: t.MBMC,
          symbolSize: 30,
          category: 3,
          value: `${t.MBDJ}目标·${t.MBZT}`
        })
      })

      const edges = []
      this.taskNodes.forEach(n => {
        edges.push({
          source: 'task',
          target: n.JDID,
          lineStyle: {color: 'rgba(56,189,248,0.45)', width: 1.2}
        })
      })
      Object.keys(NODE_PLATFORM_MAP).forEach(jd => {
        NODE_PLATFORM_MAP[jd].forEach(pt => {
          edges.push({
            source: jd,
            target: pt,
            lineStyle: {color: 'rgba(96,165,250,0.4)', width: 1.1}
          })
        })
      })
      Object.keys(PLATFORM_TARGET_MAP).forEach(pt => {
        PLATFORM_TARGET_MAP[pt].forEach(mb => {
          edges.push({
            source: pt,
            target: mb,
            lineStyle: {
              color: 'rgba(251,113,133,0.55)',
              width: 1.4,
              type: 'dashed'
            }
          })
        })
      })
      this.links.forEach(l => {
        edges.push({
          source: l.source,
          target: l.target,
          value: l.type,
          lineStyle: {
            color: LINK_STATUS[l.status] || '#22c55e',
            width: 2.6,
            opacity: l.status === '中断' ? 0.45 : 0.95
          }
        })
      })

      this.netChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(8,14,24,0.92)',
          borderColor: '#1e3557',
          textStyle: {color: '#cbd5e1', fontSize: 11},
          formatter: params => {
            const data = params.data || {}
            let extra = data.value ? ` · ${data.value}` : ''
            return `${params.name}${extra}`
          }
        },
        legend: {
          data: categories.map(c => c.name),
          textStyle: {color: '#94a3b8', fontSize: 10},
          top: 6,
          left: 'center'
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            draggable: true,
            categories,
            data: nodes,
            links: edges,
            force: {
              repulsion: 320,
              edgeLength: [70, 150],
              gravity: 0.08
            },
            label: {
              show: true,
              color: '#cbd5e1',
              fontSize: 10
            },
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: 6,
            lineStyle: {opacity: 0.9, width: 1.4},
            emphasis: {
              focus: 'adjacency',
              lineStyle: {width: 3}
            }
          }
        ]
      })
    }
  }
}
</script>

<style scoped>
.screen-container {
  width: 100%;
  height: 100%;
  background-color: #03060c;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.top-search-header {
  height: 46px;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.hub-title {
  font-size: 13px;
  font-weight: bold;
  color: #38bdf8;
}

.search-flex {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  background: #101b2e;
  border: 1px solid #1e3557;
  font-size: 11px;
  color: #fff;
}

.status-bar {
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  margin-bottom: 8px;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #475569;
}

.status-dot.ok {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

.status-srv {
  margin-left: auto;
  color: #64748b;
}

.main-body-layout {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  gap: 12px;
}

.left-panel {
  width: 360px;
  flex-shrink: 0;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  padding: 11px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  min-width: 0;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.panel-header-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid #111b2b;
  margin-bottom: 2px;
}

.panel-header-summary .title {
  font-size: 12px;
  font-weight: bold;
  color: #7cecff;
}

.task-info-card {
  background: #0d1522;
  border: 1px solid #172438;
  border-radius: 4px;
  padding: 8px 10px;
}

.task-info-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: bold;
}

.priority-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
}

.priority-tag.p-high {
  background: rgba(251, 113, 133, 0.15);
  color: #fb7185;
  border: 1px solid rgba(251, 113, 133, 0.35);
}

.priority-tag.p-normal {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border: 1px solid #1e293b;
}

.task-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
  font-size: 11px;
  color: #94a3b8;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.stat-item {
  background: #0d1522;
  border: 1px solid #172438;
  border-radius: 4px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  color: #64748b;
}

.link-scroll-box {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: #0d1522;
  border: 1px solid #172438;
  border-left: 3px solid #475569;
  border-radius: 3px;
  font-size: 11px;
}

.link-row .link-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #475569;
  flex-shrink: 0;
}

.link-row.st-正常 {
  border-left-color: #22c55e;
}

.link-row.st-正常 .link-dot {
  background: #22c55e;
}

.link-row.st-告警 {
  border-left-color: #f59e0b;
}

.link-row.st-告警 .link-dot {
  background: #f59e0b;
}

.link-row.st-中断 {
  border-left-color: #ef4444;
  opacity: 0.75;
}

.link-row.st-中断 .link-dot {
  background: #ef4444;
}

.link-pair {
  color: #cbd5e1;
}

.link-type {
  color: #64748b;
  font-size: 10px;
}

.link-status {
  margin-left: auto;
  font-size: 10px;
  color: #94a3b8;
}

.right-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 8px;
  border-bottom: 1px solid #111b2b;
  font-size: 12px;
  font-weight: bold;
  color: #7cecff;
  flex-shrink: 0;
}

.legend-inline {
  font-size: 10px;
  font-weight: normal;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-inline .lg {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  margin-left: 6px;
}

.lg-ok {
  background: #22c55e;
}

.lg-warn {
  background: #f59e0b;
}

.lg-err {
  background: #ef4444;
}

.chart-box {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.text-blue {
  color: #38bdf8;
}

.text-cyan {
  color: #22d3ee;
}

.text-green {
  color: #22c55e;
}

.text-orange {
  color: #f59e0b;
}

.text-rose {
  color: #fb7185;
}

.font-num {
  font-family: 'JetBrains Mono', Consolas, monospace;
}

/* 数据来源标签 */
.source-tag {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 3px;
  border: 1px solid;
  margin-right: 4px;
}

.source-tag.mock {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.1);
}

.source-tag.real {
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
}

/* 真实服务 iframe */
.real-iframe-box {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  overflow: hidden;
}

.embed-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #03060c;
}

.real-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(3, 6, 12, 0.82);
  color: #94a3b8;
  font-size: 12px;
  z-index: 2;
}

.mask-icon {
  font-size: 28px;
  color: #38bdf8;
}

.real-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-size: 12px;
  z-index: 2;
  background: rgba(3, 6, 12, 0.82);
}
</style>
