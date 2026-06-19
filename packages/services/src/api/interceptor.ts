/**
 * 通用 API 服务拦截器 —— 展示拦截器的标准写法。
 *
 * 四个钩子覆盖了请求/响应生命周期的全部节点：
 *   requestInterceptor       — 注入 Authorization token
 *   requestInterceptorCatch  — 请求构造错误（极少触发）
 *   responseInterceptor      — 业务码校验、成功/失败分支
 *   responseInterceptorCatch — HTTP 非 2xx（401 / 500 / 网络断开等）
 *
 * 要新建自己的服务，照这个文件修改业务码字段名和对 401 的策略即可。
 */

import { servicesCoreHelper, showErrorMessage } from '@repo/services/core';

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ExpandAxiosResponse } from '@repo/services/types';

/**
 * 通用 API 响应体结构。
 *
 * 你的后端可能用不同命名（如 DDM 的 code/msg、某服务用 status/message），
 * 照实际契约改这里的字段。
 */
interface ApiResponse {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * 通用 API 拦截器 —— 最典型的「token 注入 + 业务码校验 + 401 跳登录」三板斧。
 */
export const apiInterceptor = {
  /**
   * 请求拦截：为每个请求注入 Authorization 头部。
   */
  requestInterceptor(config: InternalAxiosRequestConfig) {
    const token = servicesCoreHelper.getAuthenticationToken();
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },

  /**
   * 请求构造阶段抛错（极少发生，直接 reject 即可）。
   */
  requestInterceptorCatch(err: unknown) {
    return Promise.reject(err);
  },

  /**
   * 响应成功拦截：校验业务码 code。
   *
   * 约定：code === 200 为成功，其他为业务错误。
   * 业务错误时调用 showErrorMessage 展示后端返回的 message，
   * 除非当次请求设置了 hiddenNotify。
   */
  responseInterceptor(result: ExpandAxiosResponse<ApiResponse>) {
    const res = result as ExpandAxiosResponse<ApiResponse>;
    const data = res.data || { code: -1, message: '' };

    if (data.code !== 200) {
      const message = data.message || '请求失败，请稍后重试。';
      const hiddenNotify = res.config?.requestOptions?.hiddenNotify;
      if (!hiddenNotify) {
        showErrorMessage(message);
      }
    }

    return Promise.resolve(data);
  },

  /**
   * HTTP 层错误处理（网络断开、500、401 等）。
   *
   * - 401 → 触发 servicesCoreHelper.handleAuthenticationFailure()
   *         以调用注入方（app 启动时配置的 onAuthenticationFailure）。
   *         设置 skipAuthRedirect 的请求可跳过此逻辑。
   * - 其他错误 → 展示错误信息，reject 出去让业务层自行兜底。
   */
  responseInterceptorCatch(err: unknown) {
    const axiosErr = err as AxiosError<{ message?: string }>;

    if (axiosErr.response?.status === 401) {
      const config = axiosErr.config as { requestOptions?: { skipAuthRedirect?: boolean } } | undefined;
      if (!config?.requestOptions?.skipAuthRedirect) {
        servicesCoreHelper.handleAuthenticationFailure();
      }
      return Promise.reject(axiosErr);
    }

    // 提取错误信息：优先业务 message，其次 axios 错误 message，最后兜底文案
    let message: string;
    if (axiosErr.code === 'ERR_NETWORK') {
      message = '网络连接失败，请检查网络。';
    } else {
      message = axiosErr.response?.data?.message || axiosErr.message || '请求失败，请稍后重试。';
    }
    showErrorMessage(message);

    return Promise.reject(axiosErr.response?.data || axiosErr);
  },
};
