/**
 * 导入类型声明
 */
import type { EnvMode, HtmlInjectOptions } from '../../../types.ts';

/**
 * 构建期固定的时间戳，用于外部资源缓存清除（cache busting）。
 *
 * 取模块加载时刻的单一值，保证同一次构建内所有页面注入的资源 query 一致，
 * 又能在每次重新构建后变化，迫使浏览器拉取最新的外部 CDN 资源。
 */
const CACHE_BUSTING_TIMESTAMP: number = Date.now();

/**
 * 合并公共清单与当前环境清单，并追加 cache-busting 时间戳。
 * @param baseList 公共资源地址列表
 * @param envMap 按环境的资源地址映射
 * @param envMode 当前构建环境
 * @returns 去空、带时间戳 query 的资源地址列表
 */
const mergeWithTimestamp = (
  baseList: string[] | undefined,
  envMap: Partial<Record<EnvMode, string[]>> | undefined,
  envMode: EnvMode,
): string[] => {
  const envList = envMap?.[envMode] ?? [];
  return (baseList ?? [])
    .concat(envList)
    .filter((url): boolean => !!url)
    .map((url) => `${url}?t=${CACHE_BUSTING_TIMESTAMP}`);
};

/**
 * 计算当前环境应注入的外部脚本地址列表。
 * @param html html 注入配置
 * @param envMode 当前构建环境
 * @returns 带时间戳的脚本地址列表
 */
export const getScriptUrlList = (
  html: HtmlInjectOptions | undefined,
  envMode: EnvMode,
): string[] => {
  return mergeWithTimestamp(
    html?.scriptUrlList,
    html?.envScriptUrlMap,
    envMode,
  );
};

/**
 * 计算当前环境应注入的外部样式地址列表。
 * @param html html 注入配置
 * @param envMode 当前构建环境
 * @returns 带时间戳的样式地址列表
 */
export const getStyleUrlList = (
  html: HtmlInjectOptions | undefined,
  envMode: EnvMode,
): string[] => {
  return mergeWithTimestamp(html?.styleUrlList, html?.envStyleUrlMap, envMode);
};
