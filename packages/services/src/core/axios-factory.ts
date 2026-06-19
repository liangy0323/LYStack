/**
 * Axios 实例工厂 —— 可插拔拦截器的请求内核。
 *
 * ## 设计理念
 *
 * 不同于常见的「单例 axios + 全局拦截器」做法，AxiosFactory 是**可实例化**的
 * 包装类，每个后端服务（CMS / DDM / 行情 / …）创建自己的 factory 实例，
 * 各自拥有独立的：
 *   - baseURL / timeout 等基础配置
 *   - 自定义拦截器（token 字段名、业务码、401 处理策略可各自不同）
 *
 * 这套「多实例 + 各自拦截器」是原项目在对接 3 套后端验证过的模式，
 * 比全局单例更能应对「同一前端对接多个异构后端」的企业场景。
 *
 * ## 使用方式
 *
 * ```ts
 * const request = new AxiosFactory({
 *   timeout: 30000,
 *   interceptorHooks: myInterceptor,
 * });
 * const data = await request.get<ApiResponse>('/user/info');
 * ```
 */

import axios from 'axios';

import type { AxiosInstance } from 'axios';
import type { InterceptorHooks, ExpandAxiosRequestConfig } from '../types';

export class AxiosFactory {
  /**
   * axios 实例（每个 factory 独立创建）
   */
  private _instance: AxiosInstance;

  /**
   * 实例级拦截器钩子
   */
  private _interceptorHooks?: InterceptorHooks;

  /**
   * @param config 扩展的请求配置，interceptorHooks 在此注入
   */
  constructor(config: ExpandAxiosRequestConfig) {
    this._instance = axios.create(config);
    this._instance.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
    this._interceptorHooks = config.interceptorHooks;
    this.setupInterceptors();
  }

  /**
   * 注册拦截器：将 interceptorHooks 的四个钩子（若提供）挂载到 axios 实例。
   *
   * axios 1.x 的类型签名要求 responseInterceptor 返回 AxiosResponse，
   * 但实际链式调用中拦截器可以返回任意值传给下游。这里用类型断言桥接
   * 两者的分歧——运行时行为是正确的。
   */
  private setupInterceptors(): void {
    this._instance.interceptors.request.use(
      this._interceptorHooks?.requestInterceptor,
      this._interceptorHooks?.requestInterceptorCatch,
    );
    this._instance.interceptors.response.use(
      this._interceptorHooks?.responseInterceptor as Parameters<typeof this._instance.interceptors.response.use>[0],
      this._interceptorHooks?.responseInterceptorCatch,
    );
  }

  /**
   * GET 请求
   */
  public get<T = unknown>(url: string, config?: ExpandAxiosRequestConfig): Promise<T> {
    return this._instance.get(url, config);
  }

  /**
   * POST 请求
   */
  public post<T = unknown>(url: string, data?: unknown, config?: ExpandAxiosRequestConfig): Promise<T> {
    return this._instance.post(url, data, config);
  }

  /**
   * PUT 请求
   */
  public put<T = unknown>(url: string, data?: unknown, config?: ExpandAxiosRequestConfig): Promise<T> {
    return this._instance.put(url, data, config);
  }

  /**
   * DELETE 请求
   */
  public delete<T = unknown>(url: string, config?: ExpandAxiosRequestConfig): Promise<T> {
    return this._instance.delete(url, config);
  }

  /**
   * 自由组合请求：传入完整 config，适用于 PATCH 等不常用方法或精细控制场景。
   */
  public request<T = unknown>(config: ExpandAxiosRequestConfig): Promise<T> {
    return this._instance.request(config);
  }
}
