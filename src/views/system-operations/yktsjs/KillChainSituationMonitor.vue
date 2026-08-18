<template>
  <div class="sslxx-monitor" v-loading="loading">
    <!-- ==================== 顶部标题栏 ==================== -->
    <div class="monitor-header">
      <div class="header-brand">
        <span class="brand-icon">
          <Icon icon="mdi:sword-cross" :size="16" />
        </span>
        <span class="brand-title">杀伤链态势监控</span>
        <span class="brand-sub">KILL CHAIN SITUATION MONITOR</span>
      </div>
      <div class="header-right">
        <span class="live-dot"></span>
        <span class="live-text">实时</span>
        <span class="header-divider"></span>
        <el-button
          size="mini"
          class="dark-btn"
          icon="el-icon-refresh"
          :loading="loading"
          @click="handleRefresh"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- ==================== 态势统计卡片 ==================== -->
    <div class="stat-cards">
      <div class="stat-card sc-total">
        <div class="sc-icon">
          <Icon icon="lucide:layers" :size="18" color="#38bdf8" />
        </div>
        <div class="sc-body">
          <span class="sc-label">杀伤链总数</span>
          <span class="sc-value">{{ total }}</span>
        </div>
        <div class="sc-trend info">当前查询结果</div>
      </div>
      <div class="stat-card sc-normal">
        <div class="sc-icon">
          <Icon icon="lucide:check-circle" :size="18" color="#10b981" />
        </div>
        <div class="sc-body">
          <span class="sc-label">正常执行</span>
          <span class="sc-value">{{ countByState(1) }}</span>
        </div>
        <div class="sc-trend ok">状态正常</div>
      </div>
      <div class="stat-card sc-abnormal">
        <div class="sc-icon">
          <Icon icon="lucide:alert-triangle" :size="18" color="#f43f5e" />
        </div>
        <div class="sc-body">
          <span class="sc-label">态势异常</span>
          <span class="sc-value">{{ countByState(2) }}</span>
        </div>
        <div class="sc-trend danger">需关注</div>
      </div>
      <div class="stat-card sc-warn">
        <div class="sc-icon">
          <Icon icon="lucide:bell-ring" :size="18" color="#f59e0b" />
        </div>
        <div class="sc-body">
          <span class="sc-label">关联告警</span>
          <span class="sc-value">{{ totalWarn }}</span>
        </div>
        <div class="sc-trend warn">告警条数</div>
      </div>
    </div>

    <!-- ==================== 查询条件栏 ==================== -->
    <div class="query-bar">
      <div class="query-item">
        <span class="query-label">任务名称</span>
        <el-input
          v-model="queryParams.RWMC"
          size="mini"
          class="dark-input"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter.native="handleSearch"
        />
      </div>
      <div class="query-item">
        <span class="query-label">目标名称</span>
        <el-input
          v-model="queryParams.MBMC"
          size="mini"
          class="dark-input"
          placeholder="请输入目标名称"
          clearable
          @keyup.enter.native="handleSearch"
        />
      </div>
      <div class="query-item">
        <span class="query-label">目标标识</span>
        <el-input
          v-model="queryParams.MBID"
          size="mini"
          class="dark-input"
          placeholder="请输入目标标识"
          clearable
          @keyup.enter.native="handleSearch"
        />
      </div>
      <div class="query-item">
        <span class="query-label">执行状态</span>
        <el-select
          v-model="queryParams.KILLCHAIN_STATE"
          size="mini"
          class="dark-select"
          placeholder="全部"
          clearable
        >
          <el-option
            v-for="(cfg, val) in stateConfigs"
            :key="val"
            :label="cfg.label"
            :value="Number(val)"
          />
        </el-select>
      </div>
      <div class="query-item">
        <span class="query-label">执行阶段</span>
        <el-select
          v-model="queryParams.KILLCHAIN_EXECUTEPHASE"
          size="mini"
          class="dark-select"
          placeholder="全部"
          clearable
        >
          <el-option
            v-for="(text, val) in phraseMap"
            :key="val"
            :label="text"
            :value="Number(val)"
          />
        </el-select>
      </div>
      <div class="query-actions">
        <el-button
          size="mini"
          type="primary"
          icon="el-icon-search"
          @click="handleSearch"
        >
          查询
        </el-button>
        <el-button
          size="mini"
          class="dark-btn"
          icon="el-icon-refresh-left"
          @click="handleReset"
        >
          重置
        </el-button>
      </div>
    </div>

    <!-- ==================== 数据表格 ==================== -->
    <div class="table-wrap">
      <el-table
        :data="list"
        class="sslxx-table"
        size="mini"
        height="100%"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        highlight-current-row
        empty-text="暂无杀伤链数据"
      >
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column
          prop="KILLCHAIN_ID"
          label="杀伤链编号"
          width="110"
          align="center"
        >
          <template slot-scope="{row}">
            <span class="kc-id">#{{ row.KILLCHAIN_ID }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="RWMC"
          label="任务名称"
          min-width="140"
          show-overflow-tooltip
        >
          <template slot-scope="{row}">{{ row.RWMC || '—' }}</template>
        </el-table-column>
        <el-table-column
          prop="MBMC"
          label="目标名称"
          min-width="120"
          show-overflow-tooltip
        >
          <template slot-scope="{row}">
            <span class="mbmc">{{ row.MBMC || '未知目标' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="MBID"
          label="目标标识"
          width="110"
          align="center"
        >
          <template slot-scope="{row}">{{ row.MBID || '—' }}</template>
        </el-table-column>
        <el-table-column
          prop="KILLCHAIN_TARGET_PROPERTY"
          label="目标属性"
          min-width="120"
          show-overflow-tooltip
        >
          <template slot-scope="{row}">{{
            row.KILLCHAIN_TARGET_PROPERTY || '常规战术要素'
          }}</template>
        </el-table-column>
        <el-table-column label="执行阶段" width="100" align="center">
          <template slot-scope="{row}">
            <el-tag
              size="mini"
              :type="phaseTagType(row.KILLCHAIN_EXECUTEPHASE)"
              effect="dark"
              class="phase-tag"
            >
              {{ phraseMap[row.KILLCHAIN_EXECUTEPHASE] || '初始' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行状态" width="110" align="center">
          <template slot-scope="{row}">
            <span
              class="state-tag"
              :class="'state-' + (row.KILLCHAIN_STATE || 1)"
            >
              <i class="state-dot"></i>
              {{ stateLabel(row.KILLCHAIN_STATE) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="关联告警" width="90" align="center">
          <template slot-scope="{row}">
            <span
              class="warn-num"
              :class="{'has-warn': row.Killchain_Warn > 0}"
            >
              <i
                v-if="row.Killchain_Warn > 0"
                class="el-icon-warning-outline"
              ></i>
              {{ row.Killchain_Warn || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template slot-scope="{row}">
            <el-button
              size="mini"
              type="text"
              class="detail-btn"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-button
              size="mini"
              type="text"
              class="situation-btn"
              @click="handleSituation(row)"
            >
              运行态势
            </el-button>
            <el-button
              size="mini"
              type="text"
              class="flow-btn"
              @click="handleFlow(row)"
            >
              流程
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ==================== 分页 ==================== -->
    <div class="pagination-bar">
      <span class="pagination-total">
        共 <b>{{ total }}</b> 条记录
      </span>
      <el-pagination
        background
        layout="prev, pager, next, jumper"
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>

    <!-- ==================== 详情弹窗 ==================== -->
    <el-dialog
      :title="`杀伤链详情 #${currentRow.KILLCHAIN_ID || ''}`"
      :visible.sync="detailVisible"
      width="900px"
      class="dark-dialog detail-dialog"
      append-to-body
    >
      <div
        class="detail-body"
        v-loading="detailLoading"
        element-loading-background="rgba(15, 23, 42, 0.8)"
        v-if="
          detailFields.length ||
          phaseStats.length ||
          latestGroupMembers.length ||
          latestNetworkLinks.length
        "
      >
        <!-- 其他要素（左列） -->
        <div class="detail-main">
          <div class="detail-item" v-for="f in detailFields" :key="f.key">
            <span class="d-label">{{ f.label }}</span>
            <span class="d-value" :class="{'d-json': f.json}">{{
              f.value
            }}</span>
          </div>
        </div>

        <!-- 协同群组成员 / 网络规划关系（右列，Tab 切换） -->
        <div class="rel-section">
          <div class="rel-tabs">
            <div
              class="rel-tab"
              :class="{active: activeRelTab === 'members'}"
              @click="activeRelTab = 'members'"
            >
              <Icon icon="lucide:users" :size="13" />
              <span>协同群组成员</span>
              <span class="rel-count">{{ latestGroupMembers.length }}</span>
            </div>
            <div
              class="rel-tab"
              :class="{active: activeRelTab === 'links'}"
              @click="activeRelTab = 'links'"
            >
              <Icon icon="lucide:route" :size="13" />
              <span>网络规划关系</span>
              <span class="rel-count">{{ latestNetworkLinks.length }}</span>
            </div>
          </div>

          <div class="rel-panel">
            <div class="rel-panel-body" v-show="activeRelTab === 'members'">
              <div class="rel-list" v-if="latestGroupMembers.length">
                <div
                  class="rel-item"
                  v-for="(m, idx) in latestGroupMembers"
                  :key="'m' + idx"
                >
                  <div class="rel-item-head">
                    <span class="rel-idx">#{{ idx + 1 }}</span>
                    <span class="rel-name">{{
                      m.Killchain_Group_Member_PltName || m.PLTMC || '未知平台'
                    }}</span>
                    <span
                      class="rel-role"
                      :class="
                        'role-' +
                        (Number(m.Killchain_Group_Member_PltRole) || 0)
                      "
                      v-if="
                        m.Killchain_Group_Member_PltRole !== undefined &&
                        m.Killchain_Group_Member_PltRole !== null &&
                        m.Killchain_Group_Member_PltRole !== ''
                      "
                    >
                      {{ roleLabel(m.Killchain_Group_Member_PltRole) }}
                    </span>
                  </div>
                  <div class="rel-kv-grid">
                    <div
                      class="rel-kv"
                      :class="{'kv-span2': f.span2}"
                      v-for="f in memberFields(m)"
                      :key="f.key"
                    >
                      <span class="rk-label">{{ f.label }}</span>
                      <span
                        class="rk-value"
                        :class="{'rk-none': f.value === '无'}"
                        >{{ f.value }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
              <div class="rel-empty" v-else>暂无协同群组成员</div>
            </div>

            <div class="rel-panel-body" v-show="activeRelTab === 'links'">
              <div class="rel-list" v-if="latestNetworkLinks.length">
                <div
                  class="rel-item"
                  v-for="(l, idx) in latestNetworkLinks"
                  :key="'l' + idx"
                >
                  <div class="rel-item-head">
                    <span class="rel-idx">#{{ idx + 1 }}</span>
                    <span class="rel-type" :class="'type-' + (l.XXLX || 3)">{{
                      linkTypeLabel(l.XXLX)
                    }}</span>
                  </div>
                  <div class="rel-kv">
                    <span class="rk-label">源平台</span>
                    <span class="rk-value">{{
                      l.YPTMC || '平台#' + l.YPTID
                    }}</span>
                  </div>
                  <div class="rel-kv">
                    <span class="rk-label">目标平台</span>
                    <span class="rk-value">{{
                      l.MDPTMC || '平台#' + l.MDPTID
                    }}</span>
                  </div>
                  <div class="rel-kv rel-kv-2col">
                    <span class="rk-label">时延</span>
                    <span class="rk-value">{{ l.SY || 0 }}ms</span>
                    <span class="rk-label">带宽</span>
                    <span class="rk-value">{{ l.DK || 0 }}M</span>
                  </div>
                </div>
              </div>
              <div class="rel-empty" v-else>暂无网络规划关系</div>
            </div>
          </div>
        </div>

        <!-- 各阶段要素平铺展示（底部通栏） -->
        <div class="phase-section" v-if="phaseStats.length">
          <div class="phase-section-title">
            <Icon icon="lucide:layout-template" :size="13" />
            <span>各阶段要素分布</span>
            <span class="phase-legend">平台数 / 链路数</span>
          </div>
          <div class="phase-grid">
            <div
              class="phase-cell"
              :class="[`phase-${p.phase}`, {'has-data': p.hasData}]"
              v-for="p in phaseStats"
              :key="p.phase"
            >
              <div class="phase-name">{{ p.label }}</div>
              <div class="phase-count">
                <span class="pc-label">平台</span>
                <span class="pc-num" :class="{zero: !p.platformCount}">{{
                  p.platformCount
                }}</span>
              </div>
              <div class="phase-count">
                <span class="pc-label">链路</span>
                <span class="pc-num" :class="{zero: !p.linkCount}">{{
                  p.linkCount
                }}</span>
              </div>
              <div
                class="phase-names"
                :title="p.platformNames"
                v-if="p.platforms.length"
              >
                <span
                  class="phase-name-tag"
                  v-for="(name, i) in p.platforms.slice(0, 2)"
                  :key="i"
                >
                  {{ name }}
                </span>
                <span class="phase-more" v-if="p.platforms.length > 2">
                  +{{ p.platforms.length - 2 }}
                </span>
              </div>
              <div class="phase-names empty" v-else>—</div>
            </div>
          </div>
        </div>
      </div>
      <div class="detail-empty" v-else>暂无可展示的详情信息</div>
    </el-dialog>

    <!-- ==================== 运行态势弹窗 ==================== -->
    <el-dialog
      title="杀伤链运行历史态势"
      :visible.sync="sslyxVisible"
      width="900px"
      class="dark-dialog sslyx-dialog"
      append-to-body
    >
      <div class="sslyx-body sslyx-layout" v-loading="sslyxLoading">
        <div class="sslyx-left">
          <div class="group-card-list" v-if="sslyxList.length">
            <div
              class="group-card sslyx-card"
              :class="{active: sslyxActiveRow === row}"
              v-for="(row, idx) in sslyxList"
              :key="row.SSLYXID || idx"
              @click="loadSslyxGroups(row)"
            >
              <div class="group-card-head">
                <span class="rel-idx">#{{ idx + 1 }}</span>
                <span class="group-card-title">{{
                  row.MBMC || '未知目标'
                }}</span>
                <span
                  class="phase-chip"
                  :class="{
                    'phase-active':
                      sslyxActiveRow === row &&
                      sslyxActivePhase === Number(row.KILLCHAIN_EXECUTEPHASE)
                  }"
                >
                  {{ phraseMap[row.KILLCHAIN_EXECUTEPHASE] || '初始' }}
                </span>
                <span
                  class="state-tag"
                  :class="'state-' + (row.KILLCHAIN_STATE || 1)"
                >
                  <i class="state-dot"></i>{{ stateLabel(row.KILLCHAIN_STATE) }}
                </span>
              </div>
              <div class="rel-kv-grid sslyx-kv">
                <div class="rel-kv" v-for="f in sslyxFields(row)" :key="f.key">
                  <span class="rk-label">{{ f.label }}</span>
                  <span
                    class="rk-value"
                    :class="{'rk-none': f.value === '无'}"
                    >{{ f.value }}</span
                  >
                </div>
              </div>
              <div class="sslyx-card-time">{{ row.opTime || '无' }}</div>
            </div>
          </div>
          <div class="rel-empty" v-else>暂无运行态势数据</div>
          <div
            class="pagination-bar sslyx-pager"
            v-if="sslyxTotal > sslyxPageSize"
          >
            <span class="pagination-total"
              >共 <b>{{ sslyxTotal }}</b> 条记录</span
            >
            <el-pagination
              background
              layout="prev, pager, next"
              :current-page="sslyxPageNum"
              :page-size="sslyxPageSize"
              :total="sslyxTotal"
              @current-change="handleSslyxPageChange"
            />
          </div>
        </div>

        <!-- ==================== 阶段群组面板（右侧） ==================== -->
        <div class="sslyx-right">
          <div
            class="sslyx-groups"
            v-if="sslyxActiveRow || sslyxGroups.length"
            v-loading="sslyxGroupLoading"
          >
            <div class="sslyx-groups-head">
              <Icon icon="lucide:git-merge" :size="13" />
              <span class="sslyx-groups-title">
                {{ phraseMap[sslyxActivePhase] || '初始' }}阶段 · 群组
              </span>
              <span class="sslyx-groups-count" v-if="!sslyxGroupLoading">
                共 {{ sslyxGroups.length }} 个群组
              </span>
            </div>
            <div class="group-card-list" v-if="sslyxGroups.length">
              <div
                class="group-card"
                v-for="(g, gi) in sslyxGroups"
                :key="g.SSLQZID || gi"
              >
                <div class="group-card-head">
                  <span class="rel-idx">#{{ gi + 1 }}</span>
                  <span class="group-card-title">群组 #{{ g.SSLQZID }}</span>
                  <span class="group-card-badge" v-if="g.QZZRW"
                    >群组子任务 {{ g.QZZRW }}</span
                  >
                </div>
                <div class="group-tabs">
                  <span
                    class="group-tab"
                    :class="{active: groupTab(g) === 'info'}"
                    @click="setGroupTab(g, 'info')"
                  >
                    群组信息
                  </span>
                  <span
                    class="group-tab"
                    :class="{active: groupTab(g) === 'net'}"
                    @click="setGroupTab(g, 'net')"
                  >
                    网络规划 ({{ groupLinks(g).length }})
                  </span>
                </div>
                <div class="group-tab-panel" v-show="groupTab(g) === 'info'">
                  <div class="rel-kv-grid">
                    <div
                      class="rel-kv"
                      v-for="f in groupFields(g)"
                      :key="f.key"
                    >
                      <span class="rk-label">{{ f.label }}</span>
                      <span
                        class="rk-value"
                        :class="{'rk-none': f.value === '无'}"
                        >{{ f.value }}</span
                      >
                    </div>
                  </div>
                  <div class="sslyx-info-members">
                    <div class="group-links-title">
                      <Icon icon="lucide:users" :size="12" />
                      <span>群组成员 ({{ groupMembers(g).length }})</span>
                    </div>
                    <div class="sslyx-members" v-if="groupMembers(g).length">
                      <div
                        class="sslyx-member"
                        v-for="(m, mi) in groupMembers(g)"
                        :key="m.SSLQZCYID || mi"
                      >
                        <span class="sslyx-member-dot"></span>
                        <span class="sslyx-member-name">{{
                          m.Killchain_Group_Member_PltName ||
                          '平台#' + m.Killchain_Group_Member_PltID
                        }}</span>
                        <span
                          class="rel-role"
                          :class="
                            'role-' +
                            (Number(m.Killchain_Group_Member_PltRole) || 0)
                          "
                          v-if="
                            m.Killchain_Group_Member_PltRole !== undefined &&
                            m.Killchain_Group_Member_PltRole !== null &&
                            m.Killchain_Group_Member_PltRole !== ''
                          "
                        >
                          {{ roleLabel(m.Killchain_Group_Member_PltRole) }}
                        </span>
                      </div>
                    </div>
                    <div class="rel-empty" v-else>暂无群组成员</div>
                  </div>
                </div>
                <div class="group-tab-panel" v-show="groupTab(g) === 'net'">
                  <div class="group-links" v-if="groupLinks(g).length">
                    <div class="group-links-title">
                      <Icon icon="lucide:route" :size="12" />
                      <span>网络规划 ({{ groupLinks(g).length }})</span>
                    </div>
                    <div
                      class="group-link-item"
                      v-for="(l, li) in groupLinks(g)"
                      :key="li"
                    >
                      <span class="rel-type" :class="'type-' + (l.XXLX || 3)">{{
                        linkTypeLabel(l.XXLX)
                      }}</span>
                      <span class="gl-src">{{
                        l.YPTMC || '平台#' + l.YPTID
                      }}</span>
                      <i class="el-icon-right gl-arrow"></i>
                      <span class="gl-dst">{{
                        l.MDPTMC || '平台#' + l.MDPTID
                      }}</span>
                      <span class="gl-meta">
                        {{ l.SY || 0 }}ms · {{ l.DK || 0 }}M
                      </span>
                    </div>
                  </div>
                  <div class="rel-empty" v-else>暂无网络规划</div>
                </div>
              </div>
            </div>
            <div
              class="rel-empty"
              v-if="!sslyxGroupLoading && !sslyxGroups.length"
            >
              该阶段暂无群组
            </div>
          </div>
          <div
            class="sslyx-right-empty"
            v-if="!sslyxActiveRow && !sslyxGroups.length"
          >
            <Icon icon="lucide:git-merge" :size="26" />
            <span>请点击左侧运行记录，查看该阶段群组</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- ==================== 群组成员弹窗 ==================== -->
    <el-dialog
      title="群组成员"
      :visible.sync="memberVisible"
      width="820px"
      class="dark-dialog"
      append-to-body
    >
      <div class="sslyx-body" v-loading="memberLoading">
        <div class="group-card-list" v-if="memberList.length">
          <div
            class="group-card"
            v-for="(m, idx) in memberList"
            :key="m.SSLQZCYID || idx"
          >
            <div class="group-card-head">
              <span class="rel-idx">#{{ idx + 1 }}</span>
              <span class="group-card-title">{{
                m.Killchain_Group_Member_PltName || '未知平台'
              }}</span>
              <span
                class="rel-role"
                :class="
                  'role-' + (Number(m.Killchain_Group_Member_PltRole) || 0)
                "
                v-if="
                  m.Killchain_Group_Member_PltRole !== undefined &&
                  m.Killchain_Group_Member_PltRole !== null &&
                  m.Killchain_Group_Member_PltRole !== ''
                "
              >
                {{ roleLabel(m.Killchain_Group_Member_PltRole) }}
              </span>
              <span class="group-card-badge" v-if="m.QZZRW"
                >群组子任务 {{ m.QZZRW }}</span
              >
            </div>
            <div class="rel-kv-grid">
              <div
                class="rel-kv"
                :class="{'kv-span2': f.span2}"
                v-for="f in memberFields(m)"
                :key="f.key"
              >
                <span class="rk-label">{{ f.label }}</span>
                <span class="rk-value" :class="{'rk-none': f.value === '无'}">{{
                  f.value
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="rel-empty" v-else>暂无群组成员</div>
      </div>
    </el-dialog>

    <!-- ==================== 杀伤链流程可视化弹窗 ==================== -->
    <el-dialog
      :title="`杀伤链流程 #${flowKillchainId || ''}`"
      :visible.sync="flowVisible"
      width="960px"
      class="dark-dialog flow-dialog"
      append-to-body
      @closed="onFlowClosed"
    >
      <div class="flow-body" v-loading="flowLoading">
        <!-- 六阶段流程条 -->
        <div class="flow-track">
          <template v-for="(p, i) in flowPhases">
            <div
              class="flow-node"
              :key="'n' + p.phase"
              :class="{
                'is-reached': p.reached,
                'is-current': p.current,
                'is-selected': flowExpandedPhase === p.phase
              }"
              @click="
                p.reached &&
                (flowExpandedPhase =
                  flowExpandedPhase === p.phase ? null : p.phase)
              "
            >
              <div class="flow-node-dot"></div>
              <div class="flow-node-label">{{ p.label }}</div>
              <div class="flow-node-groups" v-if="p.reached && p.groupCount">
                {{ p.groupCount }}群
              </div>
            </div>
            <div
              class="flow-arrow"
              v-if="i < flowPhases.length - 1"
              :key="'a' + i"
              :class="{'is-active': flowPhases[i + 1].reached}"
            >
              <i class="el-icon-right"></i>
            </div>
          </template>
        </div>

        <!-- 阶段群组与成员 -->
        <div class="flow-phase-detail" v-if="selectedPhaseInfo">
          <div class="flow-detail-title">
            <Icon icon="lucide:git-merge" :size="13" />
            <span>{{ selectedPhaseInfo.label }}阶段 · 群组与成员</span>
            <span class="flow-detail-count"
              >共 {{ selectedPhaseInfo.groupCount }} 个群组</span
            >
          </div>
          <div
            class="flow-group-card"
            v-for="(g, gi) in selectedPhaseInfo.groups"
            :key="g.SSLQZID || gi"
            v-show="gi === 0 || flowShowAllGroups"
          >
            <div class="flow-group-head">
              <span class="rel-idx">#{{ gi + 1 }}</span>
              <span class="group-card-title">群组 #{{ g.SSLQZID }}</span>
              <span class="group-card-badge" v-if="g.QZZRW"
                >群组子任务 {{ g.QZZRW }}</span
              >
              <el-button
                v-if="gi === 0 && selectedPhaseInfo.groupCount > 1"
                size="mini"
                type="text"
                class="flow-toggle-btn"
                @click="flowShowAllGroups = !flowShowAllGroups"
              >
                {{
                  flowShowAllGroups
                    ? '收起'
                    : '全部 ' + selectedPhaseInfo.groupCount + ' 个'
                }}
              </el-button>
            </div>
            <div class="flow-members">
              <div
                class="flow-member"
                v-for="(m, mi) in membersByGroup(g.SSLQZID)"
                :key="m.SSLQZCYID || mi"
              >
                <span class="flow-member-dot"></span>
                <span class="flow-member-name">{{
                  m.Killchain_Group_Member_PltName ||
                  '平台#' + m.Killchain_Group_Member_PltID
                }}</span>
                <span
                  class="rel-role"
                  :class="
                    'role-' + (Number(m.Killchain_Group_Member_PltRole) || 0)
                  "
                  v-if="
                    m.Killchain_Group_Member_PltRole !== undefined &&
                    m.Killchain_Group_Member_PltRole !== null &&
                    m.Killchain_Group_Member_PltRole !== ''
                  "
                >
                  {{ roleLabel(m.Killchain_Group_Member_PltRole) }}
                </span>
              </div>
              <div
                class="flow-no-member"
                v-if="!membersByGroup(g.SSLQZID).length"
              >
                暂无成员
              </div>
            </div>
          </div>
          <div class="rel-empty" v-if="!selectedPhaseInfo.groupCount">
            该阶段暂无群组
          </div>
        </div>

        <!-- 阶段演进时间轴 -->
        <div class="flow-chart-wrap" v-if="flowTimeline.length">
          <div class="flow-detail-title">
            <Icon icon="lucide:trending-up" :size="13" />
            <span>阶段演进时间轴</span>
            <span class="flow-detail-count"
              >已到达
              {{ flowPhases.filter(p => p.reached).length }} 个阶段</span
            >
          </div>
          <div class="flow-timeline">
            <div
              class="flow-tl-seg"
              v-for="seg in flowTimelineSegs"
              :key="seg.phase"
              :class="{
                'is-reached': seg.reached,
                'is-current': seg.current
              }"
              :style="{flex: seg.flex}"
              :title="
                seg.reached
                  ? seg.label + '：' + seg.startLabel + ' ~ ' + seg.endLabel
                  : seg.label + '（未到达）'
              "
            >
              <div class="flow-tl-seg-label">{{ seg.label }}</div>
              <div class="flow-tl-seg-state" v-if="seg.reached && seg.state">
                {{ seg.state }}
              </div>
              <div class="flow-tl-seg-time" v-if="seg.reached">
                {{ seg.startLabel }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getSslxxPage,
  getSslxxDetail,
  getSslyxPage,
  getSslqzPage,
  getSslqzcyPage
} from '@/api/sslxx'
import * as echarts from 'echarts'

export default {
  name: 'KillChainSituationMonitor',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      pageNum: 1,
      pageSize: 20,
      queryParams: {
        RWMC: '',
        MBMC: '',
        MBID: '',
        KILLCHAIN_STATE: null,
        KILLCHAIN_EXECUTEPHASE: null
      },
      detailVisible: false,
      detailLoading: false,
      activeRelTab: 'members',
      currentRow: {},
      sslyxVisible: false,
      sslyxLoading: false,
      sslyxList: [],
      sslyxTotal: 0,
      sslyxPageNum: 1,
      sslyxPageSize: 10,
      sslyxParams: null,
      sslyxGroups: [],
      sslyxGroupLoading: false,
      sslyxActivePhase: null,
      sslyxActiveRow: null,
      sslyxGroupTabs: {},
      sslyxGroupMembers: {},
      memberVisible: false,
      memberLoading: false,
      memberList: [],
      flowVisible: false,
      flowLoading: false,
      flowTimer: null,
      flowKillchainId: null,
      flowLastFingerprint: null,
      flowPhases: [],
      flowTimeline: [],
      flowGroupsAll: [],
      flowMembersAll: [],
      flowCurrentPhase: null,
      flowExpandedPhase: null,
      flowShowAllGroups: false,
      flowChart: null,
      phraseMap: {
        0: '发现',
        1: '定位',
        2: '跟踪',
        3: '瞄准',
        4: '打击',
        5: '评估'
      },
      stateConfigs: {
        1: {label: '正常执行', type: 'success'},
        2: {label: '态势异常', type: 'danger'},
        3: {label: '流程完成', type: 'info'},
        4: {label: '指挥中止', type: 'warning'}
      }
    }
  },
  mounted() {
    this.fetchData()
  },
  beforeDestroy() {
    this.stopFlowPolling()
    if (this.flowChart) {
      this.flowChart.dispose()
      this.flowChart = null
    }
  },
  methods: {
    headerCellStyle() {
      return {
        background: '#1e293b',
        color: '#94a3b8',
        fontWeight: 600,
        borderColor: '#1f2937'
      }
    },
    cellStyle() {
      return {
        background: '#0f172a',
        color: '#e2e8f0',
        borderColor: '#1f2937'
      }
    },
    async fetchData() {
      this.loading = true
      try {
        const res = await getSslxxPage(this.queryParams, {
          pageNum: this.pageNum,
          pageSize: this.pageSize
        })
        const data = res.data || {}
        this.list = data.list || data.records || []
        this.total = data.total || this.list.length
      } catch (e) {
        console.error('杀伤链信息查询失败:', e)
        this.list = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pageNum = 1
      this.fetchData()
    },
    handleReset() {
      this.queryParams = {
        RWMC: '',
        MBMC: '',
        MBID: '',
        KILLCHAIN_STATE: null,
        KILLCHAIN_EXECUTEPHASE: null
      }
      this.pageNum = 1
      this.fetchData()
    },
    handleRefresh() {
      this.fetchData()
    },
    handlePageChange(page) {
      this.pageNum = page
      this.fetchData()
    },
    async handleDetail(row) {
      this.currentRow = {...row}
      this.detailVisible = true
      this.detailLoading = true
      try {
        const res = await getSslxxDetail(row.KILLCHAIN_ID)
        let detail = (res && res.data) || null
        if (
          (!detail || typeof detail !== 'object' || Array.isArray(detail)) &&
          res &&
          typeof res === 'object' &&
          !Array.isArray(res) &&
          res.code === undefined &&
          res.msg === undefined
        ) {
          detail = res
        }
        if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
          this.currentRow = {...this.currentRow, ...detail}
        }
      } catch (e) {
        console.error('杀伤链详情查询失败，展示列表数据:', e)
      } finally {
        this.detailLoading = false
      }
    },
    async handleSituation(row) {
      this.sslyxVisible = true
      this.sslyxLoading = true
      this.sslyxList = []
      this.sslyxTotal = 0
      this.sslyxPageNum = 1
      this.sslyxGroups = []
      this.sslyxActivePhase = null
      this.sslyxActiveRow = null
      try {
        // 打开弹窗即预加载该杀伤链所有群组的成员
        this.loadAllGroupMembers(row.KILLCHAIN_ID)
        let params = {
          ZZRWID: row.ZZRWID || '',
          RWMC: row.RWMC || '',
          KILLCHAIN_ID: row.KILLCHAIN_ID
        }
        // 列表行可能缺少作战任务ID，先取详情补齐
        if (!params.ZZRWID) {
          const res = await getSslxxDetail(row.KILLCHAIN_ID)
          const detail = (res && res.data) || {}
          params.ZZRWID = detail.ZZRWID || ''
          params.RWMC = detail.RWMC || params.RWMC
        }
        this.sslyxParams = params
        await this.querySslyx()
      } catch (e) {
        console.error('运行态势查询失败:', e)
        this.sslyxList = []
        this.sslyxTotal = 0
      } finally {
        this.sslyxLoading = false
      }
    },
    async querySslyx() {
      this.sslyxLoading = true
      try {
        const res = await getSslyxPage(this.sslyxParams, {
          pageNum: this.sslyxPageNum,
          pageSize: this.sslyxPageSize
        })
        const data = res.data || {}
        this.sslyxList = data.list || data.records || []
        this.sslyxTotal = data.total || this.sslyxList.length
      } catch (e) {
        console.error('运行态势查询失败:', e)
        this.sslyxList = []
        this.sslyxTotal = 0
      } finally {
        this.sslyxLoading = false
      }
    },
    handleSslyxPageChange(page) {
      this.sslyxPageNum = page
      this.querySslyx()
    },
    sslyxFields(row) {
      const fields = [
        {key: 'SSLYXID', label: '运行记录ID', value: row.SSLYXID},
        {
          key: 'Killchain_Warn',
          label: '异常告警',
          value: row.Killchain_Warn
        }
      ]
      return fields.map(f => ({
        key: f.key,
        label: f.label,
        value:
          f.value === undefined || f.value === null || f.value === ''
            ? '无'
            : f.value,
        span2: !!f.span2,
        noLabel: !!f.noLabel,
        wrap: !!f.wrap
      }))
    },
    async loadSslyxGroups(row) {
      this.sslyxActiveRow = row
      this.sslyxActivePhase = Number(row.KILLCHAIN_EXECUTEPHASE)
      this.sslyxGroupLoading = true
      this.sslyxGroups = []
      try {
        const res = await getSslqzPage(
          {KILLCHAIN_ID: row.KILLCHAIN_ID},
          {pageNum: 1, pageSize: 100}
        )
        const data = res.data || {}
        const all = data.list || data.records || []
        // 前端按阶段过滤（后端仅支持 phase>0，统一前端过滤保证阶段0也正确）
        const groups = all.filter(
          g => Number(g.KILLCHAIN_EXECUTEPHASE) === this.sslyxActivePhase
        )
        groups.sort((a, b) => (b.opTime || '').localeCompare(a.opTime || ''))
        this.sslyxGroups = groups
      } catch (e) {
        console.error('阶段群组查询失败:', e)
        this.sslyxGroups = []
      } finally {
        this.sslyxGroupLoading = false
      }
    },
    groupTab(g) {
      return this.sslyxGroupTabs[g.SSLQZID] || 'info'
    },
    setGroupTab(g, tab) {
      this.$set(this.sslyxGroupTabs, g.SSLQZID, tab)
    },
    groupMembers(g) {
      const v = this.sslyxGroupMembers[g.SSLQZID]
      return Array.isArray(v) ? v : []
    },
    groupMembersLoaded(g) {
      return Array.isArray(this.sslyxGroupMembers[g.SSLQZID])
    },
    async loadAllGroupMembers(killchainId) {
      try {
        const res = await getSslqzcyPage(
          {KILLCHAIN_ID: killchainId},
          {pageNum: 1, pageSize: 100}
        )
        const data = res.data || {}
        const list = data.list || data.records || []
        const map = {}
        list.forEach(m => {
          const id = m.SSLQZID
          if (!map[id]) map[id] = []
          map[id].push(m)
        })
        this.sslyxGroupMembers = map
      } catch (e) {
        console.error('群组成员预加载失败:', e)
      }
    },
    async loadGroupMembers(g) {
      // 全量成员已在打开弹窗时预加载，此处仅兜底缺失的群组
      if (this.sslyxGroupMembers[g.SSLQZID] !== undefined) return
      this.$set(this.sslyxGroupMembers, g.SSLQZID, null)
      try {
        const res = await getSslqzcyPage(
          {
            KILLCHAIN_ID: g.KILLCHAIN_ID,
            SSLQZID: g.SSLQZID,
            ZZRWID: g.ZZRWID || '',
            RWMC: g.RWMC || ''
          },
          {pageNum: 1, pageSize: 100}
        )
        const data = res.data || {}
        this.$set(
          this.sslyxGroupMembers,
          g.SSLQZID,
          data.list || data.records || []
        )
      } catch (e) {
        console.error('群组成员加载失败:', e)
        this.$set(this.sslyxGroupMembers, g.SSLQZID, [])
      }
    },
    async handleViewMembers(g) {
      this.memberVisible = true
      this.memberLoading = true
      this.memberList = []
      try {
        const res = await getSslqzcyPage({
          KILLCHAIN_ID: g.KILLCHAIN_ID,
          SSLQZID: g.SSLQZID,
          ZZRWID: g.ZZRWID || '',
          RWMC: g.RWMC || ''
        })
        const data = res.data || {}
        this.memberList = data.list || data.records || []
      } catch (e) {
        console.error('群组成员查询失败:', e)
        this.memberList = []
      } finally {
        this.memberLoading = false
      }
    },
    handleFlow(row) {
      this.flowKillchainId = row.KILLCHAIN_ID
      this.flowVisible = true
      this.flowExpandedPhase = null
      this.flowShowAllGroups = false
      this.flowLastFingerprint = null
      this.loadFlow()
      this.startFlowPolling()
    },
    startFlowPolling() {
      this.stopFlowPolling()
      this.flowTimer = setInterval(() => {
        if (this.flowVisible) this.loadFlow()
      }, 12000)
    },
    stopFlowPolling() {
      if (this.flowTimer) {
        clearInterval(this.flowTimer)
        this.flowTimer = null
      }
    },
    onFlowClosed() {
      this.stopFlowPolling()
      if (this.flowChart) {
        this.flowChart.dispose()
        this.flowChart = null
      }
    },
    async loadFlow() {
      if (!this.flowKillchainId) return
      this.flowLoading = true
      try {
        const [resYx, resQz, resCy] = await Promise.all([
          getSslyxPage(
            {KILLCHAIN_ID: this.flowKillchainId},
            {pageNum: 1, pageSize: 100}
          ),
          getSslqzPage(
            {KILLCHAIN_ID: this.flowKillchainId},
            {pageNum: 1, pageSize: 100}
          ),
          getSslqzcyPage(
            {KILLCHAIN_ID: this.flowKillchainId},
            {pageNum: 1, pageSize: 100}
          )
        ])
        const yxList =
          (resYx.data && (resYx.data.list || resYx.data.records)) || []
        const qzList =
          (resQz.data && (resQz.data.list || resQz.data.records)) || []
        const cyList =
          (resCy.data && (resCy.data.list || resCy.data.records)) || []

        const fingerprint = `${yxList.length}_${qzList.length}_${cyList.length}`
        if (fingerprint === this.flowLastFingerprint) return
        this.flowLastFingerprint = fingerprint

        this.flowTimeline = [...yxList].sort((a, b) =>
          (a.opTime || '').localeCompare(b.opTime || '')
        )
        this.flowGroupsAll = qzList
        this.flowMembersAll = cyList

        this.buildFlowPhases(yxList, qzList)
      } catch (e) {
        console.error('流程加载失败:', e)
      } finally {
        this.flowLoading = false
      }
    },
    buildFlowPhases(yxList, qzList) {
      const sorted = [...yxList].sort((a, b) =>
        (a.opTime || '').localeCompare(b.opTime || '')
      )
      const seq = []
      sorted.forEach(r => {
        const ph = Number(r.KILLCHAIN_EXECUTEPHASE)
        if (!isNaN(ph) && seq[seq.length - 1] !== ph) seq.push(ph)
      })
      const latest = sorted[sorted.length - 1] || null
      const currentPhase = latest ? Number(latest.KILLCHAIN_EXECUTEPHASE) : null

      const groupsByPhase = {}
      qzList.forEach(g => {
        const ph = Number(g.KILLCHAIN_EXECUTEPHASE)
        if (ph === undefined || ph === null || isNaN(ph)) return
        if (!groupsByPhase[ph]) groupsByPhase[ph] = []
        groupsByPhase[ph].push(g)
      })
      Object.keys(groupsByPhase).forEach(ph => {
        groupsByPhase[ph].sort((a, b) =>
          (b.opTime || '').localeCompare(a.opTime || '')
        )
      })

      this.flowPhases = [0, 1, 2, 3, 4, 5].map(ph => {
        const reached = seq.includes(ph)
        const groups = groupsByPhase[ph] || []
        return {
          phase: ph,
          label: this.phraseMap[ph] || String(ph),
          reached,
          current: currentPhase === ph,
          groups,
          latestGroup: groups[0] || null,
          groupCount: groups.length
        }
      })
      this.flowCurrentPhase = currentPhase
    },
    membersByGroup(sslqzid) {
      return this.flowMembersAll.filter(
        m => String(m.SSLQZID) === String(sslqzid)
      )
    },
    renderFlowChart() {
      const el = this.$refs.flowChartEl
      if (!el) return
      if (!this.flowChart) this.flowChart = echarts.init(el)
      const points = this.flowTimeline.map(r => ({
        time: r.opTime || '',
        phase: Number(r.KILLCHAIN_EXECUTEPHASE) || 0,
        warn: Number(r.Killchain_Warn) || 0
      }))
      const times = points.map(p => (p.time ? p.time.slice(5, 16) : ''))
      const warnPoints = points.filter(p => p.warn > 0)
      const maxPhase = points.reduce((m, p) => Math.max(m, p.phase), 0)
      this.flowChart.setOption({
        backgroundColor: 'transparent',
        grid: {left: 64, right: 28, top: 36, bottom: 46},
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#111827',
          borderColor: '#1f2937',
          textStyle: {color: '#e2e8f0'},
          formatter: params => {
            const p = points[params[0].dataIndex] || {}
            let s = `<div style="font-size:11px;color:#94a3b8">${p.time}</div>`
            s += `<div style="margin-top:4px;font-size:12px">阶段：<b style="color:#7dd3fc">${this.phraseMap[p.phase] || p.phase}</b></div>`
            if (p.warn > 0) {
              s += `<div style="margin-top:2px;color:#f87171;font-size:11px">⚠ 关联告警 ${p.warn} 条</div>`
            }
            return s
          }
        },
        xAxis: {
          type: 'category',
          data: times,
          boundaryGap: false,
          axisLabel: {color: '#64748b', fontSize: 10},
          axisLine: {lineStyle: {color: '#1f2937'}},
          axisTick: {lineStyle: {color: '#334155'}}
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 5,
          interval: 1,
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: v => this.phraseMap[v] || v
          },
          splitLine: {lineStyle: {color: 'rgba(30,41,59,0.6)'}}
        },
        series: [
          {
            name: '阶段演进',
            type: 'line',
            step: 'end',
            smooth: false,
            data: points.map(p => p.phase),
            symbol: 'circle',
            symbolSize: 9,
            lineStyle: {color: '#38bdf8', width: 2},
            itemStyle: {
              color: '#0ea5e9',
              borderColor: '#7dd3fc',
              borderWidth: 1
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {offset: 0, color: 'rgba(56, 189, 248, 0.25)'},
                {offset: 1, color: 'rgba(56, 189, 248, 0.02)'}
              ])
            },
            markLine: {
              silent: true,
              symbol: 'none',
              data: [
                {
                  yAxis: maxPhase,
                  lineStyle: {
                    color: 'rgba(16, 185, 129, 0.6)',
                    type: 'dashed'
                  }
                }
              ],
              label: {
                formatter: '当前 ' + (this.phraseMap[maxPhase] || maxPhase),
                color: '#10b981',
                fontSize: 10,
                position: 'insideEndTop'
              }
            }
          },
          {
            name: '告警',
            type: 'scatter',
            data: warnPoints.map(p => [times[points.indexOf(p)], p.phase]),
            symbol: 'pin',
            symbolSize: 24,
            itemStyle: {color: '#f87171'},
            label: {show: false},
            z: 10
          }
        ]
      })
    },
    groupFields(g) {
      const base = [
        {key: 'SSLQZID', label: '群组标识', value: g.SSLQZID},
        {key: 'QZZRW', label: '群组子任务', value: g.QZZRW},
        {
          key: 'KILLCHAIN_STATE',
          label: '执行状态',
          value: this.stateLabel(g.KILLCHAIN_STATE)
        },
        {
          key: 'KILLCHAIN_EXECUTEPHASE',
          label: '执行阶段',
          value: this.phraseMap[g.KILLCHAIN_EXECUTEPHASE] || '初始'
        }
      ]
      return base.map(f => ({
        key: f.key,
        label: f.label,
        value:
          f.value === undefined || f.value === null || f.value === ''
            ? '无'
            : f.value
      }))
    },
    parseMap(v) {
      if (!v) return {}
      if (typeof v === 'object') return v
      try {
        return JSON.parse(v)
      } catch (e) {
        return {}
      }
    },
    formatPhaseMap(map, unit) {
      const parts = []
      Object.keys(map).forEach(k => {
        const v = map[k]
        if (v === undefined || v === null || v === '' || v === 0) return
        parts.push(`${this.phraseMap[k] || k}:${v}${unit}`)
      })
      return parts.length ? parts.join('  ') : '无'
    },
    groupLinks(g) {
      return this.parseArray(g.sslWLGHs)
    },
    countByState(state) {
      return this.list.filter(i => Number(i.KILLCHAIN_STATE) === state).length
    },
    stateLabel(state) {
      const cfg = this.stateConfigs[state]
      return cfg ? cfg.label : '正常执行'
    },
    formatDetailValue(key, value) {
      if (key === 'KILLCHAIN_ID') return `#${value}`
      if (key === 'KILLCHAIN_EXECUTEPHASE') {
        return this.phraseMap[value] || value || '初始'
      }
      if (key === 'KILLCHAIN_STATE') {
        return this.stateLabel(value)
      }
      return value
    },
    phaseTagType(phase) {
      const map = {
        0: 'primary',
        1: 'primary',
        2: 'warning',
        3: 'warning',
        4: 'danger',
        5: 'success'
      }
      return map[phase] || 'info'
    },
    parseArray(v) {
      if (!v) return []
      if (Array.isArray(v)) return v
      try {
        const parsed = JSON.parse(v)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        return []
      }
    },
    memberFields(m) {
      const core = [
        {
          key: 'pt',
          label: '平台ID',
          value: m.Killchain_Group_Member_PltID || m.PLTID
        },
        {key: 'memberId', label: '群组成员ID', value: m.SSLQZCYID},
        {key: 'groupId', label: '协同群组ID', value: m.SSLQZID},
        {
          key: 'role',
          label: '成员角色',
          value: m.Killchain_Group_Member_PltRole
        },
        {key: 'subTask', label: '群组子任务', value: m.QZZRW},
        {key: 'phase', label: '执行阶段', value: m.KILLCHAIN_EXECUTEPHASE},
        {key: 'opTime', label: '更新时间', value: m.opTime, span2: true}
      ]
      const fields = core.map(f => ({
        key: f.key,
        label: f.label,
        value: this.formatMemberValue(f.key, f.value),
        span2: !!f.span2
      }))
      // 其余未列出的额外字段
      const known = new Set([
        'Killchain_Group_Member_PltID',
        'Killchain_Group_Member_PltName',
        'PLTID',
        'PLTMC',
        'SSLQZCYID',
        'SSLQZID',
        'Killchain_Group_Member_PltRole',
        'QZZRW',
        'KILLCHAIN_EXECUTEPHASE',
        'opTime',
        'RWMC',
        'KILLCHAIN_ID',
        'SSLYXID'
      ])
      Object.keys(m).forEach(k => {
        if (known.has(k)) return
        const v = m[k]
        if (v === undefined || v === null || v === '') return
        fields.push({
          key: k,
          label: k,
          value:
            typeof v === 'object'
              ? JSON.stringify(v)
              : this.formatMemberValue(k, v)
        })
      })
      return fields
    },
    formatMemberValue(k, v) {
      if (v === undefined || v === null || v === '') return '无'
      if (k === 'role') {
        return {1: '领导', 0: '成员'}[v] || v || '无'
      }
      if (k === 'phase' || k === 'KILLCHAIN_EXECUTEPHASE') {
        return this.phraseMap[v] || v || '无'
      }
      if (typeof v === 'object') return JSON.stringify(v)
      return v
    },
    linkTypeLabel(xxlx) {
      return {1: '指控', 2: '协同', 3: '情报'}[xxlx] || xxlx || '未知'
    },
    roleLabel(role) {
      if (role === undefined || role === null || role === '') return ''
      return {1: '领导', 0: '成员'}[role] || role
    }
  },
  computed: {
    totalWarn() {
      return this.list.reduce(
        (sum, i) => sum + (Number(i.Killchain_Warn) || 0),
        0
      )
    },
    detailFields() {
      const row = this.currentRow
      if (!row || row.KILLCHAIN_ID === undefined) return []
      const known = {
        KILLCHAIN_ID: '杀伤链编号',
        RWMC: '任务名称',
        MBMC: '目标名称',
        MBID: '目标标识',
        KILLCHAIN_TARGET_PROPERTY: '目标属性',
        KILLCHAIN_EXECUTEPHASE: '执行阶段',
        KILLCHAIN_STATE: '执行状态',
        Killchain_Warn: '关联告警'
      }
      const fields = []
      Object.keys(known).forEach(key => {
        const val = row[key]
        if (val === undefined || val === null || val === '') return
        fields.push({
          key,
          label: known[key],
          value: this.formatDetailValue(key, val),
          json: false
        })
      })
      const extraLabels = {
        SSLXXID: '杀伤链信息ID',
        ZZRWID: '作战任务ID',
        KILLCHAIN_STARTTIME: '杀伤链开始时间',
        KILLCHAIN_ENDTIME: '杀伤链结束时间',
        opTime: '更新时间',
        latestSSLYXID: '最新运行记录ID',
        latestSSLQZCYs: '最新协同群组成员',
        latestSSLWLGHs: '最新网络规划关系',
        phrasePtNamesMap: '各阶段平台名称',
        phrasePtCountMap: '各阶段平台数量',
        phraseWlCountMap: '各阶段链路数量'
      }
      const phaseKeys = [
        'phrasePtNamesMap',
        'phrasePtCountMap',
        'phraseWlCountMap',
        'latestSSLQZCYs',
        'latestSSLWLGHs'
      ]
      const seen = new Set([...Object.keys(known), ...phaseKeys])
      Object.keys(row).forEach(key => {
        if (seen.has(key)) return
        const val = row[key]
        if (val === undefined || val === null || val === '') return
        const label = extraLabels[key] || key
        if (typeof val === 'object') {
          const isEmpty = Array.isArray(val)
            ? val.length === 0
            : Object.keys(val).length === 0
          let text = ''
          try {
            text = isEmpty ? '—' : JSON.stringify(val)
          } catch (e) {
            text = String(val)
          }
          fields.push({key, label, value: text, json: !isEmpty})
        } else {
          fields.push({key, label, value: val, json: false})
        }
      })
      return fields
    },
    phaseStats() {
      const row = this.currentRow
      const parse = v => {
        if (!v) return {}
        if (typeof v === 'object') return v
        try {
          return JSON.parse(v)
        } catch (e) {
          return {}
        }
      }
      const names = parse(row.phrasePtNamesMap)
      const ptCounts = parse(row.phrasePtCountMap)
      const wlCounts = parse(row.phraseWlCountMap)
      return [0, 1, 2, 3, 4, 5].map(phase => {
        const platformNames = String(names[phase] || '').trim()
        const platforms = platformNames
          ? platformNames
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : []
        const platformCount = Number(ptCounts[phase]) || 0
        const linkCount = Number(wlCounts[phase]) || 0
        return {
          phase,
          label: this.phraseMap[phase] || String(phase),
          platformNames,
          platforms,
          platformCount,
          linkCount,
          hasData: platformCount > 0 || linkCount > 0 || platformNames !== ''
        }
      })
    },
    latestGroupMembers() {
      return this.parseArray(this.currentRow.latestSSLQZCYs)
    },
    latestNetworkLinks() {
      return this.parseArray(this.currentRow.latestSSLWLGHs)
    },
    selectedPhaseInfo() {
      if (this.flowExpandedPhase === null) return null
      return (
        this.flowPhases.find(p => p.phase === this.flowExpandedPhase) || null
      )
    },
    flowTimelineSegs() {
      const tl = this.flowTimeline
      if (!tl.length) return []
      const phases = [0, 1, 2, 3, 4, 5]
      const firstTime = tl[0].opTime
      const lastTime = tl[tl.length - 1].opTime
      const total = Math.max(
        new Date(lastTime).getTime() - new Date(firstTime).getTime(),
        1
      )
      const phaseFirst = {}
      const phaseState = {}
      tl.forEach(r => {
        const ph = Number(r.KILLCHAIN_EXECUTEPHASE)
        if (!isNaN(ph)) {
          if (phaseFirst[ph] === undefined) phaseFirst[ph] = r.opTime
          // 时间升序遍历，后到的为最新状态
          phaseState[ph] = r.KILLCHAIN_STATE
        }
      })
      return phases.map((ph, i) => {
        const reached = phaseFirst[ph] !== undefined
        const start = reached ? phaseFirst[ph] : null
        let end = null
        for (let j = i + 1; j < phases.length; j++) {
          if (phaseFirst[phases[j]] !== undefined) {
            end = phaseFirst[phases[j]]
            break
          }
        }
        if (!end) end = lastTime
        // 均衡分段：已到达等宽、未到达窄灰（时间乱序时比例失真，改为均衡更清晰）
        const flex = reached ? 1 : 0.5
        return {
          phase: ph,
          label: this.phraseMap[ph] || String(ph),
          reached,
          current: reached && Number(this.flowCurrentPhase) === ph,
          state:
            reached && phaseState[ph] !== undefined
              ? this.stateLabel(phaseState[ph])
              : '',
          startLabel: start ? start.slice(0, 19) : '',
          endLabel: end ? end.slice(0, 19) : '',
          flex
        }
      })
    }
  }
}
</script>

<style scoped>
/* ==================== 页面底座 ==================== */
.sslxx-monitor {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #f8fafc;
  overflow: hidden;
  padding: 14px 18px;
  box-sizing: border-box;
  gap: 12px;
}

/* ==================== 顶部标题栏 ==================== */
.monitor-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #0ea5a0, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.45);
}
.brand-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 1px;
}
.brand-sub {
  font-size: 10px;
  color: #475569;
  letter-spacing: 2px;
  margin-top: 3px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: livePulse 1.6s infinite;
}
.live-text {
  font-size: 12px;
  color: #10b981;
  font-weight: 600;
}
.header-divider {
  width: 1px;
  height: 18px;
  background: #1f2937;
  margin: 0 4px;
}
@keyframes livePulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

/* ==================== 统计卡片 ==================== */
.stat-cards {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 12px 16px;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.sc-total::before {
  background: #38bdf8;
}
.sc-normal::before {
  background: #10b981;
}
.sc-abnormal::before {
  background: #f43f5e;
}
.sc-warn::before {
  background: #f59e0b;
}
.sc-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sc-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sc-label {
  font-size: 11px;
  color: #64748b;
}
.sc-value {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1;
}
.sc-trend {
  margin-left: auto;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.sc-trend.ok {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}
.sc-trend.danger {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.12);
}
.sc-trend.warn {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}
.sc-trend.info {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
}

/* ==================== 查询条件栏 ==================== */
.query-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 10px 14px;
}
.query-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.query-label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}
.query-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
.dark-input ::v-deep .el-input__inner {
  background-color: #1f2937 !important;
  border: 1px solid #374151 !important;
  color: #f8fafc !important;
  width: 140px;
}
.dark-select ::v-deep .el-input__inner {
  background-color: #1f2937 !important;
  border: 1px solid #374151 !important;
  color: #f8fafc !important;
  width: 120px;
}
.dark-select ::v-deep .el-select__caret,
.dark-input ::v-deep .el-input__icon {
  color: #64748b;
}
.dark-btn {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
  color: #94a3b8 !important;
}
.dark-btn:hover {
  background-color: #374151 !important;
  border-color: #14b8a6 !important;
  color: #f8fafc !important;
}

/* ==================== 数据表格 ==================== */
.table-wrap {
  flex: 1;
  min-height: 0;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
}
.sslxx-table ::v-deep .el-table__row:hover > td {
  background: #1e293b !important;
}
.sslxx-table ::v-deep .el-table__body tr.current-row > td {
  background: #1e293b !important;
}
.kc-id {
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #38bdf8;
  font-weight: 600;
}
.mbmc {
  color: #f8fafc;
  font-weight: 500;
}
.phase-tag {
  border-radius: 4px;
  min-width: 48px;
}
.state-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.state-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.state-1 {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}
.state-1 .state-dot {
  background: #10b981;
  box-shadow: 0 0 5px #10b981;
}
.state-2 {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.12);
}
.state-2 .state-dot {
  background: #f43f5e;
  box-shadow: 0 0 5px #f43f5e;
}
.state-3 {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
}
.state-3 .state-dot {
  background: #94a3b8;
}
.state-4 {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}
.state-4 .state-dot {
  background: #f59e0b;
  box-shadow: 0 0 5px #f59e0b;
}
.warn-num {
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #64748b;
}
.warn-num.has-warn {
  color: #f59e0b;
  font-weight: 600;
}
.detail-btn {
  color: #38bdf8 !important;
}
.situation-btn {
  color: #f59e0b !important;
}
.situation-btn:hover {
  color: #fbbf24 !important;
}
.group-btn {
  color: #10b981 !important;
}
.group-btn:hover {
  color: #34d399 !important;
}
.member-btn {
  color: #a78bfa !important;
}
.member-btn:hover {
  color: #c4b5fd !important;
}
.group-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.group-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 10px;
}
.group-info-col {
  min-width: 0;
}
.group-net-col {
  min-width: 0;
  border-left: 1px solid #1f2937;
  padding-left: 12px;
}
.group-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1f2937;
}
.group-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}
.phase-chip {
  font-size: 10px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 10px;
  padding: 1px 8px;
}
.phase-chip.clickable {
  cursor: pointer;
  transition:
    background 0.2s,
    box-shadow 0.2s;
}
.phase-chip.clickable:hover {
  background: rgba(251, 191, 36, 0.2);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.55);
}
.phase-chip.clickable.phase-active {
  color: #0f172a;
  background: #fbbf24;
  border-color: #fbbf24;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
}
.sslyx-group-btn {
  flex: none;
}
.sslyx-groups {
  margin-top: 14px;
  padding: 14px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sslyx-groups-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}
.sslyx-groups-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: #64748b;
}
/* 运行态势弹窗左右分栏：左侧历史、右侧阶段群组 */
.sslyx-body.sslyx-layout {
  display: flex;
  gap: 12px;
  align-items: stretch;
}
.sslyx-left {
  flex: 1.1;
  min-width: 0;
  height: 520px;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sslyx-right {
  flex: 1;
  min-width: 0;
  height: 520px;
  overflow-y: auto;
  padding-left: 2px;
}
.sslyx-right .sslyx-groups {
  margin-top: 0;
  box-sizing: border-box;
}
.sslyx-right .group-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.group-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #1f2937;
}
.group-tab {
  padding: 4px 12px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition:
    color 0.2s,
    border-color 0.2s;
  user-select: none;
}
.group-tab:hover {
  color: #e2e8f0;
}
.group-tab.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
  font-weight: 600;
}
.group-tab-panel {
  padding-top: 2px;
  height: 180px;
  overflow-y: auto;
}
/* 左侧运行记录卡片：整卡可点、时间右下角、字段两行 */
.sslyx-left .group-card.sslyx-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}
.sslyx-left .group-card.sslyx-card:hover {
  border-color: #334155;
  background: #0f172a;
}
.sslyx-left .group-card.sslyx-card.active {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.4);
}
.sslyx-kv {
  grid-template-columns: 1fr;
}
.sslyx-card-time {
  font-size: 10px;
  color: #475569;
  text-align: right;
}
/* 右侧群组成员（并入群组信息面板） */
.sslyx-info-members {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #1f2937;
}
.sslyx-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sslyx-member {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #1f2937;
  border-radius: 14px;
  font-size: 11px;
}
.sslyx-member-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #475569;
}
.sslyx-member-name {
  color: #e2e8f0;
}
.sslyx-right-empty {
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  font-size: 12px;
  color: #475569;
  border: 1px dashed #1f2937;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.4);
}
.group-card-badge {
  margin-left: auto;
  font-size: 10px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-radius: 10px;
  padding: 1px 8px;
}
.group-links {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}
.group-links-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}
.group-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 6px;
  padding: 5px 8px;
  margin-bottom: 4px;
  font-size: 11px;
}
.gl-src,
.gl-dst {
  color: #e2e8f0;
}
.gl-arrow {
  color: #475569;
  font-size: 10px;
}
.gl-meta {
  margin-left: auto;
  color: #64748b;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
.sslyx-body {
  display: block;
}
.sslyx-pager {
  margin-top: 10px;
}

/* ==================== 分页 ==================== */
.pagination-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 6px 14px;
}
.pagination-total {
  font-size: 12px;
  color: #64748b;
}
.pagination-total b {
  color: #38bdf8;
}
.pagination-bar ::v-deep .el-pagination.is-background .el-pager li {
  background-color: #1f2937;
  color: #94a3b8;
}
.pagination-bar ::v-deep .el-pagination.is-background .el-pager li.active {
  background-color: #0ea5a0;
  color: #fff;
}
.pagination-bar ::v-deep .el-pagination .btn-prev,
.pagination-bar ::v-deep .el-pagination .btn-next {
  background-color: #1f2937;
  color: #94a3b8;
}
.pagination-bar ::v-deep .el-pagination__jump {
  color: #64748b;
}
.pagination-bar ::v-deep .el-input__inner {
  background-color: #1f2937;
  border-color: #374151;
  color: #f8fafc;
}

/* ==================== 详情弹窗 ==================== */
.dark-dialog ::v-deep .el-dialog {
  max-height: 55vh;
  margin-top: 5vh;
  margin-bottom: 5vh;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
}
.dark-dialog ::v-deep .el-dialog__body {
  max-height: calc(55vh - 70px);
  overflow-y: auto;
}
.dark-dialog ::v-deep .el-dialog__title {
  color: #f8fafc;
}
/* 流程弹窗高度自适应（贴近全视口，内容超高时内部滚动） */
.dark-dialog.flow-dialog ::v-deep .el-dialog {
  max-height: calc(100vh - 8vh);
  margin-top: 4vh;
  margin-bottom: 4vh;
}
.dark-dialog.flow-dialog ::v-deep .el-dialog__body {
  max-height: calc(100vh - 8vh - 72px);
  overflow-y: auto;
}
/* 详情弹窗高度自适应（随内容撑开，不受 55vh 限制） */
.dark-dialog.detail-dialog ::v-deep .el-dialog {
  max-height: none;
}
.dark-dialog.detail-dialog ::v-deep .el-dialog__body {
  max-height: none;
  overflow-y: visible;
}
/* 运行态势弹窗高度自适应（随内容撑开） */
.dark-dialog.sslyx-dialog ::v-deep .el-dialog {
  max-height: none;
  margin-top: 4vh;
  margin-bottom: 4vh;
}
.dark-dialog.sslyx-dialog ::v-deep .el-dialog__body {
  max-height: none;
  overflow-y: visible;
}
.dark-dialog ::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: #94a3b8;
}
.detail-body {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 12px;
}
.detail-main {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  min-width: 0;
  align-content: flex-start;
}
.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 6px;
}
.d-label {
  width: 92px;
  flex: none;
  font-size: 12px;
  color: #64748b;
}
.d-value {
  flex: 1;
  font-size: 13px;
  color: #f8fafc;
  word-break: break-all;
  text-align: right;
}
.d-value.d-json {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
  color: #38bdf8;
}
.detail-empty {
  padding: 24px 0;
  text-align: center;
  font-size: 12px;
  color: #475569;
}

/* ==================== 各阶段要素平铺 ==================== */
.phase-section {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding: 12px 0 2px;
  border-top: 1px solid #1f2937;
}
.phase-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 10px;
}
.phase-section-title .phase-legend {
  margin-left: auto;
  font-size: 10px;
  font-weight: 400;
  color: #475569;
}
.phase-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}
.phase-cell {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 8px 6px;
  text-align: center;
  transition: border-color 0.2s;
}
.phase-cell.has-data {
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.1);
}
.phase-name {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 1px;
}
.phase-0 .phase-name {
  color: #38bdf8;
}
.phase-1 .phase-name {
  color: #a78bfa;
}
.phase-2 .phase-name {
  color: #fbbf24;
}
.phase-3 .phase-name {
  color: #fb923c;
}
.phase-4 .phase-name {
  color: #f87171;
}
.phase-5 .phase-name {
  color: #34d399;
}
.phase-0.has-data {
  border-color: #38bdf8;
}
.phase-1.has-data {
  border-color: #a78bfa;
}
.phase-2.has-data {
  border-color: #fbbf24;
}
.phase-3.has-data {
  border-color: #fb923c;
}
.phase-4.has-data {
  border-color: #f87171;
}
.phase-5.has-data {
  border-color: #34d399;
}
.phase-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px;
}
.pc-label {
  font-size: 10px;
  color: #64748b;
}
.pc-num {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
.pc-num.zero {
  color: #475569;
}
.phase-names {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: 3px;
  min-height: 14px;
}
.phase-name-tag {
  font-size: 9px;
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 3px;
  padding: 1px 4px;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.phase-more {
  font-size: 9px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 3px;
  padding: 1px 4px;
  line-height: 1.4;
}
.phase-names.empty {
  color: #334155;
}

/* ==================== 协同群组成员 / 网络规划关系 ==================== */
.rel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.rel-tabs {
  display: flex;
  gap: 6px;
}
.rel-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.rel-tab:hover {
  color: #e2e8f0;
  border-color: #374151;
}
.rel-tab.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.15);
}
.rel-tab .rel-count {
  margin-left: auto;
}
.rel-panel {
  height: 240px;
  display: flex;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
}
.rel-panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.rel-col {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 8px;
}
.rel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
}
.rel-count {
  margin-left: auto;
  font-size: 10px;
  font-weight: 400;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-radius: 10px;
  padding: 1px 8px;
}
.rel-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}
.rel-list::-webkit-scrollbar {
  width: 4px;
}
.rel-list::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 2px;
}
.rel-item {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 6px;
  padding: 6px 8px;
}
.rel-item-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.rel-idx {
  font-size: 10px;
  color: #64748b;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
.rel-name {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rel-type {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}
.rel-type.type-1 {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
}
.rel-type.type-2 {
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
}
.rel-type.type-3 {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
}
.rel-role {
  flex: none;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}
.rel-role.role-1 {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.rel-role.role-0 {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.rel-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px 12px;
}
.rel-kv-grid .kv-span2 {
  grid-column: 1 / -1;
}
.rel-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 1px 2px;
  font-size: 11px;
  min-width: 0;
}
.rel-kv.kv-wrap {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
}
.rel-kv.kv-nolabel {
  justify-content: flex-start;
}
.rel-kv.kv-nolabel .rk-value {
  text-align: left;
}
.rel-kv .rk-value {
  margin-left: 4px;
}
.rk-value.rk-none {
  color: #475569;
}
.rel-kv-2col {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 6px;
}
.rk-label {
  color: #64748b;
}
.rk-value {
  color: #e2e8f0;
  text-align: right;
  word-break: break-all;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
.rel-empty {
  padding: 18px 0;
  text-align: center;
  font-size: 11px;
  color: #475569;
}

/* ==================== 流程可视化 ==================== */
.flow-btn {
  color: #a78bfa !important;
}
.flow-btn:hover {
  color: #c4b5fd !important;
}
.flow-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.flow-track {
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 18px 14px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 10px;
}
.flow-node {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px 6px;
  border-radius: 8px;
  cursor: default;
  transition: background 0.2s;
}
.flow-node.is-reached {
  cursor: pointer;
}
.flow-node.is-reached:hover {
  background: rgba(56, 189, 248, 0.08);
}
.flow-node.is-selected {
  background: rgba(56, 189, 248, 0.14);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.4);
}
.flow-node-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #334155;
  border: 2px solid #475569;
  box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.15);
  transition: all 0.25s;
}
.flow-node.is-reached .flow-node-dot {
  background: #0ea5e9;
  border-color: #7dd3fc;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.7);
}
.flow-node.is-current .flow-node-dot {
  background: #10b981;
  border-color: #6ee7b7;
  animation: flow-breathe 1.6s ease-in-out infinite;
}
@keyframes flow-breathe {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 14px rgba(16, 185, 129, 0.95);
  }
}
.flow-node-label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  transition: color 0.25s;
}
.flow-node.is-reached .flow-node-label {
  color: #e0f2fe;
  font-weight: 600;
}
.flow-node-groups {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 8px;
  color: #a5b4fc;
  background: rgba(167, 139, 250, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.35);
}
.flow-arrow {
  flex: none;
  align-self: center;
  display: flex;
  align-items: center;
  color: #334155;
  font-size: 14px;
  transition: color 0.25s;
}
.flow-arrow.is-active {
  color: #38bdf8;
}
.flow-phase-detail {
  padding: 14px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.flow-detail-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}
.flow-detail-count {
  font-size: 11px;
  font-weight: 400;
  color: #64748b;
  margin-left: auto;
}
.flow-group-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
}
.flow-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.flow-toggle-btn {
  margin-left: auto;
  color: #a78bfa !important;
  padding: 0;
}
.flow-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.flow-member {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #1f2937;
  border-radius: 14px;
  font-size: 11px;
}
.flow-member-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #475569;
}
.flow-member-name {
  color: #e2e8f0;
}
.flow-no-member {
  font-size: 11px;
  color: #475569;
}
.flow-chart-wrap {
  padding: 14px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
/* 阶段演进时间轴（横向分段） */
.flow-timeline {
  display: flex;
  align-items: stretch;
  gap: 3px;
  height: 86px;
}
.flow-tl-seg {
  min-width: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  padding: 6px 4px;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.35);
  border: 1px dashed #334155;
  color: #475569;
  overflow: hidden;
}
.flow-tl-seg.is-reached {
  background: rgba(14, 165, 233, 0.16);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #e0f2fe;
}
.flow-tl-seg.is-current {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.45);
  animation: flow-breathe 1.6s ease-in-out infinite;
}
.flow-tl-seg-label {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.flow-tl-seg-state {
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 8px;
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.12);
  white-space: nowrap;
}
.flow-tl-seg-time {
  font-size: 9px;
  color: #94a3b8;
  white-space: nowrap;
}
</style>
