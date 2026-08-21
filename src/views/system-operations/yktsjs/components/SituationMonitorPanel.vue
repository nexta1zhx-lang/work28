<template>
  <div class="situation-monitor">
    <!-- 左侧面板：资源状态监控 -->
    <transition name="sm-slide">
      <div v-show="panelOpen" class="sm-panel">
        <!-- 头部：平台列表 / 平台详情 -->
        <div class="sm-head">
          <template v-if="activePlatform">
            <el-button
              size="mini"
              icon="el-icon-back"
              class="sm-back-btn"
              @click="backToList"
              >返回</el-button
            >
            <span class="sm-title" :title="ptName(activePlatform)">{{
              ptName(activePlatform)
            }}</span>
            <span class="sm-head-type">{{ ptTypeName(activePlatform) }}</span>
          </template>
          <template v-else>
            <span class="sm-title">
              <i class="el-icon-odometer sm-head-ico"></i>态势监控 · 资源状态
            </span>
            <el-button
              size="mini"
              icon="el-icon-refresh"
              :loading="loadingPlatforms"
              @click="loadAll"
              >刷新</el-button
            >
          </template>
        </div>

        <!-- ===== 一级：平台列表 ===== -->
        <template v-if="!activePlatform">
          <div class="sm-summary">
            <div
              class="sm-stat"
              v-for="s in summaryStats"
              :key="s.label"
              :style="s.color ? {color: s.color} : null"
            >
              <div class="sm-stat-num">{{ s.value }}</div>
              <div class="sm-stat-label">{{ s.label }}</div>
            </div>
          </div>

          <!-- 控制栏：仅显示异常平台 -->
          <div class="sm-toolbar">
            <span class="sm-toolbar-label">
              <i class="el-icon-warning-outline"></i>仅异常平台
            </span>
            <el-switch
              v-model="showAbnormalOnly"
              size="mini"
              active-color="#ef4444"
            />
            <span v-if="showAbnormalOnly" class="sm-toolbar-count"
              >{{ abnormalCount }} 个异常</span
            >
            <el-button
              size="mini"
              :type="hideAll ? 'warning' : 'default'"
              icon="el-icon-hide"
              class="sm-toolbar-btn"
              @click="toggleHideAll"
              >{{ hideAll ? '显示全部' : '隐藏所有' }}</el-button
            >
          </div>

          <div class="sm-list-wrap">
            <el-input
              v-model="keyword"
              size="mini"
              prefix-icon="el-icon-search"
              placeholder="筛选平台名称…"
              clearable
              class="sm-search"
            />
            <div v-if="loadingPlatforms" class="sm-tip-row">
              <i class="el-icon-loading"></i>平台加载中…
            </div>
            <div v-else-if="!filteredPlatforms.length" class="sm-tip-row">
              暂无平台数据
            </div>
            <div v-else class="sm-list">
              <div
                v-for="p in filteredPlatforms"
                :key="ptKey(p)"
                class="sm-item sm-clickable"
                :class="{'sm-hidden': isPtHidden(p)}"
                @click="openPlatform(p)"
              >
                <div class="sm-item-main">
                  <div class="sm-item-name">
                    {{ ptName(p) }}
                    <span v-if="isAbnormalPt(p)" class="sm-abnormal-badge"
                      >异常</span
                    >
                  </div>
                  <div class="sm-item-sub">
                    {{ ptTypeName(p) }}
                    <template v-if="ptLon(p) != null && ptLat(p) != null">
                      · 经度{{ (+ptLon(p)).toFixed(1) }} 纬度{{
                        (+ptLat(p)).toFixed(1)
                      }}</template
                    >
                    <template v-if="ptGd(p) != null">
                      · 高度{{ ptGd(p) }}m</template
                    >
                  </div>
                </div>
                <i
                  class="sm-eye"
                  :title="
                    isPtHidden(p) ? '隐藏中，点击显示' : '显示中，点击隐藏'
                  "
                  @click.stop="togglePtVisibility(p)"
                >
                  <!-- 隐藏态：眼睛 + 斜杠 -->
                  <svg
                    v-if="isPtHidden(p)"
                    class="sm-eye-ico"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                    />
                    <path
                      d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <!-- 显示态：眼睛 -->
                  <svg
                    v-else
                    class="sm-eye-ico"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </i>
                <i class="el-icon-arrow-right sm-go"></i>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== 二级：平台详情（挂载资源 / 告警信息） ===== -->
        <template v-else>
          <div class="sm-tabs">
            <div
              v-for="tab in detailTopTabs"
              :key="tab.key"
              class="sm-tab"
              :class="{active: detailTab === tab.key}"
              @click="switchDetailTab(tab.key)"
            >
              {{ tab.label }}
              <span class="sm-tab-count">{{ tab.count }}</span>
            </div>
          </div>

          <!-- ===== 挂载资源：武器/传感器/设备 ===== -->
          <template v-if="detailTab === 'mount'">
            <div class="sm-subtabs">
              <div
                v-for="tab in detailTabs"
                :key="tab.key"
                class="sm-subtab"
                :class="{active: activeType === tab.key}"
                @click="activeType = tab.key"
              >
                {{ tab.label }}
                <span class="sm-tab-count">{{ tab.count }}</span>
              </div>
            </div>

            <!-- 状态图例 -->
            <div class="sm-legend">
              <span class="sm-legend-label">健康</span>
              <span class="sm-legend-item"
                ><i class="sm-dot sm-dot-jk-run"></i>运行</span
              >
              <span class="sm-legend-item"
                ><i class="sm-dot sm-dot-jk-off"></i>未运行</span
              >
              <span class="sm-legend-item"
                ><i class="sm-dot sm-dot-jk-fault"></i>故障</span
              >
              <span class="sm-legend-label">资源</span>
              <span class="sm-legend-item"
                ><i class="sm-dot sm-dot-zy-free"></i>空闲</span
              >
              <span class="sm-legend-item"
                ><i class="sm-dot sm-dot-zy-busy"></i>占用</span
              >
            </div>

            <!-- 范围显示配置：雷达探测范围 / 武器打击范围 -->
            <div class="sm-rangebar">
              <span class="sm-rangebar-label">范围显示</span>
              <span class="sm-rangebar-item">
                <i class="sm-range-dot sm-range-dot-detect"></i>探测范围
                <el-switch
                  v-model="showDetectRange"
                  size="mini"
                  active-color="#38bdf8"
                />
              </span>
              <span class="sm-rangebar-item">
                <i class="sm-range-dot sm-range-dot-strike"></i>打击范围
                <el-switch
                  v-model="showStrikeRange"
                  size="mini"
                  active-color="#ef4444"
                />
              </span>
            </div>

            <div class="sm-list-wrap">
              <el-input
                v-model="keyword"
                size="mini"
                prefix-icon="el-icon-search"
                placeholder="筛选名称/型号…"
                clearable
                class="sm-search"
              />
              <div v-if="detailLoading" class="sm-tip-row">
                <i class="el-icon-loading"></i>详情加载中…
              </div>
              <div v-else-if="!filteredDetail.length" class="sm-tip-row">
                该平台暂无{{ detailTypeLabel }}数据
              </div>
              <div v-else class="sm-list">
                <div
                  v-for="r in filteredDetail"
                  :key="resKey(r)"
                  class="sm-item"
                >
                  <div class="sm-item-main">
                    <div class="sm-item-name">{{ resName(r) }}</div>
                    <div class="sm-item-sub">{{ resMeta(r) }}</div>
                    <template v-if="activeType === 'device'">
                      <div class="sm-item-progress">
                        <span>负载</span>
                        <el-progress
                          :percentage="pct(r.CPU)"
                          :status="pct(r.CPU) > 80 ? 'exception' : 'success'"
                          :stroke-width="2"
                          :show-text="false"
                        />
                      </div>
                      <div class="sm-item-meta">
                        <span
                          >RAM
                          {{ r.RAM != null ? pct(r.RAM) + '%' : '—' }}</span
                        >
                        <span
                          >温度 {{ r.TEMP != null ? r.TEMP + '℃' : '—' }}</span
                        >
                      </div>
                    </template>
                  </div>
                  <div class="sm-item-status">
                    <span
                      class="sm-badge"
                      :class="jkClass(r.JKZT)"
                      :title="'健康状态：' + (jkMap[r.JKZT] || '—')"
                      >{{ jkText(r.JKZT) }}</span
                    >
                    <span
                      class="sm-badge"
                      :class="zyClass(r.ZYZYZT)"
                      :title="'资源状态：' + (zyMap[r.ZYZYZT] || '—')"
                      >{{ zyText(r.ZYZYZT) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ===== 告警信息 ===== -->
          <template v-else>
            <div class="sm-list-wrap">
              <div v-if="alarmLoading" class="sm-tip-row">
                <i class="el-icon-loading"></i>告警加载中…
              </div>
              <div v-else-if="!alarmList.length" class="sm-tip-row">
                当前无告警信息
              </div>
              <div v-else class="sm-list">
                <div
                  v-for="a in alarmList"
                  :key="a.warnId"
                  class="sm-alarm-item"
                  :class="'lvl' + (a.warnLevel != null ? a.warnLevel : 0)"
                >
                  <div class="sm-alarm-head">
                    <span class="sm-alarm-level"
                      >[{{ warnLevelLabel(a.warnLevel) }}]</span
                    >
                    <span class="sm-alarm-time">{{
                      formatBeijing(a.warnTimestamp)
                    }}</span>
                  </div>
                  <div class="sm-alarm-content">
                    {{ a.warnContent || a.faultName || '未知告警' }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
import L from 'leaflet'
import {
  getPlatformPage,
  getSensorPage,
  getWeaponPage,
  getsbxxPage,
  getPlatformTypeMap
} from '@/api/platform'
import {getPtWarnInfos} from '@/api/warnInfo'

// 状态字典（与 DeviceMonitor 保持一致）
const JK_MAP = {0: '运行', 1: '未运行', 2: '故障'}
const ZY_MAP = {0: '空闲', 1: '占用'}
const PT_TYPE_MAP = {
  1: '指控平台',
  2: '舰艇平台',
  3: '航空平台',
  4: '特种飞机',
  5: '弹载平台',
  6: '星载平台'
}
const WQ_TYPE_MAP = {1: '对陆', 2: '对水面', 3: '对水下', 4: '对空'}
const CG_TYPE_MAP = {
  1: '雷达传感器',
  2: '光学传感器',
  3: '电子传感器'
}
const SB_TYPE_MAP = {
  1: '计算核心',
  2: '存储矩阵',
  3: '通信路由',
  4: '供电伺服'
}

const TABS = [
  {key: 'platform', label: '平台'},
  {key: 'sensor', label: '传感器'},
  {key: 'weapon', label: '武器'},
  {key: 'device', label: '设备'}
]

// 平台详情子页签：仅武器/传感器/设备（按 PTMC 查询）
const DETAIL_TABS = [
  {key: 'weapon', label: '武器'},
  {key: 'sensor', label: '传感器'},
  {key: 'device', label: '设备'}
]

export default {
  name: 'SituationMonitorPanel',
  props: {
    map: {type: Object, default: null}
  },
  data() {
    return {
      panelOpen: true,
      activePlatform: null, // null = 平台列表；否则为当前平台详情
      activeType: 'weapon',
      keyword: '',
      loadingPlatforms: false,
      detailLoading: false,
      platformList: [],
      // 仅显示异常平台
      showAbnormalOnly: false,
      // 隐藏所有平台标记
      hideAll: false,
      // 各平台在地图上的显示/隐藏（ptKey -> bool，true=隐藏）
      hiddenPlatforms: {},
      // 当前选中平台的 武器/传感器/设备（按 PTMC 查询）
      detailData: {weapon: [], sensor: [], device: []},
      // 详情一级页签：mount 挂载资源 / alarm 告警信息
      detailTab: 'mount',
      // 当前平台告警列表
      alarmList: [],
      alarmLoading: false,
      // 平台范围显示开关（探测范围/打击范围）
      showDetectRange: false,
      showStrikeRange: false,
      platformTypeMap: {...PT_TYPE_MAP},
      jkMap: JK_MAP,
      zyMap: ZY_MAP,
      timer: null,
      ptLayer: null,
      rangeLayer: null
    }
  },
  computed: {
    detailTabs() {
      return DETAIL_TABS.map(t => ({
        ...t,
        count: (this.detailData[t.key] || []).length
      }))
    },
    /** 详情一级页签：挂载资源 / 告警信息 */
    detailTopTabs() {
      const mountCount =
        (this.detailData.weapon || []).length +
        (this.detailData.sensor || []).length +
        (this.detailData.device || []).length
      return [
        {key: 'mount', label: '挂载资源', count: mountCount},
        {key: 'alarm', label: '告警信息', count: this.alarmList.length}
      ]
    },
    detailTypeLabel() {
      return DETAIL_TABS.find(t => t.key === this.activeType)?.label || '资源'
    },
    summaryStats() {
      return [
        {label: '平台', value: this.platformList.length},
        {label: '异常', value: this.abnormalCount, color: '#ef4444'}
      ]
    },
    /** 异常平台数量（任一子资源 未运行/故障） */
    abnormalCount() {
      return this.platformList.filter(p => this.isAbnormalPt(p)).length
    },
    /** 按“仅异常平台”过滤后的平台列表 */
    displayPlatforms() {
      if (!this.showAbnormalOnly) return this.platformList
      return this.platformList.filter(p => this.isAbnormalPt(p))
    },
    filteredPlatforms() {
      const kw = this.keyword.trim()
      const base = this.displayPlatforms
      if (!kw) return base
      return base.filter(p =>
        this.ptName(p).toLowerCase().includes(kw.toLowerCase())
      )
    },
    detailList() {
      return this.detailData[this.activeType] || []
    },
    filteredDetail() {
      const kw = this.keyword.trim()
      if (!kw) return this.detailList
      return this.detailList.filter(r =>
        this.resName(r).toLowerCase().includes(kw.toLowerCase())
      )
    }
  },
  watch: {
    map(v) {
      if (v) {
        this.ensureLayers()
        this.renderPlatforms()
        this.renderRanges()
      }
    },
    // 切换“仅异常平台”时重绘地图标记
    showAbnormalOnly() {
      this.renderPlatforms()
    },
    // 范围开关变化时动态显示/隐藏范围圆
    showDetectRange() {
      this.renderRanges()
    },
    showStrikeRange() {
      this.renderRanges()
    }
  },
  mounted() {
    this.ensureLayers()
    this.loadAll()
    this.timer = setInterval(() => this.loadAll(true), 5000)
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
    this.destroyLayers()
  },
  methods: {
    ptKey(p) {
      return p.PTXXID != null ? 'pt_' + p.PTXXID : this.ptName(p)
    },
    ptName(p) {
      return p.PTMC || p.ptmc || '未命名平台'
    },
    ptTypeName(p) {
      return this.platformTypeMap[p.PTLX] || '未知类型'
    },
    /** 平台经度（兼容大小写字段） */
    ptLon(p) {
      return p.PTJD != null ? p.PTJD : p.ptjd
    },
    /** 平台纬度（兼容大小写字段） */
    ptLat(p) {
      return p.PTWD != null ? p.PTWD : p.ptwd
    },
    /** 平台高度（兼容大小写字段） */
    ptGd(p) {
      return p.PTGD != null ? p.PTGD : p.ptgd
    },
    /** 平台是否异常：任一子资源（武器/设备/传感器）为 未运行(1) 或 故障(2) */
    isAbnormalPt(p) {
      const assets = [
        ...(p.wqxxs || []),
        ...(p.sbzts || []),
        ...(p.cgqxxs || [])
      ]
      return assets.some(a => {
        const jk = Number(a.JKZT)
        return jk === 1 || jk === 2
      })
    },
    /** 平台地图标记是否隐藏 */
    isPtHidden(p) {
      return !!this.hiddenPlatforms[this.ptKey(p)]
    },
    /** 切换平台标记显示/隐藏 */
    togglePtVisibility(p) {
      const k = this.ptKey(p)
      this.$set(this.hiddenPlatforms, k, !this.isPtHidden(p))
      this.renderPlatforms()
    },
    /** 隐藏所有/显示全部平台标记 */
    toggleHideAll() {
      this.hideAll = !this.hideAll
      if (!this.hideAll) {
        // 显示全部时清空单个隐藏状态
        this.hiddenPlatforms = {}
      }
      this.renderPlatforms()
    },
    resKey(r) {
      const id = r.WQXXID || r.CGQXXID || r.SBXXID || r.ZYXH || r.id
      return id != null ? this.activeType + '_' + id : this.resName(r)
    },
    resName(r) {
      return (
        r.WQXHMC || r.CGQXHMC || r.SBXHMC || r.SBMC || r.name || '未命名资源'
      )
    },
    resMeta(r) {
      if (this.activeType === 'sensor')
        return (
          '类型 ' +
          (CG_TYPE_MAP[r.CGQLX] || r.CGQLX || '—') +
          (r.TCFW != null ? ' · 探测' + r.TCFW + 'km' : '') +
          (r.RCS != null ? ' · 精度' + r.RCS : '') +
          (r.GZMS != null ? ' · 模式' + r.GZMS : '')
        )
      if (this.activeType === 'weapon')
        return (
          '类型 ' +
          (WQ_TYPE_MAP[r.WQLX] || '—') +
          (r.DJFW != null ? ' · 射程' + r.DJFW + 'km' : '') +
          (r.DJJD != null ? ' · 精度' + r.DJJD + 'km' : '') +
          (r.DJCGL != null
            ? ' · 成功率' + Math.round(+r.DJCGL * 100) + '%'
            : '') +
          (r.GZSL != null ? ' · 挂载' + r.GZSL : '')
        )
      return '类型 ' + (SB_TYPE_MAP[r.SBLX] || r.SBLX || '—')
    },
    jkClass(v) {
      if (v == null) return 'sm-jk-na'
      const n = Number(v)
      if (n === 2) return 'sm-jk-fault'
      if (n === 1) return 'sm-jk-off'
      return 'sm-jk-run'
    },
    zyClass(v) {
      if (v == null) return 'sm-zy-na'
      return Number(v) === 1 ? 'sm-zy-busy' : 'sm-zy-free'
    },
    /** 健康状态文本（空值显示 —） */
    jkText(v) {
      return v != null ? this.jkMap[v] || '未知' : '—'
    },
    /** 资源状态文本（空值显示 —） */
    zyText(v) {
      return v != null ? this.zyMap[v] || '未知' : '—'
    },
    /** 百分比归一：0~1 小数乘 100，0~100 原样，封顶 100（RAM/CPU 占用率） */
    pct(v) {
      const n = +v
      if (isNaN(n)) return 0
      const p = n <= 1 ? n * 100 : n
      return Math.min(100, Math.round(p))
    },
    /** 时间戳 -> 北京时间 YYYY-MM-DD HH:mm:ss（UTC+8） */
    formatBeijing(ts) {
      if (ts == null || ts === '') return '—'
      const s = String(ts).trim()
      const p = n => String(n).padStart(2, '0')
      const fmt = d =>
        `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(
          d.getUTCDate()
        )} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(
          d.getUTCSeconds()
        )}`
      // 已是可读日期字符串直接返回
      if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) return s
      // 纯数字：秒或毫秒时间戳 -> 北京
      if (/^\d+(\.\d+)?$/.test(s)) {
        let ms = Number(ts)
        if (ms < 1e12) ms *= 1000
        const d = new Date(ms + 8 * 3600 * 1000)
        return isNaN(d.getTime()) ? s : fmt(d)
      }
      // 其他可解析日期（ISO 带 Z 等）-> 北京
      const d = new Date(ts)
      if (isNaN(d.getTime())) return s
      return fmt(new Date(d.getTime() + 8 * 3600 * 1000))
    },
    /** tooltip 键值行 */
    tipRow(k, v) {
      return `<div class="sm-ptip-row"><span class="sm-ptip-k">${k}</span><span class="sm-ptip-v">${v}</span></div>`
    },

    ensureLayers() {
      if (!this.map) return
      if (!this.ptLayer) this.ptLayer = L.layerGroup().addTo(this.map)
      if (!this.rangeLayer) this.rangeLayer = L.layerGroup().addTo(this.map)
    },
    destroyLayers() {
      if (this.ptLayer && this.map) this.map.removeLayer(this.ptLayer)
      if (this.rangeLayer && this.map) this.map.removeLayer(this.rangeLayer)
      this.ptLayer = null
      this.rangeLayer = null
    },

    async fetchTypeMap() {
      try {
        const res = await getPlatformTypeMap()
        if (res?.data)
          this.platformTypeMap = {...this.platformTypeMap, ...res.data}
      } catch (e) {
        /* 使用硬编码字典 */
      }
    },

    /** 加载平台列表（静默轮询时不显示 loading） */
    async loadAll(silent = false) {
      if (!silent) this.loadingPlatforms = true
      try {
        const res = await getPlatformPage({
          pageNum: 1,
          pageSize: 9999,
          params: {}
        })
        this.platformList = res?.data?.list || res?.rows || []
        this.renderPlatforms()
        // 处于详情页时同步刷新该平台详情与告警
        if (this.activePlatform) {
          this.loadPlatformDetail(this.activePlatform, true)
          this.loadAlarms(this.activePlatform, true)
        }
      } catch (e) {
        console.error('平台列表加载失败', e)
      } finally {
        if (!silent) this.loadingPlatforms = false
      }
    },

    /** 点击平台：进入详情（挂载资源/告警信息），按 PTMC 查询资源、按 PTID 查询告警，并锁定地图 */
    async openPlatform(p) {
      this.activePlatform = p
      this.activeType = 'weapon'
      this.detailTab = 'mount'
      this.keyword = ''
      await this.loadPlatformDetail(p)
      this.loadAlarms(p)
      this.lockToPlatform(p)
    },
    backToList() {
      this.activePlatform = null
      this.clearRanges()
    },
    /** 清除所有范围圆 */
    clearRanges() {
      if (this.rangeLayer) this.rangeLayer.clearLayers()
    },
    /** 动态绘制/清除平台探测范围（传感器 TCFW）与打击范围（武器 DJFW）圆 */
    renderRanges() {
      if (!this.rangeLayer) return
      this.rangeLayer.clearLayers()
      const p = this.activePlatform
      if (!p) return
      const lon = Number(p.PTJD ?? p.ptjd)
      const lat = Number(p.PTWD ?? p.ptwd)
      if (isNaN(lon) || isNaN(lat)) return
      // 标签分散角度（同半径圆避免重叠）
      let labelIdx = 0
      if (this.showDetectRange) {
        const sensors = this.detailData.sensor || []
        sensors.forEach(s => {
          const km = Number(s.TCFW)
          if (isNaN(km) || km <= 0) return
          L.circle([lat, lon], {
            radius: km * 1000,
            color: '#38bdf8',
            weight: 1.2,
            opacity: 0.8,
            fillColor: '#38bdf8',
            fillOpacity: 0.08,
            className: 'sm-range-detect'
          })
            .bindTooltip(`探测范围 ${km}km`, {
              direction: 'top',
              className: 'sm-range-tip',
              opacity: 0.95
            })
            .addTo(this.rangeLayer)
          this.addRangeLabel(
            lat,
            lon,
            km,
            `${s.CGQXHMC || s.cgqxhmc || '传感器'} ${km}km`,
            '#38bdf8',
            labelIdx++
          )
        })
      }
      if (this.showStrikeRange) {
        const weapons = this.detailData.weapon || []
        weapons.forEach(w => {
          const km = Number(w.DJFW)
          if (isNaN(km) || km <= 0) return
          L.circle([lat, lon], {
            radius: km * 1000,
            color: '#ef4444',
            weight: 1.2,
            opacity: 0.8,
            fillColor: '#ef4444',
            fillOpacity: 0.08,
            className: 'sm-range-strike'
          })
            .bindTooltip(`打击范围 ${km}km`, {
              direction: 'top',
              className: 'sm-range-tip',
              opacity: 0.95
            })
            .addTo(this.rangeLayer)
          this.addRangeLabel(
            lat,
            lon,
            km,
            `${w.WQXHMC || w.wqxhmc || '武器'} ${km}km`,
            '#ef4444',
            labelIdx++
          )
        })
      }
    },
    /** 在范围圆边缘放置名称标签（按角度分散，避免同半径重叠） */
    addRangeLabel(lat, lon, km, text, color, idx) {
      const angle = ((idx || 0) * 50 * Math.PI) / 180
      const dLat = (km / 111.32) * Math.cos(angle)
      const dLon =
        (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
      L.marker([lat + dLat, lon + dLon], {
        icon: L.divIcon({
          className: 'sm-range-label-icon',
          html: `<span class="sm-range-label" style="color:${color};border-color:${color}">${text}</span>`,
          iconSize: null,
          iconAnchor: [0, 0]
        }),
        interactive: false
      }).addTo(this.rangeLayer)
    },
    /** 地图锁定到平台位置，缩放到 Z7 */
    lockToPlatform(p) {
      if (!this.map) return
      const lon = Number(p.PTJD ?? p.ptjd)
      const lat = Number(p.PTWD ?? p.ptwd)
      if (isNaN(lon) || isNaN(lat)) return
      this.map.flyTo([lat, lon], 7, {duration: 1.2})
    },

    /** 按 PTMC 查询该平台的武器/传感器/设备 */
    async loadPlatformDetail(p, silent = false) {
      if (!silent) this.detailLoading = true
      const ptmc = p.PTMC || p.ptmc || ''
      try {
        const [resWq, resCg, resSb] = await Promise.all([
          getWeaponPage({pageNum: 1, pageSize: 9999, params: {PTMC: ptmc}}),
          getSensorPage({pageNum: 1, pageSize: 9999, params: {PTMC: ptmc}}),
          getsbxxPage({pageNum: 1, pageSize: 9999, params: {PTMC: ptmc}})
        ])
        this.detailData.weapon = resWq?.data?.list || resWq?.rows || []
        this.detailData.sensor = resCg?.data?.list || resCg?.rows || []
        this.detailData.device = resSb?.data?.list || resSb?.rows || []
        // 详情数据更新后重绘范围圆
        this.renderRanges()
      } catch (e) {
        console.error('平台详情加载失败', e)
      } finally {
        if (!silent) this.detailLoading = false
      }
    },

    /** 把有坐标的平台绘制到地图（状态色圆点 + 名称） */
    /** 平台点悬浮提示：类型 + 经纬度/高度/速度/航向/俯仰/横滚/时间（紧凑行式 + 单位） */
    platformTip(p) {
      let html = `<b class="sm-ptip-title">${this.ptName(p)}</b>`
      const type = this.ptTypeName(p)
      if (type) html += this.tipRow('类型', type)
      const lon = this.ptLon(p)
      const lat = this.ptLat(p)
      if (lon != null && lat != null) {
        html += this.tipRow('经度', (+lon).toFixed(1) + '°')
        html += this.tipRow('纬度', (+lat).toFixed(1) + '°')
      }
      const gd = this.ptGd(p)
      if (gd != null) html += this.tipRow('高度', gd + 'm')
      if (p.PTSD != null) html += this.tipRow('速度', p.PTSD + 'm/s')
      if (p.PTHX != null) html += this.tipRow('航向', p.PTHX + '°')
      if (p.PTFY != null) html += this.tipRow('俯仰', p.PTFY + '°')
      if (p.PTHG != null) html += this.tipRow('横滚', p.PTHG + '°')
      if (p.PTSJ != null)
        html += this.tipRow('时间', this.formatBeijing(p.PTSJ))
      return `<div class="sm-ptip">${html}</div>`
    },

    /** 告警级别标签 */
    warnLevelLabel(lvl) {
      const maps = {0: '无', 1: '一般', 2: '中度', 3: '严重'}
      return maps[lvl] !== undefined ? maps[lvl] : '未知'
    },
    /** 切换详情一级页签：mount 挂载资源 / alarm 告警信息 */
    switchDetailTab(key) {
      this.detailTab = key
      if (key === 'alarm' && this.activePlatform) {
        this.loadAlarms(this.activePlatform)
      }
    },
    /** 加载当前平台告警列表（按 PTID 查询，展示在左侧详情“告警信息”tab） */
    async loadAlarms(p, silent = false) {
      if (!p) return
      if (!silent) this.alarmLoading = true
      const ptid = p.PTID != null ? p.PTID : p.ptid
      try {
        const res = await getPtWarnInfos(ptid)
        this.alarmList = res?.data?.list || res?.rows || res?.data || []
      } catch (e) {
        this.alarmList = []
      } finally {
        if (!silent) this.alarmLoading = false
      }
    },

    renderPlatforms() {
      if (!this.ptLayer) return
      this.ptLayer.clearLayers()
      // 隐藏所有时不再绘制任何平台标记
      if (this.hideAll) return
      const colorMap = {2: '#ef4444', 1: '#94a3b8', 0: '#10b981'}
      this.platformList.forEach(p => {
        // 被手动隐藏的平台不绘制
        if (this.isPtHidden(p)) return
        // “仅异常平台”开启时只绘制异常平台
        if (this.showAbnormalOnly && !this.isAbnormalPt(p)) return
        const lon = Number(p.PTJD ?? p.ptjd)
        const lat = Number(p.PTWD ?? p.ptwd)
        if (isNaN(lon) || isNaN(lat)) return
        const color = colorMap[Number(p.JKZT)] || '#10b981'
        const name = p.PTMC || p.ptmc || ''
        const icon = L.divIcon({
          className: 'sm-pt-icon',
          html: `<div class="sm-pt"><span class="sm-pt-dot" style="background:${color};box-shadow:0 0 6px ${color}"></span><span class="sm-pt-label">${name}</span></div>`,
          iconSize: [96, 20],
          iconAnchor: [4, 4]
        })
        L.marker([lat, lon], {icon, interactive: true})
          .bindTooltip(this.platformTip(p), {
            direction: 'top',
            offset: [0, -6],
            className: 'sm-tooltip',
            opacity: 0.95
          })
          .on('click', () => this.openPlatform(p))
          .addTo(this.ptLayer)
      })
    }
  }
}
</script>

<style scoped lang="scss">
.situation-monitor {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  pointer-events: none; // 地图可交互，面板内部恢复

  .sm-panel {
    position: absolute;
    top: 100px;
    left: 12px;
    height: 80%;
    width: 340px;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    border-radius: 10px;
    border: 1px solid rgba(90, 170, 255, 0.28);
    background: linear-gradient(
      180deg,
      rgba(15, 27, 48, 0.97),
      rgba(10, 18, 32, 0.97)
    );
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);

    .sm-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .sm-back-btn {
        flex-shrink: 0;
      }
      .sm-head-ico {
        color: #38bdf8;
      }
      .sm-title {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        font-weight: 600;
        color: #9fd0ff;
        letter-spacing: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sm-head-type {
        flex-shrink: 0;
        font-size: 11px;
        color: #7fd0ff;
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(127, 208, 255, 0.12);
        border: 1px solid rgba(127, 208, 255, 0.35);
      }
    }

    /* 总览统计 */
    .sm-summary {
      display: flex;
      gap: 8px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .sm-stat {
        flex: 1;
        text-align: center;
        padding: 6px 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);

        .sm-stat-num {
          font-size: 18px;
          font-weight: 700;
          color: #e8eef7;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
        }
        .sm-stat-label {
          font-size: 10px;
          color: #6f8aa8;
          margin-top: 2px;
        }
      }
    }

    /* 控制栏：仅异常平台 */
    .sm-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .sm-toolbar-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #8fb8dc;

        i {
          color: #ef4444;
        }
      }
      .sm-toolbar-count {
        font-size: 11px;
        color: #ef4444;
      }
      .sm-toolbar-btn {
        margin-left: auto;
        flex-shrink: 0;
      }
    }

    /* 资源类型切换 */
    .sm-tabs {
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .sm-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 5px 0;
        font-size: 12px;
        color: #8fb8dc;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
        transition:
          background 0.2s,
          color 0.2s,
          border-color 0.2s;

        &:hover {
          color: #fff;
        }
        &.active {
          color: #7fd0ff;
          background: rgba(127, 208, 255, 0.12);
          border-color: rgba(127, 208, 255, 0.4);
        }
        .sm-tab-count {
          font-size: 10px;
          color: #6f8aa8;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
        }
      }
    }

    /* 挂载资源子页签（武器/传感器/设备） */
    .sm-subtabs {
      display: flex;
      gap: 6px;
      padding: 6px 14px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .sm-subtab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 0;
        font-size: 11px;
        color: #7d92ab;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition:
          color 0.2s,
          border-color 0.2s;

        &:hover {
          color: #fff;
        }
        &.active {
          color: #7fd0ff;
          border-bottom-color: #38bdf8;
        }
        .sm-tab-count {
          font-size: 10px;
          color: #6f8aa8;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
        }
      }
    }

    /* 告警列表项 */
    .sm-alarm-item {
      padding: 7px 10px;
      margin-bottom: 6px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-left: 3px solid #64748b;

      &.lvl3 {
        border-left-color: #ef4444;
      }
      &.lvl2 {
        border-left-color: #f97316;
      }
      &.lvl1 {
        border-left-color: #facc15;
      }

      .sm-alarm-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;

        .sm-alarm-level {
          font-size: 11px;
          font-weight: 600;
          color: #7fd0ff;
        }
        .sm-alarm-time {
          font-size: 10px;
          color: #6f8aa8;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
        }
      }
      .sm-alarm-content {
        font-size: 12px;
        color: #e8eef7;
        margin-top: 3px;
        line-height: 1.4;
        word-break: break-all;
      }
    }

    /* 状态图例 */
    .sm-legend {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 10px;
      padding: 6px 14px;
      font-size: 10px;
      color: #6f8aa8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .sm-legend-label {
        color: #8fb8dc;
      }
      .sm-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .sm-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;
      }
    }
    .sm-dot-jk-run {
      background: #10b981;
    }
    .sm-dot-jk-off {
      background: #94a3b8;
    }
    .sm-dot-jk-fault {
      background: #ef4444;
    }
    .sm-dot-zy-free {
      background: #06b6d4;
    }
    .sm-dot-zy-busy {
      background: #f59e0b;
    }

    /* 范围显示配置 */
    .sm-rangebar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 7px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .sm-rangebar-label {
        font-size: 12px;
        color: #8fb8dc;
        flex-shrink: 0;
      }
      .sm-rangebar-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: #9fb3c8;
        white-space: nowrap;

        .el-switch {
          margin-left: 2px;
        }
      }
      .sm-range-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .sm-range-dot-detect {
        background: #38bdf8;
        box-shadow: 0 0 5px rgba(56, 189, 248, 0.8);
      }
      .sm-range-dot-strike {
        background: #ef4444;
        box-shadow: 0 0 5px rgba(239, 68, 68, 0.8);
      }
    }

    /* 列表 */
    .sm-list-wrap {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 8px 10px 12px;

      .sm-search {
        margin-bottom: 6px;
        flex-shrink: 0;
      }
      .sm-tip-row {
        padding: 18px 14px;
        font-size: 12px;
        color: #6f8aa8;
        text-align: center;
      }
      .sm-list {
        flex: 1;
        overflow-y: auto;
        padding-right: 2px;
      }

      .sm-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition:
          background 0.2s,
          border-color 0.2s,
          opacity 0.2s;

        &.sm-hidden {
          opacity: 0.45;

          .sm-eye {
            color: #f87171; /* 隐藏态：斜杠眼睛用红色醒目显示 */
            opacity: 1;
          }
        }

        &.sm-clickable {
          cursor: pointer;

          &:hover {
            background: rgba(127, 208, 255, 0.1);
            border-color: rgba(127, 208, 255, 0.3);
          }
        }

        .sm-go {
          flex-shrink: 0;
          color: #7fd0ff;
          font-size: 14px;
        }
        .sm-eye {
          flex-shrink: 0;
          display: inline-flex;
          color: #7fd0ff;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition:
            color 0.2s,
            background 0.2s;

          &:hover {
            color: #fff;
            background: rgba(127, 208, 255, 0.15);
          }

          .sm-eye-ico {
            width: 15px;
            height: 15px;
            display: block;
          }
        }

        .sm-item-main {
          flex: 1;
          min-width: 0;

          .sm-item-name {
            font-size: 12.5px;
            color: #e8eef7;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .sm-abnormal-badge {
              display: inline-block;
              margin-left: 6px;
              padding: 0 5px;
              font-size: 10px;
              line-height: 15px;
              border-radius: 4px;
              color: #ef4444;
              background: rgba(239, 68, 68, 0.16);
              border: 1px solid rgba(239, 68, 68, 0.4);
              vertical-align: 1px;
            }
          }
          .sm-item-sub {
            font-size: 11px;
            color: #6f8aa8;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sm-item-progress {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 5px;
            font-size: 10px;
            color: #6f8aa8;

            .el-progress {
              flex: 1;
            }
          }
          .sm-item-meta {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #7fd0ff;
            margin-top: 3px;
          }
        }

        .sm-item-status {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;

          .sm-badge {
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 4px;
            text-align: center;
            white-space: nowrap;
          }
        }
      }
    }
  }
}

/* 面板滑入过渡 */
.sm-slide-enter-active,
.sm-slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.sm-slide-enter,
.sm-slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>

<style lang="scss">
/* ===== 状态徽标配色（全局，供动态 class） ===== */
.sm-jk-run {
  color: #10b981;
  background: rgba(16, 185, 129, 0.16);
  border: 1px solid rgba(16, 185, 129, 0.4);
}
.sm-jk-off {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.4);
}
.sm-jk-fault {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.16);
  border: 1px solid rgba(239, 68, 68, 0.4);
}
.sm-jk-na {
  color: #64748b;
  background: rgba(100, 116, 139, 0.12);
  border: 1px solid rgba(100, 116, 139, 0.35);
}
.sm-zy-free {
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.14);
  border: 1px solid rgba(6, 182, 212, 0.4);
}
.sm-zy-busy {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.16);
  border: 1px solid rgba(245, 158, 11, 0.4);
}
.sm-zy-na {
  color: #64748b;
  background: rgba(100, 116, 139, 0.12);
  border: 1px solid rgba(100, 116, 139, 0.35);
}

/* ===== 平台地图标注 ===== */
.sm-pt-icon {
  background: transparent !important;
  border: none !important;
}
.sm-pt {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.sm-pt-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sm-pt-label {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7);
}

/* ===== 平台点位悬浮提示 ===== */
.sm-tooltip.leaflet-tooltip {
  background: rgba(10, 18, 32, 0.95);
  border: 1px solid rgba(127, 208, 255, 0.35);
  color: #e8eef7;
  font-size: 11px;
  line-height: 1.35;
  padding: 3px 8px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.sm-tooltip.leaflet-tooltip-top::before {
  border-top-color: rgba(127, 208, 255, 0.35);
}

/* ===== 探测/打击范围圆提示 ===== */
.sm-range-tip.leaflet-tooltip {
  background: rgba(10, 18, 32, 0.92);
  border: 1px solid rgba(127, 208, 255, 0.35);
  color: #e8eef7;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* ===== 范围圆边缘名称标签 ===== */
.sm-range-label-icon {
  background: transparent !important;
  border: none !important;
}
.sm-range-label {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  background: rgba(10, 18, 32, 0.85);
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.sm-ptip {
  min-width: 150px;
}
.sm-ptip-title {
  display: block;
  color: #9fd0ff;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 3px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(127, 208, 255, 0.25);
}
.sm-ptip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 1px 0;
}
.sm-ptip-k {
  color: #6f8aa8;
  flex-shrink: 0;
}
.sm-ptip-v {
  color: #e8eef7;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  text-align: right;
}

/* ===== 平台告警信息弹窗 ===== */
.sm-warnpop.leaflet-popup .leaflet-popup-content-wrapper {
  background: linear-gradient(
    180deg,
    rgba(15, 27, 48, 0.98),
    rgba(10, 18, 32, 0.98)
  );
  color: #e8eef7;
  border: 1px solid rgba(127, 208, 255, 0.35);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}
.sm-warnpop.leaflet-popup .leaflet-popup-tip {
  display: none; /* 弹窗位于点位下方，隐藏箭头 */
}
.sm-warnpop.leaflet-popup .leaflet-popup-content {
  margin: 10px 12px;
  line-height: 1.4;
}
.sm-warnpop.leaflet-popup .leaflet-popup-close-button {
  color: #8fb8dc;
  font-size: 15px;
  top: 4px;
  right: 4px;
}
.sm-warnpop-title {
  display: block;
  color: #9fd0ff;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(127, 208, 255, 0.25);
}
.sm-warnpop-empty {
  padding: 10px 4px;
  color: #6f8aa8;
  font-size: 12px;
  text-align: center;
}
.sm-warnpop-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sm-warnpop-item {
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-left: 3px solid #64748b;
}
.sm-warnpop-item.lvl3 {
  border-left-color: #ef4444;
}
.sm-warnpop-item.lvl2 {
  border-left-color: #f97316;
}
.sm-warnpop-item.lvl1 {
  border-left-color: #facc15;
}
.sm-warnpop-item.lvl0 {
  border-left-color: #64748b;
}
.sm-warnpop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.sm-warnpop-level {
  font-size: 11px;
  font-weight: 600;
  color: #7fd0ff;
}
.sm-warnpop-time {
  font-size: 10px;
  color: #6f8aa8;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
}
.sm-warnpop-content {
  font-size: 12px;
  color: #e8eef7;
  margin-top: 2px;
  word-break: break-all;
}
.sm-warnpop-more {
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed rgba(127, 208, 255, 0.25);
  font-size: 10px;
  color: #6f8aa8;
  text-align: center;
}
</style>
