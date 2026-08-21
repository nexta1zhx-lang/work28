# 轻量 GIS 展示方案：Leaflet + 本地栅格瓦片（中国/台海区域）

> 适用：局域网后台、点位量 < 5,000、快速交付。无需 GeoServer/ArcGIS，纯静态瓦片 + Nginx/静态目录转发。

## 一、架构总览

```mermaid
graph LR
  A[瓦片下载工具<br/>Nivala/TileMill / BAMDB / 全能地图下载器 / 本项目脚本] --> B[瓦片文件<br/>public/tiles/{z}/{x}/{y}.png]
  B --> C[静态服务<br/>devServer public / Nginx]
  C --> D[Leaflet<br/>L.tileLayer '/tiles/{z}/{x}/{y}.png']
  E[业务数据<br/>rest/ptxx/page PTJD/PTWD] --> F[Leaflet 点位图层<br/>divIcon + markerCluster]
  D --> G[浏览器展示]
  F --> G
```

## 二、区域与瓦片参数（当前只做中国 + 台海）

- 经纬度范围 bbox：`西 73°E，南 18°N，东 135°E，北 54°N`
- 投影：Web 墨卡托 **EPSG:3857**（所有 XYZ 瓦片默认投影，Leaflet 默认即此，无需配置）
- 建议缩放级别：`zoom 4 ~ 14`（级别越高瓦片数量约 ×4 增长，按需取舍）
- 前端已限制可视范围：`maxBounds [[18,73],[54,135]]`、`minZoom 4`，防越界加载不存在的瓦片

## 三、瓦片获取与部署（三选一）

### 方式 A：本项目一键脚本（推荐试跑）

```bash
# 1. 修改 scripts/download-tiles.js 顶部的 TILE_SOURCE 为你可用的瓦片源
# 2. 执行
node scripts/download-tiles.js
```

脚本按 bbox + zoom 计算所有瓦片号，并发下载到 `public/tiles/{z}/{x}/{y}.png`，支持断点续传（已存在跳过）。

### 方式 B：地图下载器导出（大批量/专业底图）

- 工具：Nivala/TileMill、BAMDB、全能地图下载器 等
- 关键：选 **XYZ 瓦片导出 / 切片（TMS 需勾选 Y 轴翻转）**，目录结构导出为 `{z}/{x}/{y}.png`
- 把导出目录拷贝到 `public/tiles/` 下（保持 `{z}/{x}/{y}.png` 结构）

### 方式 C：独立 Nginx 瓦片服务器（瓦片量大、与前端解耦）

```nginx
# nginx.conf
server {
  listen 8090;
  location /tiles/ {
    alias /data/tiles/;   # 内部结构 /data/tiles/{z}/{x}/{y}.png
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
  }
}
```

前端开发环境把 `vue.config.js` 里注释掉的 `/tiles` 代理打开，指向该 Nginx；生产环境由同一 Nginx 同时托管前端 dist 与 `/tiles`。

## 四、前端接入

页面组件：`src/views/system-operations/yktsjs/LeafletGisView.vue`

- 路由：`/gis-light-map`（运控态势监视 分类下「轻量GIS点位展示」）
- 底图：`L.tileLayer('/tiles/{z}/{x}/{y}.png')`，支持「亮色底图 / 暗色底图 / 空白网格」切换
  - 暗色底图：对同一份已下载瓦片加 CSS 滤镜 `invert(1) hue-rotate(180deg) brightness(.9) contrast(.9)`，**无需重复下载**，纯离线可用
- 点位：`rest/ptxx/page` 分页拉取（每页 1000，循环至 total），字段 `PTJD`(经度)/`PTWD`(纬度)
- 底图：固定为**卫星影像**（高德纯卫星瓦片 `public/sat/{z}/{x}/{y}.jpg`，无路网标注，全球 z3~7 + 中国 z8，123MB）
- 地图组件：仅卫星底图 + 可配置叠加图层（右上「图层配置」抽屉，独立开关）：
  - **国家边界**（粗/细两级：低层级 `world-countries.geojson` 180 国，高层级 `world-countries-detail.geojson` 242 国，白色细线，按缩放切换）
  - **海岸线高亮**（`coastline.geojson`，ne_50m **1428 段**，亮青色 `#00d5ff`）
  - **经纬度网格**（全球 5° 步长 SVG 虚线）
  - **经纬度标注**（底部/左侧边缘显示度数，内缩避让 UI，随移动更新）
  - **主要城市**（`gisData.js`：直辖市/省会/世界重要城市，**500km 以上（缩放<6）不显示城市**，放大到 z6 后显示）
  - **地名注记**（`gisData.js`：43 国家/地区 + 18 海域，中文标注）
- 已移除：平台点位/热力图/图例/点位弹窗/河流水系等，仅保留地图组件
- 说明：卫星影像天然无路网标注；底图仅卫星影像。
- 态势增强：发光脉冲点位（`.gis-pin` 光晕 + `gis-pulse` 呼吸，悬停/选中放大）、比例尺、右下角中心坐标- 展示：按 `PTLX` 类型着色 `divIcon` 圆点 + `markerCluster` 聚合（< 5,000 点无压力），点击弹出详情，图例实时生成

组件关键 props（按需调整）：

```js
<tile-url-prop="'/tiles/{z}/{x}/{y}.png'" :point-size="10" :cluster-radius="40" />
```

## 五、3D / 2D 卫星地球（2026-08-21 新增）

- 全球卫星瓦片：`GLOBAL=true OUT_SUBDIR=sat EXT=jpg MIN_ZOOM=3 MAX_ZOOM=7 node scripts/download-tiles.js`，已下载 z3~7 **全球完整覆盖**（z3=64/z4=256/z5=1024/z6=4096/z7=16384 片）+ z8 中国详配（共 23342 片 / 123MB），**非中国区域也可放大到 z7**
- 2D 首屏为**全球视野**（Z3，不自动聚焦中国）；点击「刷新点位」才缩放到点位范围（firstLoad 标记控制）
- 已删除不用的路网瓦片 `public/tiles/`（13MB），仅保留卫星影像
- **3D**：`/gis-globe`（`GlobeSatelliteView.vue`，ECharts-GL globe）——用本地全球卫星瓦片在浏览器端拼接成 4096×4096 等距柱状纹理，`scatter3D` 叠加平台点位（按类型着色），支持自动旋转/拖拽缩放
  - **2D**：`/gis-light-map`（Leaflet），固定卫星底图、全球视野（z3~7 全球 + z8 中国详配）
- 互切：2D 页「3D 视图」按钮 ↔ 3D 页「2D 视图」按钮
- 纹理拼接：`buildEarthTexture(z=4)` 拉取 `/sat/4/{x}/{y}.jpg`（16×16=256 片）绘制到 canvas，缺片忽略、同源无跨域问题

## 六、性能与注意点

| 要点         | 说明                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| 5,000 点渲染 | `preferCanvas: true` + `divIcon` 圆点 + 聚合，流畅                     |
| 瓦片加载     | 局域网内 Nginx 纯静态，速度极快；`expires 30d` 命中浏览器缓存          |
| 瓦片缺失     | 高 zoom 未下载时用 `maxNativeZoom` 自动放大低级别瓦片                  |
| 数据合规     | 使用自有/已授权下载的底图数据                                          |
| 升级路线     | 需要海量矢量/高精度要素时，再考虑 MapLibre GL / OpenLayers / GeoServer |
