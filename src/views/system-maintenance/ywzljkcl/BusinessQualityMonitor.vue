<template>
  <div class="business-screen-container">
    <div class="global-statistics-bar">
      <div class="stat-card">
        <div class="stat-lbl">
          <Icon
            icon="lucide:swords"
            :size="12"
            color="#60a5fa"
            style="vertical-align: middle; margin-right: 4px"
          />所有群组
        </div>
        <div class="stat-val text-blue font-num">
          {{ globalStats.totalGroups }}<small>组</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">
          <Icon
            icon="lucide:boxes"
            :size="12"
            color="#22d3ee"
            style="vertical-align: middle; margin-right: 4px"
          />应用服务
        </div>
        <div class="stat-val text-cyan font-num">
          {{ globalStats.totalServices }}<small>个</small>
        </div>
      </div>
      <div
        class="stat-card"
        :class="globalStats.alertCount > 0 ? 'alert-flash-border' : ''"
      >
        <div class="stat-lbl">
          <Icon
            icon="lucide:alert-triangle"
            :size="12"
            color="#f87171"
            style="vertical-align: middle; margin-right: 4px"
          />离线平台
        </div>
        <div
          class="stat-val font-num"
          :class="globalStats.alertCount > 0 ? 'text-red' : 'text-gray'"
        >
          {{ globalStats.alertCount }}<small>项</small>
        </div>
      </div>
    </div>

    <div class="business-main-layout two-col-layout">
      <div class="business-column width-60">
        <div class="sub-panel flex-100">
          <span class="panel-corner-tl"></span>
          <span class="panel-corner-tr"></span>
          <span class="panel-corner-bl"></span>
          <span class="panel-corner-br"></span>
          <div class="panel-title-bar">
            <span class="title">
              <Icon
                icon="lucide:shield-alert"
                :size="12"
                color="#f43f5e"
                style="vertical-align: middle; margin-right: 4px"
              />作战任务群组在网态势监视
            </span>
          </div>

          <div class="inner-filter-bar grid-2 custom-el-form">
            <el-input
              v-model="taskQueryParams.QZMC"
              @input="handleTaskQuery"
              placeholder="输入群组名称检索..."
              size="mini"
              clearable
            />
            <el-input
              v-model="taskQueryParams.RWMC"
              @input="handleTaskQuery"
              placeholder="输入任务名称检索..."
              size="mini"
              clearable
            />
          </div>

          <div class="scroll-wrapper task-grid" v-loading="loadingTask">
            <div v-if="taskGroupList.length === 0" class="empty-holder">
              当前无在网执行的作战群组任务
            </div>

            <div
              v-for="task in taskGroupList"
              :key="task.ZZRWQZID"
              class="task-group-dashboard"
            >
              <div class="task-corner"></div>
              <div class="task-card-body">
                <div class="task-card-left">
                  <div class="task-top-meta">
                    <span class="qz-title">
                      <Icon
                        icon="lucide:shield"
                        :size="12"
                        color="#60a5fa"
                        style="vertical-align: middle; margin-right: 4px"
                      />{{ task.QZMC }}
                    </span>
                    <span class="state-tag" :class="'state-' + task.QZSTATE">{{
                      getTaskStateText(task.QZSTATE)
                    }}</span>
                  </div>

                  <span class="task-badge">
                    <Icon
                      icon="lucide:flag"
                      :size="9"
                      color="#facc15"
                      style="margin-right: 3px"
                    />{{ task.RWMC }}
                  </span>

                  <div class="time-period-row font-num">
                    <span class="tp-item">
                      <Icon
                        icon="lucide:play"
                        :size="11"
                        color="#34d399"
                        style="vertical-align: middle; margin-right: 3px"
                      />开始:
                      <span class="tp-val text-green">{{ task.RWKSSJ }}</span>
                    </span>
                    <span class="tp-item">
                      <Icon
                        icon="lucide:square"
                        :size="11"
                        color="#f87171"
                        style="vertical-align: middle; margin-right: 3px"
                      />终止:
                      <span class="tp-val text-red">{{ task.RWZZSJ }}</span>
                    </span>
                  </div>

                  <div class="task-extra-meta font-num">
                    <span class="extra-item">
                      <Icon
                        icon="lucide:radio"
                        :size="9"
                        color="#64748b"
                        style="vertical-align: middle; margin-right: 2px"
                      />平台编识号:
                      <span class="text-cyan"
                        >{{ task.QSPTBSH || '?' }}~{{
                          task.ZZPTBSH || '?'
                        }}</span
                      >
                    </span>
                    <span class="extra-item">
                      <Icon
                        icon="lucide:crosshair"
                        :size="9"
                        color="#64748b"
                        style="vertical-align: middle; margin-right: 2px"
                      />目标编识号:
                      <span class="text-orange"
                        >{{ task.QSMBBSH || '?' }}~{{
                          task.ZZMBBSH || '?'
                        }}</span
                      >
                    </span>
                  </div>
                </div>

                <div class="task-card-right">
                  <div class="platform-section">
                    <div class="pl-header">
                      <span class="pl-header-lbl">
                        <Icon
                          icon="lucide:radio"
                          :size="11"
                          color="#22d3ee"
                          style="vertical-align: middle; margin-right: 4px"
                        />编组平台
                      </span>
                      <span class="online-badge"
                        >{{ getOnlineCount(task) }}/{{
                          getTotalCount(task)
                        }}在线</span
                      >
                    </div>
                    <div class="pl-tags-wrap">
                      <div class="pl-tags-inner">
                        <span
                          v-for="(pt, pi) in getPlatformItems(task)"
                          :key="pi"
                          class="pl-tag"
                          :class="pt.online ? 'tag-online' : 'tag-offline'"
                        >
                          <span
                            class="pl-dot"
                            :class="pt.online ? 'dot-online' : 'dot-offline'"
                          ></span>
                          <span class="pl-name">{{ pt.name }}</span>
                        </span>
                      </div>
                      <el-popover
                        v-if="
                          getPlatformItems(task).length > platformVisibleLimit
                        "
                        placement="right"
                        trigger="hover"
                        popper-class="dark-pl-popover"
                      >
                        <span slot="reference" class="pl-more-btn"
                          >+{{
                            getPlatformItems(task).length - platformVisibleLimit
                          }}</span
                        >
                        <div class="popover-pl-list">
                          <div
                            v-for="(pt, pi) in getPlatformItems(task)"
                            :key="pi"
                            class="popover-pl-item"
                          >
                            <span
                              class="pl-dot"
                              :class="pt.online ? 'dot-online' : 'dot-offline'"
                            ></span>
                            <span
                              class="pl-name"
                              :class="pt.online ? 'text-green' : 'text-gray'"
                              >{{ pt.name }}</span
                            >
                          </div>
                        </div>
                      </el-popover>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="task-pagination-bar">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :total="taskTotal"
              :page-size="pageConfig.pageSize"
              :current-page="taskPageNum"
              @current-change="handleTaskPageChange"
            />
          </div>
        </div>
      </div>

      <div class="business-column width-40">
        <div class="sub-panel flex-100">
          <span class="panel-corner-tl"></span>
          <span class="panel-corner-tr"></span>
          <span class="panel-corner-bl"></span>
          <span class="panel-corner-br"></span>
          <div class="panel-title-bar">
            <span class="title">
              <Icon
                icon="lucide:layers"
                :size="12"
                color="#facc15"
                style="vertical-align: middle; margin-right: 4px"
              />业务微服务集群网格
            </span>
          </div>

          <div class="inner-filter-bar grid-2 custom-el-form">
            <el-input
              v-model="serviceQueryParams.serviceName"
              @input="fetchServicePage"
              placeholder="搜索微服务..."
              size="mini"
              clearable
            />
            <el-select
              v-model="serviceQueryParams.serviceStatus"
              @change="fetchServicePage"
              placeholder="全部状态"
              size="mini"
              clearable
            >
              <el-option label="全部状态" value="" />
              <el-option label="正常就绪" value="0" />
              <el-option label="宕机挂起" value="1" />
            </el-select>
          </div>

          <div class="scroll-wrapper service-grid" v-loading="loadingService">
            <div v-if="serviceList.length === 0" class="empty-holder">
              未捕捉到运行微服务监控指标
            </div>

            <div
              v-for="srv in serviceList"
              :key="srv.serviceId"
              class="service-circle-card"
              :class="
                Number(srv.serviceStatus) === 1 ? 'card-dead' : 'card-alive'
              "
            >
              <div class="scc-top">
                <span class="scc-name">{{ srv.serviceName }}</span>
                <span
                  class="scc-status"
                  :class="
                    Number(srv.serviceStatus) === 1 ? 'st-red' : 'st-green'
                  "
                ></span>
              </div>

              <div class="scc-circus">
                <div class="scc-ring">
                  <svg viewBox="0 0 36 36" class="scc-svg">
                    <path
                      class="ring-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      class="ring-fill"
                      :stroke-dasharray="cpuArc(srv)"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20" class="ring-text">
                      {{ srv.useCpu || 0 }}%
                    </text>
                  </svg>
                  <span class="scc-label">CPU</span>
                </div>
                <div class="scc-ring">
                  <svg viewBox="0 0 36 36" class="scc-svg">
                    <path
                      class="ring-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      class="ring-fill mem"
                      :stroke-dasharray="memArc(srv)"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20" class="ring-text">
                      {{ srv.useMemory || 0 }}
                    </text>
                  </svg>
                  <span class="scc-label">MB</span>
                </div>
              </div>

              <div class="scc-footer font-num">
                <span class="text-cyan"
                  >{{ srv.serviceIp }}:{{ srv.servicePort }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import {getServiceInfoPage, getZzrwqzPage} from '@/api/platform'

export default {
  name: 'BusinessQualityMonitor',
  components: {},
  data() {
    return {
      eventDrawerVisible: false,
      loadingTask: false,
      loadingService: false,

      taskGroupList: [],
      serviceList: [],

      globalStats: {
        totalGroups: 0,
        totalServices: 0,
        alertCount: 0
      },

      taskQueryParams: {QZMC: '', RWMC: ''},
      serviceQueryParams: {serviceName: '', serviceStatus: ''},

      pageConfig: {pageNum: 1, pageSize: 20},
      taskPageNum: 1,
      taskTotal: 0,

      chartIns: null,
      platformVisibleLimit: 8
    }
  },
  created() {
    this.initialMasterWorkflow()
  },
  mounted() {},
  beforeDestroy() {
    if (this.chartIns) this.chartIns.dispose()
  },
  methods: {
    async initialMasterWorkflow() {
      this.loadingTask = true
      this.loadingService = true

      await Promise.all([this.fetchTaskGroupPage(), this.fetchServicePage()])

      this.loadingTask = false
      this.loadingService = false
    },

    async fetchTaskGroupPage(page = 1) {
      this.taskPageNum = page
      try {
        const payload = {
          pageNum: page,
          pageSize: this.pageConfig.pageSize,
          params: {
            QZMC: this.taskQueryParams.QZMC || undefined,
            RWMC: this.taskQueryParams.RWMC || undefined
          }
        }
        const res = await getZzrwqzPage(payload)
        const rows = res?.rows || res?.data?.list || []
        const total = res?.total || res?.data?.total || 0

        this.taskGroupList = rows.length > 0 ? rows : []
        this.taskTotal = total

        this.calculateGlobalStats(total)
      } catch (e) {
        console.warn('作战任务群组加载阻断')
      }
    },

    handleTaskPageChange(page) {
      this.fetchTaskGroupPage(page)
    },

    handleTaskQuery() {
      this.fetchTaskGroupPage(1)
    },

    async fetchServicePage() {
      try {
        const payload = {
          pageNum: this.pageConfig.pageNum,
          pageSize: this.pageConfig.pageSize,
          params: {
            serviceName: this.serviceQueryParams.serviceName || undefined,
            serviceStatus:
              this.serviceQueryParams.serviceStatus !== ''
                ? Number(this.serviceQueryParams.serviceStatus)
                : undefined
          }
        }
        const res = await getServiceInfoPage(payload)
        this.serviceList = res?.rows || res?.data?.list || []

        if (!this.serviceList || this.serviceList.length === 0) {
          this.serviceList = [
            {
              serviceId: 'SRV_01',
              serviceName: '时空轨迹动态纠偏服务',
              templateName: '标准微服务模板',
              serviceStatus: 0,
              useCpu: 45,
              useMemory: 1024,
              serviceIp: '192.168.10.45',
              servicePort: '8081',
              serviceURL: '/api/v1/geo/rectify'
            },
            {
              serviceId: 'SRV_02',
              serviceName: '多模组网拓扑流转网关',
              templateName: '高负载专用组件',
              serviceStatus: 0,
              useCpu: 88,
              useMemory: 4096,
              serviceIp: '192.168.10.46',
              servicePort: '9000',
              serviceURL: '/api/v1/topology/stream'
            },
            {
              serviceId: 'SRV_03',
              serviceName: '雷达目标威胁判决服务',
              templateName: '核心算力模板',
              serviceStatus: 1,
              useCpu: 0,
              useMemory: 0,
              serviceIp: '192.168.10.50',
              servicePort: '8088',
              serviceURL: '/api/v1/threat/judge'
            }
          ]
        }
        this.calculateGlobalStats()
      } catch (e) {
        console.warn('微服务引擎状态解析异常')
      }
    },

    calculateGlobalStats(total) {
      this.globalStats.totalGroups = total || this.taskGroupList.length
      this.globalStats.totalServices = this.serviceList.length

      const deadServices = this.serviceList.filter(
        s => Number(s.serviceStatus) === 1
      ).length
      this.globalStats.alertCount = deadServices
    },

    getTaskStateText(s) {
      return {0: '新建', 1: '在线', 2: '离线'}[s] || '未知'
    },
    getPlatformItems(task) {
      const raw = task.PTXXMCS || task.ptxxmcs || task.platformNames || ''
      const names = String(raw).split(',').filter(Boolean)
      const onlineRaw = task.onlinePTs || task.onlinepts || []
      const onlineNames = onlineRaw.map(
        pt => pt.PTMC || pt.ptmc || pt.name || ''
      )
      return names.map(name => ({
        name: name.trim(),
        online: onlineNames.includes(name.trim()) || onlineNames.includes(name)
      }))
    },
    getOnlineCount(task) {
      return (
        task.onlineCount ||
        task.onlinecount ||
        (task.onlinePTs || task.onlinepts || []).length
      )
    },
    getTotalCount(task) {
      const raw = task.PTXXMCS || task.ptxxmcs || task.platformNames || ''
      return String(raw).split(',').filter(Boolean).length
    },
    cpuArc(srv) {
      const pct = Math.min(Math.floor(srv.useCpu || 0), 100)
      return `${pct} ${100 - pct}`
    },
    memArc(srv) {
      const max = 8192
      const val = Math.min(srv.useMemory || 0, max)
      const pct = Math.round((val / max) * 100)
      return `${pct} ${100 - pct}`
    }
  }
}
</script>

<style scoped>
/* ===== 全局动画关键帧 ===== */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(56, 189, 248, 0);
  }
  50% {
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
  }
}

@keyframes countPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.business-screen-container {
  width: 100%;
  height: 100%;
  /* background-color: #03060c; */
  color: #cbd5e1;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  padding: 14px;
}

/* 1. 全局标题头 */
.business-top-header {
  height: 46px;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}
.brand-title {
  font-size: 13px;
  font-weight: bold;
  color: #38bdf8;
  letter-spacing: 1px;
}
.global-legend {
  display: flex;
  align-items: center;
  gap: 14px;
}
.global-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}
.legend-node .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.bg-safe {
  background: #10b981;
}
.bg-warn {
  background: #f59e0b;
}
.bg-crit {
  background: #ef4444;
}
.sync-countdown-badge {
  background: #111e36;
  color: #38bdf8;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
}

/* 2. 数据大屏核心统计带 */
.global-statistics-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 11px 0;
  flex-shrink: 0;
}
.stat-card {
  background: #080e18;
  border: 1px solid #132238;
  border-radius: 4px;
  padding: 11px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: fadeSlideUp 0.5s ease both;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  opacity: 0.4;
}
.stat-card:hover {
  border-color: #1e3a5f;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.stat-card:nth-child(1) {
  animation-delay: 0s;
}
.stat-card:nth-child(2) {
  animation-delay: 0.1s;
}
.stat-card:nth-child(3) {
  animation-delay: 0.2s;
}

.stat-lbl {
  font-size: 11px;
  color: #94a3b8;
  font-weight: bold;
  margin-bottom: 2px;
}
.stat-val {
  font-size: 22px;
  font-weight: bold;
  letter-spacing: -0.5px;
  animation: pulseGlow 3s ease-in-out infinite;
}
.stat-val small {
  font-size: 11px;
  font-weight: normal;
  margin-left: 3px;
  color: #94a3b8;
}

/* 大屏布局 */
.business-main-layout {
  display: flex;
  flex: 1;
  gap: 14px;
  height: calc(100% - 130px);
  min-height: 0;
}
.two-col-layout .width-60 {
  width: 68%;
}
.two-col-layout .width-40 {
  width: 32%;
}
.business-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.sub-panel {
  background: #080e18;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
  position: relative;
  box-shadow:
    0 0 12px rgba(56, 189, 248, 0.04),
    inset 0 0 20px rgba(56, 189, 248, 0.02);
}
.sub-panel::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(56, 189, 248, 0.4),
    transparent
  );
  pointer-events: none;
}
.sub-panel::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(56, 189, 248, 0.2),
    transparent
  );
  pointer-events: none;
}
.sub-panel .panel-corner-tl {
  position: absolute;
  top: -1px;
  left: -1px;
  width: 16px;
  height: 16px;
  border-top: 2px solid rgba(56, 189, 248, 0.45);
  border-left: 2px solid rgba(56, 189, 248, 0.45);
  border-radius: 4px 0 0 0;
  pointer-events: none;
}
.sub-panel .panel-corner-tr {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 16px;
  height: 16px;
  border-top: 2px solid rgba(56, 189, 248, 0.45);
  border-right: 2px solid rgba(56, 189, 248, 0.45);
  border-radius: 0 4px 0 0;
  pointer-events: none;
}
.sub-panel .panel-corner-bl {
  position: absolute;
  bottom: -1px;
  left: -1px;
  width: 16px;
  height: 16px;
  border-bottom: 2px solid rgba(56, 189, 248, 0.45);
  border-left: 2px solid rgba(56, 189, 248, 0.45);
  border-radius: 0 0 0 4px;
  pointer-events: none;
}
.sub-panel .panel-corner-br {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 16px;
  height: 16px;
  border-bottom: 2px solid rgba(56, 189, 248, 0.45);
  border-right: 2px solid rgba(56, 189, 248, 0.45);
  border-radius: 0 0 4px 0;
  pointer-events: none;
}
.flex-100 {
  flex: 1;
}
.flex-50 {
  flex: 0.5;
}
.flex-35 {
  flex: 0.35;
}
.flex-65 {
  flex: 0.65;
}

.panel-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #111b2b;
  padding-bottom: 6px;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.panel-title-bar .title {
  font-size: 11px;
  font-weight: bold;
  color: #38bdf8;
}
.active-node-desc {
  font-size: 11px;
  font-weight: bold;
}

/* 过滤框 Element UI 深色主题覆盖配置 */
.inner-filter-bar {
  margin-bottom: 8px;
  flex-shrink: 0;
}
.inner-filter-bar.grid-2 {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 6px;
}
.custom-el-form ::v-nav,
.custom-el-form ::v-deep .el-input__inner {
  background-color: #070c14 !important;
  border: 1px solid #172438 !important;
  color: #fff !important;
  font-size: 11px !important;
  height: 28px !important;
  line-height: 28px !important;
}
.custom-el-form ::v-deep .el-input__icon {
  line-height: 28px !important;
}
/* 覆盖 El 单选下拉菜单底衬 */
.custom-el-form ::v-deep .el-select {
  width: 100%;
}

/* 滚动条机制 */
.scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.task-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  align-content: start;
}

/* 任务群组分页器深色主题 */
.task-pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 10px;
  flex-shrink: 0;
}
.task-pagination-bar ::v-deep .el-pagination {
  color: #94a3b8;
}
.task-pagination-bar ::v-deep .el-pagination__total {
  color: #64748b;
  font-size: 11px;
  margin-right: 8px;
}
.task-pagination-bar ::v-deep .el-pagination button,
.task-pagination-bar ::v-deep .el-pagination .el-pager li {
  background-color: #0a1120;
  border: 1px solid #172438;
  border-radius: 3px;
  color: #94a3b8;
  font-size: 11px;
  margin: 0 3px;
}
.task-pagination-bar ::v-deep .el-pagination button:hover,
.task-pagination-bar ::v-deep .el-pagination .el-pager li:hover {
  color: #38bdf8;
  border-color: #38bdf8;
}
.task-pagination-bar ::v-deep .el-pagination .el-pager li.active {
  background-color: #38bdf8;
  border-color: #38bdf8;
  color: #06121f;
}
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: #172438;
  border-radius: 2px;
}

/* 链路质量卡片 */
.quality-glass-card {
  background: #0d1522;
  border: 1px solid #172438;
  border-left: 3px solid #94a3b8;
  padding: 8px 11px;
  border-radius: 3px;
  cursor: pointer;
}
.quality-glass-card:hover,
.quality-glass-card.is-active {
  background: #111e33;
  border-color: #38bdf8;
}
.card-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-row-top .main-code {
  font-size: 11px;
  font-weight: bold;
  color: #fff;
}
.status-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  background: #070c14;
}

.metrics-triple-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background: #070c14;
  padding: 5px;
  border-radius: 2px;
  margin: 6px 0;
}
.triple-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.triple-cell .lbl {
  font-size: 9px;
  color: #94a3b8;
  transform: scale(0.9);
}
.triple-cell .val {
  font-size: 11px;
  font-weight: bold;
  margin-top: 1px;
}
.card-row-nodes {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #4e6890;
}
.card-id-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
  font-size: 9px;
  flex-wrap: wrap;
}
.card-id-row .id-tag {
  color: #94a3b8;
  background: #070c14;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid #172438;
}
.health-score {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 2px;
  font-weight: bold;
}
.health-excellent {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.health-warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
}
.health-critical {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
}
.anomaly-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 2px;
  font-weight: bold;
  font-size: 9px;
}
.anomaly-yes {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.anomaly-no {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.card-time-row {
  margin-top: 4px;
  font-size: 9px;
  color: #94a3b8;
  padding: 2px 4px;
  background: #070c14;
  border-radius: 2px;
}

/* 中央图表 */
.bg-chart-radar {
  background-image: radial-gradient(
    circle at 50% 10%,
    rgba(56, 189, 248, 0.03) 0%,
    transparent 80%
  );
}
.chart-container-box {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.echart-container {
  flex: 1;
  width: 100%;
}

/* 作战群组面板 */
.task-group-dashboard {
  background: linear-gradient(
    135deg,
    rgba(13, 21, 34, 0.95),
    rgba(8, 14, 24, 0.98)
  );
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 4px;
  padding: 8px;
  transition: all 0.3s ease;
  animation: fadeSlideUp 0.5s ease both;
  position: relative;
  overflow: hidden;
  min-height: 150px;
}
.task-card-body {
  display: flex;
  gap: 10px;
  height: 100%;
  min-height: 130px;
}
.task-card-left {
  flex: 0.7;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: 2px 0;
  overflow: auto;
}
.task-card-left .task-top-meta {
  margin-bottom: 2px;
}
.task-card-left .task-badge {
  margin-bottom: 2px;
}
.task-card-right {
  flex: 1;
  display: flex;
  min-width: 0;
}
.task-card-right .platform-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(5, 11, 20, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 4px;
  padding: 6px 8px;
  min-height: 0;
}
.task-card-right .pl-header {
  margin-bottom: 4px;
  flex-shrink: 0;
}
.task-card-right .pl-header-lbl {
  font-size: 10px;
}
.task-card-right .online-badge {
  font-size: 10px;
}
.task-card-right .pl-tags-wrap {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.task-card-right .pl-tags-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-content: flex-start;
  padding: 2px 0;
}
.task-card-right .pl-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.task-card-right .pl-dot {
  width: 7px;
  height: 7px;
}
.task-card-right .pl-more-btn {
  font-size: 10px;
  padding: 3px 8px;
}
.task-group-dashboard::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 14px;
  height: 14px;
  border-top: 2px solid rgba(56, 189, 248, 0.35);
  border-left: 2px solid rgba(56, 189, 248, 0.35);
  border-radius: 4px 0 0 0;
  pointer-events: none;
}
.task-group-dashboard::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 14px;
  height: 14px;
  border-bottom: 2px solid rgba(56, 189, 248, 0.35);
  border-right: 2px solid rgba(56, 189, 248, 0.35);
  border-radius: 0 0 4px 0;
  pointer-events: none;
}
.task-group-dashboard:nth-child(1) {
  animation-delay: 0s;
}
.task-group-dashboard:nth-child(2) {
  animation-delay: 0.08s;
}
.task-group-dashboard:nth-child(3) {
  animation-delay: 0.16s;
}
.task-group-dashboard:nth-child(4) {
  animation-delay: 0.24s;
}
.task-group-dashboard:nth-child(5) {
  animation-delay: 0.32s;
}
.task-group-dashboard:hover {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow:
    0 0 18px rgba(56, 189, 248, 0.08),
    inset 0 0 20px rgba(56, 189, 248, 0.02);
}
.task-group-dashboard:hover::before,
.task-group-dashboard:hover::after {
  border-color: rgba(56, 189, 248, 0.6);
}
.task-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;
}
.task-top-meta .qz-title {
  font-size: 12px;
  font-weight: bold;
  color: #e2e8f0;
  letter-spacing: 0.5px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 任务小标签 */
.task-badge {
  display: inline-flex;
  align-items: center;
  font-size: 9px;
  color: #facc15;
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.15);
  padding: 1px 8px;
  border-radius: 3px;
  margin-bottom: 5px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.state-tag {
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 3px;
  background: transparent;
  font-weight: bold;
  letter-spacing: 0.3px;
}
.state-0 {
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.5);
  background: rgba(56, 189, 248, 0.06);
}
.state-1 {
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.06);
}
.state-2 {
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.06);
}

.topo-route-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #070c14;
  padding: 5px 8px;
  border-radius: 2px;
  margin-bottom: 4px;
}
.route-node {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
}
.route-node .dot-icon {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}
.bg-blue {
  background: #38bdf8;
}
.bg-orange {
  background: #f59e0b;
}
.route-arrow {
  color: #1e293b;
  font-size: 9px;
}
.target-track-panel {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  background: rgba(239, 68, 68, 0.02);
  padding: 4px;
  border-radius: 2px;
  margin-bottom: 4px;
}
/* 作战群组 — 编组平台区域 */
.platform-section {
  background: rgba(5, 11, 20, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 3px;
  padding: 4px 5px;
  margin-bottom: 3px;
}
.pl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}
.pl-header-lbl {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
}
.online-badge {
  font-size: 9px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(16, 185, 129, 0.25);
  font-weight: bold;
}
.pl-tags-wrap {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}
.pl-tags-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  flex: 1;
}
.pl-tag {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.tag-online {
  color: #a7f3d0;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.tag-offline {
  color: #64748b;
  background: rgba(100, 116, 139, 0.08);
  border: 1px solid rgba(100, 116, 139, 0.12);
}
.pl-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-online {
  background: #10b981;
  box-shadow: 0 0 5px rgba(16, 185, 129, 0.6);
}
.dot-offline {
  background: #64748b;
}
.pl-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pl-more-btn {
  font-size: 9px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 2px 6px;
  border-radius: 2px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.pl-more-btn:hover {
  background: rgba(56, 189, 248, 0.2);
}

/* 作战群组 — 时间两排 */
.time-period-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 9px;
  padding: 2px 0;
}
.tp-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.tp-val {
  font-weight: bold;
}

.task-extra-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 10px;
  padding: 5px 6px;
  background: rgba(5, 11, 20, 0.4);
  border: 1px solid rgba(56, 189, 248, 0.06);
  border-radius: 3px;
  margin-top: 3px;
}
.extra-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* 应用微服务 */
.service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-content: start;
}
.service-circle-card {
  background: linear-gradient(
    135deg,
    rgba(13, 21, 34, 0.9),
    rgba(8, 14, 24, 0.95)
  );
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 6px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  animation: fadeSlideUp 0.5s ease both;
  transition: all 0.3s ease;
}
.service-circle-card:nth-child(1) {
  animation-delay: 0s;
}
.service-circle-card:nth-child(2) {
  animation-delay: 0.06s;
}
.service-circle-card:nth-child(3) {
  animation-delay: 0.12s;
}
.service-circle-card:nth-child(4) {
  animation-delay: 0.18s;
}
.service-circle-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.06);
  transform: translateY(-1px);
}
.card-alive {
  border-top: 2px solid #10b981;
}
.card-dead {
  border-top: 2px solid #ef4444;
  opacity: 0.7;
}

.scc-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}
.scc-name {
  font-size: 10px;
  font-weight: bold;
  color: #e2e8f0;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scc-status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.st-green {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}
.st-red {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
}

.scc-circus {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 4px 0;
}
.scc-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.scc-svg {
  width: 42px;
  height: 42px;
  transform: rotate(-90deg);
}
.scc-svg .ring-bg {
  fill: none;
  stroke: #172438;
  stroke-width: 3.2;
}
.scc-svg .ring-fill {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 3.2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}
.scc-svg .ring-fill.mem {
  stroke: #f59e0b;
}
.scc-svg .ring-text {
  transform: rotate(90deg);
  transform-origin: 18px 18px;
  fill: #cbd5e1;
  font-size: 8px;
  text-anchor: middle;
  dominant-baseline: central;
}
.scc-label {
  font-size: 9px;
  color: #64748b;
}
.scc-footer {
  font-size: 9px;
  color: #64748b;
  text-align: center;
}

/* 警报状态定义 */
.lvl-crit {
  border-left-color: #ef4444 !important;
}
.lvl-warn {
  border-left-color: #f59e0b !important;
}
.lvl-safe {
  border-left-color: #10b981 !important;
}
.badge-CRIT,
.badge-3 {
  color: #ef4444;
}
.badge-WARN,
.badge-2 {
  color: #f59e0b;
}

@keyframes alert-pulse {
  0%,
  100% {
    border-color: #1e293b;
    box-shadow: none;
  }
  50% {
    border-color: rgba(239, 68, 68, 0.4);
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.2);
  }
}
.alert-flash-border {
  animation: alert-pulse 2s infinite ease-in-out;
}

.empty-holder {
  text-align: center;
  font-size: 11px;
  color: #223147;
  padding: 20px;
  border: 1px dashed #111b2b;
}
.text-green {
  color: #10b981 !important;
}
.text-red {
  color: #ef4444 !important;
}
.text-blue {
  color: #38bdf8 !important;
}
.text-cyan {
  color: #06b6d4 !important;
}
.text-orange {
  color: #f59e0b !important;
}
.text-gray {
  color: #94a3b8 !important;
}
</style>

<style>
/* el-popover 深色主题 — 全局样式 */
.dark-pl-popover {
  background: #0d1522 !important;
  border: 1px solid #1e2d4a !important;
  border-radius: 4px !important;
  padding: 8px 10px !important;
  max-height: 200px;
  overflow-y: auto;
}
.dark-pl-popover .popper__arrow {
  display: none !important;
}
.dark-pl-popover .popover-pl-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dark-pl-popover .popover-pl-item {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 4px;
  border-radius: 2px;
}
.dark-pl-popover .popover-pl-item:hover {
  background: rgba(56, 189, 248, 0.06);
}
</style>
