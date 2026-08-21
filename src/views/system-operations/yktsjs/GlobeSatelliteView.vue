<template>
  <div class="globe-satellite">
    <!-- 3D 地球画布 -->
    <div ref="globeEl" class="globe-canvas"></div>

    <!-- 顶部工具条 -->
    <div class="globe-toolbar">
      <span class="globe-title">3D 卫星地球</span>
      <el-button
        size="mini"
        :type="autoRotate ? 'warning' : ''"
        @click="toggleRotate"
        >自动旋转</el-button
      >
      <el-button
        size="mini"
        type="primary"
        plain
        icon="el-icon-refresh"
        :loading="loading"
        @click="loadPlatforms"
        >刷新点位</el-button
      >
      <span class="globe-count">已加载 {{ total }} 个点位</span>
    </div>

    <!-- 类型图例 -->
    <div v-if="legend.length" class="globe-legend">
      <div v-for="item in legend" :key="item.value" class="legend-item">
        <span class="legend-dot" :style="{background: item.color}"></span>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-count">{{ item.count }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import 'echarts-gl'
import {getPlatformPage, getPlatformTypeMap} from '@/api/platform'

// 类型配色盘（按 PTLX 值顺序分配）
const PALETTE = [
  '#e74c3c',
  '#f39c12',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#16a085',
  '#c0392b',
  '#2980b9',
  '#8e44ad',
  '#27ae60',
  '#d35400',
  '#7f8c8d'
]

// 地球贴图拼接级别（z4：全球 16x16 片 → 4096x4096 等距柱状纹理）
const TEX_ZOOM = 4

export default {
  name: 'GlobeSatelliteView',
  data() {
    return {
      chart: null,
      autoRotate: true,
      loading: false,
      total: 0,
      legend: [],
      platformTypeMap: {}
    }
  },
  async mounted() {
    this.initChart()
    this.loadPlatformTypeMap()
    this.loadPlatforms()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.chart) this.chart.dispose()
    this.chart = null
  },
  methods: {
    /** 初始化 3D 卫星地球 */
    async initChart() {
      this.chart = echarts.init(this.$refs.globeEl)

      // 用本地全球卫星瓦片拼接等距柱状纹理
      const baseTexture = await this.buildEarthTexture(TEX_ZOOM)

      this.chart.setOption({
        backgroundColor: '#050a14',
        globe: {
          baseTexture,
          shading: 'realistic',
          environment: 'none',
          atmosphere: {
            show: true,
            color: '#3a6ea5',
            glowPower: 90
          },
          light: {
            ambient: {intensity: 0.45},
            main: {intensity: 1.35, shadow: 'low'}
          },
          viewControl: {
            autoRotate: this.autoRotate,
            autoRotateSpeed: 5,
            distance: 220,
            minDistance: 80,
            maxDistance: 600,
            alpha: 25,
            beta: 0
          }
        },
        series: []
      })
    },

    /** 拼接全球卫星瓦片为一张 canvas 纹理 */
    buildEarthTexture(z) {
      const n = Math.pow(2, z)
      const size = n * 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      // 底色（极区/无瓦片处）
      ctx.fillStyle = '#0a1a33'
      ctx.fillRect(0, 0, size, size)

      const tasks = []
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          tasks.push(
            this.loadTile(z, x, y)
              .then(img => ctx.drawImage(img, x * 256, y * 256))
              .catch(() => {}) // 缺片忽略
          )
        }
      }
      return Promise.all(tasks).then(() => canvas)
    },

    /** 加载本地瓦片（同源，无需跨域） */
    loadTile(z, x, y) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () =>
          reject(new Error('tile fail ' + z + '/' + x + '/' + y))
        img.src = `/sat/${z}/${x}/${y}.jpg`
      })
    },

    /** 加载平台类型映射 */
    async loadPlatformTypeMap() {
      try {
        const res = await getPlatformTypeMap()
        this.platformTypeMap = res.data || res || {}
      } catch (e) {
        this.platformTypeMap = {}
      }
    },

    /** 分页拉取全量平台点位 */
    async loadPlatforms() {
      this.loading = true
      const list = []
      const pageSize = 1000
      let pageNum = 1
      let total = Infinity
      try {
        while (list.length < total) {
          const res = await getPlatformPage({pageNum, pageSize})
          const data = res.data || res
          const rows = data.list || data.rows || data.records || []
          total = Number(data.total) || rows.length
          list.push(...rows)
          if (!rows.length) break
          pageNum++
          if (pageNum > 100) break // 安全上限
        }
      } catch (e) {
        this.$message &&
          this.$message.error('加载平台数据失败：' + (e.message || e))
      }
      this.renderPoints(list)
      this.loading = false
    },

    /** 渲染平台点位到 3D 地球 */
    renderPoints(list) {
      if (!this.chart) return
      this.total = list.length
      const valid = list.filter(p => {
        const lon = Number(p.PTJD)
        const lat = Number(p.PTWD)
        return (
          !isNaN(lon) &&
          !isNaN(lat) &&
          lon >= -180 &&
          lon <= 180 &&
          lat >= -90 &&
          lat <= 90
        )
      })

      // 类型 → 颜色/图例
      const typeSet = []
      const typeCount = {}
      valid.forEach(p => {
        const t = String(p.PTLX ?? '未知')
        if (!typeSet.includes(t)) typeSet.push(t)
        typeCount[t] = (typeCount[t] || 0) + 1
      })
      this.legend = typeSet.map((t, i) => ({
        value: t,
        label: this.platformTypeMap[t] || t,
        color: PALETTE[i % PALETTE.length],
        count: typeCount[t]
      }))
      const colorOf = t =>
        PALETTE[
          Math.max(0, typeSet.indexOf(String(t ?? '未知'))) % PALETTE.length
        ]

      const data = valid.map(p => ({
        name: p.PTMC || '',
        value: [Number(p.PTJD), Number(p.PTWD), 0], // [经度, 纬度, 高度]
        itemStyle: {color: colorOf(p.PTLX)}
      }))

      this.chart.setOption({
        series: [
          {
            type: 'scatter3D',
            coordinateSystem: 'globe',
            blendMode: 'lighter',
            symbolSize: 7,
            data,
            itemStyle: {opacity: 0.95},
            label: {show: false},
            emphasis: {
              label: {
                show: true,
                formatter: p => p.name,
                color: '#fff',
                fontSize: 12,
                distance: 20
              },
              itemStyle: {opacity: 1}
            }
          }
        ]
      })
    },

    /** 自动旋转开关 */
    toggleRotate() {
      this.autoRotate = !this.autoRotate
      if (this.chart) {
        this.chart.setOption({
          globe: {viewControl: {autoRotate: this.autoRotate}}
        })
      }
    },

    onResize() {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>

<style scoped lang="scss">
.globe-satellite {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #050a14;

  .globe-canvas {
    position: absolute;
    inset: 0;
  }

  .globe-toolbar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(10, 16, 28, 0.88);
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);

    .globe-title {
      color: #7fd0ff;
      font-size: 14px;
      font-weight: 600;
      margin-right: 4px;
    }
    .globe-count {
      font-size: 12px;
      color: #9fb3c8;
      margin-left: 4px;
    }
  }

  .globe-legend {
    position: absolute;
    left: 12px;
    bottom: 32px;
    z-index: 1000;
    padding: 8px 12px;
    background: rgba(10, 16, 28, 0.85);
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
    font-size: 12px;
    color: #cfe0f0;
    max-height: 260px;
    overflow: auto;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;

      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .legend-count {
        color: #7d93ab;
        margin-left: auto;
        padding-left: 10px;
      }
    }
  }
}
</style>
