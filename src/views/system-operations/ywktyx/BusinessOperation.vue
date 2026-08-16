<template>
  <div class="screen-container">
    <div class="main-body-layout">
      <div class="panel-wing-left" v-loading="loadingLeft">
        <div class="panel-header-summary">
          <span class="title">
            <Icon
              icon="lucide:satellite"
              :size="13"
              color="#06b6d4"
              style="vertical-align: middle; margin-right: 4px"
            />运控策略树
          </span>
          <el-button type="primary" size="mini" @click="openTreeDialog(false)"
            >新建流程</el-button
          >
        </div>

        <div class="filter-action-row">
          <el-input
            v-model="filterText"
            placeholder="过滤树节点名称..."
            size="mini"
            clearable
          />
        </div>

        <div class="tree-scroll-container">
          <el-tree
            ref="strategyTree"
            :data="treeData"
            :props="defaultProps"
            node-key="businessId"
            :filter-node-method="filterNode"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <span class="custom-tree-node" slot-scope="{data}">
              <span>
                <span class="tree-icon">
                  <Icon
                    v-if="data.businessType === 0"
                    icon="lucide:folder"
                    :size="12"
                    color="#facc15"
                    style="vertical-align: middle"
                  />
                  <Icon
                    v-else
                    icon="lucide:git-fork"
                    :size="12"
                    color="#38bdf8"
                    style="vertical-align: middle"
                  />
                </span>
                <span style="margin-left: 5px">{{ data.businessName }}</span>
              </span>
              <span class="node-action-span">
                <i
                  class="el-icon-edit text-green"
                  title="编辑"
                  @click.stop="openTreeDialog(true, data)"
                ></i>
                <i
                  class="el-icon-delete text-red"
                  title="删除"
                  @click.stop="handleDeleteTree(data)"
                ></i>
              </span>
            </span>
          </el-tree>
        </div>
      </div>

      <div class="panel-wing-right">
        <div v-if="!activeBusinessId" class="empty-fallback">
          <div class="radar-scan-loader"></div>
          <p>请先在左侧控制树点击选择具体 [业务流程] 以激活 X6 拓扑建模轴...</p>
        </div>

        <div v-show="activeBusinessId" class="canvas-layout-wrapper">
          <div class="canvas-top-bar">
            <div class="active-tip">
              <Icon
                icon="lucide:activity"
                :size="13"
                color="#10b981"
                style="vertical-align: middle; margin-right: 2px"
              />
              当前指挥流:
              <span class="active-flow-name">{{ activeBusinessName }}</span>
              <span v-if="activeBusinessState !== null" class="flow-state-tag">
                状态: {{ getStatusLabel(activeBusinessState) }}
              </span>
            </div>
            <div class="action-btn-group">
              <el-button type="warning" size="mini" @click="layoutGraph"
                >自动布线居中</el-button
              >
              <el-button type="primary" size="mini" @click="centerGraph"
                >视角复位居中</el-button
              >
              <el-button type="danger" size="mini" @click="clearCanvas"
                >全舱清空</el-button
              >
            </div>
          </div>

          <div class="workspace-body">
            <div class="dnd-sidebar">
              <div>
                <div class="sidebar-title">
                  <Icon
                    icon="lucide:swords"
                    :size="12"
                    color="#94a3b8"
                    style="vertical-align: middle; margin-right: 4px"
                  />流程节点算子
                </div>

                <div class="dnd-pool">
                  <div
                    v-for="(typeLabel, idx) in dynamicNodeTypes"
                    :key="idx"
                    class="dnd-item"
                    @mousedown="startDrag($event, typeLabel)"
                  >
                    <Icon
                      icon="lucide:cpu"
                      :size="11"
                      color="#38bdf8"
                      style="vertical-align: middle; margin-right: 4px"
                    />{{ typeLabel }}
                  </div>
                </div>
              </div>

              <div class="dnd-tip-box">
                <p class="tip-title">
                  <Icon
                    icon="lucide:lightbulb"
                    :size="12"
                    color="#fbbf24"
                    style="vertical-align: middle; margin-right: 3px"
                  />快捷操纵指南：
                </p>
                <p>
                  1. <b>鼠标左键拖拽</b>算子节点入画布释放，配置后即时同步云端。
                </p>
                <p>
                  2.
                  触碰节点边缘蓝点向下拉出连线，释放后<b>即时配置并固化</b>路由条件。
                </p>
                <p>3. <b>单点单击</b>任一图元或线缆可随时唤醒配置弹窗。</p>
                <p>
                  4.
                  <b>删除逻辑</b
                  >：点击图元弹出配置窗，通过左下角按钮执行云端销毁。
                </p>
              </div>
            </div>

            <div class="canvas-container" v-loading="loadingRight">
              <div id="container-x6-canvas" class="x6-graph-instance"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      :visible.sync="dialogNodeVisible"
      width="480px"
      append-to-body
      :before-close="handleNodeDialogCancel"
    >
      <div slot="title" class="dialog-custom-title">
        <Icon
          v-if="formNode.businessNodeId"
          icon="lucide:wrench"
          :size="14"
          color="#38bdf8"
          style="vertical-align: middle; margin-right: 5px"
        />
        <Icon
          v-else
          icon="lucide:rocket"
          :size="14"
          color="#10b981"
          style="vertical-align: middle; margin-right: 5px"
        />
        <span>{{
          formNode.businessNodeId ? '修改流程节点参数' : '新增流程图元节点'
        }}</span>
      </div>

      <el-form
        :model="formNode"
        ref="nodeForm"
        :rules="rulesNode"
        label-width="111px"
        size="mini"
      >
        <el-form-item label="节点名称" prop="nodeName">
          <el-input
            v-model="formNode.nodeName"
            placeholder="具体图元算子名称..."
          />
        </el-form-item>
        <el-form-item label="节点类型">
          <el-select v-model="formNode.nodeType" class="full-width">
            <el-option
              v-for="t in dynamicNodeTypes"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务模板归属">
          <el-select
            v-model="formNode.serviceTemplateId"
            placeholder="选择关联的服务模板"
            class="full-width"
            filterable
            clearable
          >
            <el-option
              v-for="item in templateOptions"
              :key="item.serviceTemplateId || item.id"
              :label="item.templateName || item.name || item.serviceTemplateId"
              :value="item.serviceTemplateId || item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图元节点说明">
          <el-input type="textarea" v-model="formNode.nodeMemo" :rows="3" />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer-layout">
        <div class="footer-left-action">
          <el-button
            v-if="formNode.businessNodeId"
            size="mini"
            type="danger"
            plain
            icon="el-icon-delete"
            @click="deleteCurrentNode"
            >删除节点</el-button
          >
        </div>
        <div class="footer-right-action">
          <el-button size="mini" @click="handleNodeDialogCancel"
            >取消</el-button
          >
          <el-button size="mini" type="primary" @click="submitNodeForm"
            >保存至云端</el-button
          >
        </div>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="dialogLinkVisible"
      width="460px"
      append-to-body
      :before-close="handleLinkDialogCancel"
    >
      <div slot="title" class="dialog-custom-title">
        <Icon
          icon="lucide:link-2"
          :size="14"
          color="#fb923c"
          style="vertical-align: middle; margin-right: 5px"
        />
        <span>配置线缆路由参数</span>
      </div>

      <el-form :model="formLink" size="mini" label-width="111px">
        <el-form-item label="条件表达式(elExp)">
          <el-input
            type="textarea"
            v-model="formLink.elExp"
            :rows="3"
            placeholder="例如：${status == 200}"
          />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer-layout">
        <div class="footer-left-action">
          <el-button
            v-if="formLink.businessLinkId"
            size="mini"
            type="danger"
            plain
            icon="el-icon-scissors"
            @click="deleteCurrentLink"
            >斩断此连线</el-button
          >
        </div>
        <div class="footer-right-action">
          <el-button size="mini" @click="handleLinkDialogCancel"
            >取消</el-button
          >
          <el-button size="mini" type="primary" @click="submitLinkForm"
            >保存至云端</el-button
          >
        </div>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogTreeVisible" width="480px" append-to-body>
      <div slot="title" class="dialog-custom-title">
        <Icon
          v-if="isEditTree"
          icon="lucide:folder-cog"
          :size="14"
          color="#38bdf8"
          style="vertical-align: middle; margin-right: 5px"
        />
        <Icon
          v-else
          icon="lucide:folder-plus"
          :size="14"
          color="#10b981"
          style="vertical-align: middle; margin-right: 5px"
        />
        <span>{{ isEditTree ? '修改目录/流程' : '新增目录/流程' }}</span>
      </div>

      <el-form :model="formTree" size="mini" label-width="111px">
        <el-form-item label="上级节点">
          <el-cascader
            v-model="formTree.parentBusinessId"
            :options="treeData"
            :props="{
              value: 'businessId',
              label: 'businessName',
              children: 'children',
              emitPath: false,
              checkStrictly: true
            }"
            placeholder="根层级请留空"
            class="full-width"
            clearable
          />
        </el-form-item>
        <el-form-item label="名称"
          ><el-input v-model="formTree.businessName"
        /></el-form-item>
        <el-form-item label="节点属性">
          <el-select v-model="formTree.businessType" class="full-width">
            <el-option label="目录结构" :value="0" />
            <el-option label="业务流程图" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明详情"
          ><el-input type="textarea" v-model="formTree.businessMemo" :rows="2"
        /></el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="dialogTreeVisible = false"
          >取消</el-button
        >
        <el-button size="mini" type="primary" @click="submitTreeForm"
          >保存</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {apiPage, apiAdd, apiUpdate, apiDelete} from '@/api/common.js'
import {businessInfoTops, nodeTypes} from '@/api/map.js'
import {Graph, Dnd} from '@antv/x6'
import {DagreLayout} from '@antv/layout'

export default {
  name: 'OperationStrategyOptimizer',
  data() {
    return {
      baseInfoUrl: 'businessInfo',
      baseNodeUrl: 'businessNode',
      baseLinkUrl: 'businessLink',

      loadingLeft: false,
      loadingRight: false,
      filterText: '',

      treeData: [],
      defaultProps: {children: 'children', label: 'businessName'},
      activeBusinessId: null,
      activeBusinessName: '',
      activeBusinessState: null,

      dynamicNodeTypes: [],
      templateOptions: [],

      dialogTreeVisible: false,
      isEditTree: false,
      formTree: {},

      dialogNodeVisible: false,
      formNode: {},
      currentNodeCell: null,
      isNewNodeAction: false,
      rulesNode: {
        nodeName: [
          {required: true, message: '节点名称不可为空', trigger: 'blur'}
        ]
      },

      dialogLinkVisible: false,
      formLink: {},
      currentEdgeCell: null,
      isNewLinkAction: false,

      graph: null,
      dnd: null,
      resizeTimer: null,
      isGraphLoading: false
    }
  },
  watch: {
    filterText(val) {
      this.$refs.strategyTree.filter(val)
    }
  },
  mounted() {
    this.loadStrategyTree()
    this.loadDynamicNodeTypes()
    this.loadServiceTemplates()
    window.addEventListener('resize', this.handleWindowResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleWindowResize)
    if (this.graph) this.graph.dispose()
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true
      return data.businessName.indexOf(value) !== -1
    },
    getStatusLabel(state) {
      const stateMap = {0: '未运行', 1: '运行中', 2: '已完成'}
      return stateMap[state] || '未运行'
    },
    loadDynamicNodeTypes() {
      nodeTypes()
        .then(res => {
          this.dynamicNodeTypes = res.data ||
            res || ['普通节点', '条件选择', '固定循环', '条件循环', '脚本节点']
        })
        .catch(() => {
          this.dynamicNodeTypes = [
            '普通节点',
            '条件选择',
            '固定循环',
            '条件循环',
            '脚本节点'
          ]
        })
    },
    loadServiceTemplates() {
      apiPage('serviceTemplate', {pageNum: 1, pageSize: 1000, params: {}}).then(
        res => {
          this.templateOptions = res.data?.list || res.data || []
        }
      )
    },
    loadStrategyTree() {
      this.loadingLeft = true
      businessInfoTops()
        .then(res => {
          this.treeData = res.data?.list || res.data || []
        })
        .finally(() => {
          this.loadingLeft = false
        })
    },
    handleNodeClick(data) {
      if (
        data.businessType === 0 ||
        (data.children && data.children.length > 0)
      )
        return

      this.activeBusinessId = data.businessId
      this.activeBusinessName = data.businessName
      this.activeBusinessState = data.businessState

      this.$nextTick(() => {
        this.initX6Graph()
        this.loadTopologyData()
      })
    },

    initX6Graph() {
      if (this.graph) return

      const container = document.getElementById('container-x6-canvas')
      if (!container) return

      this.graph = new Graph({
        container: container,
        autoResize: true,
        background: {color: '#070c14'},
        grid: {
          size: 10,
          visible: true,
          type: 'mesh',
          args: {color: '#111c2e', thickness: 1}
        },
        connecting: {
          router: 'manhattan',
          connector: {name: 'rounded', args: {radius: 8}},
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          snap: {radius: 20},
          createEdge() {
            return this.createEdge({
              attrs: {
                line: {
                  stroke: '#38bdf8',
                  strokeWidth: 2,
                  targetMarker: {name: 'block', width: 8, height: 6}
                }
              }
            })
          }
        },
        snapline: true,
        panning: true,
        mousewheel: {enabled: true, modifiers: 'ctrl'}
      })

      this.dnd = new Dnd({target: this.graph, scaled: false})

      this.graph.on('node:added', ({node}) => {
        if (this.isGraphLoading) return
        if (this.isNewNodeAction) {
          this.isNewNodeAction = false
          this.evokeNodeEditor(node, true)
        }
      })

      this.graph.on('edge:connected', ({edge}) => {
        if (this.isGraphLoading) return
        setTimeout(() => {
          this.evokeEdgeEditor(edge, true)
        }, 100)
      })

      this.graph.on('node:click', ({node}) => {
        if (this.isGraphLoading) return
        this.evokeNodeEditor(node, false)
      })
      this.graph.on('edge:click', ({edge}) => {
        if (this.isGraphLoading) return
        this.evokeEdgeEditor(edge, false)
      })
    },

    startDrag(e, typeLabel) {
      if (!this.graph || !this.dnd) return
      this.isNewNodeAction = true

      const tempRandomId = 'temp-node-' + new Date().getTime()
      const node = this.graph.createNode({
        id: tempRandomId,
        width: 140,
        height: 40,
        label: typeLabel,
        attrs: {
          body: {fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 1.5, rx: 3},
          label: {fill: '#ffffff', fontSize: 12}
        },
        ports: {
          groups: {absolute: {position: 'absolute'}},
          items: [
            {
              id: 'port-top',
              group: 'absolute',
              args: {x: '50%', y: 0},
              attrs: {circle: {r: 4, magnet: true, fill: '#38bdf8'}}
            },
            {
              id: 'port-bottom',
              group: 'absolute',
              args: {x: '50%', y: '100%'},
              attrs: {circle: {r: 4, magnet: true, fill: '#38bdf8'}}
            }
          ]
        },
        data: {
          businessNodeId: null,
          businessId: this.activeBusinessId,
          nodeType: typeLabel,
          nodeName: typeLabel,
          serviceTemplateId: null,
          nodeMemo: ''
        }
      })
      this.dnd.start(node, e)
    },

    evokeNodeEditor(node, isNew = false) {
      this.currentNodeCell = node
      this.isNewNodeAction = isNew
      const data = node.getData() || {}
      const pos = node.position()

      this.formNode = {
        businessNodeId: data.businessNodeId || null,
        businessId: this.activeBusinessId,
        nodeName: node.getLabel() || data.nodeName || '',
        nodeType: data.nodeType || '普通节点',
        serviceTemplateId: data.serviceTemplateId || null,
        nodeMemo: data.nodeMemo || '',
        coordinateX: Math.floor(pos.x),
        coordinateY: Math.floor(pos.y)
      }
      this.dialogNodeVisible = true
    },
    submitNodeForm() {
      this.$refs.nodeForm.validate(valid => {
        if (!valid) return
        const isUpdateAction = !!this.formNode.businessNodeId
        const action = isUpdateAction
          ? apiUpdate(this.baseNodeUrl, this.formNode)
          : apiAdd(this.baseNodeUrl, this.formNode)

        action.then(res => {
          this.$message.success('节点数据同步就绪')
          this.dialogNodeVisible = false
          if (!isUpdateAction) {
            // 新增节点后端未返回 businessNodeId，重新拉取全量拓扑数据刷新画布
            this.loadTopologyData()
          } else if (this.currentNodeCell) {
            // 更新（改名）成功后，及时同步画布节点标签与内置数据
            this.currentNodeCell.setLabel(this.formNode.nodeName)
            const prevData = this.currentNodeCell.getData() || {}
            this.currentNodeCell.setData({
              ...prevData,
              nodeName: this.formNode.nodeName,
              nodeType: this.formNode.nodeType,
              serviceTemplateId: this.formNode.serviceTemplateId,
              nodeMemo: this.formNode.nodeMemo
            })
          }
        })
      })
    },
    handleNodeDialogCancel() {
      this.dialogNodeVisible = false
      if (this.isNewNodeAction && this.currentNodeCell) {
        this.graph.removeNode(this.currentNodeCell)
      }
    },
    deleteCurrentNode() {
      if (!this.formNode.businessNodeId) return
      this.$confirm(
        `危险操作：确定要从后端持久层彻底移除流程节点 [${this.formNode.nodeName}] 吗？相连线缆将同步断开。`,
        '删除确认',
        {type: 'warning'}
      ).then(() => {
        apiDelete(this.baseNodeUrl, this.formNode.businessNodeId).then(() => {
          this.$message.success('节点已成功下线销毁')
          if (this.currentNodeCell) {
            this.graph.removeNode(this.currentNodeCell)
          }
          this.dialogNodeVisible = false
        })
      })
    },

    evokeEdgeEditor(edge, isNew = false) {
      this.currentEdgeCell = edge
      this.isNewLinkAction = isNew
      const data = edge.getData() || {}

      const sourceNode = edge.getSourceNode()
      const targetNode = edge.getTargetNode()
      const srcNodeId = sourceNode?.getData()?.businessNodeId
      const dstNodeId = targetNode?.getData()?.businessNodeId

      if (!srcNodeId || !dstNodeId) {
        if (isNew) {
          this.$message.warning('请等待两端图元主键生成后再进行拉线链接')
          this.graph.removeEdge(edge)
        }
        return
      }

      this.formLink = {
        businessLinkId: data.businessLinkId || null,
        businessId: this.activeBusinessId,
        srcNodeId: srcNodeId,
        dstNodeId: dstNodeId,
        elExp: data.elExp || ''
      }
      this.dialogLinkVisible = true
    },
    submitLinkForm() {
      const isUpdateAction = !!this.formLink.businessLinkId
      const action = isUpdateAction
        ? apiUpdate(this.baseLinkUrl, this.formLink)
        : apiAdd(this.baseLinkUrl, this.formLink)

      action.then(res => {
        this.$message.success('连线路由条件已固化')
        const savedData = res.data || res || this.formLink
        if (this.currentEdgeCell) {
          this.currentEdgeCell.setData(savedData)
          if (!isUpdateAction && savedData.businessLinkId) {
            this.currentEdgeCell.id = 'link-' + savedData.businessLinkId
          }
          if (this.formLink.elExp) {
            this.currentEdgeCell.setLabels([
              {
                attrs: {
                  text: {
                    text: this.formLink.elExp,
                    fill: '#f59e0b',
                    fontSize: 10
                  }
                }
              }
            ])
          } else {
            this.currentEdgeCell.setLabels([])
          }
        }
        this.dialogLinkVisible = false
      })
    },
    handleLinkDialogCancel() {
      this.dialogLinkVisible = false
      if (this.isNewLinkAction && this.currentEdgeCell) {
        this.graph.removeEdge(this.currentEdgeCell)
      }
    },
    deleteCurrentLink() {
      if (!this.formLink.businessLinkId) return
      this.$confirm(
        '确定要彻底从后端斩断并销毁这条连接线缆吗？',
        '连线斩断确认',
        {type: 'warning'}
      ).then(() => {
        apiDelete(this.baseLinkUrl, this.formLink.businessLinkId).then(() => {
          this.$message.success('路由连线已成功切断')
          if (this.currentEdgeCell) {
            this.graph.removeEdge(this.currentEdgeCell)
          }
          this.dialogLinkVisible = false
        })
      })
    },

    loadTopologyData() {
      this.loadingRight = true
      if (this.graph) {
        this.graph.clearCells()
      }
      this.isGraphLoading = true

      const payload = {
        pageNum: 1,
        pageSize: 1000,
        params: {businessId: this.activeBusinessId}
      }

      Promise.all([
        apiPage(this.baseNodeUrl, payload),
        apiPage(this.baseLinkUrl, payload)
      ])
        .then(([resNodes, resLinks]) => {
          const backendNodes = resNodes.data?.list || resNodes.data || []
          const backendLinks = resLinks.data?.list || resLinks.data || []

          const x6NodesMap = {}

          backendNodes.forEach(item => {
            const vNode = this.graph.addNode({
              id: 'node-' + item.businessNodeId,
              x: Number(item.coordinateX) || 100,
              y: Number(item.coordinateY) || 100,
              width: 140,
              height: 40,
              label: item.nodeName,
              attrs: {
                body: {
                  fill: '#0f172a',
                  stroke: '#06b6d4',
                  strokeWidth: 1.5,
                  rx: 3
                },
                label: {fill: '#cbd5e1', fontSize: 12}
              },
              ports: {
                groups: {absolute: {position: 'absolute'}},
                items: [
                  {
                    id: 'port-top',
                    group: 'absolute',
                    args: {x: '50%', y: 0},
                    attrs: {circle: {r: 4, magnet: true, fill: '#06b6d4'}}
                  },
                  {
                    id: 'port-bottom',
                    group: 'absolute',
                    args: {x: '50%', y: '100%'},
                    attrs: {circle: {r: 4, magnet: true, fill: '#06b6d4'}}
                  }
                ]
              },
              data: {...item}
            })
            x6NodesMap[item.businessNodeId] = vNode
          })

          backendLinks.forEach(link => {
            const sNode = x6NodesMap[link.srcNodeId]
            const dNode = x6NodesMap[link.dstNodeId]
            if (sNode && dNode) {
              this.graph.addEdge({
                id: 'link-' + link.businessLinkId,
                source: {cell: sNode.id, port: 'port-bottom'},
                target: {cell: dNode.id, port: 'port-top'},
                attrs: {
                  line: {
                    stroke: '#f59e0b',
                    strokeWidth: 2,
                    targetMarker: {name: 'block', width: 8, height: 6}
                  }
                },
                labels: link.elExp
                  ? [
                      {
                        attrs: {
                          text: {
                            text: link.elExp,
                            fill: '#f59e0b',
                            fontSize: 10
                          }
                        }
                      }
                    ]
                  : [],
                data: {...link}
              })
            }
          })

          if (backendNodes.length > 0 && !backendNodes[0].coordinateX) {
            this.layoutGraph()
          } else {
            this.centerGraph()
          }
        })
        .finally(() => {
          this.loadingRight = false
          setTimeout(() => {
            this.isGraphLoading = false
          }, 150)
        })
    },

    layoutGraph() {
      if (!this.graph) return
      const nodes = this.graph
        .getNodes()
        .map(n => ({id: n.id, width: 140, height: 40}))
      const edges = this.graph
        .getEdges()
        .map(e => ({source: e.getSourceCellId(), target: e.getTargetCellId()}))

      const dagreLayout = new DagreLayout({
        type: 'dagre',
        rankdir: 'TB',
        ranksep: 40,
        nodesep: 40
      })
      const model = dagreLayout.layout({nodes, edges})

      this.graph.batchUpdate(() => {
        model.nodes.forEach(n => {
          const cell = this.graph.getCellById(n.id)
          if (cell) cell.position(n.x, n.y)
        })
      })
      this.centerGraph()
    },
    centerGraph() {
      if (this.graph) this.graph.centerContent()
    },
    handleWindowResize() {
      if (!this.graph) return

      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer)
      }

      this.resizeTimer = setTimeout(() => {
        const container = document.getElementById('container-x6-canvas')
        if (container && this.graph) {
          const width = container.clientWidth
          const height = container.clientHeight
          this.graph.resize(width, height)
          this.graph.centerContent()
        }
      }, 100)
    },
    clearCanvas() {
      if (this.graph) {
        this.graph.clearCells()
        this.$message.info('画布显式清空')
      }
    },

    openTreeDialog(isEdit, data = null) {
      this.isEditTree = isEdit
      if (isEdit && data) {
        console.log('编辑业务架构节点数据：', data)
        this.formTree = {...data}
      } else {
        this.formTree = {
          businessId: null,
          businessName: '',
          parentBusinessId: this.activeBusinessId || null,
          businessType: 1,
          businessState: 0,
          businessMemo: ''
        }
      }
      this.dialogTreeVisible = true
    },
    submitTreeForm() {
      const action = this.isEditTree
        ? apiUpdate(this.baseInfoUrl, this.formTree)
        : apiAdd(this.baseInfoUrl, this.formTree)
      action.then(() => {
        this.dialogTreeVisible = false
        this.loadStrategyTree()
      })
    },
    handleDeleteTree(data) {
      this.$confirm(`确定要移除业务架构 [${data.businessName}] 吗？`, '警示', {
        type: 'warning'
      }).then(() => {
        apiDelete(this.baseInfoUrl, data.businessId).then(() => {
          if (this.activeBusinessId === data.businessId) {
            this.activeBusinessId = null
            this.activeBusinessName = ''
          }
          this.loadStrategyTree()
        })
      })
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
  overflow: hidden;
  box-sizing: border-box;
  padding: 12px;
}
.main-body-layout {
  display: flex;
  flex: 1;
  gap: 12px;
  height: 100%;
  min-height: 0;
}
.panel-wing-left {
  width: 30%;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
}
.tree-scroll-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 4px;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 12px;
  justify-content: space-between;
  padding-right: 6px;
}
.tree-icon {
  display: inline-flex;
  align-items: center;
}
.node-action-span {
  display: none;
  gap: 8px;
  font-size: 12px;
}
.custom-tree-node:hover .node-action-span {
  display: flex;
}

.panel-wing-right {
  width: 75%;
  background: #080e18;
  border: 1px solid #111b2b;
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
}
.canvas-layout-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
}
.canvas-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0c1424;
  padding: 8px 12px;
  border-radius: 3px;
  margin-bottom: 11px;
  border: 1px solid #16243a;
}
.canvas-top-bar .active-tip {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.active-flow-name {
  color: #10b981;
  font-weight: bold;
}
.flow-state-tag {
  background: #1e293b;
  padding: 2px 6px;
  border-radius: 3px;
  color: #94a3b8;
  font-size: 11px;
}

.workspace-body {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}

.dnd-sidebar {
  width: 180px;
  background: #0a101a;
  border: 1px solid #16243a;
  border-radius: 3px;
  padding: 11px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.dnd-sidebar .sidebar-title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: bold;
  margin-bottom: 11px;
  border-bottom: 1px solid #16243a;
  padding-bottom: 4px;
}
.dnd-pool {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.dnd-item {
  padding: 8px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
  cursor: grab;
  user-select: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.dnd-item:hover {
  border-color: #38bdf8;
  color: #38bdf8;
}

.dnd-tip-box {
  background: #070c14;
  border: 1px dashed #1e293b;
  border-radius: 3px;
  padding: 8px;
  font-size: 11px;
  color: #516580;
  line-height: 1.5;
  margin-top: auto;
}
.dnd-tip-box .tip-title {
  color: #38bdf8;
  font-weight: bold;
  margin: 0 0 6px 0;
}
.dnd-tip-box p {
  margin: 0 0 4px 0;
}

.canvas-container {
  flex: 1;
  border: 1px solid #16243a;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  background: #070c14;
}
.x6-graph-instance {
  width: 100%;
  height: 100%;
}
.full-width {
  width: 100% !important;
}

/* 弹窗自定义头部样式 */
.dialog-custom-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: #cbd5e1;
}

.dialog-footer-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.panel-header-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid #111b2b;
  padding-bottom: 6px;
}
.panel-header-summary .title {
  font-size: 12px;
  font-weight: bold;
  color: #06b6d4;
  display: flex;
  align-items: center;
}
.filter-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.empty-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #080e18;
  color: #94a3b8;
  font-size: 11px;
}
.radar-scan-loader {
  width: 32px;
  height: 32px;
  border: 2px dashed #172438;
  border-radius: 50%;
  animation: spin 4s linear infinite;
  margin-bottom: 11px;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.text-green {
  color: #10b981;
}
.text-red {
  color: #ef4444;
}
</style>
