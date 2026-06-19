/**
 * 组合根（composition root）。
 *
 * 应用启动时的统一装配点：在这里集中完成所有「副作用初始化」与
 * 依赖注入（认证 token 读取、服务层配置、错误消息展示）。
 *
 * 设计意图：让启动流程显式、可读、可测；业务组件不再各自做初始化，
 * 一切装配收敛于此。
 *
 * ── 这是你定制自己 app 启动流程的入口 ──
 */
import { configureServiceAuth, setErrorMessenger } from '@repo/services/core';
import { STORAGE_TOKEN_KEY } from '@repo/shared/constants';

/**
 * 引导装配函数 —— 在 createApp(App).mount('#app') 之前调用。
 */
export function bootstrap(): void {
  // ── 1. 注入认证能力 ──
  // services 层不直接依赖 localStorage / router / cookie，
  // 而是通过依赖反转，由 app 层在启动时注入「如何获取 token」
  // 与「token 失效时做什么」。
  configureServiceAuth({
    getToken: () => localStorage.getItem(STORAGE_TOKEN_KEY) ?? '',
    onAuthenticationFailure: () => {
      // 真实项目里这里跳转登录页：
      // router.push('/login');
      console.warn('[bootstrap] 认证失效，请接入路由跳转逻辑');
    },
  });

  // ── 2. 注入错误消息展示器 ──
  // services 层不绑定任何 UI 框架（不 import ElMessage / toast），
  // 由 app 层注入具体的消息展示方式。
  // 当前底座阶段用 console.error 兜底；接入 UI 框架后替换：
  //   import { ElMessage } from 'element-plus';
  //   setErrorMessenger((msg) => ElMessage.error(msg));
  setErrorMessenger((msg: string) => {
    // TODO(ui): 接入 UI 框架后将此处替换为 ElMessage / toast / modal
    console.error(`[LYStack] ${msg}`);
  });

  console.log('[bootstrap] LYStack 装配完成 ✅');
}
