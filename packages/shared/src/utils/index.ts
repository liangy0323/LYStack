/**
 * 通用工具函数（构建工具无关、框架无关）。
 * 仅放真正跨应用复用的纯函数，避免沦为杂物堆。
 */

/**
 * 值是否已定义（非 null 且非 undefined）
 */
export function isDef<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * 安全的 JSON 解析：失败返回 fallback 而非抛错
 */
export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * 创建单调递增的请求序号生成器，用于异步竞态防护
 */
export function createRequestSeq(): () => number {
  let seq = 0;
  return () => ++seq;
}
