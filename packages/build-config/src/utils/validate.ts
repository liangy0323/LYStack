import type { AppBuildOptions } from '../types.ts';

/**
 * 校验应用构建选项的完整性。
 *
 * 设计取舍：显式 fail loudly，而不是静默兜底。
 * 原型项目的一个教训是 env / 配置缺失时用 `?? ''` 静默吞掉，
 * 导致构建出空 baseURL 之类难排查的问题。这里反其道而行：
 * 配置不合法立即抛错，把问题暴露在构建期而非运行期。
 */
export function assertAppBuildOptions(options: AppBuildOptions): void {
  const { kind, appName, root } = options;

  if (!appName) {
    throw new Error('[build-config] appName 不能为空');
  }
  if (!root) {
    throw new Error(`[build-config] 应用 "${appName}" 缺少 root 路径`);
  }

  if (kind === 'spa') {
    if (!options.entry) {
      throw new Error(`[build-config] SPA 应用 "${appName}" 必须提供 entry`);
    }
    return;
  }

  if (kind === 'mpa') {
    if (!options.pages || options.pages.length === 0) {
      throw new Error(`[build-config] MPA 应用 "${appName}" 必须提供至少一个 page`);
    }
    const names = new Set<string>();
    for (const page of options.pages) {
      if (!page.name || !page.entry) {
        throw new Error(`[build-config] MPA 应用 "${appName}" 存在缺少 name 或 entry 的页面`);
      }
      if (names.has(page.name)) {
        throw new Error(`[build-config] MPA 应用 "${appName}" 存在重复的页面名 "${page.name}"`);
      }
      names.add(page.name);
    }
    return;
  }

  throw new Error(`[build-config] 未知的应用类型 kind="${kind as string}"`);
}
