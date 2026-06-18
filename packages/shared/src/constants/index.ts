/**
 * 跨应用共享常量。
 * 仅放中立、与具体业务无关的常量。
 */

/**
 * localStorage 中存放认证 token 的键名。
 * 双下划线包裹是底座存储键约定：降低与第三方库 key 冲突的概率，
 * 也便于在 DevTools 里一眼辨认是本应用写入的键。
 */
export const STORAGE_TOKEN_KEY = '__LYSTACK_TOKEN__';
