/**
 * 导入 rsbuild 插件
 */
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import CompressionPlugin from 'compression-webpack-plugin';

/**
 * 导入类型声明
 */
import type { RsbuildConfig } from '@rsbuild/core';

/**
 * 生成生产环境特定配置。
 *
 * 承载与具体业务无关的通用生产优化：自定义分包、CSS 提取、gzip 预压缩、
 * 图片压缩、关闭 polyfill。所有策略都不假设项目用了哪个 UI / 状态库，
 * 仅按通用 vendor 维度切分。
 * @returns 生产环境 Rsbuild 配置
 */
export function getProdConfig(): RsbuildConfig {
  return {
    /**
     * 性能配置：自定义分包策略
     */
    performance: {
      chunkSplit: {
        strategy: 'custom',
        splitChunks: {
          chunks: 'all',
          // 控制首屏并行请求数与单 chunk 体积区间，平衡缓存粒度与请求数。
          maxInitialRequests: 6,
          minSize: 20000,
          maxSize: 200000,
          cacheGroups: {
            // Vue 全家桶单独成 chunk：版本最稳定，长效缓存命中率最高。
            vueCore: {
              test: /[\\/]node_modules[\\/](vue|@vue[\\/].*|vue-router)[\\/]/,
              name: 'vue-core',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // 其余第三方依赖统一兜底分包，不假设具体使用了哪些库。
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      },
    },

    /**
     * 底层工具配置：CSS 提取与 gzip 预压缩
     */
    tools: {
      cssExtract: {
        loaderOptions: {
          // 产物 css 位于 css/ 子目录，需回退一级才能正确引用图片 / 字体等相对资源。
          publicPath: '../',
        },
        pluginOptions: {
          ignoreOrder: true,
        },
      },
      rspack: {
        plugins: [
          // 预生成 .gz：仅对超过阈值且可观压缩比的 JS/CSS 产物压缩，由服务端直接下发。
          new CompressionPlugin({
            test: /\.(js|css)$/,
            filename: '[path][base].gz',
            algorithm: 'gzip',
            threshold: 10240,
            minRatio: 0.8,
          }),
        ],
      },
    },

    /**
     * 配置使用的插件
     */
    plugins: [pluginImageCompress()],

    /**
     * 与构建产物有关的选项
     */
    output: {
      // 现代浏览器目标下关闭 polyfill 注入，减小包体。
      polyfill: 'off',
    },
  };
}
