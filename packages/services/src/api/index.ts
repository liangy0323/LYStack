/**
 * 通用 API 服务 —— 开箱即用的 HTTP 服务实例。
 *
 * ## 定位
 *
 * 这是 @repo/services 自带的**可直接使用的 API 服务**，也是你定制自己服务的蓝图。
 * 你可以：
 *   - 直接用 `apiService.get('/user/info')` 调用接口
 *   - 照这个文件的结构，建自己的 `service-cms.ts` / `service-payment.ts`，
 *     各自绑定自己的拦截器、baseURL 和响应类型——这就是「多服务实例」模式。
 *
 * ## 使用前提
 *
 * 1. 在 app bootstrap 中注入认证能力：
 *    ```ts
 *    configureServiceAuth({
 *      getToken: () => localStorage.getItem('__LYSTACK_TOKEN__') ?? '',
 *      onAuthenticationFailure: () => router.push('/login'),
 *    });
 *    ```
 * 2. 设置 API 基地址（如 .env.development 中 PUBLIC_API_BASE_URL）：
 *    服务内部通过 @repo/shared/env 读取，你无需在代码里硬编码域名。
 */

import { AxiosFactory } from '@repo/services/core';
import { getEnv } from '@repo/shared/env';
import { apiInterceptor } from './interceptor.ts';

import type { ExpandAxiosRequestConfig } from '@repo/services/types';

/**
 * 通用 API 业务响应结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/**
 * 创建 axios 实例：30s 超时，挂载通用拦截器。
 *
 * 每个服务创建自己的 AxiosFactory 实例是刻意为之：
 * 不同后端可能有不同的超时、baseURL 甚至 Content-Type（如文件上传用 multipart），
 * 全局单例在这些场景下会互相掣肘。
 */
const request = new AxiosFactory({
  timeout: 30 * 1000,
  interceptorHooks: apiInterceptor,
});

/**
 * 通用 API 服务封装 —— 自动拼接 baseURL，返回类型化的响应体。
 *
 * 方法签名刻意与 Axios 保持相似（url + data/params + config），
 * 让熟悉 axios 的开发者零学习成本上手。
 */
class ApiService {
  /**
   * 获取 API 基地址（从环境变量读取，避免硬编码）。
   */
  private get baseUrl(): string {
    return getEnv('PUBLIC_API_BASE_URL', 'http://localhost:3000/api');
  }

  /**
   * GET 请求
   */
  public get<T = unknown, P = Record<string, unknown>>(url: string, params?: P, config?: ExpandAxiosRequestConfig) {
    return request.get<ApiResponse<T>>(`${this.baseUrl}${url}`, { params, ...config });
  }

  /**
   * POST 请求
   */
  public post<T = unknown, D = unknown>(url: string, data?: D, config?: ExpandAxiosRequestConfig) {
    return request.post<ApiResponse<T>>(`${this.baseUrl}${url}`, data, config);
  }

  /**
   * PUT 请求
   */
  public put<T = unknown, D = unknown>(url: string, data?: D, config?: ExpandAxiosRequestConfig) {
    return request.put<ApiResponse<T>>(`${this.baseUrl}${url}`, data, config);
  }

  /**
   * DELETE 请求
   */
  public delete<T = unknown>(url: string, config?: ExpandAxiosRequestConfig) {
    return request.delete<ApiResponse<T>>(`${this.baseUrl}${url}`, config);
  }
}

/**
 * 导出单例实例 —— 业务代码直接 import { apiService } from '@repo/services/api' 使用。
 */
export const apiService = new ApiService();
