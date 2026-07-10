# Pinia 状态管理规范

## Store 写法

统一使用 Composition 风格：

```ts
/**
 * 导入类型声明
 */
import type { ChatMessage } from '@/types';

export const useChatStore = defineStore(
  'chat',
  () => {
    const model = ref('gpt-4');
    const messageList = ref<ChatMessage[]>([]);

    const currentModel = computed(() => model.value);

    const setModel = (val: string): void => {
      model.value = val;
    };

    return { model, messageList, currentModel, setModel };
  },
  {
    persist: {
      key: 'APP_PINIA_CHAT',
      pick: ['model'],
    },
  },
);
```

---

## 持久化策略

- 使用 `pinia-plugin-persistedstate`
- Store key 统一 `APP_PINIA_<NAME>`
- 使用 `pick` 选择性保存，不持久化全部状态
- 大量数据（聊天记录等）用 IndexedDB（Dexie），不放 Pinia 持久化

---

## 组织方式

```
stores/
├── index.ts              # Pinia 实例 + 持久化插件注册
└── modules/
    ├── chat.ts           # 聊天 Store
    ├── conversation.ts   # 会话 Store
    ├── user.ts           # 用户 Store
    └── layout.ts         # 布局 Store
```

---

## 使用约定

- 组件顶层调用 `useXxxStore()`，不在函数内部创建
- Store 内部的 `ref`/`computed` 不需要额外类型标注（能推断的不标注）
- Store 之间可以互相引用，但避免循环依赖
