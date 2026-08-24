<template>
  <div class="combat-planning">
    <!-- 顶部 tab：作战筹划（点击展开/收起左侧面板）；父级提供总 tabbar 时隐藏 -->
    <div v-if="showTabbar" class="cp-tabbar">
      <div
        class="cp-tab"
        :class="{active: panelOpen}"
        @click="panelOpen = !panelOpen"
      >
        <i class="el-icon-notebook-2"></i>作战筹划
      </div>
    </div>

    <!-- 左侧面板：任务列表 / 任务详情 -->
    <transition name="cp-slide">
      <div v-show="panelOpen" class="cp-left-panel">
        <!-- ===== 二级：任务详情 ===== -->
        <template v-if="activeTask">
          <div class="cp-head">
            <el-button
              size="mini"
              icon="el-icon-back"
              class="cp-back-btn"
              @click="backToList"
              >返回</el-button
            >
            <span class="cp-title" :title="taskName(activeTask)">{{
              taskName(activeTask)
            }}</span>
            <el-switch
              :value="isTaskVisible(activeTask)"
              @change="v => toggleTask(activeTask, v)"
            />
          </div>

          <el-tabs v-model="activeTab" class="cp-tabs">
            <!-- 编成编组 -->
            <el-tab-pane
              :label="formationLabel"
              name="formation"
              :disabled="!showFormation"
            >
              <div v-if="activeFormationLoading" class="cp-tip-row">
                <i class="el-icon-loading"></i>编成加载中…
              </div>
              <div v-else-if="!activeFormation.length" class="cp-tip-row">
                暂无编成数据
              </div>
              <div v-else class="cp-tab-body">
                <el-tree
                  ref="formationTree"
                  class="cp-tree"
                  :data="formationTree"
                  node-key="key"
                  :props="{label: 'label', children: 'children'}"
                  default-expand-all
                  highlight-current
                  @node-click="handleFormationNodeClick"
                >
                  <span slot-scope="{data}" class="cp-tree-node">
                    <i
                      v-if="
                        data.pt &&
                        (data.pt.PTJD != null || data.pt.ptjd != null)
                      "
                      class="cp-tree-ico el-icon-location-outline"
                    ></i>
                    <span class="cp-tree-name">{{ data.label }}</span>
                    <span
                      v-if="
                        data.pt &&
                        (data.pt.PTJD != null || data.pt.ptjd != null)
                      "
                      class="cp-tree-sub"
                    >
                      {{ (+ptLon(data.pt)).toFixed(1) }},
                      {{ (+ptLat(data.pt)).toFixed(1) }}
                    </span>
                  </span>
                </el-tree>
              </div>
            </el-tab-pane>

            <!-- 作战路线 -->
            <el-tab-pane
              :label="routeLabel"
              name="route"
              :disabled="!showRoutes"
            >
              <div v-if="activeRoutesLoading" class="cp-tip-row">
                <i class="el-icon-loading"></i>路线加载中…
              </div>
              <div v-else-if="!activeRoutes.length" class="cp-tip-row">
                暂无路线数据
              </div>
              <div v-else class="cp-tab-body">
                <div
                  v-for="r in activeRoutes"
                  :key="r.routeId"
                  class="cp-row-item"
                  @click="zoomToRoute(r)"
                >
                  <i class="el-icon-guide cp-row-ico"></i>
                  <div class="cp-row-main">
                    <div class="cp-row-name">
                      {{ routeName(r) }}
                    </div>
                    <div class="cp-row-sub">
                      {{ r.typeName || '—' }} · 转向点{{
                        (activeRoutePointMap[r.routeId] || []).length
                      }}个
                    </div>
                  </div>
                  <span class="cp-row-tag">#{{ r.routeId }}</span>
                </div>
              </div>
            </el-tab-pane>

            <!-- 作战区域 -->
            <el-tab-pane :label="areaLabel" name="area" :disabled="!showAreas">
              <div v-if="activeAreasLoading" class="cp-tip-row">
                <i class="el-icon-loading"></i>区域加载中…
              </div>
              <div v-else-if="!activeAreas.length" class="cp-tip-row">
                暂无区域数据
              </div>
              <div v-else class="cp-tab-body">
                <div
                  v-for="a in activeAreas"
                  :key="a.zzqyid || a.ZZQYID"
                  class="cp-row-item"
                  @click="zoomToArea(a)"
                >
                  <i class="el-icon-map-location cp-row-ico"></i>
                  <div class="cp-row-main">
                    <div class="cp-row-name">{{ a.qymc || a.QYMC }}</div>
                    <div class="cp-row-sub">{{ a.qylx || a.QYLX || '—' }}</div>
                  </div>
                  <span class="cp-row-tag">#{{ a.zzqyid || a.ZZQYID }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>

        <!-- ===== 一级：任务列表 ===== -->
        <template v-else>
          <div class="cp-head">
            <span class="cp-title">作战任务</span>
            <el-button
              size="mini"
              icon="el-icon-refresh"
              :loading="loadingTasks"
              @click="loadTaskList"
              >刷新</el-button
            >
          </div>

          <div class="cp-type-toggle">
            <el-checkbox v-model="showFormation" @change="renderAll"
              >编成</el-checkbox
            >
            <el-checkbox v-model="showRoutes" @change="renderAll"
              >路线</el-checkbox
            >
            <el-checkbox v-model="showAreas" @change="renderAll"
              >区域</el-checkbox
            >
          </div>

          <div class="cp-task-list">
            <div v-if="!taskList.length" class="cp-tip-row">
              {{ loadingTasks ? '任务加载中…' : '暂无作战任务' }}
            </div>
            <div
              v-for="t in taskList"
              :key="t.ZZRWID || t.zzrwid"
              class="cp-task-item"
              :class="{selected: isActive(t)}"
            >
              <el-checkbox
                :value="isTaskVisible(t)"
                @change="v => toggleTask(t, v)"
              />
              <div class="cp-task-main" @click="openTask(t)">
                <div class="cp-task-name">{{ taskName(t) }}</div>
                <div class="cp-task-meta">
                  {{ taskStateOf(t) }}
                  <template v-if="startTime(t)">
                    · 开始 {{ startTime(t) }}</template
                  >
                  <template v-if="duration(t)">
                    · 持续 {{ duration(t) }}</template
                  >
                </div>
              </div>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-arrow-right"
                class="cp-detail-btn"
                @click="openTask(t)"
              />
            </div>
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
import L from 'leaflet'
import {
  taskGetPage,
  getOrganizationByTaskId,
  getRoutePage,
  areaGetPage
} from '@/api/task'
import {getRoutePointPage, getAreaPointPage} from '@/api/datalinkAssurance'

// 平台类型配色
const PT_PALETTE = [
  '#ffd97a',
  '#7fd0ff',
  '#a8f0a8',
  '#f0a8a8',
  '#c8a8f0',
  '#7fe0c0',
  '#f0d07f',
  '#ff9f7f'
]
// 任务主题色（区分多个同时显示的任务）
const TASK_COLORS = [
  '#00d5ff',
  '#f59e0b',
  '#7fd0ff',
  '#a8f0a8',
  '#f0a8a8',
  '#c8a8f0',
  '#7fe0c0',
  '#ffd97a'
]

export default {
  name: 'CombatPlanningPanel',
  props: {
    map: {type: Object, default: null},
    // 由父级控制顶部 tabbar 时置 false（如与“态势监控”共用顶栏切换）
    showTabbar: {type: Boolean, default: true}
  },
  data() {
    return {
      panelOpen: true,
      taskList: [],
      loadingTasks: false,
      showFormation: true,
      showRoutes: true,
      showAreas: true,
      taskVisible: {}, // ZZRWID -> bool 是否在地图上显示
      taskDataCache: {}, // ZZRWID -> {formation, routes, routePointMap, areas, loading, loaded}
      activeTask: null, // 当前打开详情任务
      activeTab: 'formation',
      formationLayer: null,
      routeLayer: null,
      areaLayer: null
    }
  },
  computed: {
    currentEntry() {
      const id = this.taskId(this.activeTask)
      return id ? this.taskDataCache[id] || null : null
    },
    activeFormation() {
      return this.currentEntry ? this.currentEntry.formation || [] : []
    },
    activeRoutes() {
      return this.currentEntry ? this.currentEntry.routes || [] : []
    },
    activeRoutePointMap() {
      return this.currentEntry ? this.currentEntry.routePointMap || {} : {}
    },
    activeAreas() {
      return this.currentEntry ? this.currentEntry.areas || [] : []
    },
    activeFormationLoading() {
      return !!(this.currentEntry && this.currentEntry.formationLoading)
    },
    /** 编成编组 -> 树结构（按 PARENTPTMC 父子关系） */
    formationTree() {
      const list = this.activeFormation
      if (!list.length) return []
      const childrenMap = {}
      list.forEach(p => {
        const key = p.PTMC || p.ptmc
        if (!childrenMap[key]) childrenMap[key] = []
      })
      list.forEach(p => {
        const parent = p.PARENTPTMC || p.parentptmc
        if (parent && childrenMap[parent]) childrenMap[parent].push(p)
      })
      const roots = list.filter(p => {
        const parent = p.PARENTPTMC || p.parentptmc
        return !parent || !childrenMap[parent]
      })
      const toNode = p => ({
        key: String(p.PTID ?? p.ptid ?? p.PTMC ?? p.ptmc),
        label: p.PTMC || p.ptmc || '未命名',
        pt: p,
        children: (childrenMap[p.PTMC || p.ptmc] || []).map(toNode)
      })
      return roots.map(toNode)
    },
    activeRoutesLoading() {
      return !!(this.currentEntry && this.currentEntry.routesLoading)
    },
    activeAreasLoading() {
      return !!(this.currentEntry && this.currentEntry.areasLoading)
    },
    /** 编成 tab 标题（加载中显示 …，加载后显示数量） */
    formationLabel() {
      return this.activeFormationLoading
        ? '编成编组…'
        : `编成编组(${this.activeFormation.length})`
    },
    routeLabel() {
      return this.activeRoutesLoading
        ? '作战路线…'
        : `作战路线(${this.activeRoutes.length})`
    },
    areaLabel() {
      return this.activeAreasLoading
        ? '作战区域…'
        : `作战区域(${this.activeAreas.length})`
    }
  },
  watch: {
    map(v) {
      if (v) this.ensureLayers()
    },
    // 切换 tab 即时请求对应数据并显示
    activeTab(v) {
      if (!this.activeTask) return
      if (v === 'route') this.loadRoutesData(this.activeTask)
      else if (v === 'area') this.loadAreasData(this.activeTask)
    },
    // 多选（编成/路线/区域）与详情 tab 绑定：关闭某类图层时禁用对应 tab
    showFormation(v) {
      if (!v && this.activeTab === 'formation') this.activeTab = 'route'
    },
    showRoutes(v) {
      if (!v && this.activeTab === 'route')
        this.activeTab = this.showAreas ? 'area' : 'formation'
    },
    showAreas(v) {
      if (!v && this.activeTab === 'area')
        this.activeTab = this.showFormation ? 'formation' : 'route'
    }
  },
  mounted() {
    this.loadTaskList()
    if (this.map) this.ensureLayers()
  },
  beforeDestroy() {
    this.destroyLayers()
  },
  methods: {
    taskId(t) {
      return t ? t.ZZRWID || t.zzrwid : null
    },
    taskName(t) {
      return t ? t.RWMC || t.rwmc || '未命名任务' : ''
    },
    isActive(t) {
      return (
        !!this.activeTask && this.taskId(this.activeTask) === this.taskId(t)
      )
    },
    taskState(s) {
      const map = {0: '待命', 1: '启动', 2: '结束'}
      return map[Number(s)] != null ? map[Number(s)] : s || '—'
    },
    taskStateOf(t) {
      return this.taskState(t.STATE != null ? t.STATE : t.state)
    },
    taskColor(t) {
      const idx = this.taskList.findIndex(
        x => this.taskId(x) === this.taskId(t)
      )
      return TASK_COLORS[Math.max(0, idx) % TASK_COLORS.length]
    },
    ptColor(p) {
      return PT_PALETTE[
        Math.abs(Number(p.PTLX ?? p.ptlx) || 0) % PT_PALETTE.length
      ]
    },
    ptType(p) {
      return p.PTLX != null ? p.PTLX : p.ptlx
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
    ptH(p) {
      return p.PTGD != null ? p.PTGD : p.ptgd
    },
    /** 点位悬浮提示：任务名 + 名称 + 经度 + 纬度 + 高度（JD/WD/GD 字段） */
    pointTip(name, p, task) {
      const info = []
      if (p.JD != null) info.push(`经度${(+p.JD).toFixed(1)}`)
      if (p.WD != null) info.push(`纬度${(+p.WD).toFixed(1)}`)
      if (p.GD != null) info.push(`高度${p.GD}m`)
      const tName = task ? task.RWMC || task.rwmc : ''
      // 任务名为标题（块级），点名为首行信息；无任务名时点名为标题
      if (tName) info.unshift(name)
      // 标题为块级（b{display:block}），其后的信息行无需再补 <br/>，避免空行造成间距过大
      return `<b>${tName || name}</b>` + (info.length ? info.join('<br/>') : '')
    },
    /** 转向点悬浮提示（直接显示点名称） */
    routePointTip(p, task) {
      const name =
        p.pointName ||
        p.WZDMC ||
        (p.pointIndex != null ? '转向点' + p.pointIndex : '')
      return this.pointTip(name, p, task)
    },
    /** 区域点悬浮提示（WZDMC 点名称） */
    areaPointTip(p, task) {
      const name = p.WZDMC || '区域点' + (p.WZDXH != null ? p.WZDXH : '')
      return this.pointTip(name, p, task)
    },
    /** 开始时间（毫秒 -> MM-DD HH:mm） */
    startTime(t) {
      const ts = t.STARTTIME != null ? t.STARTTIME : t.starttime
      if (!ts) return ''
      const d = new Date(ts)
      const p = n => String(n).padStart(2, '0')
      return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
        d.getHours()
      )}:${p(d.getMinutes())}`
    },
    /** 持续时间（毫秒 -> 天/时/分） */
    duration(t) {
      const ms = t.RWSJ != null ? t.RWSJ : t.rwsj
      if (!ms) return ''
      const sec = Math.floor(ms / 1000)
      const d = Math.floor(sec / 86400)
      const h = Math.floor((sec % 86400) / 3600)
      const m = Math.floor((sec % 3600) / 60)
      if (d > 0) return `${d}天${h}时`
      if (h > 0) return `${h}时${m}分`
      return `${m}分`
    },
    isTaskVisible(t) {
      return !!this.taskVisible[this.taskId(t)]
    },

    /** 图层组挂到地图 */
    ensureLayers() {
      if (!this.map) return
      if (!this.formationLayer)
        this.formationLayer = L.layerGroup().addTo(this.map)
      if (!this.routeLayer) this.routeLayer = L.layerGroup().addTo(this.map)
      if (!this.areaLayer) this.areaLayer = L.layerGroup().addTo(this.map)
    },
    destroyLayers() {
      const layers = [this.formationLayer, this.routeLayer, this.areaLayer]
      layers.forEach(l => {
        if (l && this.map) this.map.removeLayer(l)
      })
      this.formationLayer = this.routeLayer = this.areaLayer = null
    },
    clearLayers() {
      const layers = [this.formationLayer, this.routeLayer, this.areaLayer]
      layers.forEach(l => l && l.clearLayers())
    },

    /** 加载任务列表 */
    async loadTaskList() {
      this.loadingTasks = true
      try {
        const res = await taskGetPage({pageNum: 1, pageSize: 9999})
        this.taskList = res.data?.list || res.data?.records || []
      } catch (e) {
        this.$message &&
          this.$message.error('作战任务加载失败：' + (e.message || e))
      } finally {
        this.loadingTasks = false
      }
    },

    /** 初始化任务数据缓存条目（$set 保证响应式跟踪，动态新增 key + 深观察属性） */
    ensureEntry(t) {
      const id = this.taskId(t)
      if (!id) return null
      if (!this.taskDataCache[id]) {
        this.$set(this.taskDataCache, id, {
          formation: [],
          routes: [],
          routePointMap: {},
          areas: [],
          areaPoints: [],
          formationLoading: false,
          routesLoading: false,
          areasLoading: false,
          formationLoaded: false,
          routesLoaded: false,
          areasLoaded: false
        })
      }
      return this.taskDataCache[id]
    },

    /** 切换任务是否在地图上显示（显示时加载全部数据） */
    async toggleTask(t, visible) {
      // 用 $set 动态添加/更新 key，保证 Vue2 响应式（列表勾选框与详情右上角开关同步）
      this.$set(this.taskVisible, this.taskId(t), !!visible)
      if (visible) {
        this.ensureEntry(t)
        await Promise.all([
          this.loadFormationData(t),
          this.loadRoutesData(t),
          this.loadAreasData(t)
        ])
      }
      this.renderAll()
    },

    /** 编成数据：点击即请求并显示（已加载则复用缓存） */
    async loadFormationData(t) {
      const e = this.ensureEntry(t)
      if (!e || e.formationLoaded || e.formationLoading) return
      e.formationLoading = true
      try {
        const res = await getOrganizationByTaskId(this.taskId(t))
        e.formation = res.data?.list || res.data || []
      } catch (err) {
        e.formation = []
      } finally {
        e.formationLoading = false
        e.formationLoaded = true
        this.renderAll()
      }
    },

    /** 路线数据：点击即请求并显示（含转向点） */
    async loadRoutesData(t) {
      const e = this.ensureEntry(t)
      if (!e || e.routesLoaded || e.routesLoading) return
      e.routesLoading = true
      const id = this.taskId(t)
      const params = {ZZRWID: id}
      if (t.RWMC || t.rwmc) params.RWMC = t.RWMC || t.rwmc
      try {
        const [rRes, pRes] = await Promise.all([
          getRoutePage({pageNum: 1, pageSize: 9999, params}),
          getRoutePointPage({
            pageNum: 1,
            pageSize: 9999,
            params: {ZZRWID: id}
          })
        ])
        e.routes = rRes.data?.list || rRes.data?.records || []
        const points = pRes.data?.list || pRes.data?.records || []
        const map = {}
        points.forEach(p => {
          if (map[p.routeId] == null) map[p.routeId] = []
          map[p.routeId].push(p)
        })
        Object.keys(map).forEach(k =>
          map[k].sort((a, b) => (a.pointIndex || 0) - (b.pointIndex || 0))
        )
        e.routePointMap = map
      } catch (err) {
        e.routes = []
        e.routePointMap = {}
      } finally {
        e.routesLoading = false
        e.routesLoaded = true
        this.renderAll()
      }
    },

    /** 区域数据：点击即请求并显示 */
    async loadAreasData(t) {
      const e = this.ensureEntry(t)
      if (!e || e.areasLoaded || e.areasLoading) return
      e.areasLoading = true
      const id = this.taskId(t)
      const params = {ZZRWID: id}
      if (t.RWMC || t.rwmc) params.RWMC = t.RWMC || t.rwmc
      try {
        const [aRes, apRes] = await Promise.all([
          areaGetPage({pageNum: 1, pageSize: 9999, params}),
          getAreaPointPage({
            pageNum: 1,
            pageSize: 9999,
            params: {ZZRWID: id}
          })
        ])
        e.areas = aRes.data?.list || aRes.data?.records || []
        e.areaPoints = apRes.data?.list || apRes.data?.records || []
      } catch (err) {
        e.areas = []
        e.areaPoints = []
      } finally {
        e.areasLoading = false
        e.areasLoaded = true
        this.renderAll()
      }
    },

    visibleTasks() {
      return this.taskList.filter(t => this.isTaskVisible(t))
    },

    /** 重绘所有可见任务的图层 */
    renderAll() {
      this.ensureLayers()
      this.clearLayers()
      this.visibleTasks().forEach(t => {
        const d = this.taskDataCache[this.taskId(t)]
        if (!d) return
        const color = this.taskColor(t)
        if (this.showFormation) this.renderFormation(d.formation, color, t)
        if (this.showRoutes)
          this.renderRoutes(d.routes, d.routePointMap, color, t)
        if (this.showAreas) this.renderAreas(d.areas, d.areaPoints, color, t)
      })
    },

    renderFormation(list, color, task) {
      const g = this.formationLayer
      if (!g) return
      const latlngs = []
      list.forEach(p => {
        const lon = Number(p.PTJD ?? p.ptjd)
        const lat = Number(p.PTWD ?? p.ptwd)
        if (isNaN(lon) || isNaN(lat)) return
        latlngs.push([lat, lon])
        const name = p.PTMC || p.ptmc || ''
        const pcolor = this.ptColor(p)
        const icon = L.divIcon({
          className: 'cp-pt-icon',
          html: `<div class="cp-pt"><span class="cp-pt-dot" style="background:${pcolor}"></span><span class="cp-pt-label">${name}</span></div>`,
          iconSize: [96, 20],
          iconAnchor: [4, 4]
        })
        L.marker([lat, lon], {icon, interactive: true})
          .bindTooltip(this.taskTip(task, name), {
            direction: 'top',
            offset: [0, -6],
            className: 'cp-tooltip',
            opacity: 0.95
          })
          .addTo(g)
      })
      // 任务名称标签（显示在编成范围中心）
      const taskName = (task && (task.RWMC || task.rwmc)) || ''
      if (taskName && latlngs.length) {
        const center = L.latLngBounds(latlngs).getCenter()
        const icon = L.divIcon({
          className: 'cp-task-icon',
          html: `<div class="cp-task" style="color:${color};border-color:${color}">${taskName}</div>`,
          iconSize: [220, 26],
          iconAnchor: [110, 13]
        })
        L.marker([center.lat, center.lng], {icon, interactive: false}).addTo(g)
      }
    },

    /** 点击编成树节点：有坐标则定位点位，无坐标则缩放到子节点范围 */
    handleFormationNodeClick(data) {
      if (!data || !data.pt) return
      const p = data.pt
      const lon = Number(p.PTJD ?? p.ptjd)
      const lat = Number(p.PTWD ?? p.ptwd)
      if (!isNaN(lon) && !isNaN(lat)) {
        this.map.setView([lat, lon], Math.max(this.map.getZoom(), 9))
      } else {
        const coords = this.collectChildCoords(data)
        if (coords.length) {
          this.map.fitBounds(L.latLngBounds(coords), {padding: [40, 40]})
        }
      }
    },
    collectChildCoords(node) {
      const out = []
      const walk = n => {
        if (!n) return
        if (n.pt) {
          const lon = Number(n.pt.PTJD ?? n.pt.ptjd)
          const lat = Number(n.pt.PTWD ?? n.pt.ptwd)
          if (!isNaN(lon) && !isNaN(lat)) out.push([lat, lon])
        }
        ;(n.children || []).forEach(walk)
      }
      walk(node)
      return out
    },
    /** 触碰提示前缀：显示作战任务名 */
    taskTip(task, body) {
      const tName = task ? task.RWMC || task.rwmc : ''
      return tName ? `<b>${tName}</b>${body}` : body
    },

    /** 路线名称（兼容多种字段名，优先 routeName） */
    routeName(r) {
      return (
        r.routeName ||
        r.ROUTENAME ||
        r.routename ||
        r.LUXMC ||
        r.luxmc ||
        r.RWMC ||
        '未命名路线'
      )
    },

    renderRoutes(routes, rpMap, color, task) {
      const g = this.routeLayer
      if (!g) return
      routes.forEach(r => {
        const pts = rpMap[r.routeId] || []
        if (!pts.length) return
        const latlngs = pts
          .map(p => [Number(p.WD), Number(p.JD)])
          .filter(x => !isNaN(x[0]) && !isNaN(x[1]))
        if (latlngs.length >= 2) {
          const name = this.routeName(r)
          L.polyline(latlngs, {
            color,
            weight: 2.2,
            opacity: 0.95,
            dashArray: '6 4'
          })
            .bindTooltip(this.taskTip(task, name), {
              direction: 'top',
              offset: [0, -6],
              className: 'cp-tooltip',
              opacity: 0.95
            })
            .addTo(g)

          // 路线名称标签（显示在折线范围中心）
          const center = L.latLngBounds(latlngs).getCenter()
          const rIcon = L.divIcon({
            className: 'cp-rt-icon',
            html: `<div class="cp-rt" style="color:${color};border-color:${color}">${name}</div>`,
            iconSize: [180, 22],
            iconAnchor: [90, 11]
          })
          L.marker([center.lat, center.lng], {
            icon: rIcon,
            interactive: false
          }).addTo(g)
        }
        pts.forEach(p => {
          const lon = Number(p.JD)
          const lat = Number(p.WD)
          if (isNaN(lon) || isNaN(lat)) return
          const icon = L.divIcon({
            className: 'cp-rp-icon',
            html: `<div class="cp-rp" style="border-color:${color};box-shadow:0 0 6px ${color}99">${p.pointIndex != null ? p.pointIndex : ''}</div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })
          L.marker([lat, lon], {icon, interactive: true})
            .bindTooltip(this.routePointTip(p, task), {
              direction: 'top',
              offset: [0, -6],
              className: 'cp-tooltip',
              opacity: 0.95
            })
            .addTo(g)
        })
      })
    },

    renderAreas(areas, areaPoints, color, task) {
      const g = this.areaLayer
      if (!g) return
      areas.forEach(a => {
        const coords = this.parseQyxz(a.qyxz || a.QYXZ)
        if (!coords || coords.length < 3) return
        const latlngs = coords
          .map(c => [Number(c.latitude), Number(c.longitude)])
          .filter(x => !isNaN(x[0]) && !isNaN(x[1]))
        if (latlngs.length < 3) return
        L.polygon(latlngs, {
          color,
          weight: 1.6,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: 0.16
        })
          .bindTooltip(this.taskTip(task, a.qymc || a.QYMC || ''), {
            direction: 'top',
            className: 'cp-tooltip',
            opacity: 0.95
          })
          .addTo(g)
        const center = L.latLngBounds(latlngs).getCenter()
        const icon = L.divIcon({
          className: 'cp-qy-icon',
          html: `<div class="cp-qy" style="color:${color}">${a.qymc || a.QYMC || ''}</div>`,
          iconSize: [140, 20],
          iconAnchor: [70, 10]
        })
        L.marker([center.lat, center.lng], {icon, interactive: false}).addTo(g)
      })
      // 区域转向点（悬浮显示 WZDMC 名称）
      ;(areaPoints || []).forEach(p => {
        const lon = Number(p.JD)
        const lat = Number(p.WD)
        if (isNaN(lon) || isNaN(lat)) return
        const icon = L.divIcon({
          className: 'cp-ap-icon',
          html: `<div class="cp-ap"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        })
        L.marker([lat, lon], {icon, interactive: true})
          .bindTooltip(this.areaPointTip(p, task), {
            direction: 'top',
            className: 'cp-tooltip'
          })
          .addTo(g)
      })
    },

    /** 打开任务详情（点击即请求编成/路线/区域并显示数量；tab 与多选绑定，默认进第一个启用的 tab） */
    openTask(t) {
      this.activeTask = t
      this.activeTab = this.showFormation
        ? 'formation'
        : this.showRoutes
          ? 'route'
          : 'area'
      // 三类数据一起加载，tab 上即可显示数量（已加载过的会自动跳过）
      this.loadFormationData(t)
      this.loadRoutesData(t)
      this.loadAreasData(t)
    },
    /** 返回任务列表 */
    backToList() {
      this.activeTask = null
    },

    /** 定位到路线 */
    zoomToRoute(r) {
      const pts = (this.activeRoutePointMap[r.routeId] || [])
        .map(p => [Number(p.WD), Number(p.JD)])
        .filter(x => !isNaN(x[0]) && !isNaN(x[1]))
      if (this.map && pts.length) {
        this.map.fitBounds(L.latLngBounds(pts), {padding: [40, 40]})
      }
    },
    /** 定位到区域 */
    zoomToArea(a) {
      const coords = this.parseQyxz(a.qyxz || a.QYXZ)
      if (!coords || !this.map) return
      const latlngs = coords
        .map(c => [Number(c.latitude), Number(c.longitude)])
        .filter(x => !isNaN(x[0]) && !isNaN(x[1]))
      if (latlngs.length) {
        this.map.fitBounds(L.latLngBounds(latlngs), {padding: [40, 40]})
      }
    },

    parseQyxz(qyxz) {
      if (!qyxz) return null
      try {
        const obj = typeof qyxz === 'object' ? qyxz : JSON.parse(qyxz)
        return obj.boundary_coordinates || null
      } catch (e) {
        return null
      }
    }
  }
}
</script>

<style scoped lang="scss">
.combat-planning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  pointer-events: none; // 地图可交互，面板内部恢复

  /* 顶部 tab */
  .cp-tabbar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: auto;

    .cp-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 22px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      color: #8fb8dc;
      background: rgba(15, 27, 48, 0.92);
      border: 1px solid rgba(90, 170, 255, 0.28);
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      transition:
        background 0.25s,
        color 0.25s;

      &:hover {
        color: #fff;
      }
      &.active {
        color: #7fd0ff;
        background: rgba(36, 70, 118, 0.95);
        border-color: rgba(127, 208, 255, 0.5);
      }
    }
  }

  /* 左侧面板：固定高度、下移避开左上角缩放加减号，内部滚动 */
  .cp-left-panel {
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

    .cp-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .cp-back-btn {
        flex-shrink: 0;
      }
      .cp-title {
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
    }

    .cp-type-toggle {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 12px;
      color: #9fb3c8;
    }

    .cp-task-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      .cp-task-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 9px 8px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition:
          background 0.2s,
          border-color 0.2s;

        &:hover {
          background: rgba(127, 208, 255, 0.1);
        }
        &.selected {
          border-color: rgba(127, 208, 255, 0.5);
          background: rgba(127, 208, 255, 0.12);
        }

        .cp-task-main {
          flex: 1;
          min-width: 0;
          cursor: pointer;

          .cp-task-name {
            font-size: 13px;
            color: #e8eef7;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .cp-task-meta {
            font-size: 11px;
            color: #6f8aa8;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
        .cp-detail-btn {
          flex-shrink: 0;
        }
      }
    }

    /* 详情 tab 内容 */
    .cp-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .cp-tab-body {
      flex: 1;
      overflow-y: auto;
      padding: 4px 8px 12px;
    }
    .cp-tip-row {
      padding: 18px 14px;
      font-size: 12px;
      color: #6f8aa8;
      text-align: center;
    }

    .cp-row-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      margin-bottom: 6px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      cursor: pointer;
      transition:
        background 0.2s,
        border-color 0.2s;

      &:hover {
        background: rgba(127, 208, 255, 0.1);
      }

      .cp-row-ico {
        color: #7fd0ff;
        font-size: 15px;
        flex-shrink: 0;
      }
      .cp-row-main {
        flex: 1;
        min-width: 0;

        .cp-row-name {
          font-size: 12.5px;
          color: #e8eef7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cp-row-sub {
          font-size: 11px;
          color: #6f8aa8;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .cp-row-tag {
        font-size: 10px;
        color: #7fd0ff;
        flex-shrink: 0;
        font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      }
    }
  }
}

/* 面板滑入过渡 */
.cp-slide-enter-active,
.cp-slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.cp-slide-enter,
.cp-slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>

<style lang="scss">
/* ===== 编成平台标注 ===== */
.cp-pt-icon {
  background: transparent !important;
  border: none !important;
}
.cp-pt {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.cp-pt-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.cp-pt-label {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7);
}

/* ===== 路线转向点 ===== */
.cp-rp-icon {
  background: transparent !important;
  border: none !important;
}
.cp-rp {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 213, 255, 0.22);
  border: 1px solid #00d5ff;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 0 6px rgba(0, 213, 255, 0.6);
}

/* ===== 区域名称 ===== */
.cp-qy-icon {
  background: transparent !important;
  border: none !important;
}
.cp-qy {
  font-size: 12px;
  color: #fbbf24;
  text-align: center;
  letter-spacing: 2px;
  font-weight: 600;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}

/* ===== 路线名称（简约） ===== */
.cp-rt-icon {
  background: transparent !important;
  border: none !important;
}
.cp-rt {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7);
}

/* ===== 任务名称 ===== */
.cp-task-icon {
  background: transparent !important;
  border: none !important;
}
.cp-task {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.95),
    0 0 6px rgba(0, 0, 0, 0.8);
}

/* ===== 编成编组树 ===== */
.combat-planning .cp-tree {
  background: transparent !important;
  color: #cbd5e1;
}
.combat-planning .cp-tree .el-tree-node__content {
  height: 28px;
  background: transparent;
  border-radius: 3px;
}
.combat-planning .cp-tree .el-tree-node__content:hover,
.combat-planning .cp-tree .el-tree-node.is-current > .el-tree-node__content {
  background: rgba(0, 213, 255, 0.1);
}
.combat-planning .cp-tree .el-tree-node__expand-icon {
  color: #7cecff;
}
.combat-planning .cp-tree .el-tree-node__expand-icon.is-leaf {
  color: #475569;
}
.combat-planning .cp-tree .cp-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  color: #cbd5e1;
  overflow: hidden;
  white-space: nowrap;
}
.combat-planning .cp-tree .cp-tree-ico {
  color: #38bdf8;
  font-size: 13px;
  flex-shrink: 0;
}
.combat-planning .cp-tree .cp-tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
.combat-planning .cp-tree .cp-tree-sub {
  margin-left: 4px;
  font-size: 10px;
  color: #64748b;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
}

/* ===== 地图点悬浮提示（路线点/区域点） ===== */
.cp-tooltip.leaflet-tooltip {
  background: rgba(10, 18, 32, 0.95);
  border: 1px solid rgba(127, 208, 255, 0.35);
  color: #e8eef7;
  font-size: 11px;
  line-height: 1.4;
  padding: 3px 7px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.cp-tooltip.leaflet-tooltip-top::before {
  border-top-color: rgba(127, 208, 255, 0.35);
}
.cp-tooltip.leaflet-tooltip b {
  display: block;
  color: #9fd0ff;
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 1px;
  padding-bottom: 1px;
  border-bottom: 1px solid rgba(127, 208, 255, 0.2);
}

/* ===== el-tabs 深色主题（子组件内部元素，需全局样式） ===== */
.cp-tabs.el-tabs {
  .el-tabs__header {
    margin: 8px 10px 8px;
  }
  .el-tabs__nav-wrap::after {
    background: rgba(255, 255, 255, 0.08);
  }
  .el-tabs__item {
    color: #8fb8dc;
    font-size: 12px;
    height: 34px;
    line-height: 34px;
    padding: 0 16px;
  }
  .el-tabs__item.is-disabled {
    color: #41536a;
    cursor: not-allowed;
    opacity: 0.6;
  }
  .el-tabs__item.is-active {
    color: #7fd0ff;
  }
  .el-tabs__active-bar {
    background: #38bdf8;
  }
  .el-tabs__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .el-tab-pane {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
