/**
 * 组合根（composition root）— MPA 共享版本。
 *
 * MPA 多入口应用中，每个页面的 main.ts 独立启动，
 * 但都需要相同的装配流程（认证注入、错误展示）。
 * 因此将 bootstrap 提取为公共模块，各页面入口共享引用。
 *
 * ── 这是你定制自己 app 启动流程的入口 ──
 */
import { configureServiceAuth, setErrorMessenger } from '@repo/services/core';
import { STORAGE_TOKEN_KEY } from '@repo/shared/constants';

/**
 * 引导装配函数 —— 在各页面 createApp(App).mount('#app') 之前调用。
 */
export function bootstrap(): void {
  // ── 1. 注入认证能力 ──
  configureServiceAuth({
    getToken: () => localStorage.getItem(STORAGE_TOKEN_KEY) ?? '',
    onAuthenticationFailure: () => {
      console.warn('[bootstrap] 认证失效，请接入路由跳转逻辑');
    },
  });

  // ── 2. 注入错误消息展示器 ──
  setErrorMessenger((msg: string) => {
    console.error(`[LYStack] ${msg}`);
  });

  console.log('[bootstrap] LYStack 装配完成 ✅');
}
