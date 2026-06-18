/**
 * 导入类型声明
 */
import type { RsbuildConfig } from '@rsbuild/core';
import type { AppBuildOptions } from '../../../types.ts';

/**
 * 生成开发环境特定配置。
 *
 * 仅承载开发期体验优化：指定端口、关闭 dev server 的 gzip（本地无意义、徒增开销）、
 * 启动后自动开页、显示编译进度条。
 * @param options 应用构建选项
 * @returns 开发环境 Rsbuild 配置
 */
export const getDevConfig = (options: AppBuildOptions): RsbuildConfig => {
  return {
    server: {
      port: options.port,
      // 本地开发无需 gzip，关闭以减少每次响应的压缩开销。
      compress: false,
      // 启动后自动打开浏览器，省去手动复制地址。
      open: true,
    },
    dev: {
      progressBar: true,
    },
  };
};
