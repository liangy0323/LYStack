/**
 * 应用配置中心 —— 全底座构建期「纯数据」配置的唯一真相源。
 *
 * 定位与边界：
 *   - 只放与运行环境无关的静态数据（端口、默认 HTML 配置等），零业务、零 import；
 *   - 由 @repo/build-config 反向读取（依赖方向 build-config → app.config），
 *     应用层不直接耦合构建细节；
 *   - 动态值（接口域名等「按环境切换」的配置）不放这里，统一走 .env.* +
 *     @repo/shared/env，避免把运行期关注点混进静态配置。
 */

/**
 * 各应用开发服务端口表。
 *
 * 集中登记避免端口冲突：新增 app 时在此登记一处，构建侧按 appName 查表，
 * 应用的 *.config.ts 不再各自硬编码端口。
 *
 * 新增应用由 `pnpm new:app` 在 PLOP_INJECT_PORT 锚点处注入端口条目，请勿删除该锚点。
 */
export const APP_PORTS: Record<string, number> = {
  /**
   * Rsbuild SPA 示例应用
   */
  'example-rsbuild': 5273,
  /**
   * Rsbuild MPA 示例应用
   */
  'example-rsbuild-mpa': 5373,
  /**
   * Vite SPA 示例应用
   */
  'example-vite': 5173,
  /* PLOP_INJECT_PORT */
};

/**
 * 默认开发端口：appName 未在 APP_PORTS 登记时的回退值
 */
export const DEFAULT_DEV_PORT = 5200;

/**
 * 默认 HTML 配置。
 *
 * 应用未显式声明时的 HTML 兜底项，集中在此便于统一调整全站默认表现。
 */
export const DEFAULT_HTML_CONFIG = {
  /**
   * 默认页面标题
   */
  title: 'LYStack App',
  /**
   * 默认语言
   */
  lang: 'zh-CN',
} as const;

/**
 * 按应用名解析开发端口：命中 APP_PORTS 则用登记值，否则回退默认端口。
 * @param appName 应用名
 * @returns 开发服务端口
 */
export function resolveAppPort(appName: string): number {
  return APP_PORTS[appName] ?? DEFAULT_DEV_PORT;
}
