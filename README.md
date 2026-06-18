# LYStack

构建工具无关的企业级 Vue3 Monorepo 底座。

> 不是脚手架，是**架构地基**。LYStack 不绑定任何 UI 框架，只提供经过生产验证的分层、依赖编排与工程规范，让团队在一个不会随时间腐化的结构上开展业务。

## 核心理念

- **构建工具可插拔**：核心层（shared / services / 应用代码）对构建工具零依赖，Vite 与 Rsbuild 各自作为 adapter 关在 `@repo/build-config` 一层里。今天 Vite、明天 Rsbuild，业务代码一行不改。
- **依赖方向受控**：服务层不感知认证从哪来，通过注入装配；环境变量统一收口，禁止业务层直读 `process.env` / `import.meta.env`。
- **显式优于隐式**：组合根（`bootstrap()`）集中装配；配置缺失 fail loudly，不静默兜底。

## 构建能力矩阵

| 构建工具 | SPA         | MPA         |
| -------- | ----------- | ----------- |
| Vite     | ✅          | 🚧 Roadmap  |
| Rsbuild  | 🚧 第二阶段 | 🚧 第二阶段 |

> MPA 默认由 Rsbuild 承载——Rspack 的 js-first 入口模型 + TS 可编程的 PageConfig 契约天生适合多页场景。Vite 是 html-first 心智，其 MPA 支持需要一层 html 生成翻译层，已列入 roadmap。详见后续技术文章。

## 技术栈

| 类别     | 技术                               |
| -------- | ---------------------------------- |
| 框架     | Vue 3.5 + TypeScript 5.x（strict） |
| 构建     | Vite 6（Rsbuild 第二阶段）         |
| 包管理   | pnpm 9.x workspace + catalog       |
| 任务编排 | Turborepo 2.x                      |
| 代码规范 | ESLint 9 flat + Prettier           |
| UI       | 无（由使用者自选接入）             |

## 项目结构

```
LYStack/
├── apps/
│   └── example-vite/      # 最小示例：Vite SPA，证明底座可运行
├── packages/
│   ├── build-config/      # 构建抽象层：统一入口契约 + vite/rsbuild adapter
│   └── shared/            # 构建无关共享层：env / utils / types / constants
├── pnpm-workspace.yaml    # workspace + catalog 版本单一真相源
├── turbo.json             # 任务编排
└── tsconfig.base.json     # 共享 TS 严格配置
```

## 快速开始

```bash
pnpm install

# 开发
pnpm dev

# 构建
pnpm build

# 类型检查 / 规范
pnpm typecheck
pnpm lint
```

## Roadmap

- [ ] Rsbuild adapter（SPA + MPA）
- [ ] Vite MPA 支持（统一 PageConfig 入口契约的 html 翻译层）
- [ ] services 依赖反转层（HTTP + 认证注入）
- [ ] 可选认证适配层
- [ ] 测试体系（Vitest）+ CI
- [ ] husky + commitlint + lint-staged
