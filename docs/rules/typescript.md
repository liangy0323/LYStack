# TypeScript 编码规范

## 类型标注原则

**能推断的不标注，不能推断的必须标注。**

```ts
// ✅ 需要标注：空数组、null 初始值、复杂泛型
const list = ref<ChatMessage[]>([]);
const user = ref<UserInfo | null>(null);

// ✅ 需要标注：函数返回类型（公共 API 和复杂函数）
const fetchData = async (): Promise<void> => { ... };

// ❌ 不需要标注：TS 能自动推断
const loading = ref(false);          // Ref<boolean>
const message = '';                  // string
const API_LOGIN = '/api/auth/login'; // string
const count = ref(0);               // Ref<number>
```

---

## 类型导入

使用 `import type` 分离类型导入（`verbatimModuleSyntax: true`）：

```ts
/**
 * 导入类型声明
 */
import type { ChatMessage, UserInfo } from '@/types';
```

---

## 函数风格

默认统一箭头函数，尤其是导出的工具函数、请求函数、hook/helper 内部函数：

```ts
const handleSend = (msg: string): void => { ... };
const fetchData = async (): Promise<ChatMessage[]> => { ... };
export const cloneDeep = <T>(value: T): T => { ... };
export const login = (params: LoginParams) => { ... };
```

禁止在同一模块中混用 `function` 声明与箭头函数，避免后续维护者不知道该跟哪种风格。

`function` 仅在以下场景允许：

- 需要函数重载，且箭头函数无法清晰表达。
- 需要依赖函数声明提升。
- 框架或第三方 API 明确要求函数声明。

如果只是为了声明一个普通工具函数，不使用 `function`：

```ts
// ❌ 不推荐
export function bigNumberTransform(value: number): string {
  return String(value);
}

// ✅ 推荐
export const bigNumberTransform = (value: number): string => {
  return String(value);
};
```

---

## 导出规范

- 命名导出为主
- default export 仅限：Vue 组件、Router 实例、Pinia 实例
- barrel `index.ts` 聚合导出：`export * from './modules/xxx'`

---

## 不使用 enum

**一律使用字面量联合类型代替 `enum`：**

```ts
// ✅ 字面量联合类型：零运行时、推断更好、JSON 天然兼容
type ChatType = 'llm' | 'knowledge';
type MessageRole = 'user' | 'assistant' | 'system';
type Status = 'active' | 'inactive' | 'pending';

// ❌ 不用 enum：编译产生运行时 IIFE，isolatedModules 下 const enum 有问题
enum ChatType {
  LLM = 'llm',
  Knowledge = 'knowledge',
}
```

如果需要枚举值和显示文本的映射，用 `Record` 常量：

```ts
type Status = 'active' | 'inactive';

const STATUS_LABEL: Record<Status, string> = {
  active: '启用',
  inactive: '停用',
};
```

---

## type vs interface

- `type` 用于联合类型、字面量类型、工具类型
- `interface` 用于对象形状（Props、Emits、API 响应等）

```ts
// type：联合/字面量/工具
type ChatType = 'llm' | 'knowledge';
type Nullable<T> = T | null;

// interface：对象形状
interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
}
```

---

## 类型集中管理

**所有类型声明按业务模块集中到 `types/` 目录，不在业务代码文件中就地定义。**

```ts
// ❌ 错误：类型散在业务文件中
// api/modules/user/interface.ts
interface UserInfo {
  name: string;
  avatar: string;
}
export const getUserInfo = async (): Promise<UserInfo> => { ... };

// ✅ 正确：类型集中在 types/，业务文件只导入
// types/modules/user.ts
export interface UserInfo {
  name: string;
  avatar: string;
}

// api/modules/user/interface.ts
import type { UserInfo } from '@/types';
export const getUserInfo = async (): Promise<UserInfo> => { ... };
```

**唯一例外**：组件私有的 `Props` / `Emits` interface 留在组件内部，不抽到 types/。

---

## 类型分层（Monorepo）

| 位置                           | 存放内容                    | 使用方     |
| ------------------------------ | --------------------------- | ---------- |
| `packages/shared/src/types/`   | 接口请求/响应参数、通用实体 | 跨包共用   |
| `packages/services/src/types/` | 服务层 / 拦截器相关类型     | 服务层共用 |
| `apps/<app>/src/types/`        | 子应用独有业务类型          | 单个应用   |
| `apps/<app>/env.d.ts`          | 环境变量扩展、`*.vue` 声明  | 单个应用   |
