/**
 * 导入模块
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

/**
 * 导入工具类
 */
import { assertAppBuildOptions } from '../../utils/validate.ts';
import { buildPublicEnvDefine, loadPublicEnv } from '../../utils/env.ts';
import { resolveAppPort } from '../../app-config.ts';

/**
 * 导入类型声明
 */
import type { AppBuildOptions, AppKind, BuildAdapter } from '../../types.ts';

/**
 * Vite adapter。
 *
 * 能力边界（截至当前版本）：
 *   - SPA：✅ 原生顺手，单入口
 *   - MPA：🚧 暂不支持。Vite 是 html-first 心智（入口是 html），
 *          与底座「TS 配置驱动多入口」的 PageConfig 契约不对齐，
 *          需要一层 html 生成翻译层。已列入 roadmap，此处显式抛错，
 *          绝不静默假装支持。
 */
function supports(kind: AppKind): boolean {
  return kind === 'spa';
}

/**
 * 将中立选项转换为 Vite 原生配置。
 * @param options 应用构建选项
 * @returns Vite 配置对象
 */
function createConfig(options: AppBuildOptions): UserConfig {
  assertAppBuildOptions(options);

  if (!supports(options.kind)) {
    throw new Error(
      `[build-config:vite] 暂不支持 MPA。Vite 的 html-first 入口模型与底座的 ` +
        `PageConfig 契约不对齐，MPA 请使用 Rsbuild adapter。` +
        `（Vite MPA 支持已列入 roadmap）`,
    );
  }

  const { root, entry, envMode = 'development' } = options;
  const isProd = envMode === 'production';

  /**
   * 加载公共环境快照并注入同名全局 __PUBLIC_ENV__：与 Rsbuild adapter 注入口径一致，
   * 业务侧统一经 @repo/shared/env 读取，不直接耦合构建工具的 env 暴露机制。
   */
  const publicEnv = loadPublicEnv(root, envMode);

  return defineConfig({
    root,
    base: options.assetPrefix ?? '/',
    define: buildPublicEnvDefine(publicEnv),
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
      },
    },
    server: {
      // 端口优先用应用显式声明，否则按 appName 查 app.config.ts 的端口表兜底。
      port: options.port ?? resolveAppPort(options.appName),
    },
    build: {
      // 产物输出到应用自身目录的 dist/，保持各 app 自包含，
      // 同时让 Turborepo 的 outputs（相对各包的 dist/**）能正确命中并缓存。
      outDir: resolve(root, 'dist'),
      emptyOutDir: true,
      sourcemap: !isProd,
      rollupOptions: {
        input: resolve(root, entry as string),
      },
    },
  }) as UserConfig;
}

/**
 * Vite adapter 单例。
 *
 * 用对象字面量 + satisfies 实现 BuildAdapter 契约：无实例状态、天然单例，
 * 不必引入 class 这层命名空间。
 */
export const viteAdapter = {
  name: 'vite',
  supports,
  createConfig,
} satisfies BuildAdapter;

/**
 * 应用层定义 Vite 配置的入口糖：
 *   // app 根目录 vite.config.ts
 *   import { defineViteConfig } from '@repo/build-config/vite';
 *   export default defineViteConfig({ kind: 'spa', appName: 'example-vite', ... });
 */
export function defineViteConfig(options: AppBuildOptions): UserConfig {
  return viteAdapter.createConfig(options);
}

/**
 * 便捷工具：从 import.meta.url 推导应用根目录
 */
export function resolveRoot(importMetaUrl: string): string {
  return fileURLToPath(new URL('.', importMetaUrl));
}
