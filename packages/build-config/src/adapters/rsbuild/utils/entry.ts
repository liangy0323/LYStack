/**
 * 导入 node 模块
 */
import { resolve } from 'node:path';

/**
 * 导入类型声明
 */
import type { AppBuildOptions, EnvMode, PageEntry } from '../../../types.ts';

/**
 * 入口名 -> 入口文件路径的映射，即 Rsbuild 的 source.entry 形状
 */
export type EntryMap = Record<string, string>;

/**
 * 入口名 -> 页面标题的映射，供 html.title 按 entryName 回填
 */
export type TitleMap = Record<string, string>;

/**
 * 入口名 -> 该页面额外注入资源的映射，供 html.templateParameters 按页追加
 */
export type PageAssetMap = Record<string, { scripts: string[]; styles: string[] }>;

/**
 * 单/多入口归一化后的结果。
 * entry 喂给 Rsbuild，titleMap 供 html 回填标题，pageAssetMap 供 MPA 按页追加资源。
 */
export interface ResolvedEntry {
  /**
   * Rsbuild source.entry：key 为入口名（同时是产出 html 名）
   */
  entry: EntryMap;
  /**
   * 入口名到页面标题的映射
   */
  titleMap: TitleMap;
  /**
   * 入口名到该页额外脚本 / 样式的映射（仅 MPA 非空）
   */
  pageAssetMap: PageAssetMap;
}

/**
 * 将 SPA 单入口归一化为 Rsbuild 的 source.entry。
 * 入口名固定 'index'，产出 index.html，标题回退到应用名。
 * @param options 应用构建选项
 * @returns 归一化入口结果
 */
export function resolveSpaEntry(options: AppBuildOptions): ResolvedEntry {
  const entryPath = resolve(options.root, options.entry as string);
  const title = options.html?.title ?? options.appName;
  return {
    entry: { index: entryPath },
    titleMap: { index: title },
    pageAssetMap: {},
  };
}

/**
 * 将中立的 PageEntry[] 展开为 Rsbuild 的多入口 source.entry。
 *
 * 按 envMode 过滤：页面未声明 env = 全环境启用；声明则仅当前环境命中时纳入，
 * 与「page.config.ts 唯一真相源 + 按环境裁剪入口」的契约对齐。
 * 每个页面的 name 既是入口名也是产出的 html 文件名。
 * @param pages 中立页面清单
 * @param root 应用根目录
 * @param envMode 当前构建环境
 * @returns 归一化入口结果
 */
export function resolveMpaEntry(pages: PageEntry[], root: string, envMode: EnvMode): ResolvedEntry {
  const entry: EntryMap = {};
  const titleMap: TitleMap = {};
  const pageAssetMap: PageAssetMap = {};

  for (const page of pages) {
    if (page.env && !page.env.includes(envMode)) {
      continue;
    }
    entry[page.name] = resolve(root, page.entry);
    titleMap[page.name] = page.title ?? page.name;
    pageAssetMap[page.name] = {
      scripts: page.scripts ?? [],
      styles: page.styles ?? [],
    };
  }

  return { entry, titleMap, pageAssetMap };
}
