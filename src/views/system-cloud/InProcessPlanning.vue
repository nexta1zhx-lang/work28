<template>
  <div class="screen-container">
    <!-- 顶部工具栏 -->
    <div class="top-search-header">
      <div class="search-flex">
        <span class="hub-title">
          <Icon
            icon="lucide:clipboard-list"
            :size="15"
            style="vertical-align: -2px; margin-right: 5px"
          />
          事中规划{{ useReal ? '（真实服务）' : '（本地模拟）' }}
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
          {{ useReal ? '重新加载页面' : '重新生成规划' }}
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
      <!-- 左侧规划信息 -->
      <div class="left-panel">
        <div class="panel-header-summary">
          <span class="title">
            <Icon
              icon="lucide:swords"
              :size="15"
              style="vertical-align: middle; margin-right: 4px"
            />
            规划任务
          </span>
        </div>
        <div class="task-info-card">
          <div class="task-info-name">
            <span class="text-blue">{{ zzrwxx.RWMC }}</span>
          </div>
          <div class="task-info-grid">
            <div>
              任务ID：<span class="font-num text-cyan">{{
                zzrwxx.ZZRWID
              }}</span>
            </div>
            <div>
              规划时间：<span>{{ generatedAt }}</span>
            </div>
            <div>
              参与平台：<span class="font-num text-cyan">{{
                plans.length
              }}</span>
            </div>
            <div>
              完成进度：<span class="text-green">{{ progress }}%</span>
            </div>
          </div>
        </div>

        <div class="panel-header-summary">
          <span class="title">
            <Icon
              icon="lucide:git-branch"
              :size="15"
              style="vertical-align: middle; margin-right: 4px"
            />
            规划阶段
          </span>
        </div>
        <div class="phase-scroll-box">
          <div
            v-for="phase in phases"
            :key="phase.name"
            class="phase-item"
            :class="'ph-' + phase.state"
          >
            <span class="phase-dot"></span>
            <span class="phase-name">{{ phase.name }}</span>
            <span class="phase-dur font-num">{{ phase.dur }}m</span>
            <span class="phase-state">{{ phase.state }}</span>
          </div>
        </div>

        <el-button
          type="primary"
          size="mini"
          icon="el-icon-refresh"
          class="action-btn generate-btn"
          @click="regenerate"
        >
          重新生成规划
        </el-button>
      </div>

      <!-- 右侧方案明细 + 甘特图 -->
      <div class="right-panel">
        <div class="right-panel-title">
          <span>规划方案明细</span>
          <el-select v-model="planFilter" size="mini" class="filter-select">
            <el-option label="全部状态" value="all" />
            <el-option label="执行中" value="执行中" />
            <el-option label="已规划" value="已规划" />
            <el-option label="待规划" value="待规划" />
          </el-select>
        </div>

        <el-table
          :data="filteredPlans"
          class="plan-table"
          size="mini"
          height="200"
          :row-class-name="tableRowClass"
        >
          <el-table-column prop="JHID" label="计划编号" width="130" />
          <el-table-column prop="PHASE" label="阶段" width="110" />
          <el-table-column
            prop="PTMC"
            label="使用平台"
            min-width="130"
            show-overflow-tooltip
          />
          <el-table-column
            prop="LINK"
            label="数据链路"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column prop="START" label="开始" width="150" />
          <el-table-column prop="END" label="结束" width="150" />
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="{row}">
              <span class="plan-status" :class="'ps-' + row.STATE">{{
                row.STATE
              }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div ref="ganttChart" class="chart-box gantt-box"></div>
      </div>
    </div>

    <!-- 真实服务模式：iframe 嵌入外部 HTML 页面 -->
    <div v-else class="real-iframe-box">
      <iframe
        ref="realFrame"
        class="embed-frame"
        title="事中规划（真实服务）"
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
 * 事中规划（本地模拟）
 * 按阶段生成规划方案明细表 + 甘特时间轴
 */
import * as echarts from 'echarts'
import {generateMockData, PLAN_STATE_COLOR} from './mockData'
import {
  ANALYSIS_REAL,
  ANALYSIS_SERVER,
  loadRealPage,
  defaultInProcessInput
} from './analysisConfig'

export default {
  name: 'InProcessPlanning',

  data() {
    return {
      planFilter: 'all',
      zzrwxx: {},
      phases: [],
      plans: [],
      generatedAt: '',
      ganttChart: null,
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
    dataSummary() {
      if (ANALYSIS_REAL) {
        return (
          this.realError ||
          (this.realLoading
            ? '正在加载真实服务...'
            : '真实服务地址：' + ANALYSIS_SERVER)
        )
      }
      const total = this.plans.length
      const done = this.plans.filter(p => p.STATE !== '待规划').length
      return `规划 ${total} 项 / 已完成 ${done} 项 / 进度 ${this.progress}%`
    },
    filteredPlans() {
      if (this.planFilter === 'all') return this.plans
      return this.plans.filter(p => p.STATE === this.planFilter)
    },
    progress() {
      if (!this.plans.length) return 0
      const done = this.plans.filter(p => p.STATE !== '待规划').length
      return Math.round((done / this.plans.length) * 100)
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
    if (this.ganttChart) {
      this.ganttChart.dispose()
      this.ganttChart = null
    }
  },

  methods: {
    handleResize() {
      if (this.ganttChart) this.ganttChart.resize()
    },

    async loadReal() {
      const iframe = this.$refs.realFrame
      if (!iframe) return
      this.realLoading = true
      this.realError = ''
      try {
        await loadRealPage(
          iframe,
          '/api/in-process/page',
          defaultInProcessInput()
        )
      } catch (e) {
        this.realError = '页面加载失败：' + (e.message || e)
        console.error('[事中规划] 加载真实服务失败:', e)
      } finally {
        this.realLoading = false
      }
    },

    regenerate() {
      const data = generateMockData()
      this.generatedAt = data.generatedAt
      this.zzrwxx = data.zzrwxx
      this.phases = data.phases
      this.plans = data.plans

      this.$nextTick(() => this.renderGanttChart())
      this.$message.success('已重新生成事中规划数据')
    },

    renderGanttChart() {
      const el = this.$refs.ganttChart
      if (!el || el.clientWidth === 0) return

      if (!this.ganttChart) {
        this.ganttChart = echarts.init(el)
      }

      const totalMin = this.plans.length
        ? this.plans[this.plans.length - 1].startMin +
          this.plans[this.plans.length - 1].durMin
        : 200

      const base = this.plans.map(p => p.startMin)
      const bars = this.plans.map(p => ({
        value: p.durMin,
        itemStyle: {
          color: PLAN_STATE_COLOR[p.STATE] || '#38bdf8',
          opacity: 0.9
        }
      }))

      this.ganttChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(8,14,24,0.92)',
          borderColor: '#1e3557',
          textStyle: {color: '#cbd5e1', fontSize: 11},
          formatter: params => {
            const p = this.plans[params.dataIndex] || {}
            return `${p.JHID || ''} ${p.PHASE || ''}<br/>${p.START || ''} - ${p.END || ''}<br/>平台：${p.PTMC || ''}`
          }
        },
        grid: {left: 100, right: 24, top: 30, bottom: 28},
        xAxis: {
          type: 'value',
          name: '分钟',
          min: 0,
          max: Math.ceil(totalMin / 30) * 30,
          nameTextStyle: {color: '#64748b', fontSize: 10},
          axisLabel: {color: '#64748b', fontSize: 10},
          axisLine: {lineStyle: {color: '#1e3557'}},
          splitLine: {lineStyle: {color: '#0d1522'}}
        },
        yAxis: {
          type: 'category',
          data: this.plans.map(p => p.PHASE),
          axisLabel: {color: '#94a3b8', fontSize: 11},
          axisLine: {lineStyle: {color: '#1e3557'}},
          axisTick: {show: false}
        },
        series: [
          {
            name: '底',
            type: 'bar',
            stack: 'plan',
            barWidth: 18,
            itemStyle: {color: 'transparent'},
            data: base,
            tooltip: {show: false}
          },
          {
            name: '计划',
            type: 'bar',
            stack: 'plan',
            barWidth: 18,
            label: {
              show: true,
              position: 'inside',
              color: '#0b1220',
              fontSize: 10,
              formatter: p => {
                const it = this.plans[p.dataIndex] || {}
                return it.STATE === '待规划' ? '待规划' : ''
              }
            },
            data: bars
          }
        ]
      })
    },

    tableRowClass({row}) {
      return 'plan-row-' + row.STATE
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

.task-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
  font-size: 11px;
  color: #94a3b8;
}

.phase-scroll-box {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: #0d1522;
  border: 1px solid #172438;
  border-left: 3px solid #475569;
  border-radius: 3px;
  font-size: 11px;
}

.phase-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #475569;
  flex-shrink: 0;
}

.phase-item.ph-执行中 {
  border-left-color: #22c55e;
}

.phase-item.ph-执行中 .phase-dot {
  background: #22c55e;
  animation: pulse 1.4s infinite;
}

.phase-item.ph-待规划 {
  border-left-color: #475569;
  opacity: 0.7;
}

.phase-name {
  color: #cbd5e1;
}

.phase-dur {
  color: #64748b;
  font-size: 10px;
}

.phase-state {
  margin-left: auto;
  font-size: 10px;
  color: #94a3b8;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.generate-btn {
  flex-shrink: 0;
  margin-top: auto;
}

.filter-select {
  width: 120px;
}

.filter-select :deep(.el-input__inner) {
  background: #0d1522;
  border-color: #172438;
  color: #94a3b8;
  font-size: 11px;
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

.plan-table {
  flex-shrink: 0;
  margin-top: 8px;
}

.plan-table :deep(.el-table__header th) {
  background: #0d1522 !important;
  color: #94a3b8;
  font-size: 11px;
}

.plan-table :deep(.el-table__body td) {
  background: transparent;
  font-size: 11px;
  color: #cbd5e1;
}

.plan-table :deep(.el-table) {
  background: transparent;
}

.plan-table :deep(.el-table tr) {
  background: #080e18;
}

.plan-table :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: #0d1522;
}

.plan-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid;
}

.plan-status.ps-执行中 {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.1);
}

.plan-status.ps-已规划 {
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
}

.plan-status.ps-待规划 {
  color: #94a3b8;
  border-color: #1e293b;
  background: rgba(148, 163, 184, 0.08);
}

.chart-box {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.gantt-box {
  margin-top: 8px;
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
