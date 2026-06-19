/**
 * 全局环境类型声明（ambient）—— 整个 Monorepo 的环境变量类型契约。
 *
 * 为什么是全局 ambient（无顶层 import/export）：
 *   声明文件一旦出现顶层 import/export 就会变成「模块」，其中的 declare global
 *   才生效，写法更绕。这里全部用 ambient 声明，由各包 tsconfig 的 include 纳入，
 *   即可在全仓共享，无需逐处 import。
 *
 * 暴露约定：仅 PUBLIC_ 前缀变量会被构建期注入客户端，业务侧统一经
 * @repo/shared/env 读取，不直接碰 process.env / import.meta.env。
 */

/**
 * 应用环境枚举：业务逻辑分支开关，与「构建优化口径」（dev / prod）解耦
 */
type AppEnv = 'development' | 'test' | 'production';

/**
 * 构建期注入到客户端的公共环境快照。
 *
 * 双构建工具（Vite / Rsbuild）的 define 机制不同：Vite 暴露 import.meta.env，
 * Rsbuild 走 process.env，且对「动态 key 访问」支持不一。底座统一把 PUBLIC_
 * 前缀变量与 APP_ENV 聚合成这一个字面量对象注入，
 * @repo/shared/env 优先读它，从而抹平构建工具差异。
 *
 * 运行模式（dev / prod）不在此携带：由构建工具原生注入
 * import.meta.env.DEV/PROD/MODE 与 process.env.NODE_ENV，isDev/isProd 直接消费。
 */
interface PublicEnv {
  /**
   * 应用环境
   */
  readonly APP_ENV: AppEnv;
  /**
   * 其余 PUBLIC_ 前缀变量（构建期按前缀筛入）
   */
  readonly [key: string]: string;
}

/**
 * 全局注入的公共环境快照（由 build-config 在构建期 define）
 */
declare const __PUBLIC_ENV__: PublicEnv;

/**
 * Node 侧（构建脚本 / 配置文件）可见的进程环境变量。
 *
 * 仅声明底座约定的固定项；业务侧不应直接读 process.env，此处仅服务构建期代码。
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * 运行模式
     */
    readonly NODE_ENV: 'development' | 'production';
    /**
     * 应用环境
     */
    readonly APP_ENV: AppEnv;
  }
}

/**
 * Vue 单文件组件模块声明：让 TS 识别 *.vue 导入
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
