/**
 * 构建工具无关的配置契约。
 *
 * 设计核心：业务/应用层只描述「我要构建什么」（AppBuildOptions），
 * 不关心「用什么工具构建」。Vite / Rsbuild 各自的 adapter 负责把这份
 * 中立描述翻译成对应工具的真实配置。
 *
 * 这是整个底座「构建可插拔」的根基——构建工具被关进 adapter 这一层，
 * core 与 app 永不直接 import vite / rsbuild。
 */

/**
 * 应用的渲染形态
 */
export type AppKind =
  /**
   * 单页应用：单一入口，两种构建工具都原生顺手
   */
  | 'spa'
  /**
   * 多页应用：一份 PageConfig 作为唯一真相源驱动多入口。
   * 当前仅 Rsbuild adapter 支持（Rspack js-first 入口天生适合）；
   * Vite adapter 暂抛「不支持」错误，已列入 roadmap。
   */
  | 'mpa';

/**
 * 构建目标环境
 */
export type EnvMode = 'development' | 'test' | 'production';

/**
 * MPA 单个页面入口的中立描述。
 * 不含任何构建工具特有字段，确保未来 Vite MPA adapter 可复用同一契约。
 */
export interface PageEntry {
  /**
   * 页面唯一名（同时作为产物 html 文件名与输出子目录名）
   */
  name: string;
  /**
   * 入口 TS/JS 文件路径（相对应用根目录）
   */
  entry: string;
  /**
   * 注入 html 的页面标题
   */
  title?: string;
  /**
   * 启用该页面的环境白名单。
   * 缺省 = 所有环境都构建；声明 = 仅命中的环境纳入入口
   * （如登录 mock 页仅 ['development']），由 adapter 按当前 envMode 过滤。
   */
  env?: EnvMode[];
  /**
   * 该页面额外注入的外部脚本地址，在公共脚本基础上追加。
   */
  scripts?: string[];
  /**
   * 该页面额外注入的外部样式地址，在公共样式基础上追加。
   */
  styles?: string[];
}

/**
 * 环境到外部资源地址列表的映射。
 * 用于按当前构建环境注入不同的 CDN 脚本 / 样式（如测试与生产指向不同地址）。
 */
export type EnvAssetMap = Record<EnvMode, string[]>;

/**
 * html 注入配置：标题与外部资源（脚本 / 样式）清单。
 *
 * 设计为构建工具无关：仅描述「要注入什么」，由各 adapter 翻译成对应工具的
 * html 模板参数。公共清单对所有环境生效，env 映射按当前环境追加。
 */
export interface HtmlInjectOptions {
  /**
   * 页面标题。MPA 下作为各页 title 的兜底，单页缺省时回退为 appName。
   */
  title?: string;
  /**
   * 公共外部脚本地址，所有环境都注入。
   */
  scriptUrlList?: string[];
  /**
   * 公共外部样式地址，所有环境都注入。
   */
  styleUrlList?: string[];
  /**
   * 按环境追加的脚本地址映射。
   */
  envScriptUrlMap?: Partial<EnvAssetMap>;
  /**
   * 按环境追加的样式地址映射。
   */
  envStyleUrlMap?: Partial<EnvAssetMap>;
}

/**
 * 应用构建选项：adapter 的统一输入。
 * SPA 用 `entry` 单入口；MPA 用 `pages` 多入口。
 */
export interface AppBuildOptions {
  /**
   * 渲染形态
   */
  kind: AppKind;
  /**
   * 应用名（用于产物输出目录 dist/<appName>）
   */
  appName: string;
  /**
   * 应用根目录绝对路径
   */
  root: string;
  /**
   * SPA 入口文件（kind 为 'spa' 时必填，相对 root）
   */
  entry?: string;
  /**
   * MPA 页面清单（kind 为 'mpa' 时必填）
   */
  pages?: PageEntry[];
  /**
   * 构建目标环境，默认 'development'
   */
  envMode?: EnvMode;
  /**
   * 资源公共路径前缀，默认 '/'（嵌入式场景可设 './'）
   */
  assetPrefix?: string;
  /**
   * 开发服务器端口
   */
  port?: number;
  /**
   * html 注入配置：标题与外部脚本 / 样式清单。
   */
  html?: HtmlInjectOptions;
  /**
   * 自定义 html 模板的绝对路径。缺省时各 adapter 使用工具内置模板。
   */
  htmlTemplate?: string;
}

/**
 * adapter 统一接口。每个构建工具实现这一个契约，
 * 对外暴露「中立选项 -> 工具原生配置」的转换能力。
 *
 * 返回类型用 unknown：契约层不依赖任何具体构建工具的类型，
 * 由各 adapter 在自己的实现里收窄为 UserConfig / RsbuildConfig。
 */
export interface BuildAdapter {
  /**
   * adapter 名称，用于日志与能力矩阵
   */
  readonly name: 'vite' | 'rsbuild';
  /**
   * 该 adapter 是否支持给定的渲染形态
   */
  supports(kind: AppKind): boolean;
  /**
   * 将中立选项转换为该工具的原生配置对象
   */
  createConfig(options: AppBuildOptions): unknown;
}
