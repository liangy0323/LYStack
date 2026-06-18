/**
 * 跨应用共享的通用类型。
 * 业务相关类型应放在各自应用内，这里只放真正中立的基础类型。
 */

/**
 * 可空类型
 */
export type Nullable<T> = T | null;

/**
 * 可选可空类型
 */
export type Maybe<T> = T | null | undefined;

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
