/**
 * 统一环境变量读取层 —— 全底座读取环境变量的唯一合法入口。
 *
 * 为什么需要这一层（核心设计）：
 *   1. 不同构建工具注入 env 的机制不同：
 *      - Vite 走 `import.meta.env.*`
 *      - Rsbuild/webpack 走 `process.env.*`
 *      若业务代码到处直接读，就会硬耦合到某个构建工具，破坏「构建可插拔」。
 *   2. 这一层把差异收敛到一处，对外提供构建工具无关的 getter，
 *      业务层永远只 import 这里，不碰 import.meta / process.env。
 *
 * 配套约束：ESLint 禁止 apps/**\/src 业务代码直接出现 process.env /
 * import.meta.env（env 层除外），从规则上强制收口。
 */

/**
 * 读取一个原始环境变量。
 *
 * 兼容两套注入机制：优先 import.meta.env（Vite），回退 process.env（Rsbuild/Node）。
 * 通过 try/catch 安全探测 import.meta，避免在不支持的运行时报错。
 */
function readRaw(key: string): string | undefined {
  // Vite 注入：import.meta.env
  try {
    const metaEnv = (
      import.meta as ImportMeta & { env?: Record<string, unknown> }
    ).env;
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
    throw new Error(
      `[shared/env] 缺少必需的环境变量 "${key}"，且未提供默认值。` +
        `请检查 .env.* 配置或构建期注入。`,
    );
  }
  return value;
}

/**
 * 是否为开发环境
 */
export function isDev(): boolean {
  return getEnv('NODE_ENV', 'development') !== 'production';
}

/**
 * 是否为生产环境
 */
export function isProd(): boolean {
  return getEnv('NODE_ENV', 'development') === 'production';
}
