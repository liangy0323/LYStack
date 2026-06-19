/**
 * 统一环境变量读取层 —— 全底座读取环境变量的唯一合法入口。
 *
 * 为什么需要这一层（核心设计）：
 *   1. 不同构建工具注入 env 的机制不同：
 *      - Vite 走 `import.meta.env.*`
 *      - Rsbuild/webpack 走 `process.env.*`
 *      二者对「动态 key 访问」支持也不一，若业务代码到处直接读，
 *      就会硬耦合到某个构建工具，破坏「构建可插拔」。
 *   2. 这一层把差异收敛到一处，对外提供构建工具无关的 getter，
 *      业务层永远只 import 这里，不碰 import.meta / process.env。
 *
 * 注入口径：build-config 在构建期把 PUBLIC_ 前缀变量与 APP_ENV
 * 聚合成全局字面量 __PUBLIC_ENV__ 注入，本层优先读它，再回退到
 * import.meta.env / process.env，从而两套构建工具通吃。
 *
 * 运行模式（dev / prod）不走 __PUBLIC_ENV__：Vite 与 Rsbuild 都会按命令
 * 原生注入 import.meta.env.DEV/PROD/MODE 与 process.env.NODE_ENV，
 * isDev / isProd 直接消费构建工具的原生口径，无需手动维护 NODE_ENV。
 *
 * 配套约束：ESLint 禁止 apps/**\/src 业务代码直接出现 process.env /
 * import.meta.env（env 层除外），从规则上强制收口。
 */

/**
 * 读取一个原始环境变量。
 *
 * 读取优先级：__PUBLIC_ENV__（构建期聚合快照，两工具统一）→ import.meta.env
 * （Vite）→ process.env（Rsbuild/Node）。通过 try/catch 安全探测，
 * 避免在不支持某机制的运行时报错。
 */
function readRaw(key: string): string | undefined {
  // 构建期聚合快照：字面量全局，不依赖构建工具对动态 key 的支持
  try {
    if (typeof __PUBLIC_ENV__ !== 'undefined' && typeof __PUBLIC_ENV__[key] === 'string') {
      return __PUBLIC_ENV__[key];
    }
  } catch {
    // 未注入 __PUBLIC_ENV__（如纯 Node 脚本），忽略并回退
  }

  // Vite 注入：import.meta.env
  try {
    const metaEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
    if (metaEnv && typeof metaEnv[key] === 'string') {
      return metaEnv[key] as string;
    }
  } catch {
    // 某些运行时不支持 import.meta，忽略并回退
  }

  // Rsbuild / Node 注入：process.env
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }

  return undefined;
}

/**
 * 读取环境变量。
 *
 * 设计取舍：缺失必填项时 fail loudly（抛错），不静默兜底空串。
 * 这是从原型项目「`?? ''` 静默吞掉导致空 baseURL」教训里得到的纪律。
 * 若确实允许缺省，显式传 fallback。
 */
export function getEnv(key: string, fallback?: string): string {
  const value = readRaw(key);
  if (value === undefined || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`[shared/env] 缺少必需的环境变量 "${key}"，且未提供默认值。` + `请检查 .env.* 配置或构建期注入。`);
  }
  return value;
}

/**
 * 探测构建工具原生注入的「运行模式」。
 *
 * 不读手动维护的 NODE_ENV 快照，而是消费两套构建工具的原生口径：
 *   - Vite：import.meta.env.PROD / DEV / MODE（dev 服务为 dev，build 为 prod）
 *   - Rsbuild/webpack：process.env.NODE_ENV（dev 为 development，build 为 production）
 * 任一探测命中即返回，纯 Node 脚本等无注入场景兜底为 development。
 * @returns 'production' 表示生产级构建，否则 'development'
 */
function detectBuildMode(): 'development' | 'production' {
  // Vite：import.meta.env.PROD / DEV / MODE
  try {
    const metaEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
    if (metaEnv) {
      if (typeof metaEnv.PROD === 'boolean') {
        return metaEnv.PROD ? 'production' : 'development';
      }
      if (typeof metaEnv.MODE === 'string') {
        return metaEnv.MODE === 'production' ? 'production' : 'development';
      }
    }
  } catch {
    // 某些运行时不支持 import.meta，忽略并回退
  }

  // Rsbuild / webpack / Node：process.env.NODE_ENV
  if (typeof process !== 'undefined' && process.env && typeof process.env.NODE_ENV === 'string') {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  return 'development';
}

/**
 * 是否为开发环境（构建优化口径，由构建工具原生注入）
 */
export function isDev(): boolean {
  return detectBuildMode() !== 'production';
}

/**
 * 是否为生产环境（构建优化口径，由构建工具原生注入）
 */
export function isProd(): boolean {
  return detectBuildMode() === 'production';
}

/**
 * 读取应用环境（业务逻辑分支开关）。
 *
 * 与 isDev / isProd（构建优化口径）区分开：APP_ENV 用来
 * 区分 development / test / production 的业务行为，比如测试环境也走生产级
 * 构建（pnpm build），但服务地址仍指向测试。
 */
export function getAppEnv(): AppEnv {
  return getEnv('APP_ENV', 'development') as AppEnv;
}
