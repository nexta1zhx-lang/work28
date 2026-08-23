/**
 * 静态路由表
 * 从 index.js 中提取的所有业务页面路由
 */
const indexRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  }
]
const staticRoutes = [
  {
    path: '/',
    name: 'home',
    redirect: '/task-decomposition'
  },
  // 体系运营管理 - 任务需求分解
  {
    path: '/task-decomposition',
    name: 'TaskDecomposition',
    component: () =>
      import('@/views/system-operations/rwxqfj/TaskDecomposition.vue'),
    meta: {
      title: '任务需求分解',
      subsystem: '体系运营管理',
      category: '任务需求分解',
      icon: 'lucide:clipboard-list',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/decomposition',
    name: 'Decomposition',
    component: () =>
      import('@/views/system-operations/rwxqfj/TaskDecomposition.vue'),
    meta: {
      title: '作战筹划信息',
      subsystem: '体系运营管理',
      category: '任务需求分解',
      icon: 'lucide:compass',
      parentModule: '任务需求分解',
      requiresAuth: true
    }
  },
  {
    path: '/datalink-assurance-requirements',
    name: 'DataLinkAssuranceRequirements',
    component: () =>
      import('@/views/system-operations/rwxqfj/DataLinkAssuranceRequirements.vue'),
    meta: {
      title: '数据链保障需求分析',
      subsystem: '体系运营管理',
      category: '任务需求分解',
      icon: 'lucide:shield-check',
      parentModule: '任务需求分解',
      requiresAuth: true
    }
  },

  // 体系运营管理 - 运控策略制定
  {
    path: '/control-strategy',
    name: 'ControlStrategy',
    component: () =>
      import('@/views/system-operations/ykclzd/ControlStrategy.vue'),
    meta: {
      title: '运控策略制定',
      subsystem: '体系运营管理',
      category: '运控策略制定',
      icon: 'lucide:sliders',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/task-group-config-strategy',
    name: 'TaskGroupConfigStrategy',
    component: () =>
      import('@/views/system-operations/ykclzd/ScenarioStrategy.vue'),
    meta: {
      title: '任务群组配置策略生成',
      subsystem: '体系运营管理',
      category: '运控策略制定',
      icon: 'lucide:users-round',
      parentModule: '运控策略制定',
      requiresAuth: true
    }
  },
  {
    path: '/hierarchical-control-strategy',
    name: 'OcStrategyConfig',
    component: () =>
      import('@/views/system-operations/ykclzd/OcStrategyConfig.vue'),
    meta: {
      title: '分级体系运控策略生成',
      subsystem: '体系运营管理',
      category: '运控策略制定',
      icon: 'lucide:network',
      parentModule: '运控策略制定',
      requiresAuth: true
    }
  },
  {
    path: '/datalink-assurance-plan',
    name: 'DataLinkGuarantee',
    component: () =>
      import('@/views/system-operations/ykclzd/DataLinkGuarantee.vue'),
    meta: {
      title: '数据链保障方案构建',
      subsystem: '体系运营管理',
      category: '任务需求分解',
      icon: 'lucide:shield-check',
      parentModule: '任务需求分解',
      requiresAuth: true
    }
  },
  {
    path: '/parallel-system-simulation',
    name: 'ParallelSystemSimulation',
    component: () =>
      import('@/views/system-operations/ykclzd/ParallelSystemSimulation.vue'),
    meta: {
      title: '平行系统推演',
      subsystem: '体系运营管理',
      category: '运控策略制定',
      icon: 'lucide:refresh-cw',
      parentModule: '运控策略制定',
      requiresAuth: true
    }
  },
  {
    path: '/datalink-fault-diagnosis',
    name: 'DatalinkFaultDiagnosis',
    component: () =>
      import('@/views/system-operations/ykclzd/FaultStrategy.vue'),
    meta: {
      title: '数据链故障诊断和处理策略',
      subsystem: '体系运营管理',
      category: '运控策略制定',
      icon: 'lucide:wrench',
      parentModule: '运控策略制定',
      requiresAuth: true
    }
  },

  // 体系运营管理 - 综合调度管理
  {
    path: '/scheduling-management',
    name: 'SchedulingManagement',
    component: () =>
      import('@/views/system-operations/zhddgl/SchedulingManagement.vue'),
    meta: {
      title: '综合调度管理',
      subsystem: '体系运营管理',
      category: '综合调度管理',
      icon: 'lucide:gantt-chart',
      isModule: false,
      isVisible: false,
      requiresAuth: true
    }
  },
  {
    path: '/task-monitoring',
    name: 'TaskMonitoring',
    component: () =>
      import('@/views/system-operations/zhddgl/TaskMonitoring.vue'),
    meta: {
      title: '作战任务监视',
      subsystem: '体系运营管理',
      category: '综合调度管理',
      icon: 'lucide:activity',
      parentModule: '综合调度管理',
      isVisible: false,
      requiresAuth: true
    }
  },
  {
    path: '/task-group-management',
    name: 'TaskGroupManagement',
    component: () =>
      import('@/views/system-operations/zhddgl/TaskGroupManagement.vue'),
    meta: {
      title: '任务群组管理',
      subsystem: '体系运营管理',
      category: '综合调度管理',
      icon: 'lucide:users',
      parentModule: '综合调度管理',
      isVisible: false,
      requiresAuth: true
    }
  },
  {
    path: '/resource-conflict-resolution',
    name: 'ResourceConflictResolution',
    component: () =>
      import('@/views/system-operations/zhddgl/ResourceConflictResolution.vue'),
    meta: {
      title: '数据链资源冲突消解',
      subsystem: '体系运营管理',
      category: '综合调度管理',
      icon: 'lucide:git-merge',
      parentModule: '综合调度管理',
      isVisible: false,
      requiresAuth: true
    }
  },
  {
    path: '/fault-handling',
    name: 'FaultHandling',
    component: () =>
      import('@/views/system-operations/zhddgl/FaultHandling.vue'),
    meta: {
      title: '数据链故障处理',
      subsystem: '体系运营管理',
      category: '综合调度管理',
      icon: 'lucide:wrench',
      parentModule: '综合调度管理',
      isVisible: false,
      requiresAuth: true
    }
  },

  // 体系运营管理 - 业务开通运行
  {
    path: '/business-operation',
    name: 'BusinessOperation',
    component: () =>
      import('@/views/system-operations/ywktyx/BusinessOperation.vue'),
    meta: {
      title: '业务开通运行',
      subsystem: '体系运营管理',
      category: '业务开通运行',
      icon: 'lucide:play-circle',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/control-strategy-optimization',
    name: 'ControlStrategyOptimization',
    component: () =>
      import('@/views/system-operations/ywktyx/BusinessOperation.vue'),
    meta: {
      title: '运控策略优选与生成',
      subsystem: '体系运营管理',
      category: '业务开通运行',
      icon: 'lucide:sparkles',
      parentModule: '业务开通运行',
      requiresAuth: true
    }
  },
  {
    path: '/config-strategy-deployment',
    name: 'ConfigStrategyDeployment',
    component: () =>
      import('@/views/system-operations/ywktyx/ServiceTemplateDashboard.vue'),
    meta: {
      title: '服务模板和信息维护',
      subsystem: '体系运营管理',
      category: '业务开通运行',
      icon: 'lucide:layout-template',
      parentModule: '业务开通运行',
      requiresAuth: true
    }
  },

  // 体系运营管理 - 运控态势监视
  {
    path: '/control-situation-monitoring',
    name: 'ControlSituationMonitoring',
    component: () => import('@/views/system-operations/yktsjs/Dashboard.vue'),
    meta: {
      title: '运控态势监视',
      subsystem: '体系运营管理',
      category: '运控态势监视',
      icon: 'lucide:eye',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/statistic-data-monitoring',
    name: 'StatisticDataMonitoring',
    component: () => import('@/views/system-operations/yktsjs/Dashboard.vue'),
    meta: {
      title: '统计数据监视',
      subsystem: '体系运营管理',
      category: '运控态势监视',
      icon: 'lucide:bar-chart-3',
      parentModule: '运控态势监视',
      requiresAuth: true
    }
  },
  // ===== 以下两个页面暂不显示（如需恢复，取消注释即可） =====
  // {
  //   path: '/kill-chain-situation',
  //   name: 'KillChainSituation',
  //   component: () =>
  //     import('@/views/system-operations/yktsjs/KillChainSituation.vue'),
  //   meta: {
  //     title: '杀伤链运行态势监视',
  //     subsystem: '体系运营管理',
  //     category: '运控态势监视',
  //     icon: 'mdi:sword-cross',
  //     parentModule: '运控态势监视',
  //     requiresAuth: true
  //   }
  // },
  {
    path: '/kill-chain-situation-monitor',
    name: 'KillChainSituationMonitor',
    component: () =>
      import('@/views/system-operations/yktsjs/KillChainSituationMonitor.vue'),
    meta: {
      title: '杀伤链态势监控',
      subsystem: '体系运营管理',
      category: '运控态势监视',
      icon: 'lucide:swords',
      parentModule: '运控态势监视',
      requiresAuth: true
    }
  },
  {
    path: '/combat-resource-status',
    name: 'CombatResourceStatus',
    component: () =>
      import('@/views/system-operations/yktsjs/DeviceMonitor.vue'),
    meta: {
      title: '资源装备状态监视',
      subsystem: '体系运营管理',
      category: '运控态势监视',
      icon: 'lucide:milestone',
      parentModule: '运控态势监视',
      requiresAuth: true
    }
  },
  // {
  //   path: '/network-status-monitoring',
  //   name: 'NetworkStatusMonitoring',
  //   component: () =>
  //     import('@/views/system-operations/yktsjs/NetworkTopology.vue'),
  //   meta: {
  //     title: '网络状态信息监视',
  //     subsystem: '体系运营管理',
  //     category: '运控态势监视',
  //     icon: 'lucide:globe',
  //     parentModule: '运控态势监视',
  //     requiresAuth: true
  //   }
  // },
  {
    path: '/network-situation',
    name: 'NetworkSituation',
    component: () =>
      import('@/views/system-operations/yktsjs/NetworkSituation.vue'),
    meta: {
      title: '网络态势监控',
      subsystem: '体系运营管理',
      category: '运控态势监视',
      icon: 'lucide:radar',
      parentModule: '运控态势监视',
      requiresAuth: true
    }
  },
  {
    path: '/gis-light-map',
    name: 'GisLightMap',
    component: () =>
      import('@/views/system-operations/yktsjs/LeafletGisView.vue'),
    meta: {
      title: '轻量GIS点位展示',
      subsystem: '体系运营管理',
      category: '运控态势监视',
      icon: 'lucide:map',
      parentModule: '运控态势监视',
      requiresAuth: true
    }
  },
  // 3D 卫星地球（已注释：echarts-gl globe 二次 setOption 会导致 canvas 纹理丢失、
  // 地球变灰白，暂无法修复，先隐藏入口。组件保留：GlobeSatelliteView.vue）
  // {
  //   path: '/gis-globe',
  //   name: 'GisGlobe',
  //   component: () =>
  //     import('@/views/system-operations/yktsjs/GlobeSatelliteView.vue'),
  //   meta: {
  //     title: '3D卫星地球',
  //     subsystem: '体系运营管理',
  //     category: '运控态势监视',
  //     icon: 'lucide:globe',
  //     parentModule: '运控态势监视',
  //     requiresAuth: true
  //   }
  // },

  // 系统运维
  {
    path: '/alarm-monitoring',
    name: 'AlarmMonitoring',
    meta: {
      title: '告警监视处理',
      subsystem: '系统运维',
      category: '告警监视处理',
      icon: 'lucide:bell-ring',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/gj-monitoring',
    name: 'gjMonitoring',
    component: () =>
      import('@/views/system-maintenance/gjjscl/WarnInfoDashboard.vue'),
    meta: {
      title: '告警信息处理',
      subsystem: '系统运维',
      category: '告警监视处理',
      icon: 'lucide:bell-ring',
      parentModule: '告警监视处理',
      requiresAuth: true
    }
  },
  {
    path: '/performance-events',
    name: 'PerformanceEvents',
    component: () =>
      import('@/views/system-maintenance/components/EventQueryPage.vue'),
    meta: {
      title: '性能事件',
      subsystem: '系统运维',
      category: '告警监视处理',
      icon: 'lucide:zap',
      parentModule: '告警监视处理',
      requiresAuth: true
    }
  },
  {
    path: '/business-quality-events',
    name: 'BusinessQualityEvents',
    component: () =>
      import('@/views/system-maintenance/components/EventQueryPage.vue'),
    meta: {
      title: '业务质量事件',
      subsystem: '系统运维',
      category: '告警监视处理',
      icon: 'lucide:clipboard-list',
      parentModule: '告警监视处理',
      requiresAuth: true
    }
  },

  {
    path: '/performance-monitoring',
    name: 'PerformanceMonitoring',
    component: () =>
      import('@/views/system-maintenance/xnjscl/LinkPerformanceMonitor.vue'),
    meta: {
      title: '性能监视处理',
      subsystem: '系统运维',
      category: '性能监视处理',
      icon: 'lucide:zap',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/business-quality-monitor',
    name: 'BusinessQualityMonitorModule',
    component: () =>
      import('@/views/system-maintenance/ywzljkcl/BusinessQualityMonitor.vue'),
    meta: {
      title: '业务质量监控处理',
      subsystem: '系统运维',
      category: '业务质量监控处理',
      icon: 'lucide:activity',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/equipment-maintenance',
    name: 'EquipmentMaintenance',
    component: () =>
      import('@/views/system-maintenance/zbwhcs/EquipmentMaintenance.vue'),
    meta: {
      title: '装备维护测试',
      category: '装备维护测试',
      subsystem: '系统运维',
      icon: 'lucide:wrench',
      isModule: true,
      requiresAuth: true
    }
  },

  // 资源和数据管理 - 数据采集
  {
    path: '/data-collection',
    name: 'DataCollection',
    component: () =>
      import('@/views/system-resource/sjcj/DataCollectionProject.vue'),
    meta: {
      title: '数据采集',
      subsystem: '资源和数据管理',
      category: '数据采集',
      icon: 'lucide:database-backup',
      isModule: true,
      requiresAuth: true
    }
  },
  // 资源和数据管理 - 资源管理
  {
    path: '/resource-management',
    name: 'ResourceManagement',
    component: () =>
      import('@/views/system-resource/zygl/ResourceManagement.vue'),
    meta: {
      title: '资源管理',
      subsystem: '资源和数据管理',
      category: '资源管理',
      icon: 'lucide:boxes',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/information-resource-management',
    name: 'InformationResourceManagement',
    component: () =>
      import('@/views/system-resource/zygl/InformationResourceManagement.vue'),
    meta: {
      title: '信息资源管理',
      subsystem: '资源和数据管理',
      category: '资源管理',
      icon: 'lucide:folder-git',
      parentModule: '资源管理',
      requiresAuth: true
    }
  },
  {
    path: '/datalink-equipment-lifecycle',
    name: 'DatalinkEquipmentLifecycle',
    component: () =>
      import('@/views/system-resource/zygl/DatalinkEquipmentLifecycle.vue'),
    meta: {
      title: '数据链装备全生命周期管理',
      subsystem: '资源和数据管理',
      category: '资源管理',
      icon: 'mdi:satellite-variant',
      parentModule: '资源管理',
      requiresAuth: true
    }
  },
  {
    path: '/datalink-spectrum-resource',
    name: 'DatalinkSpectrumResource',
    component: () =>
      import('@/views/system-resource/zygl/DatalinkSpectrumResource.vue'),
    meta: {
      title: '数据链频谱资源管理',
      subsystem: '资源和数据管理',
      category: '资源管理',
      icon: 'lucide:radio',
      parentModule: '资源管理',
      requiresAuth: true
    }
  },
  {
    path: '/datalink-user-info',
    name: 'DatalinkUserInfo',
    component: () =>
      import('@/views/system-resource/zygl/DatalinkUserInfo.vue'),
    meta: {
      title: '数据链用户信息',
      subsystem: '资源和数据管理',
      category: '资源管理',
      icon: 'lucide:contact-2',
      parentModule: '资源管理',
      requiresAuth: true
    }
  },
  // 资源和数据管理 - 数据管理
  {
    path: '/data-management',
    name: 'DataManagement',
    component: () => import('@/views/system-resource/sjgl/DataManagement.vue'),
    meta: {
      title: '数据管理',
      subsystem: '资源和数据管理',
      category: '数据管理',
      icon: 'lucide:database',
      isModule: true,
      requiresAuth: true
    }
  },
  {
    path: '/permission-management',
    name: 'PermissionManagement',
    component: () =>
      import('@/views/system-resource/sjgl/PermissionManagement.vue'),
    meta: {
      title: '权限管理',
      subsystem: '资源和数据管理',
      category: '数据管理',
      icon: 'lucide:key-round',
      parentModule: '数据管理',
      requiresAuth: true
    }
  },
  {
    path: '/data-governance-model',
    name: 'DataGovernanceModel',
    component: () =>
      import('@/views/system-resource/sjgl/DataGovernanceModel.vue'),
    meta: {
      title: '数据治理模型维护',
      subsystem: '资源和数据管理',
      category: '数据管理',
      icon: 'lucide:git-fork',
      parentModule: '数据管理',
      requiresAuth: true
    }
  },
  {
    path: '/classification-storage',
    name: 'ClassificationStorage',
    component: () =>
      import('@/views/system-resource/sjgl/ClassificationStorage.vue'),
    meta: {
      title: '分类存储',
      subsystem: '资源和数据管理',
      category: '数据管理',
      icon: 'lucide:folder-tree',
      parentModule: '数据管理',
      requiresAuth: true
    }
  },
  {
    path: '/subscription-distribution',
    name: 'SubscriptionDistribution',
    component: () =>
      import('@/views/system-resource/sjgl/SubscriptionDistribution.vue'),
    meta: {
      title: '订阅分发',
      subsystem: '资源和数据管理',
      category: '数据管理',
      icon: 'lucide:share-2',
      parentModule: '数据管理',
      requiresAuth: true
    }
  },
  // 系统运维 - 性能监视处理（含分析子页面）
  {
    path: '/device-status-analysis',
    name: 'DeviceStatusAnalysis',
    component: () => import('@/views/data-analysis/DeviceStatusAnalysis.vue'),
    meta: {
      title: '设备状态分析',
      subsystem: '系统运维',
      category: '性能监视处理',
      icon: 'lucide:monitor',
      parentModule: '性能监视处理',
      requiresAuth: true
    }
  },
  {
    path: '/network-status-analysis',
    name: 'NetworkStatusAnalysis',
    component: () => import('@/views/data-analysis/NetworkStatusAnalysis.vue'),
    meta: {
      title: '网络状态分析',
      subsystem: '系统运维',
      category: '性能监视处理',
      icon: 'lucide:network',
      parentModule: '性能监视处理',
      requiresAuth: true
    }
  }
]

export {indexRoutes, staticRoutes}
