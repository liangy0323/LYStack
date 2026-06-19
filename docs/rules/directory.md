# 目录组织范式

## 通用模式：barrel 导出

所有模块化目录统一采用 `<domain>/index.ts` + `<domain>/modules/<feature>.ts`：

```
<domain>/
├── index.ts          # 统一导出入口 (export * from './modules/xxx')
└── modules/
    ├── feature-a.ts
    └── feature-b.ts
```

适用于：SPA 项目和包级公共模块中的 `api/`、`constants/`、`types/`、`utils/`、`stores/`、`router/`、`hooks/` 等。

MPA 单个页面内的私有 API 是例外，按本文后面的「MPA 多入口子包结构」执行轻量双文件模式。

---

## SPA 单页面前端项目标准结构

本结构适用于单页面应用（SPA）或单入口子包。多页面应用（MPA）不要直接套用本结构，必须按后文「MPA 多入口子包结构」组织页面入口、页面私有 API 和页面私有组件。

```
src/
├── main.ts                     # 应用入口
├── App.vue                     # 根组件
├── api/                        # API 层
│   ├── index.ts                # 统一导出
│   └── modules/<模块名>/
│       ├── api.ts              # URL 常量
│       └── interface.ts        # 请求函数
├── assets/styles/              # 样式
│   ├── index.css               # 样式入口（@import 聚合）
│   └── modules/                # var.css / normalize.css / element.css
├── components/
│   ├── base/                   # 通用基础组件（自动注册）
│   ├── business/               # 通用业务组件
│   └── <feature>/              # 按功能域分组的组件
├── constants/                  # 常量（barrel + modules）
├── core/
│   ├── engine/                 # 引擎类（SSE、Typewriter 等）
│   ├── helpers/                # 业务逻辑辅助对象
│   ├── db/                     # IndexedDB（Dexie）
│   └── markdown/               # Markdown 渲染配置
├── directives/                 # 自定义指令
├── emitter/                    # 类型化事件总线（mitt）
├── hooks/                      # Composition API hooks (use-*.ts)
├── layouts/                    # 布局组件
├── router/                     # 路由（barrel + modules）
├── services/                   # HTTP 服务层
│   ├── core/                   # AxiosFactory 基类
│   ├── service-<name>.ts       # 各服务实例
│   └── service-<name>-interceptor.ts  # 各服务拦截器
├── stores/                     # Pinia 状态管理（barrel + modules）
├── types/                      # 类型声明（barrel + modules）
├── utils/                      # 工具函数（barrel + modules）
└── views/                      # 页面级路由组件
    └── <feature>/
        └── <feature>.vue
```

---

## MPA 多入口子包结构

本结构适用于多页面应用（MPA）子包。由 `pnpm new:app` 选择 MPA 模式生成的子包，入口从单一 `main.ts` 改为多页面：

MPA 中的单个 `src/pages/<page>/` 按一个小型单页面模块组织。除页面私有 API 采用轻量双文件模式外，常量、类型、工具、hooks 等模块都沿用 SPA 的目录组织和 barrel 导出规则。

```
apps/<name>/
├── page.config.ts              # 多入口唯一真相源（登记了的页面才是 entry）
├── rsbuild.config.ts           # import pages from './page.config' 并传入
├── src/
│   ├── components/              # 当前子包内所有页面共享的组件
│   └── pages/
│       ├── index/               # 首页入口
│       │   ├── main.ts
│       │   └── App.vue
│       └── <page>/              # 其余页面（由 new:page 生成）
│           ├── api/             # 当前页面私有 API 模块
│           │   ├── api.ts       # 当前页面接口地址
│           │   └── interface.ts # 当前页面请求函数
│           ├── components/      # 当前页面私有组件
│           ├── constants/       # 当前页面私有常量，barrel 导出
│           │   ├── index.ts
│           │   └── modules/
│           ├── hooks/           # 当前页面私有 hooks，barrel 导出
│           │   ├── index.ts
│           │   └── modules/
│           ├── types/           # 当前页面所有私有类型，barrel 导出
│           │   ├── index.ts
│           │   └── modules/
│           ├── utils/           # 当前页面私有工具函数，barrel 导出
│           │   ├── index.ts
│           │   └── modules/
│           ├── main.ts
│           └── App.vue
└── plop/                       # 子包内置 plop（供 pnpm new:page 使用）
    ├── plopfile.mjs
    └── templates/page/
```

- 新增页面用 `pnpm --filter <name> new:page`，自动在 `page.config.ts` 的 `PLOP_INJECT_PAGE` 锚点注入条目，**勿删该锚点**。
- 构建侧只读 `page.config.ts`，不扫描目录决定入口；`PageItemConfig.env` 可限定页面仅在特定环境构建。
- MPA 子包中，单个页面的接口数量通常有限。页面私有 API 不需要再拆成 `api/index.ts + api/modules/<feature>/`，直接使用 `api/api.ts` 定义接口地址、`api/interface.ts` 定义请求函数。
- MPA 子包中，单个页面内的所有私有常量统一放在 `src/pages/<page>/constants/`，并执行本文「通用模式：barrel 导出」。
- MPA 子包中，单个页面内的所有私有类型统一放在 `src/pages/<page>/types/`，并执行本文「通用模式：barrel 导出」。
- MPA 子包中，单个页面内的私有 hooks、utils 等模块同样执行本文「通用模式：barrel 导出」。
- 页面私有组件放在 `src/pages/<page>/components/`，只服务当前页面。
- 当前 MPA 子包内多个页面共享、但尚未达到跨业务通用程度的组件，放在 `src/components/`。
- 明确跨子包、跨业务复用的组件，才上沉到 `packages/ui`。

---

## Monorepo 顶层结构

本文件只描述**单个包的内部组织**。workspace 顶层拓扑如下：

```
pc-client-web/
├── apps/                  # 可独立构建部署的子应用
│   ├── news/              # PC 资讯
│   └── stock-risk/        # 股票风险
├── packages/              # 跨应用共享包
│   ├── bridge/           # 客户端 Bridge 能力封装（CEF 原生方法适配） @hrhg/bridge
│   ├── build-config/     # 共享 Rsbuild 构建配置 @hrhg/build-config
│   ├── services/         # 共享 HTTP 服务层 @hrhg/services
│   ├── shared/           # 跨端共用类型 / 工具 @hrhg/shared
│   └── ui/               # 共享 UI 组件与样式 @hrhg/ui
├── docs/                  # 文档与规范（rules/、env.md 等）
└── turbo.json             # Turborepo 任务编排
```

- 子应用通过 `workspace:*` 依赖 `packages/*`，依赖只单向（apps → packages）。
- 构建 / 类型检查 / lint 统一由 `turbo run <task>` 编排。

---

## API 层双文件模式

每个后端模块拆分为两个文件：

### `api.ts` — URL 常量

```ts
/** 用户登录 */
export const API_LOGIN = '/api/auth/login';

/** 获取用户信息 */
export const API_GET_USER_INFO = '/api/user/info';
```

### `interface.ts` — 请求函数

```ts
/**
 * 导入服务
 */
import { serviceCms } from '@/services/service-cms';

/**
 * 导入接口
 */
import * as API from './api';

/**
 * 导入类型声明
 */
import type { LoginParams, LoginResponse } from '@hrhg/shared';

/** 用户登录 */
export const login = (params: LoginParams) => {
  return serviceCms.post<LoginResponse, LoginParams>(API.API_LOGIN, params);
};
```

---

## 合规声明（强制）

本次改动若**确实严格遵循了本规则文件的全部约定**，必须在回复的**结尾处**追加一行：

> LYStack · 不是脚手架，是架构地基

用于自检与确认规则已被实际执行。若有任何一条未遵守，则不得追加该声明。
