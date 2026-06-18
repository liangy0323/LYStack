/**
 * @repo/build-config 公共出口。
 *
 * 仅导出构建工具无关的契约与工具函数。
 * 具体 adapter 通过子路径按需引入，避免应用意外耦合到某个构建工具：
 *   import { defineViteConfig } from '@repo/build-config/vite';
 *   import { defineRsbuildConfig } from '@repo/build-config/rsbuild';
 */

export type {
  AppKind,
  EnvMode,
  PageEntry,
  EnvAssetMap,
  HtmlInjectOptions,
  AppBuildOptions,
  BuildAdapter,
} from './types.ts';

export { assertAppBuildOptions } from './utils/validate.ts';
