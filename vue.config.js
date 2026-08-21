// vue.config.js
const path = require('path')

module.exports = {
  devServer: {
    // 关键配置：让客户端热更新连接当前的域名和端口
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: {
        warnings: false, // 不显示警告
        // 或者更精确地只屏蔽 ResizeObserver 相关的运行时错误
        runtimeErrors: error => {
          return false
        }
      }
    },
    // 如果之前写死了 host: '192.168.43.10'，请务必删掉或改成下面这样：
    host: '0.0.0.0',
    // 代理：将 /rest/* 请求转发到后端，解决跨设备访问 localhost 问题
    proxy: {
      '/rest': {
        target: 'http://localhost:8072',
        changeOrigin: true
      }
      // 方案B（可选）：瓦片放在独立 Nginx 时，开发环境把 /tiles 代理过去。
      // 注意：启用后 public/tiles 下的本地瓦片将不再被命中（代理优先）。
      // '/tiles': {
      //   target: 'http://localhost:8090', // 你本地 Nginx 瓦片根目录（含 {z}/{x}/{y}.png）
      //   changeOrigin: true
      // }
    }
  },
  // 方式 A: 使用 configureWebpack (简单直接)
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
        // 如果有其他别名也可以加在这里
        // 'components': path.resolve(__dirname, 'src/components'),
      }
    }
  },
  chainWebpack: config => {
    // 本地图标 SVG — 用 raw-loader 加载为字符串（不经过默认的 file-loader）
    config.module
      .rule('svg-icons')
      .test(/\.svg$/)
      .include.add(path.resolve(__dirname, 'src/assets/icons'))
      .end()
      .use('raw-loader')
      .loader('raw-loader')
      .options({esModule: false})
      .end()

    // 排除 icons 目录，避免与默认的 svg 规则冲突
    config.module
      .rule('svg')
      .exclude.add(path.resolve(__dirname, 'src/assets/icons'))
      .end()
  },
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          quietDeps: true
        }
      }
    }
  }
  // 方式 B: 或者使用 chainWebpack (如果项目里已经用了 chainWebpack，建议用这个)
  // chainWebpack: config => {
  //   config.resolve.alias
  //     .set('@', path.resolve(__dirname, 'src'));
  // },

  // 其他配置...
}
