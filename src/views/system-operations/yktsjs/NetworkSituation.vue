<template>
  <div
    class="situation-container"
    v-loading="globalLoading"
    element-loading-background="rgba(3, 6, 12, 0.8)"
  >
    <!-- 顶部搜索栏 -->
    <div class="top-search-header-refined">
      <div class="search-flex-zone">
        <span class="hub-title-refined"> 网络态势监控 </span>

        <div class="search-item-refined">
          <label>网络号 (WLH)</label>
          <el-select
            v-model="currentWlh"
            placeholder="请选择网络..."
            @change="onNetworkChange"
            popper-class="monitor-select-dropdown"
            class="refined-select"
            size="mini"
          >
            <el-option
              v-for="net in networks"
              :key="net.WLH"
              :label="`网络 ${net.WLH} (成员 ${net.WLCYS})`"
              :value="net.WLH"
            />
          </el-select>
        </div>
      </div>

      <div class="monitor-legend-refined">
        <div class="legend-node-refined">
          <span class="dot-refined bg-online"></span>在网
        </div>
        <div class="legend-node-refined">
          <span class="dot-refined bg-offline"></span>离线
        </div>
        <div class="system-time-stamp font-mono">
          {{ lastRefreshTime ? `刷新: ${lastRefreshTime}` : '流量统计' }}
        </div>
      </div>
    </div>

    <!-- 主画布：成员-链路拓扑（网络包含成员，成员通过链路连接） -->
    <div class="main-canvas-area">
      <div ref="topoContainer" class="topo-container"></div>

      <!-- 画布工具栏 -->
      <div class="canvas-toolbar">
        <el-button
          type="primary"
          size="mini"
          circle
          title="适应画布"
          @click="fitCanvas"
        >
          <Icon icon="mdi:fit-to-screen" size="14px" />
        </el-button>
        <el-radio-group
          v-model="layoutType"
          size="mini"
          class="dir-radio-group"
        >
          <el-radio-button label="LR">横向</el-radio-button>
          <el-radio-button label="TB">纵向</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 网络参数信息面板（选择网络后显示） -->
      <div v-if="currentNet" class="net-info-card">
        <div class="net-info-header">
          <Icon icon="lucide:settings-2" size="13px" style="color: #06b6d4" />
          <span class="net-info-title">{{
            currentNet.WLMC || '网络 ' + currentNet.WLH
          }}</span>
          <span
            class="net-jk"
            :class="Number(currentNet.JKZT) === 0 ? 'jk-health' : 'jk-warn'"
            >{{ Number(currentNet.JKZT) === 0 ? '健康' : '故障告警' }}</span
          >
        </div>
        <div class="net-info-grid font-mono">
          <div v-for="row in netInfoFields" :key="row.label" class="ni-row">
            <span class="lbl">{{ row.label }}</span>
            <span class="val" :class="row.cls">{{ row.value }}</span>
          </div>
        </div>
      </div>

      <div v-if="!hasGraph" class="empty-state">
        <Icon icon="mdi:database-off-outline" size="48px" />
        <p>暂无网络成员数据</p>
      </div>

      <!-- 节点悬浮提示（显示平台全称） -->
      <div ref="nodeTooltip" class="node-tooltip"></div>

      <!-- 节点详情浮层（画布内左下角，不占右侧） -->
      <transition name="panel-slide">
        <div v-if="detailVisible && selectedMember" class="node-detail-card">
          <div class="nd-header">
            <Icon icon="lucide:monitor" size="13px" style="color: #06b6d4" />
            <span>{{
              selectedMember.PTMC || '平台 #' + selectedMember.PTID
            }}</span>
            <i
              class="el-icon-close nd-close"
              @click="detailVisible = false"
            ></i>
          </div>
          <div class="nd-body font-mono">
            <div class="nd-row">
              <span class="lbl">平台ID:</span>
              <span class="text-cyan">#{{ selectedMember.PTID }}</span>
            </div>
            <div class="nd-row">
              <span class="lbl">链路数:</span>{{ selectedMember.PTLLS }}
            </div>
          </div>
          <div class="nd-links">
            <div
              v-for="link in selectedMember.PTLLLB || []"
              :key="link.LLH"
              class="nd-link"
            >
              <div class="nd-link-head font-mono">
                <span class="nd-llh">链路 #{{ link.LLH }}</span>
                <span class="nd-ltype">{{
                  link.LLLXMC || getLinkTypeName(link.LLLX)
                }}</span>
              </div>
              <div
                class="nd-traffic font-mono"
                v-if="link.FSXXTS != null || link.JSXXTS != null"
              >
                <span class="tx">
                  <span class="lbl">发送:</span
                  ><span class="val">{{ link.FSXXTS || 0 }}</span>
                </span>
                <span class="rx">
                  <span class="lbl">接收:</span
                  ><span class="val">{{ link.JSXXTS || 0 }}</span>
                </span>
              </div>
              <div class="nd-nei">
                <span
                  v-for="nei in link.LJJDLB || []"
                  :key="nei.LJJDID"
                  class="nd-nei-item"
                >
                  <span
                    class="dot-refined"
                    :class="
                      Number(nei.LJJDZT) === 0 ? 'bg-online' : 'bg-offline'
                    "
                  ></span>
                  <span v-if="nei.LJJDMC" class="nd-nei-name">{{
                    nei.LJJDMC
                  }}</span>
                  <em
                    class="nd-nei-id"
                    :class="
                      Number(nei.LJJDZT) === 0 ? 'st-online' : 'st-offline'
                    "
                  >
                    #{{ nei.LJJDID }}
                  </em>
                  <em
                    :class="
                      Number(nei.LJJDZT) === 0 ? 'st-online' : 'st-offline'
                    "
                  >
                    {{ Number(nei.LJJDZT) === 0 ? '在网' : '离线' }}
                  </em>
                </span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 左侧：信息面板（结构树 / 消息发送 / 信息转发 / 信息流量 切换） -->
    <div class="left-tree-drawer">
      <div class="tree-header">
        <div class="left-tabs">
          <span
            class="left-tab"
            :class="{active: leftTab === 'tree'}"
            @click="onLeftTab('tree')"
            >结构树</span
          >
          <span
            class="left-tab"
            :class="{active: leftTab === 'info'}"
            @click="onLeftTab('info')"
            >信息</span
          >
        </div>
      </div>
      <div class="tree-body">
        <el-tree
          v-show="leftTab === 'tree'"
          :data="treeData"
          :props="treeProps"
          default-expand-all
          node-key="id"
          :highlight-current="true"
          size="mini"
          class="dark-tree"
          @node-click="onTreeNodeClick"
        >
          <span class="custom-tree-node" slot-scope="{node, data}">
            <span
              class="tree-dot"
              :class="
                data.isLink
                  ? data.online
                    ? 'bg-online'
                    : 'bg-offline'
                  : 'bg-running'
              "
            ></span>
            <span
              class="tree-icon-wrapper"
              style="
                margin-right: 6px;
                display: inline-flex;
                align-items: center;
              "
            >
              <Icon
                :icon="
                  data.isNet
                    ? 'lucide:network'
                    : data.isMember
                      ? 'lucide:monitor'
                      : 'lucide:cable'
                "
                :size="12"
                :style="{
                  color: data.isNet
                    ? '#38bdf8'
                    : data.isMember
                      ? '#06b6d4'
                      : '#a855f7'
                }"
              />
            </span>
            <span class="tree-label-txt">{{ node.label }}</span>
          </span>
        </el-tree>
        <!-- 信息监控（消息发送 / 信息转发 / 信息流量） -->
        <div v-show="leftTab === 'info'" class="info-panel">
          <div class="info-subtabs">
            <span
              :class="{active: infoTab === 'xxfsjg'}"
              @click="infoTab = 'xxfsjg'"
              >消息发送</span
            >
            <span
              :class="{active: infoTab === 'xxzf'}"
              @click="infoTab = 'xxzf'"
              >信息转发</span
            >
            <span
              :class="{active: infoTab === 'xxlltj'}"
              @click="infoTab = 'xxlltj'"
              >信息流量</span
            >
          </div>
          <div class="flow-body">
            <!-- 消息发送结果 -->
            <div v-if="infoTab === 'xxfsjg'">
              <div v-if="msgSendList.length === 0" class="flow-empty">
                <Icon icon="mdi:send-check-outline" size="34px" />
                <p>暂无消息发送结果</p>
              </div>
              <div
                v-for="m in msgSendList"
                :key="
                  m.XXFSJGID + '-' + m.YPTBSH + '-' + m.MDPTBSH + '-' + m.TIME
                "
                class="msg-item"
                :class="Number(m.XXCSQK) === 0 ? 'msg-ok' : 'msg-fail'"
              >
                <div class="msg-head font-mono">
                  <span class="msg-type">{{ m.XXLXMC || '消息' }}</span>
                  <span
                    class="msg-status"
                    :class="Number(m.XXCSQK) === 0 ? 'st-ok' : 'st-fail'"
                    >{{ Number(m.XXCSQK) === 0 ? '成功' : '失败' }}</span
                  >
                </div>
                <div class="msg-rows">
                  <div class="msg-row">
                    <span class="mr-lbl">源平台</span>
                    <span class="mr-val">{{ m.YPTMC || '#' + m.YPTBSH }}</span>
                  </div>
                  <div class="msg-row">
                    <span class="mr-lbl">目的平台</span>
                    <span class="mr-val">{{
                      m.MDPTMC || '#' + m.MDPTBSH
                    }}</span>
                  </div>
                </div>
                <div class="msg-rows">
                  <div class="msg-row">
                    <span class="mr-lbl">发送时间</span>
                    <span class="mr-val">{{ fmtDateTime(m.PTFSSJ) }}</span>
                  </div>
                  <div class="msg-row">
                    <span class="mr-lbl">接收时间</span>
                    <span class="mr-val">{{ fmtDateTime(m.PTJSSJ) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 信息转发 -->
            <div v-else-if="infoTab === 'xxzf'">
              <div v-if="zfList.length === 0" class="flow-empty">
                <Icon icon="mdi:share-variant-outline" size="34px" />
                <p>暂无转发数据</p>
              </div>
              <div
                v-for="z in zfList"
                :key="z.id"
                class="msg-item"
                :class="
                  z.ZFZT === 0
                    ? 'msg-ok'
                    : z.ZFZT === 1
                      ? 'msg-fail'
                      : 'msg-mid'
                "
              >
                <div class="msg-head font-mono">
                  <span class="msg-route">
                    {{ z.YPTMC }}<em>→</em>{{ z.MDPTMC }}
                  </span>
                  <span class="msg-type">{{ z.XXMC }}</span>
                  <span
                    class="msg-status"
                    :class="
                      z.ZFZT === 0
                        ? 'st-ok'
                        : z.ZFZT === 1
                          ? 'st-fail'
                          : 'st-mid'
                    "
                    >{{
                      z.ZFZT === 0 ? '成功' : z.ZFZT === 1 ? '失败' : '转发中'
                    }}</span
                  >
                </div>
                <div class="msg-meta font-mono">
                  <span>转发 {{ z.ZFTS }} 条</span>
                  <span>{{ fmtDateTime(z.TIME) }}</span>
                </div>
              </div>
            </div>
            <!-- 信息流量 -->
            <div v-else>
              <div v-if="trafficList.length === 0" class="flow-empty">
                <Icon icon="mdi:chart-line" size="34px" />
                <p>暂无流量数据</p>
              </div>
              <div
                v-for="t in trafficList"
                :key="
                  (t.XXLLTJID || t.SJ || '') +
                  '-' +
                  t.PT1BSH +
                  '-' +
                  t.PT2BSH +
                  '-' +
                  t.XXDM
                "
                class="flow-item"
              >
                <div class="flow-item-head font-mono">
                  <span class="flow-info">{{ t.XXMC || '信息' + t.XXDM }}</span>
                  <span class="msg-type">{{
                    t.LLLXMC || getLinkTypeName(t.LLLX)
                  }}</span>
                </div>
                <div class="msg-rows">
                  <div class="msg-row">
                    <span class="mr-lbl">源平台</span>
                    <span class="mr-val">{{ t.PT1MC || '#' + t.PT1BSH }}</span>
                  </div>
                  <div class="msg-row">
                    <span class="mr-lbl">目的平台</span>
                    <span class="mr-val">{{ t.PT2MC || '#' + t.PT2BSH }}</span>
                  </div>
                </div>
                <div class="msg-rows">
                  <div class="msg-row">
                    <span class="mr-lbl">发送</span>
                    <span class="mr-val">
                      <i class="inline-dot" style="background: #38bdf8"></i
                      >{{ t.FSXXTS || 0 }} 条
                    </span>
                  </div>
                  <div class="msg-row">
                    <span class="mr-lbl">接收</span>
                    <span class="mr-val">
                      <i class="inline-dot" style="background: #a78bfa"></i
                      >{{ t.JSXXTS || 0 }} 条
                    </span>
                  </div>
                  <div class="msg-row">
                    <span class="mr-lbl">时间</span>
                    <span class="mr-val">{{ fmtDateTime(t.SJ) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Graph} from '@antv/x6'
import dagre from 'dagre'
import {wlzt, wlztTopology, xxlltj, xxfsjg} from '@/api/network'

/**
 * ============================================================
 * 网络态势监控页面（自实现成员-链路拓扑）
 * ------------------------------------------------------------
 * 数据来源：
 *   - rest/wlzt/page 查询网络列表（网络号+状态，分页参数默认传 999）
 *   - rest/wlzt/{wlh} 查询指定网络拓扑数据（成员+链路+邻接节点）
 * ------------------------------------------------------------
 * 后端返回的网络拓扑结构（与前端展示结构一致）：
 *   Net:      WLH 网络号 | WLMC 网络名称 | WLLX 网络类型
 *             | WLCYS 成员数量 | WLCYLB 成员列表[]
 *   Member:   PTID 平台id | PTMC 平台名称 | PTWLDZ 平台网络地址
 *             | PTLLS 平台链路数 | PTLLLB 平台链路列表[]
 *   Link:     LLH 链路号 | LLLX 链路类型 | LLLXMC 链路类型名称
 *             | LJJDS 邻接节点数 | LJJDLB 邻接节点列表[]
 *   Neighbor: LJJDID 邻接节点id | LJJDZT 邻接节点状态(在网0 离线1)
 * ============================================================
 */

// 链路类型名称映射
// 成员节点图标（SVG data URI，lucide monitor）
const PT_ICON =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#06b6d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='3' width='20' height='14' rx='2' ry='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>"
  )

const LINK_TYPE_MAP = {
  1: '地基接入数据链',
  2: '天基信息直接入链',
  3: '天基侦察信息分发',
  4: '天基接入专用',
  5: '宽频段混合组网',
  6: '视距/超视距一体化',
  7: '全向低时延',
  8: '定向低时延',
  9: '低成本短距离导弹控制',
  10: '高频段高带宽',
  11: '激光频射一体化',
  12: '波形动态调整',
  13: '波形在线定义'
}

export default {
  name: 'NetworkSituation',
  data() {
    return {
      globalLoading: false,
      networks: [], // 网络列表（来自 wlzt/page）
      currentWlh: 999, // 当前网络号（默认 999）
      layoutType: 'LR', // 布局方向：LR 左右横向 / TB 上下纵向
      graph: null,
      detailVisible: false,
      selectedMember: null,
      highlightEdges: [],
      pollTimer: null,
      lastRefreshTime: '',
      trafficList: [], // 信息流量实时列表（xxlltj）
      trafficLoading: false,
      leftTab: 'tree', // 左侧主 tab：tree 结构树 / info 信息监控
      infoTab: 'xxfsjg', // 信息监控子 tab：xxfsjg 消息发送 / xxzf 信息转发 / xxlltj 信息流量
      msgSendList: [], // 消息发送结果列表（xxfsjg，50条）
      msgSendLoading: false,
      // 信息转发（模拟数据）
      zfList: [
        {
          id: 1,
          YPTMC: '战区联指',
          MDPTMC: '空警-600-1',
          XXMC: '目标指示报文',
          ZFTS: 156,
          ZFZT: 0,
          TIME: 1777085600000
        },
        {
          id: 2,
          YPTMC: '空警-600-1',
          MDPTMC: '攻击-11隐身无人攻击机#01',
          XXMC: '目标指示报文',
          ZFTS: 89,
          ZFZT: 0,
          TIME: 1777085605000
        },
        {
          id: 3,
          YPTMC: '无侦-10T舰载电子侦察无人机#03',
          MDPTMC: '辽宁舰',
          XXMC: '侦察情报报文',
          ZFTS: 230,
          ZFZT: 1,
          TIME: 1777085610000
        },
        {
          id: 4,
          YPTMC: '空警-600-1',
          MDPTMC: '052D型导弹驱逐舰-1',
          XXMC: '协同交战报文',
          ZFTS: 64,
          ZFZT: 0,
          TIME: 1777085615000
        },
        {
          id: 5,
          YPTMC: '辽宁舰',
          MDPTMC: '攻击-11隐身无人攻击机#03',
          XXMC: '打击任务指令',
          ZFTS: 42,
          ZFZT: 2,
          TIME: 1777085620000
        },
        {
          id: 6,
          YPTMC: '战区联指',
          MDPTMC: '无侦-10T舰载电子侦察无人机#04',
          XXMC: '侦察任务指令',
          ZFTS: 118,
          ZFZT: 0,
          TIME: 1777085625000
        }
      ],
      lastFingerprint: '' // 当前已渲染拓扑的数据指纹（用于避免数据未变时重建闪烁）
    }
  },
  computed: {
    currentNet() {
      return this.networks.find(n => n.WLH === this.currentWlh) || null
    },
    currentMembers() {
      return (this.currentNet && this.currentNet.WLCYLB) || []
    },
    hasGraph() {
      return this.currentMembers.length > 0
    },
    // 当前网络参数展示行（WLZT 完整字段，按数值智能格式化/着色）
    netInfoFields() {
      const n = this.currentNet
      if (!n) return []
      // 频段/带宽按数值大小自动换算单位：>=1000 视为 GHz，否则 MHz
      const fmtFreq = v => {
        if (v == null || isNaN(Number(v))) return '--'
        const num = Number(v)
        if (num >= 1000) return (num / 1000).toFixed(2) + ' GHz'
        return num + ' MHz'
      }
      // 丢包率百分比
      const fmtPct = v =>
        v == null || isNaN(Number(v)) ? '--' : Number(v) + '%'
      // 频段对：上限数值小于下限时，视为上限以 GHz 存储（单位不一致），自动换算对齐
      const fmtBand = (low, high) => {
        if (low == null || high == null) return '--'
        const l = Number(low)
        const h = Number(high)
        if (l > h && h * 1000 >= l) {
          return fmtFreq(l) + ' ~ ' + fmtFreq(h * 1000)
        }
        return fmtFreq(l) + ' ~ ' + fmtFreq(h)
      }
      // 剩余带宽比例状态色（相对带宽）
      let syCls = ''
      if (n.SYDK != null && n.DK != null && Number(n.DK) > 0) {
        const ratio = Number(n.SYDK) / Number(n.DK)
        syCls =
          ratio >= 0.6 ? 'val-ok' : ratio >= 0.3 ? 'val-warn' : 'val-danger'
      }
      // 丢包率状态色（越高越危险）
      let dblCls = ''
      if (n.DBL != null) {
        const dbl = Number(n.DBL)
        dblCls = dbl === 0 ? 'val-ok' : dbl <= 5 ? 'val-warn' : 'val-danger'
      }
      return [
        {label: '网络号', value: n.WLH, cls: ''},
        {label: '网络类型', value: this.getLinkTypeName(n.WLLX), cls: ''},
        {
          label: '频段',
          value: fmtBand(n.PDXX, n.PDSX),
          cls: ''
        },
        {label: '带宽', value: fmtFreq(n.DK), cls: ''},
        {label: '剩余带宽', value: fmtFreq(n.SYDK), cls: syCls},
        {label: '丢包率', value: fmtPct(n.DBL), cls: dblCls}
      ]
    },
    treeProps() {
      return {children: 'children', label: 'name'}
    },
    treeData() {
      const net = this.currentNet
      if (!net) return []
      return [
        {
          id: 'net' + net.WLH,
          name: '网络 ' + net.WLH,
          isNet: true,
          children: (net.WLCYLB || []).map(member => ({
            id: 'pt' + member.PTID,
            name: member.PTMC || '平台 #' + member.PTID,
            isMember: true,
            children: (member.PTLLLB || []).map(link => ({
              id: 'll' + link.LLH,
              name: '链路 #' + link.LLH,
              isLink: true,
              online:
                (link.LJJDLB || []).every(n => Number(n.LJJDZT) === 0) &&
                link.LJJDLB.length > 0
            }))
          }))
        }
      ]
    }
  },
  mounted() {
    this.initGraph()
    this.startPolling()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.pollTimer) clearInterval(this.pollTimer)
    if (this.graph) this.graph.dispose()
  },
  watch: {
    layoutType() {
      this.rebuildGraph()
    }
  },
  methods: {
    /**
     * 启动轮询：立即查一次，之后每 5 秒查一次
     */
    startPolling() {
      this.fetchAll()
      this.pollTimer = setInterval(() => {
        this.fetchAll()
      }, 5000)
    },

    /**
     * 轮询刷新：查询网络列表 + 当前网络拓扑
     */
    async fetchAll() {
      try {
        await this.fetchNetworks()
        await this.fetchTopology()
        await this.fetchTraffic()
        await this.fetchMsgSend()
        this.lastRefreshTime = new Date().toLocaleTimeString()
      } catch (err) {
        console.error('网络态势数据查询失败', err)
      }
    },

    /**
     * 查询消息发送结果（右侧实时刷新屏，直接显示 50 条）
     */
    async fetchMsgSend() {
      this.msgSendLoading = true
      try {
        const res = await xxfsjg({
          pageNum: 1,
          pageSize: 50,
          params: {}
        })
        const list = (res && res.data && res.data.list) || []
        if (Array.isArray(list)) this.msgSendList = list
      } catch (err) {
        console.error('消息发送结果查询失败', err)
      } finally {
        this.msgSendLoading = false
      }
    },

    /**
     * 时间戳格式化（毫秒 → YYYY-MM-DD HH:mm:ss）
     */
    fmtDateTime(ts) {
      if (!ts) return '--'
      const d = new Date(Number(ts))
      const p = n => (n < 10 ? '0' + n : '' + n)
      return (
        d.getFullYear() +
        '-' +
        p(d.getMonth() + 1) +
        '-' +
        p(d.getDate()) +
        ' ' +
        p(d.getHours()) +
        ':' +
        p(d.getMinutes()) +
        ':' +
        p(d.getSeconds())
      )
    },

    /**
     * 查询当前网络信息流量统计（右侧实时刷新屏）
     */
    async fetchTraffic() {
      if (!this.currentWlh) return
      this.trafficLoading = true
      try {
        const res = await xxlltj({
          pageNum: 1,
          pageSize: 50,
          params: {WLH: String(this.currentWlh)}
        })
        const list = (res && res.data && res.data.list) || []
        if (Array.isArray(list)) this.trafficList = list
      } catch (err) {
        console.error('信息流量查询失败', err)
      } finally {
        this.trafficLoading = false
      }
    },

    /**
     * 调用 rest/wlzt/page 查询网络列表（网络号+状态）
     * 分页参数默认传 999（pageSize=999），一次拉取全部网络供下拉选择
     */
    async fetchNetworks() {
      const res = await wlzt({
        pageNum: 1,
        pageSize: 999,
        params: {}
      })
      const list = (res && res.data && res.data.list) || []
      if (!Array.isArray(list)) return

      // 更新/合并网络下拉结构：保留已加载的拓扑数据(WLCYLB/WLCYS)，避免覆盖导致闪烁
      const merged = []
      list.forEach(item => {
        const wlh = Number(item.WLH)
        const existing = this.networks.find(n => n.WLH === wlh)
        merged.push({
          WLH: wlh,
          WLMC: item.WLMC || '网络' + wlh,
          // WLZT 网络参数（供网络信息面板展示）
          WLLX: item.WLLX,
          PDXX: item.PDXX,
          PDSX: item.PDSX,
          DK: item.DK,
          SYDK: item.SYDK,
          DBL: item.DBL,
          JKZT: item.JKZT,
          // 优先用后端统计的成员数(WLCYS)，否则保留已加载拓扑的成员数，避免初始为0
          WLCYS:
            item.WLCYS != null
              ? Number(item.WLCYS)
              : existing
                ? existing.WLCYS
                : 0,
          WLCYLB: existing ? existing.WLCYLB : []
        })
      })
      // 保留不在列表但已加载拓扑的网络
      this.networks.forEach(n => {
        if (
          !merged.some(m => m.WLH === n.WLH) &&
          n.WLCYLB &&
          n.WLCYLB.length > 0
        ) {
          merged.push(n)
        }
      })
      this.networks = merged

      // 保持当前网络选择有效，否则切换第一个
      if (!this.networks.some(n => n.WLH === this.currentWlh)) {
        this.currentWlh = this.networks[0] ? this.networks[0].WLH : 999
      }
    },

    /**
     * 调用 rest/wlzt/{wlh} 查询当前网络拓扑并重建画布
     */
    async fetchTopology() {
      if (!this.currentWlh) return
      const res = await wlztTopology(this.currentWlh)
      const net = (res && res.data) || null
      if (!net || !net.WLCYLB || net.WLCYLB.length === 0) {
        this.rebuildGraph(true)
        return
      }

      // 生成数据指纹：若拓扑数据未变化，跳过重建避免画面闪烁
      const fingerprint = this.makeTopologyFingerprint(net)
      const sameData =
        fingerprint === this.lastFingerprint &&
        this.currentWlh === this.lastFingerprintWlh

      // 用后端拓扑数据替换当前网络（合并保留 WLZT 网络参数，避免被覆盖丢失）
      this.networks = this.networks.map(n => {
        if (n.WLH === Number(net.WLH)) return {...n, ...net}
        return n
      })
      // 若 networks 中没有当前网络，则直接插入
      if (!this.networks.some(n => n.WLH === Number(net.WLH))) {
        this.networks.push(net)
      }

      this.lastFingerprint = fingerprint
      this.lastFingerprintWlh = this.currentWlh

      // 数据未变化时不重建画布（保留当前视图与弹窗），避免闪烁
      if (sameData) return
      // 轮询刷新时保留当前选中弹窗
      this.rebuildGraph(true)
    },

    /**
     * 生成网络拓扑数据指纹（成员+链路+邻接节点结构签名）
     */
    makeTopologyFingerprint(net) {
      const members = net.WLCYLB || []
      return members
        .map(m => {
          const links = (m.PTLLLB || [])
            .map(l => {
              const neis = (l.LJJDLB || [])
                .map(n => `${n.LJJDID}:${n.LJJDZT}`)
                .join(',')
              return `${l.LLH}:${l.LLLX}:${l.LLJKZT}:${neis}`
            })
            .join('|')
          return `${m.PTID}:${m.PTWLDZ}:${links}`
        })
        .join('#')
    },

    /** 网络切换：强制重新拉取该网络拓扑并重建 */
    async onNetworkChange() {
      this.lastFingerprint = ''
      this.lastFingerprintWlh = null
      await this.fetchTopology()
    },

    /** 左侧主 tab 切换（结构树 / 信息） */
    onLeftTab(tab) {
      this.leftTab = tab
    },

    initGraph() {
      this.graph = new Graph({
        container: this.$refs.topoContainer,
        autoResize: true,
        // 同步渲染，避免 async 调度导致节点不挂载
        async: false,
        background: {
          color: '#070c14'
        },
        grid: {
          visible: true,
          type: 'mesh',
          args: [
            {color: 'rgba(0, 162, 255, 0.06)', thickness: 1},
            {color: 'rgba(0, 162, 255, 0.03)', thickness: 1, factor: 4}
          ]
        },
        panning: true,
        mousewheel: {enabled: true, modifiers: ['ctrl', 'meta']},
        connecting: {
          router: {name: 'normal'},
          connector: {name: 'normal'},
          anchor: 'center',
          connectionPoint: 'boundary'
        }
      })

      // 点击节点：显示成员详情浮层
      this.graph.on('node:click', ({node}) => {
        const data = node.getData()
        if (!data || !data.isMember) return
        this.selectedMember = data.member
        this.detailVisible = true
        this.highlightMemberEdges(data.member.PTID)
      })
      this.graph.on('blank:click', () => {
        this.detailVisible = false
        this.clearEdgeHighlight()
      })

      // 悬浮节点：显示平台全称 tooltip
      this.graph.on('node:mouseenter', ({node, e}) => {
        const data = node.getData()
        if (!data || !data.isMember) return
        const tooltip = this.$refs.nodeTooltip
        if (!tooltip) return
        const rect = this.$refs.topoContainer.getBoundingClientRect()
        const name = data.member.PTMC || '平台 #' + data.member.PTID
        tooltip.textContent = name + '  #' + data.member.PTID
        tooltip.style.display = 'block'
        tooltip.style.left = e.clientX - rect.left + 14 + 'px'
        tooltip.style.top = e.clientY - rect.top + 14 + 'px'
      })
      this.graph.on('node:mouseleave', () => {
        if (this.$refs.nodeTooltip)
          this.$refs.nodeTooltip.style.display = 'none'
      })
    },

    /**
     * 构建成员-链路拓扑：
     *   - 每个成员(WLCYLB) 作为一个节点
     *   - 遍历成员链路的邻接节点(LJJDLB)，LJJDID 指向同网络其它成员 → 生成连线
     *   - 连线颜色按邻接状态：在网(绿) / 离线(红)
     */
    rebuildGraph(preserveSelection = false) {
      if (!this.graph) return

      // 若需保留选中，先记住当前弹窗对应的平台
      const lastSelectedPtId =
        preserveSelection && this.detailVisible && this.selectedMember
          ? this.selectedMember.PTID
          : null

      this.graph.clearCells()

      // 保留选中模式下不关闭弹窗，避免 DOM 移除重建造成的闪烁
      if (!preserveSelection) {
        this.detailVisible = false
      }
      this.clearEdgeHighlight()

      const members = this.currentMembers
      if (members.length === 0) {
        if (preserveSelection) {
          this.detailVisible = false
          this.selectedMember = null
        }
        return
      }

      // 1. 用 dagre 计算节点坐标
      const g = new dagre.graphlib.Graph()
      g.setGraph({
        rankdir: this.layoutType,
        nodesep: 90,
        ranksep: 140,
        align: 'UL',
        marginx: 60,
        marginy: 60
      })
      g.setDefaultEdgeLabel(() => ({}))

      const nodeWidth = 160
      const nodeHeight = 92
      // 平台名称超长截断（完整名称通过悬浮提示查看）
      const shortName = name => {
        if (!name) return ''
        return name.length > 12 ? name.slice(0, 12) + '…' : name
      }
      const memberIds = members.map(m => 'pt' + m.PTID)
      memberIds.forEach(id => {
        g.setNode(id, {width: nodeWidth, height: nodeHeight})
      })

      // 2. 建立成员间连线关系（通过链路邻接节点）
      // 方案B：链路号全网统一，一条链路两端都会记录，按 LLH 去重只画一次
      const linkEdges = []
      const ptMap = {}
      const seenLink = new Set()
      const edgeKeys = new Set()
      members.forEach(m => {
        ptMap[String(m.PTID)] = m
      })

      members.forEach(m => {
        const linkList = m.PTLLLB || []
        linkList.forEach(link => {
          if (seenLink.has(link.LLH)) return
          seenLink.add(link.LLH)
          const neiList = link.LJJDLB || []
          neiList.forEach(nei => {
            // 邻接节点指向同网络内其它成员才连线
            const target = ptMap[String(nei.LJJDID)]
            if (target && target.PTID !== m.PTID) {
              // 按无序节点对去重：两端都记录时只画一条线，避免双向重叠
              const key =
                Math.min(m.PTID, target.PTID) +
                '-' +
                Math.max(m.PTID, target.PTID)
              if (edgeKeys.has(key)) return
              edgeKeys.add(key)
              linkEdges.push({
                source: 'pt' + m.PTID,
                target: 'pt' + target.PTID,
                LLH: link.LLH,
                LLLX: link.LLLX,
                LJJDZT: Number(nei.LJJDZT),
                LJJDID: nei.LJJDID
              })
              g.setEdge('pt' + m.PTID, 'pt' + target.PTID)
            }
          })
        })
      })

      // 若图没有任何连线（邻接节点与成员不匹配等），dagre 会把节点垂直堆叠、
      // 无法对齐。此时添加链式虚拟边，让节点按布局方向对齐排列
      // （LR 横向布局 → 节点水平排成一行；TB 纵向布局 → 垂直排成一列）
      if (g.edges().length === 0 && memberIds.length > 1) {
        for (let i = 0; i < memberIds.length - 1; i++) {
          g.setEdge(memberIds[i], memberIds[i + 1])
        }
      }

      dagre.layout(g)

      // 3. 渲染成员节点（自定义 markup：标题 + 副标题 两行文本）
      members.forEach(m => {
        const pos = g.node('pt' + m.PTID)
        this.graph.addNode({
          id: 'pt' + m.PTID,
          x: pos.x - nodeWidth / 2,
          y: pos.y - nodeHeight / 2,
          width: nodeWidth,
          height: nodeHeight,
          shape: 'rect',
          data: {isMember: true, member: m},
          markup: [
            {tagName: 'circle', selector: 'iconBg'},
            {tagName: 'image', selector: 'icon'},
            {tagName: 'text', selector: 'name'},
            {tagName: 'text', selector: 'ip'}
          ],
          attrs: {
            // 上方计算机图标（圆形底衬托，无外框）
            iconBg: {
              cx: 80,
              cy: 24,
              r: 18,
              fill: 'rgba(6, 182, 212, 0.12)',
              stroke: 'none'
            },
            icon: {
              xlinkHref: PT_ICON,
              width: 22,
              height: 22,
              x: 69,
              y: 13
            },
            // 中间：平台名称（与图标拉开间距）—— refX/refY 相对节点定位
            name: {
              text: shortName(m.PTMC || '平台 #' + m.PTID),
              refX: 0.5,
              refY: 0.56,
              textAnchor: 'middle',
              textVerticalAnchor: 'middle',
              fill: '#e0f7ff',
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'Arial, helvetica, sans-serif'
            },
            // 下方：IP/网络地址（放在计算机节点上）
            ip: {
              text: m.PTWLDZ || '—',
              refX: 0.5,
              refY: 0.82,
              textAnchor: 'middle',
              textVerticalAnchor: 'middle',
              fill: '#38bdf8',
              fontSize: 10,
              fontFamily: 'Menlo, Consolas, monospace'
            }
          }
        })
      })

      // 4. 渲染成员间链路边（连线中间用圆形徽章显示链路号）
      linkEdges.forEach(e => {
        const online = e.LJJDZT === 0
        const color = online ? '#10b981' : '#ef4444'
        this.graph.addEdge({
          id: `edge_${e.source}_${e.target}_${e.LLH}_${e.LJJDID}`,
          source: e.source,
          target: e.target,
          zIndex: 0,
          data: {isLinkEdge: true, edge: e},
          // 连线中间的符号：圆形徽章，中间显示链路号，颜色随状态
          labels: [
            {
              markup: [
                {tagName: 'circle', selector: 'badge'},
                {tagName: 'text', selector: 'badgeText'}
              ],
              attrs: {
                badge: {
                  r: 13,
                  fill: color,
                  stroke: '#070c14',
                  strokeWidth: 2
                },
                badgeText: {
                  text: String(e.LLH),
                  fill: '#ffffff',
                  fontSize: 9,
                  fontWeight: 'bold',
                  textAnchor: 'middle',
                  textVerticalAnchor: 'middle'
                }
              }
            }
          ],
          attrs: {
            line: {
              stroke: color,
              strokeWidth: online ? 2 : 2,
              strokeDasharray: online ? null : '5,4',
              targetMarker: {
                name: 'classic',
                args: {size: 6, fill: color}
              }
            }
          }
        })
      })

      // 5. 自适应缩放
      this.$nextTick(() => {
        this.graph.zoomToFit({padding: 70, maxScale: 1})
        this.graph.centerContent()

        // 恢复保留的选中弹窗（若该平台仍在当前网络）
        if (lastSelectedPtId != null) {
          const member = this.currentMembers.find(
            m => m.PTID === lastSelectedPtId
          )
          if (member) {
            // 弹窗全程未关闭，仅刷新数据与高亮，避免闪烁
            this.selectedMember = member
            this.detailVisible = true
            this.highlightMemberEdges(lastSelectedPtId)
          } else {
            // 选中平台已不在数据中，此时才关闭弹窗
            this.detailVisible = false
            this.selectedMember = null
          }
        }
      })
    },

    /** 高亮某成员相关的链路 */
    highlightMemberEdges(ptId) {
      this.clearEdgeHighlight()
      const id = 'pt' + ptId
      this.highlightEdges = []
      this.graph.getEdges().forEach(edge => {
        const d = edge.getData()
        if (
          d &&
          d.isLinkEdge &&
          (edge.getSourceCellId() === id || edge.getTargetCellId() === id)
        ) {
          edge.attr('line/strokeWidth', 3.5)
          edge.attr('line/stroke', '#fbbf24')
          this.highlightEdges.push(edge)
        }
      })
    },
    clearEdgeHighlight() {
      if (!this.graph) return
      ;(this.highlightEdges || []).forEach(edge => {
        const d = edge.getData()
        const online = d && d.edge ? d.edge.LJJDZT === 0 : true
        edge.attr('line/strokeWidth', 2)
        edge.attr('line/stroke', online ? '#10b981' : '#ef4444')
      })
      this.highlightEdges = []
    },

    /** 树节点点击：定位/高亮对应成员 */
    onTreeNodeClick(data) {
      if (data.isMember) {
        const ptId = Number(data.id.replace('pt', ''))
        const node = this.graph && this.graph.getCellById('pt' + ptId)
        if (node) {
          this.graph.centerCell(node)
          const member = this.currentMembers.find(m => m.PTID === ptId)
          if (member) {
            this.selectedMember = member
            this.detailVisible = true
            this.highlightMemberEdges(ptId)
          }
        }
      }
    },
    fitCanvas() {
      if (this.graph) {
        this.graph.zoomToFit({padding: 70, maxScale: 1})
        this.graph.centerContent()
      }
    },
    handleResize() {
      if (this.graph) {
        const {clientWidth, clientHeight} = this.$refs.topoContainer
        this.graph.resize(clientWidth, clientHeight)
      }
    },
    getLinkTypeName(type) {
      return LINK_TYPE_MAP[type] || '未识别链路'
    }
  }
}
</script>

<style scoped>
.situation-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #03060c;
  color: #cbd5e1;
  overflow: hidden;
}
.main-canvas-area {
  position: absolute;
  top: 76px;
  left: 272px;
  right: 12px;
  bottom: 12px;
  background: #040810;
  border: 1px solid #111b2b;
  border-radius: 4px;
  z-index: 1;
  overflow: hidden;
}
.flow-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.flow-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #475569;
  font-size: 12px;
  gap: 8px;
}
.flow-empty p {
  margin: 0;
}
.flow-item {
  background: rgba(8, 14, 24, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 4px;
  padding: 7px 9px;
  margin-bottom: 8px;
}
.flow-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 5px;
}
.flow-route {
  font-size: 10px;
  color: #7dd3fc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flow-route em {
  font-style: normal;
  color: #475569;
  margin: 0 3px;
}
.flow-info {
  flex-shrink: 1;
  font-size: 10px;
  color: #7dd3fc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
  vertical-align: middle;
}
.flow-metrics {
  display: flex;
  gap: 10px;
  font-size: 10px;
}
.fm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.fm i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.fm-tx {
  color: #38bdf8;
}
.fm-tx i {
  background: #38bdf8;
}
.fm-rx {
  color: #a78bfa;
}
.fm-rx i {
  background: #a78bfa;
}
/* === 消息发送结果条目 === */
.msg-item {
  background: rgba(8, 14, 24, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-left: 3px solid #38bdf8;
  border-radius: 4px;
  padding: 7px 9px;
  margin-bottom: 8px;
}
.msg-item.msg-fail {
  border-left-color: #ef4444;
}
.msg-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}
.msg-route {
  font-size: 10px;
  color: #7dd3fc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg-route em {
  font-style: normal;
  color: #475569;
  margin: 0 3px;
}
.msg-type {
  flex-shrink: 0;
  font-size: 10px;
  color: #64748b;
}
.msg-status {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
}
.st-ok {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}
.st-fail {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}
.st-mid {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}
.msg-item.msg-mid {
  border-left-color: #f59e0b;
}
.msg-meta {
  display: flex;
  gap: 10px;
  font-size: 10px;
  color: #475569;
}
.msg-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 5px;
}
.msg-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 10px;
}
.mr-lbl {
  flex-shrink: 0;
  color: #475569;
  width: 48px;
}
.mr-val {
  color: #7dd3fc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topo-container {
  width: 100%;
  height: 100%;
}
.canvas-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 10px;
}
.canvas-toolbar ::v-deep .el-radio-group.dir-radio-group {
  display: inline-flex;
  background: rgba(8, 14, 24, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 4px;
  overflow: hidden;
}
.canvas-toolbar ::v-deep .el-radio-button__inner {
  background: transparent !important;
  border: none !important;
  color: #64748b !important;
  font-size: 11px !important;
  padding: 5px 10px !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-weight: bold;
}
.canvas-toolbar
  ::v-deep
  .el-radio-button__orig-radio:checked
  + .el-radio-button__inner {
  background: rgba(56, 189, 248, 0.15) !important;
  color: #38bdf8 !important;
  box-shadow: none !important;
}
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
  gap: 8px;
  z-index: 5;
}
.empty-state p {
  margin: 0;
}
.empty-state span {
  font-size: 11px;
  color: #475569;
}
/* === 网络参数信息面板（画布右上角） === */
.net-info-card {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 85;
  width: 224px;
  background: rgba(6, 20, 34, 0.92);
  border: 1px solid #16324a;
  border-radius: 6px;
  padding: 10px 12px;
  backdrop-filter: blur(4px);
}
.net-info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.net-info-title {
  font-size: 12px;
  font-weight: bold;
  color: #e0f7ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.net-jk {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}
.jk-health {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}
.jk-warn {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}
.net-info-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10px;
}
.ni-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ni-row .lbl {
  color: #64748b;
}
.ni-row .val {
  color: #7dd3fc;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ni-row .val-ok {
  color: #10b981;
}
.ni-row .val-warn {
  color: #f59e0b;
}
.ni-row .val-danger {
  color: #ef4444;
}
/* === 节点悬浮提示 === */
.node-tooltip {
  display: none;
  position: absolute;
  z-index: 95;
  max-width: 260px;
  background: rgba(3, 10, 18, 0.95);
  border: 1px solid #16324a;
  border-radius: 4px;
  padding: 5px 9px;
  font-size: 11px;
  color: #e0f7ff;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* === 节点详情卡片（画布内左下角） === */
.node-detail-card {
  position: absolute;
  left: 16px;
  bottom: 16px;
  width: 300px;
  max-height: calc(100% - 120px);
  overflow-y: auto;
  background: linear-gradient(
    145deg,
    rgba(30, 40, 55, 0.96),
    rgba(15, 25, 38, 0.98)
  );
  border: 1px solid rgba(6, 182, 212, 0.25);
  box-shadow: 0 11px 30px rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  color: #e2e8f0;
  z-index: 100;
  padding: 12px;
}
.node-detail-card::-webkit-scrollbar {
  width: 4px;
}
.node-detail-card::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 2px;
}
.nd-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
}
.nd-close {
  margin-left: auto;
  cursor: pointer;
  color: #64748b;
  font-size: 14px;
}
.nd-close:hover {
  color: #fff;
}
.nd-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  font-size: 11px;
  padding: 10px 0;
}
.nd-body .lbl {
  color: #94a3b8;
  margin-right: 4px;
}
.nd-links {
  border-top: 1px dashed #1e293b;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nd-link {
  background: rgba(10, 20, 35, 0.5);
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 8px;
}
.nd-link-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.nd-llh {
  font-size: 10px;
  font-weight: bold;
  color: #a855f7;
}
.nd-ltype {
  font-size: 9px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  padding: 1px 5px;
  border-radius: 2px;
}
.nd-traffic {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}
.nd-traffic .tx,
.nd-traffic .rx {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 3px;
  border-left: 2px solid transparent;
}
.nd-traffic .tx {
  border-left-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}
.nd-traffic .rx {
  border-left-color: #a855f7;
  background: rgba(168, 85, 247, 0.08);
}
.nd-traffic .lbl {
  color: #94a3b8;
}
.nd-traffic .val {
  font-weight: bold;
  color: #fff;
}
.nd-nei {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.nd-nei-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #cbd5e1;
  background: rgba(14, 28, 48, 0.4);
  padding: 3px 8px;
  border-radius: 4px;
}
.nd-nei-item .dot-refined {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.nd-nei-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nd-nei-id {
  opacity: 0.7;
}
.nd-nei-item em {
  font-style: normal;
  font-weight: bold;
}
.st-online {
  color: #10b981;
}
.st-offline {
  color: #ef4444;
}
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.25s ease;
}
.panel-slide-enter,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
.top-search-header-refined {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  height: 52px;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.search-flex-zone {
  display: flex;
  align-items: center;
  gap: 24px;
}
.hub-title-refined {
  font-size: 14px;
  font-weight: bold;
  color: #38bdf8;
  letter-spacing: 0.5px;
}
.search-item-refined {
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-item-refined label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: bold;
}
.search-item-refined ::v-deep .el-input__inner {
  background: #0d1522 !important;
  border: 1px solid #1e3557 !important;
  color: #fff !important;
  height: 30px !important;
  line-height: 30px !important;
  font-size: 11px !important;
  width: 240px;
}
.monitor-legend-refined {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
}
.legend-node-refined {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(56, 189, 248, 0.05);
  padding: 4px 11px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.1);
  color: #94a3b8;
}
.legend-node-refined .dot-refined {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot-refined.bg-online {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}
.dot-refined.bg-offline {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}
.dot-refined.bg-running {
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}
.system-time-stamp {
  color: #94a3b8;
  font-size: 11px;
  font-weight: bold;
}
/* === 左侧树 === */
.left-tree-drawer {
  position: absolute;
  top: 76px;
  left: 12px;
  bottom: 12px;
  width: 250px;
  background: rgba(8, 14, 24, 0.92);
  backdrop-filter: blur(4px);
  border: 1px solid #111b2b;
  border-radius: 4px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tree-header {
  height: 34px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: bold;
  color: #38bdf8;
  border-bottom: 1px solid #111b2b;
  flex-shrink: 0;
}
.left-tabs {
  display: flex;
  gap: 2px;
  margin-left: 4px;
}
.left-tab {
  font-size: 10px;
  color: #64748b;
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
  white-space: nowrap;
}
.left-tab.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.25);
}
.info-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.info-subtabs {
  display: flex;
  gap: 2px;
  padding: 0 8px 6px;
  border-bottom: 1px solid #111b2b;
}
.info-subtabs span {
  font-size: 10px;
  color: #64748b;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  user-select: none;
}
.info-subtabs span.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.25);
}
.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.tree-body ::v-deep .el-tree {
  background: transparent;
  border: none;
  color: #cbd5e1;
}
.tree-body ::v-deep .el-tree-node__content {
  height: 28px;
  font-size: 11px;
  color: #94a3b8;
}
.tree-body ::v-deep .el-tree-node__content:hover {
  background: rgba(56, 189, 248, 0.06);
}
.tree-body ::v-deep .el-tree-node.is-current > .el-tree-node__content {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}
.tree-body ::v-deep .el-tree-node__expand-icon {
  color: #64748b;
  font-size: 10px;
}
.tree-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
}
.tree-dot.bg-running {
  background: #38bdf8;
  box-shadow: 0 0 5px rgba(56, 189, 248, 0.5);
}
.tree-dot.bg-online {
  background: #10b981;
  box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
}
.tree-dot.bg-offline {
  background: #ef4444;
}
.tree-icon-wrapper {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
}
.tree-label-txt {
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.text-cyan {
  color: #38bdf8 !important;
}
.text-orange {
  color: #f59e0b !important;
}
.font-mono {
  font-family: 'Menlo', 'Consolas', monospace;
}
.el-select-dropdown.monitor-select-dropdown {
  background-color: #080e18 !important;
  border: 1px solid #111b2b !important;
}
</style>
