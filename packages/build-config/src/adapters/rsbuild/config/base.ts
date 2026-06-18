/**
 * 导入 node 模块
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * 导入 rsbuild 插件
 */
import { pluginVue } from '@rsbuild/plugin-vue';

/**
 * 导入工具类
 */
import { getScriptUrlList, getStyleUrlList } from '../utils/html.ts';

/**
 * 导入类型声明
 */
import type { RsbuildConfig } from '@rsbuild/core';
import type { AppBuildOptions, EnvMode } from '../../../types.ts';
import type { ResolvedEntry } from '../utils/entry.ts';

/**
 * 共享包内置默认 html 模板路径
 *
 * 应用不传 htmlTemplate 时回退到这份模板，统一注入 assetPrefix、外部脚本与样式。
 */
const DEFAULT_TEMPLATE_PATH: string = resolve(
  fileURLToPath(import.meta.url),
  '../../template/index.html',
);

/**
 * 生成 Rsbuild 基础配置。
 *
 * 与 dev / prod 环境无关的所有公共配置都收敛在此：入口、环境变量注入、
 * 产物指纹与分目录、模块解析、html 模板与资源注入、Vue 插件。
 * 由 create 层与 dev/prod 配置 merge 后产出最终配置。
 * @param options 应用构建选项
 * @param resolved 已归一化的入口结果
 * @param envMode 当前构建环境
 * @returns Rsbuild 基础配置
 */
export const getBaseConfig = (
  options: AppBuildOptions,
  resolved: ResolvedEntry,
  envMode: EnvMode,
): RsbuildConfig => {
  const { root, html, htmlTemplate } = options;
  const { entry, titleMap, pageAssetMap } = resolved;

  /**
   * 开发环境产物文件名不带 hash，便于调试时直接定位文件。
   */
  const isDev = envMode === 'development';

  return {
    /**
     * 与输入源代码相关的选项
     */
    source: {
      entry,
      define: {
        // 把当前应用环境注入客户端，业务侧统一经 @repo/shared/env 读取 process.env.APP_ENV，
        // 不直接耦合构建工具。NODE_ENV 由 Rsbuild 自动注入，无需手动定义。
        'process.env.APP_ENV': JSON.stringify(envMode),
      },
    },

    /**
     * 与构建产物有关的选项
     */
    output: {
      assetPrefix: options.assetPrefix ?? '/',
      // 产物落在应用自身的 dist/，保持各 app 自包含，
      // 让 Turborepo 的 outputs（相对各包的 dist/**）正确命中缓存。
      distPath: {
        root: resolve(root, 'dist'),
        js: 'js',
        jsAsync: 'js',
        css: 'css',
        cssAsync: 'css',
        font: 'font',
        image: 'images',
      },
      // 生产用 contenthash 做长效缓存，开发去 hash 便于调试。
      filenameHash: true,
      filename: {
        js: isDev ? '[name].js' : '[name]-[contenthash:8].js',
        css: isDev ? '[name].css' : '[name]-[contenthash:8].css',
        image: '[name]-[contenthash:8][ext]',
        font: '[name][ext]',
      },
    },

    /**
     * 与模块解析相关的选项
     */
    resolve: {
      extensions: ['.vue', '.ts', '.js', '.mjs'],
      alias: {
        '@': resolve(root, 'src'),
      },
    },

    /**
     * 与 html 生成有关的选项
     */
    html: {
      template: htmlTemplate ?? DEFAULT_TEMPLATE_PATH,
      // 按 entryName 回填各页标题：MPA 每个入口标题不同，SPA 复用同一套逻辑。
      title: ({ entryName }) => titleMap[entryName] ?? entryName,
      // 注入外部脚本 / 样式：公共清单 + 当前环境清单，MPA 下再按页追加。
      templateParameters: (_defaultValue, { entryName }) => {
        const pageAssets = pageAssetMap[entryName];
        return {
          assetPrefix: options.assetPrefix ?? '',
          scriptUrlList: getScriptUrlList(html, envMode).concat(
            pageAssets?.scripts ?? [],
          ),
          styleUrlList: getStyleUrlList(html, envMode).concat(
            pageAssets?.styles ?? [],
          ),
        };
      },
    },

    /**
     * 配置使用的插件
     */
    plugins: [pluginVue()],
  };
};
