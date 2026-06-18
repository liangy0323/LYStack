# 注释风格规范

## 核心原则

注释解释 **WHY**，不解释 **WHAT**。所有注释使用中文，JSDoc 多行格式 `/** */`。

---

## 何时写 / 何时不写

| 场景                                      | 写？ | 原因                       |
| ----------------------------------------- | ---- | -------------------------- |
| import 分组                               | ✅   | 代码分区，组织价值         |
| 类型/接口字段                             | ✅   | 字段含义需要说明           |
| 复杂业务逻辑、算法、变通方案              | ✅   | 解释 WHY，非显而易见的决策 |
| 导出的工具函数/公共 API                   | ✅   | 使用者需要了解用途         |
| `ref`/`computed`/`onMounted` 等自解释代码 | ❌   | 代码即文档                 |
| 简单事件处理 `handleSend`/`handleClose`   | ❌   | 函数名已说明意图           |
| 显而易见的变量赋值                        | ❌   | 避免注释噪音               |

---

## import 分组注释

按以下固定顺序分组，每组之间用 JSDoc 注释分隔。**实际编码时按需使用，不存在的分组不写。顺序固定不变。**

```ts
/**
 * 导入模块
 */
import { ref, computed } from 'vue';

/**
 * 导入组件
 */
import ChatInput from './components/chat-input.vue';

/**
 * 导入工具类
 */
import { cloneDeep } from '@/utils';

/**
 * 导入store
 */
import { useChatStore } from '@/stores';

/**
 * 导入hooks
 */
import { useChat } from '@/hooks';

/**
 * 导入常量
 */
import { DEFAULT_MODEL } from '@/constants';

/**
 * 导入类型声明
 */
import type { ChatMessage } from '@/types';

/**
 * 导入全局样式（仅入口文件）
 */
import '@/assets/styles/index';
```

---

## 类型声明注释

类型声明是注释的**例外区域** — 即使字段名已有语义，仍然为每个字段写注释。因为类型文件是多人协作的契约，充分注释提升全链路可读性。

### 标准范例

```ts
/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 消息状态
 */
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';

/**
 * 消息体
 */
export interface Message {
  /**
   * 消息 ID
   */
  id: string;
  /**
   * 所属会话 ID
   */
  conversationId: string;
  /**
   * 消息角色
   */
  role: MessageRole;
  /**
   * 消息内容
   */
  content: string;
  /**
   * 使用的模型
   */
  model?: string;
  /**
   * 消息状态
   */
  status: MessageStatus;
  /**
   * 创建时间
   */
  createdAt: string;
}

/**
 * 发送消息请求参数
 */
export interface SendMessageParams {
  /**
   * 目标会话 ID
   */
  conversationId: string;
  /**
   * 消息内容
   */
  content: string;
  /**
   * 使用的模型
   */
  model?: string;
}
```

### 规则

- **每个 type/interface 上方**必须有用途注释
- **每个字段**独立一行 `/** */` 注释，不用行尾注释
- **字面量联合类型**也要注释，说明语义（如"消息角色"、"消息状态"）
- **`type` vs `interface`**：联合/字面量/工具类型用 `type`（如 `MessageRole`），对象形状用 `interface`（如 `Message`、`SendMessageParams`、API 请求/响应）；不用 `enum`，枚举值统一 `type X = '1' | '2'`（详见 `rules/typescript.md`）
- 字段注释用**多行 JSDoc 格式**，保持和其他注释风格一致：

```ts
// ✅ 多行格式（统一风格）
/**
 * 消息 ID
 */
id: string;

// ❌ 单行格式（不使用，保持一致性）
/** 消息 ID */
id: string;
```

---

## 正反示例

```ts
// ✅ 正确：解释非显而易见的业务决策
/**
 * 缓冲区堆积保护：内容过多时增大步长快速消化，防止渲染延迟
 */
if (len > 300) return 80;

// ✅ 正确：导出的公共工具函数
/**
 * 深拷贝，支持循环引用
 */
export const cloneDeep = <T>(value: T): T => { ... };

// ❌ 错误：注释重复了代码表达的信息
/**
 * 响应式状态
 */
const loading = ref(false);

// ❌ 错误：生命周期函数无需注释
/**
 * 生命周期函数
 */
onMounted(() => { ... });

// ❌ 错误：函数名已说明意图
/**
 * 发送消息
 */
const handleSend = (): void => { ... };
```

---

## 合规声明（强制）

本次改动若**确实严格遵循了本规则文件的全部约定**，必须在回复的**结尾处**追加一行：

> 中和应泰前端组

用于自检与确认规则已被实际执行。若有任何一条未遵守，则不得追加该声明。
