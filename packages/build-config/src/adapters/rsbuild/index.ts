/**
 * 导入模块
 */
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeRsbuildConfig } from '@rsbuild/core';

/**
 * 导入配置层
 */
import { getBaseConfig } from './config/base.ts';
import { getDevConfig } from './config/dev.ts';
import { getProdConfig } from './config/prod.ts';

/**
 * 导入工具类
 */
import { assertAppBuildOptions } from '../../utils/validate.ts';
import { resolveMpaEntry, resolveSpaEntry } from './utils/entry.ts';

/**
 * 导入类型声明
 */
import type {
  AppBuildOptions,
  AppKind,
  BuildAdapter,
  EnvMode,
  PageEntry,
} from '../../types.ts';

/**
 * 透传中立的 PageEntry 类型：应用层 page.config.ts 从 adapter 子路径
 * 即可拿到页面入口的契约类型，无需再感知 types.ts 的存在。
 */
export type { PageEntry } from '../../types.ts';

/**
 * adapter 产出的 Rsbuild 配置类型。
 *
 * 采用函数式配置（接住 command / envMode），故取 defineConfig 的返回类型，
 * 即 RsbuildConfig 与同步 / 异步配置函数的联合，避免从子路径深引内部类型。
 */
type RsbuildConfigExport = ReturnType<typeof defineConfig>;

/**
 * Rsbuild adapter。
 *
 * 能力边界（截至当前版本）：
 *   - SPA：✅ 单入口，与 Vite adapter 对等
 *   - MPA：✅ 核心差异化卖点。Rspack js-first 入口天生适合多入口，
 *          一份 PageConfig（中立 PageEntry[]）即可编程驱动多页面，
 *          Rsbuild 为每个 source.entry 自动生成同名 html。
 *
 * 内部按 base / dev / prod 三层组织：base 承载与环境无关的公共配置，
 * dev / prod 各自叠加环境特定优化，由 Rsbuild 的 command 在运行期选择并 merge。
 * 应用层只声明中立的 AppBuildOptions，永不接触这套分层细节。
 */
class RsbuildAdapter implements BuildAdapter {
  readonly name = 'rsbuild' as const;

  supports(kind: AppKind): boolean {
    return kind === 'spa' || kind === 'mpa';
  }

  createConfig(options: AppBuildOptions): RsbuildConfigExport {
    assertAppBuildOptions(options);

    /**
     * 用函数式配置接住 Rsbuild 注入的 command / envMode：
     * command 决定叠加 dev 还是 prod，envMode 决定环境变量注入与产物指纹策略。
     * envMode 优先取 CLI 的 --env-mode，回退到选项里的 envMode，再回退 development。
     */
    return defineConfig(({ command, envMode }) => {
      const resolvedEnvMode: EnvMode =
        (envMode as EnvMode | undefined) ?? options.envMode ?? 'development';

      /**
       * SPA 与 MPA 的差异收敛在「入口形状」上：SPA 单入口，
       * MPA 是 PageEntry[] 按当前环境过滤后展开的多入口。
       */
      const resolved =
        options.kind === 'spa'
          ? resolveSpaEntry(options)
          : resolveMpaEntry(
              options.pages as PageEntry[],
              options.root,
              resolvedEnvMode,
            );

      const baseConfig = getBaseConfig(options, resolved, resolvedEnvMode);
      const envConfig =
        command === 'build' ? getProdConfig() : getDevConfig(options);

      return mergeRsbuildConfig(baseConfig, envConfig);
    });
  }
}

/**
 * Rsbuild adapter 单例
 */
export const rsbuildAdapter = new RsbuildAdapter();

/**
 * 应用层定义 Rsbuild 配置的入口糖：
 *   // app 根目录 rsbuild.config.ts
 *   import { defineRsbuildConfig } from '@repo/build-config/rsbuild';
 *   export default defineRsbuildConfig({ kind: 'mpa', appName: '...', ... });
 */
export function defineRsbuildConfig(
  options: AppBuildOptions,
): RsbuildConfigExport {
  return rsbuildAdapter.createConfig(options);
}

/**
 * 便捷工具：从 import.meta.url 推导应用根目录
 */
export function resolveRoot(importMetaUrl: string): string {
  return fileURLToPath(new URL('.', importMetaUrl));
}
