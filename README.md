# LYStack

一个面向前端工程组织能力的 Vue3 Monorepo 架构样板。

> 不是后台模板，也不是 UI 脚手架。LYStack 用一套可运行的代码，演示一个长期维护的前端项目应该如何分层、如何控制依赖方向、如何隔离构建工具差异，以及如何让 AI 按团队规范写代码。

如果你写了几年 Vue3，已经能写页面、接接口、改 Bug，但一到从 0 搭项目就会纠结这些问题：

- 目录到底怎么分，为什么 `components` 和 `utils` 越来越像垃圾桶？
- axios 请求层为什么越封越重，最后谁都不敢动？
- 环境变量为什么不能到处读，为什么 `?? ''` 会埋线上坑？
- 今天用 Vite，明天想切 Rsbuild，为什么业务代码会被构建工具绑死？
- 多个应用如何共享 services、shared、ui，而不是复制粘贴？
- AI 写代码为什么总是能跑但不像团队代码？

LYStack 想回答的就是这些问题。

## 它是什么

LYStack 是一个构建工具无关的企业级 Vue3 Monorepo 底座，当前提供三个示例应用：

| 示例应用 | 构建工具 | 形态 | 端口 | 作用 |
| --- | --- | --- | --- | --- |
| `example-vite` | Vite | SPA | 5173 | 展示 Vite 单页应用如何接入同一套底座 |
| `example-rsbuild` | Rsbuild | SPA | 5273 | 展示 Rsbuild 单页应用如何接入同一套底座 |
| `example-rsbuild-mpa` | Rsbuild | MPA | 5373 | 展示 PageConfig 驱动的多页应用入口 |

它不提供真实业务，也不绑定任何 UI 组件库。它更像一个工程样板，用来解释真实项目里那些容易腐化的边界：构建、服务、环境变量、共享包、规范和 AI 协作。

## 架构总览

```txt
LYStack/
├── apps/
│   ├── example-vite/         # Vite SPA 示例
│   ├── example-rsbuild/      # Rsbuild SPA 示例
│   └── example-rsbuild-mpa/  # Rsbuild MPA 示例
│
├── packages/
│   ├── build-config/         # 构建抽象层：AppBuildOptions + Vite/Rsbuild adapter
│   ├── shared/               # 构建无关共享层：env / utils / types / constants
│   ├── services/             # HTTP 层：AxiosFactory + interceptor + 依赖反转
│   └── ui/                   # 基础 UI 与样式变量，不绑定业务
│
├── plop-templates/           # new:app / new:page 代码生成模板
├── app.config.ts             # 应用端口与静态构建配置的单一真相源
├── pnpm-workspace.yaml       # workspace + catalog 版本单一真相源
├── turbo.json                # 任务编排
└── tsconfig.base.json        # 共享 TypeScript 严格配置
```

核心依赖方向：

```txt
apps/*
  ├─> @repo/services ──> @repo/shared
  ├─> @repo/ui       ──> @repo/shared
  └─> @repo/shared

apps/*.config.ts ──> @repo/build-config/vite | @repo/build-config/rsbuild
                         └─> adapter 内部消化 Vite/Rsbuild 差异
```

原则很简单：业务应用可以装配底层能力，但底层包不要反过来认识具体应用。

## 五个核心设计

### 1. 构建工具可插拔

应用只声明“我要构建什么”，不直接处理 Vite / Rsbuild 的细节。

```ts
// apps/example-vite/vite.config.ts
import { defineViteConfig, resolveRoot } from '@repo/build-config/vite';

export default defineViteConfig({
  kind: 'spa',
  appName: 'example-vite',
  root: resolveRoot(import.meta.url),
  entry: 'index.html',
});
```

```ts
// apps/example-rsbuild/rsbuild.config.ts
import { defineRsbuildConfig, resolveRoot } from '@repo/build-config/rsbuild';

export default defineRsbuildConfig({
  kind: 'spa',
  appName: 'example-rsbuild',
  root: resolveRoot(import.meta.url),
  entry: 'src/main.ts',
});
```

应用层只面对中立契约 `AppBuildOptions`，真正的构建工具差异被关进 adapter。

### 2. services 依赖反转

请求层不直接依赖 router、UI 组件库或 token 存储。

应用启动时在组合根注入运行时能力：

```ts
configureServiceAuth({
  getToken: () => localStorage.getItem(STORAGE_TOKEN_KEY) ?? '',
  onAuthenticationFailure: () => {
    // 真实项目里可以 router.push('/login') 或触发 SSO
    console.warn('[bootstrap] 认证失效，请接入路由跳转逻辑');
  },
});

setErrorMessenger((msg: string) => {
  // 接入 UI 框架后可替换为 ElMessage.error(msg)
  console.error(`[LYStack] ${msg}`);
});
```

这样 `@repo/services` 可以被不同应用复用，而不是被某个 app 的 router / UI / localStorage 绑死。

### 3. env 统一收口

业务层不直接读 `import.meta.env` / `process.env`，统一走 `@repo/shared/env`。

```ts
const apiBase = getEnv('PUBLIC_API_BASE_URL');
```

必填配置缺失时 fail loudly，不用空字符串静默兜底。

`shared/env` 内部会按优先级读取：

1. 构建期聚合快照 `__PUBLIC_ENV__`
2. Vite 的 `import.meta.env`
3. Rsbuild / Node 的 `process.env`

业务代码不需要认识构建工具的环境变量机制。

### 4. MPA 使用 PageConfig 作为单一真相源

Rsbuild MPA 示例通过 `page.config.ts` 管理多入口。

```ts
export const pages: PageEntry[] = [
  {
    name: 'index',
    entry: './src/pages/index/main.ts',
    title: 'LYStack · 首页',
  },
  {
    name: 'about',
    entry: './src/pages/about/main.ts',
    title: 'LYStack · 关于',
  },
];
```

登记了的页面才会成为入口，`name` 同时作为入口名和产物 html 名。新增页面由 `pnpm new:page` 注入配置，避免入口散落。

### 5. 给 AI 看的工程规范

LYStack 内置 `AGENTS.md` 和 `.rules/*`，把团队工程约束写给 AI 看：

- 注释风格
- 命名规范
- 目录组织
- Vue3 写法
- TypeScript 约束
- services / axios 约束
- env 收口
- 错误处理
- 编码自查

AI 不知道你的团队规矩，就会按自己的默认风格生成代码。把规矩写进仓库，才能让 AI 产出更接近团队代码。

## 构建能力矩阵

| 构建工具 | SPA | MPA | 说明 |
| --- | --- | --- | --- |
| Vite | 支持 | roadmap | Vite 是 html-first，MPA 需要额外 html 生成翻译层 |
| Rsbuild | 支持 | 支持 | Rspack js-first 入口模型更适合 PageConfig 驱动的多页场景 |

MPA 默认由 Rsbuild 承载。Vite MPA 支持已放入 roadmap，不会在当前版本里假装支持。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3.5 + TypeScript 6 strict mode |
| 构建 | Vite 8 / Rsbuild 2 adapter |
| HTTP | Axios 1.16，多实例 + 依赖反转 |
| 包管理 | pnpm 9 workspace + catalog |
| 任务编排 | Turborepo 2 |
| 代码规范 | ESLint 9 flat + Prettier 3 |
| 提交工作流 | husky 9 + commitlint + lint-staged |
| 代码生成 | Plop，支持 new:app / new:page |
| UI | 不绑定 UI 框架，由使用者自行接入 |

## 快速开始

```bash
pnpm install
pnpm dev
```

启动后可以访问：

| 应用 | 地址 |
| --- | --- |
| Vite SPA | http://localhost:5173 |
| Rsbuild SPA | http://localhost:5273 |
| Rsbuild MPA | http://localhost:5373 |

常用命令：

```bash
pnpm dev          # 启动所有示例应用
pnpm build        # 构建所有包和应用
pnpm typecheck    # 类型检查
pnpm lint         # 代码规范检查
pnpm new:app      # 生成新应用
pnpm new:page     # 为 MPA 生成新页面
```

## 适合谁

适合：

- 想学习大型前端项目如何组织的 0-5 年前端工程师
- 需要维护多个 Vue3 应用，并希望共享 services / shared / ui 的团队
- 想理解 Vite / Rsbuild 如何通过 adapter 解耦的工程化开发者
- 想给 AI 编程工具提供明确项目规范的团队
- 想研究 Monorepo、env 收口、依赖反转、MPA 入口管理的人

不适合：

- 只想找一个开箱即用 UI 后台模板的人
- 一次性 demo、活动页、纯静态官网
- 不需要多应用共享，也不关心工程边界的小项目
- 希望项目内置完整真实业务的人

## 从文章来的读者

这个仓库对应的是“0-5 年前端如何提升项目组织能力”系列文章。建议按下面顺序阅读：

1. 为什么你写了 3 年前端，还是搭不好一个项目？
2. 目录结构到底怎么设计？别再把 components 和 utils 当垃圾桶了
3. 前端请求层到底怎么封？为什么全局 axios 单例越用越难维护
4. 环境变量为什么不能到处读？一次空 baseURL 引发的项目配置灾难
5. 为什么你的项目越来越难换构建工具？因为业务代码认识了 Vite 的脸

> 系列文章会持续更新。LYStack 不追求大而全，它负责把这些工程思想落到一套可运行的代码里。

## 源码导读

如果你想快速读懂项目，建议按这个顺序看：

| 目标 | 文件 |
| --- | --- |
| 看整体定位 | `README.md` |
| 看 AI 工程规范入口 | `AGENTS.md` |
| 看构建中立契约 | `packages/build-config/src/types.ts` |
| 看 Vite adapter | `packages/build-config/src/adapters/vite/index.ts` |
| 看 Rsbuild adapter | `packages/build-config/src/adapters/rsbuild/index.ts` |
| 看 services 请求内核 | `packages/services/src/core/axios-factory.ts` |
| 看认证和错误展示注入 | `packages/services/src/core/helper.ts` |
| 看 env 收口 | `packages/shared/src/env/index.ts` |
| 看应用组合根 | `apps/example-vite/src/bootstrap/index.ts` |
| 看 MPA 页面入口 | `apps/example-rsbuild-mpa/page.config.ts` |

## Roadmap

- [x] Rsbuild adapter（SPA + MPA）
- [x] Vite adapter（SPA）
- [x] services 依赖反转层（HTTP + 认证注入 + 错误展示注入）
- [x] env 统一收口与 fail loudly
- [x] pnpm workspace + catalog 版本单一真相源
- [x] Turborepo 任务编排
- [x] husky + commitlint + lint-staged
- [x] `AGENTS.md` + `.rules/*` AI 友好规范
- [ ] Vite MPA 支持（统一 PageConfig 入口契约的 html 翻译层）
- [ ] 可选认证适配层
- [ ] 测试体系（Vitest）+ CI
- [ ] 离线缓存（待原始项目实战验证后整合）

## 为什么值得 star

如果你正在练习的不只是“写页面”，而是更难的“组织一个能长期维护的前端项目”，LYStack 可以作为一个源码样板：

- 看它如何分层
- 看它如何控制依赖方向
- 看它如何把构建工具关进 adapter
- 看它如何让 services 不绑定应用运行时
- 看它如何让 env 读取变成工程契约
- 看它如何把 AI 编程规范写进仓库

觉得这个方向有用，可以点一个 star。后续我会继续围绕 LYStack 拆解前端工程组织能力。

## 许可证

[MIT](./LICENSE)
