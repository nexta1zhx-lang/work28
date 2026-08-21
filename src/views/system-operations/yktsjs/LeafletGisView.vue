<template>
  <div class="gis-light-map">
    <!-- 地图容器 -->
    <div ref="mapEl" class="gis-map"></div>

    <!-- 右上角：图层配置齿轮 + 自定义弹窗（弹窗从右侧滑入，齿轮随动左移） -->
    <div class="gis-gear" :class="{open: cfgVisible}">
      <transition name="gis-pop">
        <div v-show="cfgVisible" class="gis-pop">
          <div class="pop-head">
            <span class="pop-title">图层配置</span>
            <i class="el-icon-close pop-close" @click="cfgVisible = false"></i>
          </div>
          <div class="cfg-group">
            <div class="cfg-title">底图影像</div>
            <div class="cfg-item cfg-col">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-picture-outline"></i>
                <span class="cfg-text">
                  <span class="cfg-name">卫星底图</span>
                </span>
              </span>
              <el-radio-group
                v-model="baseSource"
                size="mini"
                class="cfg-base-radios"
                @change="applyBaseSource"
              >
                <el-radio-button label="esri">Esri</el-radio-button>
                <el-radio-button label="gaode">高德</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="cfg-group">
            <div class="cfg-title">边界与行政区</div>
            <div class="cfg-item">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-map-location"></i>
                <span class="cfg-text">
                  <span class="cfg-name">国家边界</span>
                  <span class="cfg-desc">全球各国行政边界</span>
                </span>
              </span>
              <el-switch v-model="showBorders" @change="toggleBorders" />
            </div>
            <div class="cfg-item">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-connection"></i>
                <span class="cfg-text">
                  <span class="cfg-name">海岸线</span>
                  <span class="cfg-desc">全球海岸线轮廓</span>
                </span>
              </span>
              <el-switch v-model="showCoast" @change="toggleCoast" />
            </div>
          </div>
          <div class="cfg-group">
            <div class="cfg-title">地理要素</div>
            <div class="cfg-item">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-s-grid"></i>
                <span class="cfg-text">
                  <span class="cfg-name">经纬度网格</span>
                  <span class="cfg-desc">5° 间隔经纬网</span>
                </span>
              </span>
              <el-switch v-model="gridOn" @change="toggleGrid" />
            </div>
            <div class="cfg-item">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-help"></i>
                <span class="cfg-text">
                  <span class="cfg-name">经纬度标注</span>
                  <span class="cfg-desc">边缘刻度度数</span>
                </span>
              </span>
              <el-switch v-model="showLabels" @change="toggleLabels" />
            </div>
            <div class="cfg-item">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-location-outline"></i>
                <span class="cfg-text">
                  <span class="cfg-name">主要城市</span>
                  <span class="cfg-desc">直辖市 · 省会 · 世界城市</span>
                </span>
              </span>
              <el-switch v-model="showCities" @change="toggleCities" />
            </div>
            <div class="cfg-item">
              <span class="cfg-label">
                <i class="cfg-icon el-icon-postcard"></i>
                <span class="cfg-text">
                  <span class="cfg-name">地名注记</span>
                  <span class="cfg-desc">国家与海域名称</span>
                </span>
              </span>
              <el-switch v-model="showPlaces" @change="togglePlaces" />
            </div>
          </div>
        </div>
      </transition>
      <button
        class="gis-gear-btn"
        :class="{active: cfgVisible}"
        title="图层配置"
        @click="cfgVisible = !cfgVisible"
      >
        <i class="el-icon-setting"></i>
      </button>
    </div>

    <!-- 当前中心坐标 -->
    <div class="gis-coords">
      <span v-if="centerLabel">{{ centerLabel }}</span>
    </div>

    <!-- 顶部：作战筹划 / 态势监控 面板切换 -->
    <div class="gis-panel-tabs">
      <div
        class="gis-panel-tab"
        :class="{active: activePanel === 'plan'}"
        @click="activePanel = 'plan'"
      >
        <i class="el-icon-notebook-2"></i>作战筹划
      </div>
      <div
        class="gis-panel-tab"
        :class="{active: activePanel === 'monitor'}"
        @click="activePanel = 'monitor'"
      >
        <i class="el-icon-odometer"></i>态势监控
      </div>
      <div
        class="gis-panel-tab"
        :class="{active: activePanel === 'target'}"
        @click="activePanel = 'target'"
      >
        <i class="el-icon-s-opportunity"></i>目标态势
      </div>
    </div>

    <!-- 作战筹划面板（独立组件，按任务显示编成/路线/区域；顶栏由上方统一控制） -->
    <combat-planning-panel
      v-show="activePanel === 'plan'"
      :show-tabbar="false"
      :map="map"
    />

    <!-- 态势监控面板：资源状态监控 -->
    <situation-monitor-panel v-show="activePanel === 'monitor'" :map="map" />

    <!-- 目标态势面板：目标信息 -->
    <target-situation-panel v-show="activePanel === 'target'" :map="map" />
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {MAJOR_CITIES, PLACE_NAMES} from './gisData'
import CombatPlanningPanel from './components/CombatPlanningPanel.vue'
import SituationMonitorPanel from './components/SituationMonitorPanel.vue'
import TargetSituationPanel from './components/TargetSituationPanel.vue'

export default {
  name: 'LeafletGisView',
  components: {
    CombatPlanningPanel,
    SituationMonitorPanel,
    TargetSituationPanel
  },
  data() {
    return {
      map: null,
      // 顶部面板切换：plan 作战筹划 / monitor 态势监控 / target 目标态势
      activePanel: 'plan',
      tileSat: null,
      tileSatChina: null,
      graticule: null,
      graticuleRenderer: null,
      borderLayer: null,
      borderCoarseGroup: null,
      borderDetailGroup: null,
      coastLayer: null,
      labelLayer: null,
      placeLayer: null,
      cityLayer: null,
      cityMuGroup: null,
      cityWorldGroup: null,
      cityCapitalGroup: null,
      cfgVisible: false,
      // 底图来源：esri(全球+周边z8) / gaode(全球+中国z8，周边回退z7)
      baseSource: 'esri',
      gridOn: true,
      // 默认不显示国家边界、海岸线；地理要素(经纬度标注/地名)默认开启，主要城市默认关闭
      showBorders: false,
      showCoast: false,
      showLabels: true,
      showCities: false,
      showPlaces: true,
      centerLabel: ''
    }
  },
  mounted() {
    this.initMap()
  },
  beforeDestroy() {
    if (this.resizeHandler)
      window.removeEventListener('resize', this.resizeHandler)
    if (this.map) this.map.remove()
    this.map = null
  },
  methods: {
    /** 初始化地图 */
    initMap() {
      this.map = L.map(this.$refs.mapEl, {
        preferCanvas: true,
        zoomControl: true,
        // 去掉 Leaflet 官方 logo/版权标识（纯本地底图，无需署名）
        attributionControl: false
      })

      // 卫星影像底图（无路网标注；全球 z2~7 + 中国 z8）
      // ?v=5：全量换 Esri 源后强制刷新浏览器缓存
      this.tileSat = L.tileLayer('/sat/{z}/{x}/{y}.jpg?v=5', {
        minZoom: 2,
        maxZoom: 18,
        // 本地瓦片最高到 z7(全球)/z8(中国)，maxNativeZoom 取真实上限，更高级别自动放大避免空白
        maxNativeZoom: 7,
        attribution: ''
      })
      this.tileSat.addTo(this.map)

      // 中国及周边 z8 高清叠加层（仅 bbox 55~148E/3~56N 内且 z>=8 时生效，
      // 覆盖全球层放大的 z7，其余区域自动回退 z7 放大）
      this.tileSatChina = L.tileLayer('/sat/{z}/{x}/{y}.jpg?v=5', {
        minZoom: 8,
        maxZoom: 18,
        maxNativeZoom: 8,
        bounds: L.latLngBounds([3, 55], [56, 148]),
        attribution: ''
      })
      this.tileSatChina.addTo(this.map)

      this.map.setView([37.684, 94.482], 4)
      this.map.setMaxBounds(L.latLngBounds([-85, -180], [85, 180]))
      this.map.setMinZoom(2)

      // 经纬度网格（SVG 渲染）
      this.graticuleRenderer = L.svg({padding: 0.5})
      this.graticule = L.layerGroup()
      this.drawGraticule(5)
      if (this.gridOn) this.graticule.addTo(this.map)

      // 国家边界（粗/细两级，按层级切换）
      this.borderLayer = L.layerGroup()
      this.borderCoarseGroup = L.layerGroup()
      this.borderDetailGroup = L.layerGroup()
      this.buildBorders()
      if (this.showBorders) this.borderLayer.addTo(this.map)
      this.updateBorderTiers()

      // 主要城市（500km 以上不显示，放大到 z6 才出现）
      this.cityLayer = L.layerGroup()
      this.cityMuGroup = L.layerGroup()
      this.cityWorldGroup = L.layerGroup()
      this.cityCapitalGroup = L.layerGroup()
      this.buildCities()
      this.updateCityTiers()

      // 海岸线（本地 GeoJSON）
      this.coastLayer = L.layerGroup()
      this.buildCoast()
      if (this.showCoast) this.coastLayer.addTo(this.map)

      // 地名注记
      this.placeLayer = L.layerGroup()
      this.buildPlaceNames()
      if (this.showPlaces) this.placeLayer.addTo(this.map)

      // 经纬度标注（跟随视野更新）
      this.labelLayer = L.layerGroup()
      if (this.showLabels) this.labelLayer.addTo(this.map)
      this.updateGraticuleLabels()

      // 比例尺
      L.control
        .scale({metric: true, imperial: false, position: 'bottomright'})
        .addTo(this.map)

      this.map.on('moveend', () => {
        this.updateCenterCoords()
        this.updateGraticuleLabels()
        this.updateCityTiers()
        this.updateBorderTiers()
      })
      this.updateCenterCoords()

      this.resizeHandler = () => this.map && this.map.invalidateSize()
      window.addEventListener('resize', this.resizeHandler)
      this.$nextTick(() => this.map && this.map.invalidateSize())
    },

    /** 绘制经纬度网格（step 度，全球） */
    drawGraticule(step) {
      if (!this.graticule) return
      this.graticule.clearLayers()
      for (let lon = -180; lon <= 180; lon += step) {
        const pts = []
        for (let lat = -85; lat <= 85; lat += 1) pts.push([lat, lon])
        this.graticule.addLayer(
          L.polyline(pts, {
            color: '#8a93a6',
            weight: 1,
            opacity: 0.35,
            dashArray: '4 6',
            interactive: false,
            renderer: this.graticuleRenderer
          })
        )
      }
      for (let lat = -85; lat <= 85; lat += step) {
        const pts = []
        for (let lon = -180; lon <= 180; lon += 1) pts.push([lat, lon])
        this.graticule.addLayer(
          L.polyline(pts, {
            color: '#8a93a6',
            weight: 1,
            opacity: 0.35,
            dashArray: '4 6',
            interactive: false,
            renderer: this.graticuleRenderer
          })
        )
      }
    },

    /** 加载国家边界（粗/细两级，按层级精细化） */
    async buildBorders() {
      const borderStyle = {
        color: '#ffffff',
        weight: 1,
        opacity: 0.75,
        fillColor: '#1a2a45',
        fillOpacity: 0.05
      }
      // 粗略边界（低层级）
      try {
        const r = await fetch('/md/geo/world-countries.geojson')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const geo = await r.json()
        if (!this.map) return
        L.geoJSON(geo, {style: borderStyle, interactive: false}).addTo(
          this.borderCoarseGroup
        )
        console.log('粗略边界已加载', geo.features.length, '个要素')
      } catch (e) {
        console.warn('粗略边界加载失败（可忽略）', e)
      }
      // 精细边界（高层级）
      try {
        const r = await fetch('/md/geo/world-countries-detail.geojson')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const geo = await r.json()
        if (!this.map) return
        L.geoJSON(geo, {
          style: {...borderStyle, weight: 0.8, opacity: 0.85},
          interactive: false
        }).addTo(this.borderDetailGroup)
        console.log('精细边界已加载', geo.features.length, '个要素')
      } catch (e) {
        console.warn('精细边界未加载（可忽略）', e)
      }
      this.updateBorderTiers()
    },

    /** 主要城市标注（直辖市/省会 + 世界重要城市） */
    buildCities() {
      MAJOR_CITIES.forEach(c => {
        const big = c.level === 'municipality' || c.level === 'capital'
        const color =
          c.level === 'municipality'
            ? '#ffd97a'
            : c.level === 'capital'
              ? '#7fd0ff'
              : '#a8f0a8'
        const icon = L.divIcon({
          className: 'gis-city-icon',
          html: `<div class="gis-city ${big ? 'is-big' : ''}">
            <span class="gis-city-dot" style="background:${color};"></span>
            <span class="gis-city-label">${c.name}</span>
          </div>`,
          iconSize: big ? [56, 22] : [44, 18],
          iconAnchor: [6, 6]
        })
        const target =
          c.level === 'municipality'
            ? this.cityMuGroup
            : c.level === 'world'
              ? this.cityWorldGroup
              : this.cityCapitalGroup
        L.marker([c.lat, c.lon], {icon, interactive: false}).addTo(target)
      })
      this.updateCityTiers()
    },

    /** 地名注记（国家/海域中文标注） */
    buildPlaceNames() {
      PLACE_NAMES.forEach(p => {
        const icon = L.divIcon({
          className: 'gis-place-icon',
          html: `<div class="gis-place ${p.type === 'sea' ? 'is-sea' : ''}">${p.name}</div>`,
          iconSize: [80, 18],
          iconAnchor: [40, 9]
        })
        L.marker([p.lat, p.lon], {icon, interactive: false}).addTo(
          this.placeLayer
        )
      })
    },

    /** 海岸线高亮 */
    async buildCoast() {
      try {
        const r = await fetch('/md/geo/coastline.geojson')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const geo = await r.json()
        if (!this.map) return
        L.geoJSON(geo, {
          style: {
            color: '#00d5ff',
            weight: 1.4,
            opacity: 0.9,
            interactive: false
          }
        }).addTo(this.coastLayer)
      } catch (e) {
        console.warn('海岸线加载失败（可忽略）', e)
      }
    },

    /** 经纬度标注（沿视野边缘显示度数，随地图移动更新） */
    updateGraticuleLabels() {
      if (!this.map || !this.labelLayer) return
      this.labelLayer.clearLayers()
      if (!this.showLabels) return
      const b = this.map.getBounds()
      const size = this.map.getSize()
      // 按像素内缩，避免标注贴边或被顶部工具条/底部控件遮挡
      const lngPerPx = (b.getEast() - b.getWest()) / size.x
      const latPerPx = (b.getNorth() - b.getSouth()) / size.y
      const bottomInset = 18 * latPerPx // 底部上移 18px
      const leftInset = 26 * lngPerPx // 左侧右移 26px
      const step = 10
      // 经度标注：放在底部边缘（避开顶部工具条）
      for (
        let lon = Math.ceil(b.getWest() / step) * step;
        lon <= b.getEast();
        lon += step
      ) {
        const text = `${Math.abs(lon)}°${lon >= 0 ? 'E' : 'W'}`
        const icon = L.divIcon({
          className: 'gis-graticule-label-icon',
          html: `<div class="gis-graticule-label">${text}</div>`,
          iconSize: [40, 14],
          iconAnchor: [20, 7]
        })
        L.marker([b.getSouth() + bottomInset, lon], {
          icon,
          interactive: false
        }).addTo(this.labelLayer)
      }
      // 纬度标注：放在左侧边缘
      for (
        let lat = Math.ceil(b.getSouth() / step) * step;
        lat <= b.getNorth();
        lat += step
      ) {
        const text = `${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}`
        const icon = L.divIcon({
          className: 'gis-graticule-label-icon',
          html: `<div class="gis-graticule-label">${text}</div>`,
          iconSize: [40, 14],
          iconAnchor: [20, 7]
        })
        L.marker([lat, b.getWest() + leftInset], {
          icon,
          interactive: false
        }).addTo(this.labelLayer)
      }
    },

    /** 经纬网格开关 */
    toggleGrid() {
      if (!this.map || !this.graticule) return
      if (this.gridOn) {
        if (!this.map.hasLayer(this.graticule)) this.graticule.addTo(this.map)
      } else if (this.map.hasLayer(this.graticule)) {
        this.map.removeLayer(this.graticule)
      }
    },

    /** 国家边界开关 */
    toggleBorders() {
      if (!this.map || !this.borderLayer) return
      if (this.showBorders) {
        if (!this.map.hasLayer(this.borderLayer))
          this.borderLayer.addTo(this.map)
      } else if (this.map.hasLayer(this.borderLayer)) {
        this.map.removeLayer(this.borderLayer)
      }
      this.updateBorderTiers()
    },

    /** 主要城市开关 */
    toggleCities() {
      this.updateCityTiers()
    },

    /** 海岸线开关 */
    toggleCoast() {
      if (!this.map || !this.coastLayer) return
      if (this.showCoast) {
        if (!this.map.hasLayer(this.coastLayer)) this.coastLayer.addTo(this.map)
      } else if (this.map.hasLayer(this.coastLayer)) {
        this.map.removeLayer(this.coastLayer)
      }
    },

    /** 经纬度标注开关 */
    toggleLabels() {
      if (!this.map || !this.labelLayer) return
      this.updateGraticuleLabels()
      if (this.showLabels) {
        if (!this.map.hasLayer(this.labelLayer)) this.labelLayer.addTo(this.map)
      } else if (this.map.hasLayer(this.labelLayer)) {
        this.map.removeLayer(this.labelLayer)
      }
    },

    /** 地名注记开关 */
    togglePlaces() {
      if (!this.map || !this.placeLayer) return
      if (this.showPlaces) {
        if (!this.map.hasLayer(this.placeLayer)) this.placeLayer.addTo(this.map)
      } else if (this.map.hasLayer(this.placeLayer)) {
        this.map.removeLayer(this.placeLayer)
      }
    },

    /** 城市显示：500km 以上(缩放<6)不显示城市，放大到 z6 后显示 */
    updateCityTiers() {
      if (!this.map || !this.cityLayer) return
      const z = this.map.getZoom()
      if (this.showCities && z >= 6) {
        if (!this.map.hasLayer(this.cityLayer))
          this.map.addLayer(this.cityLayer)
        const add = g => {
          if (g && !this.cityLayer.hasLayer(g)) this.cityLayer.addLayer(g)
        }
        add(this.cityMuGroup)
        add(this.cityWorldGroup)
        add(this.cityCapitalGroup)
      } else if (this.map.hasLayer(this.cityLayer)) {
        this.map.removeLayer(this.cityLayer)
      }
    },

    /** 边界按层级精细化：低层级粗略 / 高层级精细（精细未就绪则沿用粗略） */
    updateBorderTiers() {
      if (!this.map || !this.borderLayer) return
      const onMap = this.map.hasLayer(this.borderLayer)
      const z = this.map.getZoom()
      const detailReady =
        this.borderDetailGroup && this.borderDetailGroup.getLayers().length > 0
      const toggle = (group, on) => {
        if (!group) return
        if (onMap && on) {
          if (!this.borderLayer.hasLayer(group))
            this.borderLayer.addLayer(group)
        } else if (this.borderLayer.hasLayer(group)) {
          this.borderLayer.removeLayer(group)
        }
      }
      toggle(this.borderCoarseGroup, z < 6 || !detailReady)
      toggle(this.borderDetailGroup, z >= 6 && detailReady)
    },

    /** 切换底图来源（Esri 全球+周边z8 / 高德 全球+中国z8） */
    applyBaseSource() {
      if (!this.map || !this.tileSat) return
      const isGd = this.baseSource === 'gaode'
      const prefix = isGd ? '/sat_gd' : '/sat'
      const url = `${prefix}/{z}/{x}/{y}.jpg?v=5`
      // 全球层
      this.tileSat.setUrl(url)
      // 重建 z8 叠加层（高德版仅中国 bbox，周边放大回退 z7）
      if (this.tileSatChina && this.map.hasLayer(this.tileSatChina)) {
        this.map.removeLayer(this.tileSatChina)
      }
      this.tileSatChina = L.tileLayer(url, {
        minZoom: 8,
        maxZoom: 18,
        maxNativeZoom: 8,
        bounds: isGd
          ? L.latLngBounds([18, 73], [54, 135])
          : L.latLngBounds([3, 55], [56, 148]),
        attribution: ''
      }).addTo(this.map)
    },

    /** 更新中心坐标显示 */
    updateCenterCoords() {
      if (!this.map) return
      const c = this.map.getCenter()
      this.centerLabel = `${c.lat.toFixed(3)}°N, ${c.lng.toFixed(3)}°E · Z${this.map.getZoom()}`
    }
  }
}
</script>

<style scoped lang="scss">
.gis-light-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .gis-map {
    position: absolute;
    inset: 0;
    background: #0a1a33; // 卫星瓦片缺失时的底色
  }

  .gis-gear {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1000;

    // 齿轮按钮：常驻右角；弹窗打开时随弹窗左移（配合 .open 切换 right）
    .gis-gear-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(90, 170, 255, 0.35);
      border-radius: 8px;
      background: rgba(15, 27, 48, 0.92);
      color: #9fd0ff;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      transition:
        right 0.35s ease,
        transform 0.25s,
        background 0.25s,
        color 0.25s;

      &:hover {
        background: rgba(36, 70, 118, 0.95);
        color: #fff;
        transform: rotate(60deg);
      }
      &.active {
        background: rgba(36, 70, 118, 0.95);
        color: #fff;
      }
    }
    &.open .gis-gear-btn {
      right: 330px; // 弹窗宽 320 + 间距 10
    }

    // 图层配置弹窗：右侧滑入（配合 transition）
    .gis-pop {
      position: absolute;
      top: 0;
      right: 0;
      width: 320px;
      padding: 0 0 14px;
      border-radius: 12px;
      border: 1px solid rgba(90, 170, 255, 0.28);
      background: linear-gradient(180deg, #0f1b30 0%, #0a1220 100%);
      box-shadow: 0 6px 28px rgba(0, 0, 0, 0.55);

      .pop-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);

        .pop-title {
          color: #9fd0ff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 2px;
        }
        .pop-close {
          color: #8fb8dc;
          font-size: 16px;
          cursor: pointer;
          &:hover {
            color: #fff;
          }
        }
      }

      .cfg-group {
        padding: 2px 14px 0;
      }

      .cfg-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #6fa8d0;
        letter-spacing: 2px;
        margin: 16px 0 10px;

        &::before {
          content: '';
          width: 3px;
          height: 12px;
          border-radius: 2px;
          background: linear-gradient(180deg, #7fd0ff, #3a7bd5);
        }
      }

      .cfg-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px 10px;
        margin-bottom: 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.045);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition:
          background 0.2s,
          border-color 0.2s;

        /* 纵向布局（底图影像）：保证切换按钮完整显示 */
        &.cfg-col {
          flex-direction: column;
          align-items: stretch;
        }

        &:hover {
          background: rgba(127, 208, 255, 0.1);
          border-color: rgba(127, 208, 255, 0.3);
        }

        .cfg-label {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;

          .cfg-icon {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-size: 14px;
            color: #7fd0ff;
            background: rgba(127, 208, 255, 0.12);
            border: 1px solid rgba(127, 208, 255, 0.2);
          }

          .cfg-text {
            display: flex;
            flex-direction: column;
            min-width: 0;

            .cfg-name {
              font-size: 13px;
              color: #cfe0f0;
              line-height: 1.3;
            }
            .cfg-desc {
              font-size: 11px;
              color: #6f8aa8;
              margin-top: 2px;
              white-space: nowrap;
            }
          }
        }
      }

      /* 底图影像切换按钮：占满整行，两端均完整显示 */
      .cfg-base-radios {
        display: flex;
        width: 100%;

        .el-radio-button {
          flex: 1;
        }
      }
    }
  }

  /* 弹窗过渡：从右侧滑入 */
  .gis-pop-enter-active,
  .gis-pop-leave-active {
    transition:
      opacity 0.35s ease,
      transform 0.35s ease;
  }
  .gis-pop-enter,
  .gis-pop-leave-to {
    opacity: 0;
    transform: translateX(calc(100% + 12px));
  }

  /* 顶部面板切换：作战筹划 / 态势监控 */
  .gis-panel-tabs {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1200;
    display: flex;
    gap: 8px;
    padding: 4px;
    background: rgba(15, 27, 48, 0.92);
    border: 1px solid rgba(90, 170, 255, 0.28);
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);

    .gis-panel-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 22px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      color: #8fb8dc;
      border-radius: 7px;
      cursor: pointer;
      transition:
        background 0.25s,
        color 0.25s;

      &:hover {
        color: #fff;
      }
      &.active {
        color: #7fd0ff;
        background: rgba(127, 208, 255, 0.14);
      }
    }
  }

  .gis-coords {
    position: absolute;
    right: 12px;
    bottom: 42px;
    z-index: 1000;
    font-size: 12px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 10px;
    border-radius: 4px;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    font-family:
      'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }
}
</style>

<style lang="scss">
/* 主要城市标注 */
.gis-city-icon {
  background: transparent !important;
  border: none !important;
}
.gis-city {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.gis-city-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 5px currentColor;
}
.gis-city.is-big .gis-city-dot {
  width: 10px;
  height: 10px;
}
.gis-city-label {
  font-size: 11px;
  color: #fff;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7);
  font-weight: 500;
}
.gis-city.is-big .gis-city-label {
  font-size: 13px;
  font-weight: 700;
}

/* 地名注记 */
.gis-place-icon {
  background: transparent !important;
  border: none !important;
}
.gis-place {
  font-size: 13px;
  color: #e8eef7;
  text-align: center;
  letter-spacing: 2px;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 0, 0, 0.6);
  font-weight: 500;
  white-space: nowrap;
}
.gis-place.is-sea {
  color: #8fd0ff;
  font-style: italic;
}

/* 经纬度标注 */
.gis-graticule-label-icon {
  background: transparent !important;
  border: none !important;
}
.gis-graticule-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
  white-space: nowrap;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
}

/* Leaflet 缩放控件：深色科技风优化（Leaflet 动态注入 DOM，需全局样式） */
.leaflet-control-zoom {
  border: none !important;
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5) !important;
}
.leaflet-control-zoom a {
  width: 36px !important;
  height: 36px !important;
  line-height: 36px !important;
  background: rgba(15, 27, 48, 0.92) !important;
  color: #9fd0ff !important;
  border: none !important;
  border-bottom: 1px solid rgba(90, 170, 255, 0.25) !important;
  transition:
    background 0.2s,
    color 0.2s;
}
.leaflet-control-zoom a:last-child {
  border-bottom: none !important;
}
.leaflet-control-zoom a:hover {
  background: rgba(36, 70, 118, 0.95) !important;
  color: #fff !important;
}
.leaflet-control-zoom a.leaflet-disabled {
  color: #4a5b70 !important;
  background: rgba(15, 27, 48, 0.55) !important;
  cursor: default;
}

/* 隐藏 Leaflet 版权/logo 区域（双保险） */
.leaflet-control-attribution {
  display: none !important;
}

/* 底图切换按钮：深色科技风、撑满一行、两端完整显示 */
.gis-light-map .cfg-base-radios {
  .el-radio-button__inner {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(90, 170, 255, 0.25);
    border-radius: 4px;
    color: #9fb3c8;
  }
  .el-radio-button:first-child .el-radio-button__inner {
    border-radius: 4px 0 0 4px;
  }
  .el-radio-button:last-child .el-radio-button__inner {
    border-radius: 0 4px 4px 0;
  }
  .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    background: rgba(36, 70, 118, 0.95);
    color: #fff;
    border-color: rgba(127, 208, 255, 0.5);
    box-shadow: -1px 0 0 0 rgba(127, 208, 255, 0.5);
  }
}
</style>
