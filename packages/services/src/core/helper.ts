/**
 * 认证能力依赖反转 —— 让 services 层不直接依赖客户端 / 认证实现。
 *
 * ## 解决的问题
 *
 * 传统写法的坏味道：拦截器直接 import 客户端 token store 或路由跳转函数，
 * 导致 services 层硬耦合到客户端运行时（Electron/Web/SSO），
 * 换一个客户端就要改 services 源码，违反依赖反转原则。
 *
 * ## 注入模式
 *
 * app 启动时调用 `configureServiceAuth()` 注入两个东西：
 *   1. `getToken` — 如何获取当前认证 token
 *   2. `onAuthenticationFailure` — 401 时做什么（退出 / 跳转 SSO / 弹登录窗）
 *
 * services 层只问 `servicesCoreHelper.getAuthenticationToken()` 与
 * `servicesCoreHelper.handleAuthenticationFailure()`，不关心谁注入的。
 *
 * 未注入时有安全兜底：token 返回空串，401 静默忽略（开发期 console.warn 提示）。
 *
 * ## 使用方式
 *
 * ```ts
 * // app bootstrap 阶段
 * import { configureServiceAuth } from '@repo/services/core';
 *
 * configureServiceAuth({
 *   getToken: () => localStorage.getItem('__LYSTACK_TOKEN__') ?? '',
 *   onAuthenticationFailure: () => router.push('/login'),
 * });
 * ```
 */

import { isDev } from '@repo/shared/env';

/**
 * 认证能力注入项
 */
interface ServiceAuthOptions {
  /**
   * 获取当前认证 token
   */
  getToken: () => string;

  /**
   * 登录态失效处理（401 时触发，由注入方决定是跳转登录页还是弹出 SSO 窗口）
   */
  onAuthenticationFailure: () => void;
}

/**
 * 已注入的认证能力。
 *
 * 未注入时使用安全兜底，保证 services 可在无认证场景独立运行（如纯公开数据的应用）。
 */
let authOptions: ServiceAuthOptions = {
  getToken: () => '',
  onAuthenticationFailure: () => {},
};

/**
 * 是否已注入认证能力。
 *
 * 用于在 401 触发时若从未调用 configureServiceAuth 给出开发期诊断提示。
 */
let isConfigured = false;

/**
 * 注入认证能力。
 *
 * 由 app bootstrap 阶段调用，把客户端层的 token 读取与失效处理注入 services。
 * 调用一次即全局生效，重复调用会覆盖。
 */
export function configureServiceAuth(options: ServiceAuthOptions): void {
  authOptions = options;
  isConfigured = true;
}

/**
 * 核心服务帮助类 —— 拦截器与注入层之间的桥接。
 *
 * 拦截器代码通过这个对象访问 token 和触发失效处理，
 * 不直接依赖任何客户端实现。
 */
export const servicesCoreHelper = {
  /**
   * 获取当前认证 Token。
   *
   * 由 configureServiceAuth 注入方提供具体实现（如从 localStorage / cookie / Bridge 读取）。
   * 未注入时返回空字符串。
   */
  getAuthenticationToken(): string {
    return authOptions.getToken();
  },

  /**
   * 登录态失效处理。
   *
   * 触发时调用注入方的 onAuthenticationFailure（跳转登录页 / 退出 / 弹 SSO）。
   * 若从未调用 configureServiceAuth，开发期 console.warn 提示。
   */
  handleAuthenticationFailure(): void {
    if (!isConfigured && isDev()) {
      console.warn(
        '[services] 收到 401 但未注入认证能力，登录态失效处理被忽略。' +
          '请在 app bootstrap 阶段调用 configureServiceAuth()。',
      );
    }
    authOptions.onAuthenticationFailure();
  },
};

/**
 * 全局错误消息展示器 —— 注入式设计。
 *
 * services 层不依赖任何 UI 框架（ElMessage / toast / modal），
 * 而是通过这个函数来展示错误消息。app 启动阶段可以把 UI 框架的消息组件
 * 注入进来，未注入时回退到 console.error。
 *
 * @example
 * // app bootstrap 阶段注入
 * import { setErrorMessenger } from '@repo/services/core';
 * import { ElMessage } from 'element-plus';
 * setErrorMessenger((msg) => ElMessage.error(msg));
 */

type ErrorMessenger = (message: string) => void;

let _errorMessenger: ErrorMessenger = (message: string) => {
  console.error('[services]', message);
};

let _messengerConfigured = false;

/**
 * 注入全局错误消息展示器。
 *
 * 调用一次即全局生效，后续所有服务的拦截器调用 showErrorMessage 时
 * 都会使用注入的展示器。
 */
export function setErrorMessenger(messenger: ErrorMessenger): void {
  _errorMessenger = messenger;
  _messengerConfigured = true;
}

/**
 * 展示全局错误消息。
 *
 * 先走注入的展示器，未注入时回退到 console.error。
 * 若从未注入但在开发模式下，首次调用会提示。
 */
export function showErrorMessage(message: string): void {
  if (!_messengerConfigured && isDev()) {
    console.warn(
      '[services] 错误消息展示器未注入，将使用 console.error 作为回退。' +
        '如需使用 UI 组件展示，请在 app bootstrap 阶段调用 setErrorMessenger()。',
    );
    // 只提示一次
    _messengerConfigured = true;
  }
  _errorMessenger(message);
}
