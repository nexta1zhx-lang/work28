import * as echarts from 'echarts'

const FONT_FAMILY = "monospace, 'Microsoft YaHei'"

// 3. 数据链网络运行统计（平滑折线图）
export const getNetworkOption = data => ({
  backgroundColor: 'transparent',
  tooltip: {trigger: 'axis'},
  grid: {left: '3%', right: '4%', bottom: '5%', top: '12%', containLabel: true},
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.times,
    axisLine: {lineStyle: {color: '#16243b'}},
    axisLabel: {color: '#94a3b8', fontFamily: FONT_FAMILY}
  },
  yAxis: {
    type: 'value',
    splitLine: {lineStyle: {color: '#111b2b'}},
    axisLabel: {color: '#94a3b8', fontFamily: FONT_FAMILY}
  },
  series: [
    {
      name: '吞吐量 (Mbps)',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: data.flow,
      itemStyle: {color: '#06b6d4'},
      lineStyle: {width: 2, color: '#06b6d4'},
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {offset: 0, color: 'rgba(6, 182, 212, 0.2)'},
            {offset: 1, color: 'rgba(6, 182, 212, 0)'}
          ]
        }
      }
    }
  ]
})

// 4. 告警类型分布饼图（增强版 - 发光+动画）
export const getAlertPieOption = data => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}次 ({d}%)',
    backgroundColor: 'rgba(7, 12, 20, 0.95)',
    borderColor: '#1e3a5f',
    textStyle: {color: '#cbd5e1', fontSize: 11}
  },
  series: [
    {
      name: '告警类型',
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      animationDuration: 1500,
      animationEasing: 'cubicInOut',
      itemStyle: {
        borderRadius: 4,
        shadowBlur: 12,
        shadowColor: 'rgba(0, 180, 255, 0.3)'
      },
      label: {show: false},
      emphasis: {
        scaleSize: 12,
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 212, 255, 0.6)'
        }
      },
      labelLine: {show: false},
      data: data
    }
  ]
})

// 5. 故障统计增强柱状图（渐变+发光+动画）
export const getFaultBarOption = data => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: {type: 'shadow'},
    backgroundColor: 'rgba(7, 12, 20, 0.95)',
    borderColor: '#1e3a5f',
    textStyle: {color: '#cbd5e1', fontSize: 11}
  },
  grid: {
    top: 24,
    bottom: 6,
    left: 6,
    right: 6,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: data.labels,
    axisLine: {lineStyle: {color: '#172438'}},
    axisLabel: {color: '#94a3b8', fontSize: 10}
  },
  yAxis: {
    type: 'value',
    splitLine: {lineStyle: {color: '#111b2b'}},
    axisLabel: {color: '#94a3b8', fontSize: 10}
  },
  series: [
    {
      name: '故障次数',
      type: 'bar',
      barWidth: '50%',
      animationDuration: 1600,
      animationEasing: 'elasticOut',
      data: data.values.map((v, i) => {
        const baseColor = data.colors
          ? data.colors[i]
          : ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#06b6d4'][
              i % 6
            ]
        return {
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: baseColor},
              {offset: 1, color: baseColor + '33'}
            ]),
            borderRadius: [4, 4, 0, 0],
            shadowBlur: 10,
            shadowColor: baseColor + '66'
          }
        }
      }),
      label: {
        show: true,
        position: 'top',
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: 'bold'
      }
    }
  ]
})

// 6. 目标类型分布饼图（彩色）
export const getTargetPieOption = data => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}个 ({d}%)',
    backgroundColor: '#070c14',
    borderColor: '#172438',
    textStyle: {color: '#cbd5e1', fontSize: 11}
  },
  legend: {
    orient: 'vertical',
    right: '5%',
    top: 'center',
    textStyle: {color: '#94a3b8', fontSize: 10}
  },
  series: [
    {
      type: 'pie',
      radius: ['30%', '55%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4
      },
      label: {show: false},
      emphasis: {
        label: {
          show: true,
          fontSize: 13,
          fontWeight: 'bold',
          color: '#fff'
        }
      },
      labelLine: {show: false},
      data: data
    }
  ]
})
