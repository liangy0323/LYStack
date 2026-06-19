/**
 * 导入 Axios 类型声明
 */
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * 拦截器钩子集合。
 *
 * 每个服务实例初始化时注入，用于在请求/响应生命周期插入公共逻辑：
 * token 注入、业务码校验、统一错误提示、401 处理等。
 * 所有钩子均可选，未提供的跳过。
 */
export interface InterceptorHooks {
  /**
   * 请求拦截（成功）：发送前最后一站，适合注入 Authorization / token 等头部。
   */
  requestInterceptor?: (
    config: InternalAxiosRequestConfig,
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

  /**
   * 请求拦截（失败）：请求构造阶段抛错时触发（极少发生，通常与配置错误有关）。
   */
  requestInterceptorCatch?: (error: unknown) => Promise<never>;

  /**
   * 响应拦截（成功）：收到 2xx 响应的第一站，适合提取 data、校验业务码、
   * 展示成功/错误提示。
   */
  responseInterceptor?: (response: AxiosResponse) => unknown | Promise<unknown>;

  /**
   * 响应拦截（失败）：HTTP 非 2xx 或网络错误的第一站，适合 401 跳转登录、
   * 统一网络错误提示等。
   */
  responseInterceptorCatch?: (error: unknown) => Promise<never>;
}

/**
 * 单次请求级选项 —— 对某一次请求微调行为，不影响全局配置。
 *
 * 所有字段均可选：未传时使用服务实例的默认行为。
 */
export interface RequestOptions {
  /**
   * 是否跳过全局认证失败处理（如某接口允许未登录访问时的 401 不触发登录跳转）。
   */
  skipAuthRedirect?: boolean;

  /**
   * 是否隐藏业务错误的全局提示（某些场景需要手动处理错误信息）。
   */
  hiddenNotify?: boolean;

  /**
   * 是否展示全局请求成功信息（极少使用，默认 false）。
   */
  globalSuccessMessage?: boolean;

  /**
   * 是否展示全局请求错误信息（默认 true，展示）。
   */
  globalErrorMessage?: boolean;
}

/**
 * 扩展的 Axios 请求配置 —— 在标准 AxiosRequestConfig 之上附加
 * 拦截器钩子（实例级）与请求选项（单次请求级）。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExpandAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
  /**
   * 实例级拦截器钩子：创建 AxiosFactory 时注入，对由此实例发出的所有请求生效。
   */
  interceptorHooks?: InterceptorHooks;

  /**
   * 单次请求级选项：仅对当次请求生效。
   */
  requestOptions?: RequestOptions;
}

/**
 * 扩展的内部请求配置 —— Axios 运行时使用的 InternalAxiosRequestConfig
 * 附加我们的自定义字段，方便在拦截器中读取。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExpandInternalAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
  interceptorHooks?: InterceptorHooks;
  requestOptions?: RequestOptions;
}

/**
 * 扩展的 Axios 响应 —— 保留自定义 config 便于拦截器内读取 requestOptions。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExpandAxiosResponse<T = any, D = any> extends AxiosResponse<T, D> {
  config: ExpandInternalAxiosRequestConfig<D>;
}
