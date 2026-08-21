<template>
  <div class="target-situation">
    <!-- 左侧面板：目标态势 -->
    <transition name="sm-slide">
      <div v-show="panelOpen" class="ts-panel">
        <!-- 头部：列表 / 详情 -->
        <div class="ts-head">
          <template v-if="activeTarget">
            <el-button
              size="mini"
              icon="el-icon-back"
              class="ts-back-btn"
              @click="backToList"
              >返回</el-button
            >
            <span class="ts-title" :title="tName(activeTarget)">{{
              tName(activeTarget)
            }}</span>
            <span class="ts-head-type">{{ targetTypeName(activeTarget) }}</span>
          </template>
          <template v-else>
            <span class="ts-title">
              <i class="el-icon-s-opportunity ts-head-ico"></i>目标态势
            </span>
            <el-button
              size="mini"
              icon="el-icon-refresh"
              :loading="loading"
              @click="loadTargets"
              >刷新</el-button
            >
          </template>
        </div>

        <!-- ===== 一级：目标列表 ===== -->
        <template v-if="!activeTarget">
          <div class="ts-summary">
            <div
              class="ts-stat"
              v-for="s in summaryStats"
              :key="s.label"
              :style="s.color ? {color: s.color} : null"
            >
              <div class="ts-stat-num">{{ s.value }}</div>
              <div class="ts-stat-label">{{ s.label }}</div>
            </div>
          </div>

          <!-- 控制栏：仅高威胁 -->
          <div class="ts-toolbar">
            <span class="ts-toolbar-label">
              <i class="el-icon-warning-outline"></i>仅高威胁
            </span>
            <el-switch
              v-model="highThreatOnly"
              size="mini"
              active-color="#ef4444"
            />
            <span v-if="highThreatOnly" class="ts-toolbar-count"
              >{{ highThreatCount }} 个</span
            >
          </div>

          <!-- 目标列表 -->
          <div class="ts-list-wrap">
            <el-input
              v-model="keyword"
              size="mini"
              prefix-icon="el-icon-search"
              placeholder="筛选目标名称…"
              clearable
              class="ts-search"
            />
            <div v-if="loading" class="ts-tip-row">
              <i class="el-icon-loading"></i>目标加载中…
            </div>
            <div v-else-if="!filteredTargets.length" class="ts-tip-row">
              暂无目标数据
            </div>
            <div v-else class="ts-list">
              <div
                v-for="t in filteredTargets"
                :key="tKey(t)"
                class="ts-item ts-clickable"
                @click="openTarget(t)"
              >
                <div class="ts-item-main">
                  <div class="ts-item-name">{{ tName(t) }}</div>
                  <div class="ts-item-sub">
                    {{ targetTypeName(t) }}
                    <template v-if="t.MBXHMC || t.mbxhmc">
                      · {{ t.MBXHMC || t.mbxhmc }}</template
                    >
                  </div>
                </div>
                <span
                  class="ts-threat"
                  :class="threatClass(t)"
                  :title="'威胁等级 ' + threatVal(t)"
                  >{{ threatLabel(t) }}</span
                >
                <i class="el-icon-arrow-right ts-go"></i>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== 二级：目标详情（全部信息，含经纬度） ===== -->
        <template v-else>
          <div class="ts-detail">
            <div class="ts-detail-row" v-for="row in detailRows" :key="row.k">
              <span class="ts-detail-k">{{ row.k }}</span>
              <span class="ts-detail-v" :class="{danger: row.danger}">{{
                row.v
              }}</span>
            </div>
            <div class="ts-detail-actions">
              <el-button
                size="mini"
                type="primary"
                icon="el-icon-location"
                @click="focusTarget(activeTarget)"
                >地图定位</el-button
              >
            </div>
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
import L from 'leaflet'
import {targetGetPage} from '@/api/task'

// 目标类型（MBLXID）
const MB_TYPE_MAP = {
  1: '空中目标',
  2: '水面目标',
  3: '水下目标',
  4: '地面目标'
}

export default {
  name: 'TargetSituationPanel',
  props: {
    map: {type: Object, default: null}
  },
  data() {
    return {
      panelOpen: true,
      activeTarget: null, // null = 目标列表；否则为目标详情
      keyword: '',
      loading: false,
      highThreatOnly: false,
      targetList: [],
      timer: null,
      tLayer: null
    }
  },
  computed: {
    highThreatCount() {
      return this.targetList.filter(t => this.threatVal(t) >= 70).length
    },
    /** 目标详情键值行（全部信息，含经纬度） */
    detailRows() {
      const t = this.activeTarget
      if (!t) return []
      const rows = []
      rows.push({k: '目标名称', v: this.tName(t)})
      rows.push({k: '目标类型', v: this.targetTypeName(t)})
      const xh = t.MBXHMC || t.mbxhmc
      if (xh) rows.push({k: '型号', v: xh})
      const lonRaw = t.JD != null ? t.JD : t.jd
      const latRaw = t.WD != null ? t.WD : t.wd
      if (lonRaw != null && latRaw != null) {
        rows.push({k: '经度', v: (+lonRaw).toFixed(1) + '°'})
        rows.push({k: '纬度', v: (+latRaw).toFixed(1) + '°'})
      }
      const gd = t.GD != null ? t.GD : t.gd
      if (gd != null) rows.push({k: '高度', v: gd + 'm'})
      const tv = this.threatVal(t)
      if (tv)
        rows.push({
          k: '威胁等级',
          v: this.threatLabel(t) + '（' + tv + '）',
          danger: true
        })
      const mbid = t.MBID != null ? t.MBID : t.mbid
      if (mbid != null) rows.push({k: '目标ID', v: mbid})
      const bs = t.MBBSH != null ? t.MBBSH : t.mbbsh
      if (bs != null) rows.push({k: '编识号', v: bs})
      return rows
    },
    summaryStats() {
      const withCoord = this.targetList.filter(
        t => (t.JD != null && t.WD != null) || (t.jd != null && t.wd != null)
      ).length
      return [
        {label: '目标', value: this.targetList.length},
        {label: '高威胁', value: this.highThreatCount, color: '#ef4444'},
        {label: '有坐标', value: withCoord, color: '#7fd0ff'}
      ]
    },
    displayTargets() {
      if (!this.highThreatOnly) return this.targetList
      return this.targetList.filter(t => this.threatVal(t) >= 70)
    },
    filteredTargets() {
      const kw = this.keyword.trim()
      const base = this.displayTargets
      if (!kw) return base
      return base.filter(t =>
        this.tName(t).toLowerCase().includes(kw.toLowerCase())
      )
    }
  },
  watch: {
    map(v) {
      if (v) {
        this.ensureLayers()
        this.renderTargets()
      }
    },
    // 切换“仅高威胁”时重绘地图标记
    highThreatOnly() {
      this.renderTargets()
    }
  },
  mounted() {
    this.ensureLayers()
    this.loadTargets()
    this.timer = setInterval(() => this.loadTargets(true), 5000)
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
    this.destroyLayers()
  },
  methods: {
    tKey(t) {
      return t.MBXXID != null ? 'mb_' + t.MBXXID : this.tName(t)
    },
    tName(t) {
      return t.MBMC || t.mbmc || '未命名目标'
    },
    targetTypeName(t) {
      return MB_TYPE_MAP[t.MBLXID] || '未知类型'
    },
    threatVal(t) {
      const v = Number(t.WXDJ != null ? t.WXDJ : t.wxdj)
      return isNaN(v) ? 0 : v
    },
    threatLabel(t) {
      const v = this.threatVal(t)
      if (v >= 70) return '高威胁'
      if (v >= 40) return '中威胁'
      return '低威胁'
    },
    threatClass(t) {
      const v = this.threatVal(t)
      if (v >= 70) return 'ts-threat-high'
      if (v >= 40) return 'ts-threat-mid'
      return 'ts-threat-low'
    },

    /** 点击目标：进入详情并锁定地图 */
    openTarget(t) {
      this.activeTarget = t
      this.focusTarget(t)
    },
    backToList() {
      this.activeTarget = null
    },

    ensureLayers() {
      if (!this.map) return
      if (!this.tLayer) this.tLayer = L.layerGroup().addTo(this.map)
    },
    destroyLayers() {
      if (this.tLayer && this.map) this.map.removeLayer(this.tLayer)
      this.tLayer = null
    },

    /** 加载目标列表（静默轮询时不显示 loading） */
    async loadTargets(silent = false) {
      if (!silent) this.loading = true
      try {
        const res = await targetGetPage({
          pageNum: 1,
          pageSize: 9999,
          params: {}
        })
        this.targetList = res?.data?.list || res?.rows || []
        this.renderTargets()
      } catch (e) {
        console.error('目标态势加载失败', e)
      } finally {
        if (!silent) this.loading = false
      }
    },

    /** 目标点悬浮提示 */
    targetTip(t) {
      const lines = [`<b class="ts-tip-title">${this.tName(t)}</b>`]
      const type = this.targetTypeName(t)
      if (type) lines.push(this.tipRow('类型', type))
      if (t.MBXHMC || t.mbxhmc)
        lines.push(this.tipRow('型号', t.MBXHMC || t.mbxhmc))
      const ll = this.targetLatLon(t)
      if (ll)
        lines.push(
          this.tipRow('坐标', `${ll[1].toFixed(1)}, ${ll[0].toFixed(1)}`)
        )
      const gd = t.GD != null ? t.GD : t.gd
      if (gd != null) lines.push(this.tipRow('高度', gd + 'm'))
      const v = this.threatVal(t)
      if (v) lines.push(this.tipRow('威胁', this.threatLabel(t) + ' ' + v))
      return `<div class="ts-tip">${lines.join('')}</div>`
    },
    tipRow(k, v) {
      return `<div class="ts-tip-row"><span class="ts-tip-k">${k}</span><span class="ts-tip-v">${v}</span></div>`
    },
    /** 目标经纬度 [lat, lon]；无坐标返回 null（null 字段显式判空，避免 Number(null)=0） */
    targetLatLon(t) {
      const lonRaw = t.JD != null ? t.JD : t.jd
      const latRaw = t.WD != null ? t.WD : t.wd
      if (lonRaw == null || latRaw == null) return null
      const lon = Number(lonRaw)
      const lat = Number(latRaw)
      if (isNaN(lon) || isNaN(lat)) return null
      return [lat, lon]
    },

    /** 点击目标：锁定地图到该目标（Z7） */
    focusTarget(t) {
      if (!this.map) return
      const ll = this.targetLatLon(t)
      if (!ll) return
      this.map.flyTo(ll, 7, {duration: 1.2})
    },

    /** 把有坐标的目标绘制到地图（威胁等级配色，菱形标记） */
    renderTargets() {
      if (!this.tLayer) return
      this.tLayer.clearLayers()
      const colorMap = {
        high: '#ef4444',
        mid: '#f87171',
        low: '#fca5a5'
      }
      this.targetList.forEach(t => {
        // “仅高威胁”开启时只绘制高威胁目标
        if (this.highThreatOnly && this.threatVal(t) < 70) return
        const ll = this.targetLatLon(t)
        if (!ll) return
        const [lat, lon] = ll
        const key = this.threatClass(t).replace('ts-threat-', '')
        const color = colorMap[key] || '#ef4444'
        const icon = L.divIcon({
          className: 'ts-pt-icon',
          html: `<div class="ts-pt"><span class="ts-pt-dot" style="background:${color};box-shadow:0 0 8px ${color}"></span><span class="ts-pt-label">${this.tName(t)}</span></div>`,
          iconSize: [120, 20],
          iconAnchor: [4, 4]
        })
        L.marker([lat, lon], {icon, interactive: true})
          .bindTooltip(this.targetTip(t), {
            direction: 'top',
            offset: [0, -6],
            className: 'ts-tooltip',
            opacity: 0.95
          })
          .on('click', () => this.focusTarget(t))
          .addTo(this.tLayer)
      })
    }
  }
}
</script>

<style scoped lang="scss">
.target-situation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  pointer-events: none;

  .ts-panel {
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

    .ts-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .ts-back-btn {
        flex-shrink: 0;
      }
      .ts-head-ico {
        color: #38bdf8;
      }
      .ts-title {
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
      .ts-head-type {
        flex-shrink: 0;
        font-size: 11px;
        color: #f87171;
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(248, 113, 113, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.35);
      }
    }

    /* 目标详情 */
    .ts-detail {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;

      .ts-detail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 8px 10px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);

        .ts-detail-k {
          font-size: 12px;
          color: #6f8aa8;
          flex-shrink: 0;
        }
        .ts-detail-v {
          font-size: 12.5px;
          color: #e8eef7;
          text-align: right;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;

          &.danger {
            color: #ef4444;
            font-weight: 600;
          }
        }
      }

      .ts-detail-actions {
        margin-top: 10px;
        text-align: center;
      }
    }

    .ts-summary {
      display: flex;
      gap: 8px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .ts-stat {
        flex: 1;
        text-align: center;
        padding: 6px 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);

        .ts-stat-num {
          font-size: 18px;
          font-weight: 700;
          color: #e8eef7;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
        }
        .ts-stat-label {
          font-size: 10px;
          color: #6f8aa8;
          margin-top: 2px;
        }
      }
    }

    .ts-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .ts-toolbar-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #8fb8dc;

        i {
          color: #ef4444;
        }
      }
      .ts-toolbar-count {
        font-size: 11px;
        color: #ef4444;
      }
    }

    .ts-list-wrap {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 8px 10px 12px;

      .ts-search {
        margin-bottom: 6px;
        flex-shrink: 0;
      }
      .ts-tip-row {
        padding: 18px 14px;
        font-size: 12px;
        color: #6f8aa8;
        text-align: center;
      }
      .ts-list {
        flex: 1;
        overflow-y: auto;
        padding-right: 2px;
      }

      .ts-item {
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
          border-color 0.2s;

        &.ts-clickable {
          cursor: pointer;

          &:hover {
            background: rgba(127, 208, 255, 0.1);
            border-color: rgba(127, 208, 255, 0.3);
          }
        }

        .ts-go {
          flex-shrink: 0;
          color: #7fd0ff;
          font-size: 14px;
        }

        .ts-item-main {
          flex: 1;
          min-width: 0;

          .ts-item-name {
            font-size: 12.5px;
            color: #e8eef7;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .ts-item-sub {
            font-size: 11px;
            color: #6f8aa8;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .ts-threat {
          flex-shrink: 0;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .ts-threat-high {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.18);
          border: 1px solid rgba(239, 68, 68, 0.5);
        }
        .ts-threat-mid {
          color: #f87171;
          background: rgba(248, 113, 113, 0.16);
          border: 1px solid rgba(248, 113, 113, 0.4);
        }
        .ts-threat-low {
          color: #fca5a5;
          background: rgba(252, 165, 165, 0.14);
          border: 1px solid rgba(252, 165, 165, 0.4);
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
  transform: translateX(-20px);
  opacity: 0;
}
</style>

<style lang="scss">
/* ===== 目标地图标注（菱形点 + 名称） ===== */
.ts-pt-icon {
  background: transparent !important;
  border: none !important;
}
.ts-pt {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.ts-pt-dot {
  width: 9px;
  height: 9px;
  transform: rotate(45deg);
  border-radius: 2px;
  flex-shrink: 0;
}
.ts-pt-label {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7);
}

/* ===== 目标点悬浮提示 ===== */
.ts-tooltip.leaflet-tooltip {
  background: rgba(10, 18, 32, 0.95);
  border: 1px solid rgba(127, 208, 255, 0.35);
  color: #e8eef7;
  font-size: 11px;
  line-height: 1.35;
  padding: 3px 8px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.ts-tooltip.leaflet-tooltip-top::before {
  border-top-color: rgba(127, 208, 255, 0.35);
}
.ts-tip {
  min-width: 140px;
}
.ts-tip-title {
  display: block;
  color: #9fd0ff;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 3px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(127, 208, 255, 0.25);
}
.ts-tip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 1px 0;
}
.ts-tip-k {
  color: #6f8aa8;
  flex-shrink: 0;
}
.ts-tip-v {
  color: #e8eef7;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  text-align: right;
}
</style>
