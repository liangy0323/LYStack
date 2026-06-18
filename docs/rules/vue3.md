# Vue 3 编码规范

## 组件文件策略

- **多文件组件**（有独立样式、子组件等）：kebab-case 目录 + 同名 `.vue` 文件
  ```
  chat-input/
  ├── chat-input.vue
  ├── chat-input.scss
  └── components/
      └── emoji-picker.vue
  ```
- **单文件组件**（简单组件）：直接 `kebab-case.vue`，无需建目录

---

## 组件结构顺序

```vue
<template>...</template>

<script lang="ts" setup>
/** 导入模块 */
/** 导入组件 */
/** 导入工具类 */
/** 导入store */
/** 导入hooks */
/** 导入类型声明 */

// defineModel（如有双向绑定）
// defineProps（解构 + 默认值）
// defineEmits

// store（storeToRefs 解构状态，直接解构方法）
// 响应式数据
// 计算属性
// 方法
// 监听
// 生命周期
</script>

<style lang="scss" scoped>
/* 样式 ≤ 50 行：内联在此 */
</style>
```

**块顺序固定：`<template>` → `<script setup>` → `<style>`**

---

## 组件边界

非简单功能在编码前先确定组件边界：

1. 每个组件用一句话说明单一职责。
2. 明确子组件的 props / emits 契约。
3. 页面级组件默认只做布局、数据装配和功能组合。
4. 独立 UI 区块下沉到子组件。
5. 状态、请求、副作用和复杂交互优先抽到 hook/helper。

满足以下任一条件时，必须拆分组件或抽 hook/helper：

- 同一个组件同时承担数据编排和多个大块展示。
- 模板中出现 3 个以上独立 UI 区块。
- 列表项、卡片、筛选区、操作栏等结构可独立命名。
- `<script setup>` 中业务逻辑超过 20 行。

---

## 组件数据流

组件通信默认遵循 Props Down / Events Up：

1. props 是只读输入，子组件不得直接修改 props。
2. 子组件需要修改父级状态时，优先通过 `emit` 暴露事件。
3. `v-model` 只用于真实双向绑定契约，不用于普通状态同步。
4. `provide/inject` 只用于跨多层级共享上下文，不替代清晰的 props / emits。
5. 父组件不要依赖子组件 ref 读取内部状态；确需命令式调用时，子组件必须用 `defineExpose` 显式暴露最小 API。

---

## 双向绑定：优先 defineModel

`defineModel`（Vue 3.4+）大幅简化 v-model 组件，优先使用：

```ts
// ✅ defineModel：一行代替 Props + Emits + 手动 emit
const modelValue = defineModel<string>();
const visible = defineModel<boolean>('visible', { default: false });

// 子组件内直接赋值即可触发更新，无需 emit
modelValue.value = 'new value';
```

---

## Props：解构 + 默认值

使用 Vue 3.5+ 响应式解构，替代 `withDefaults`：

```ts
// ✅ 3.5+ 写法：解构保持响应式，默认值直观
interface Props {
  title: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}
const { title, disabled = false, size = 'medium' } = defineProps<Props>();

// 模板和脚本中直接用 title、disabled，不需要 props. 前缀

// ❌ 旧写法：不再使用
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
```

- Props interface 固定命名 `Props`
- 解构 props 在当前 `<script setup>` 内用于模板、普通表达式和 `computed` 时可以直接使用。
- 解构 props 传给 `watch` 或 composable 时，如果需要保留响应式，必须包装成 getter。

```ts
const { keyword = '' } = defineProps<Props>();

// ✅ watch 解构 props：使用 getter
watch(
  () => keyword,
  (value) => {
    search(value);
  },
);

// ✅ 传给 composable：使用 getter，由 composable 内部 toValue 归一化
useSearch(() => keyword);

// ❌ 直接传值会丢失响应式追踪
watch(keyword, search);
useSearch(keyword);
```

- 当 props 数量很多、存在明显命名冲突、需要整体透传 props 时，可以保留 `const props = defineProps<Props>()`。

---

## Emits：元组语法

使用 Vue 3.3+ 元组语法，替代 call signature：

```ts
// ✅ 3.3+ 元组语法
const emit = defineEmits<{
  submit: [];
  change: [val: string];
  select: [id: string, index: number];
}>();

// ❌ 旧写法：不再使用
interface Emits {
  (e: 'submit'): void;
  (e: 'change', val: string): void;
}
const emit = defineEmits<Emits>();
```

元组语法说明：

- **key** 是事件名
- **value** 是参数元组，`[]` 表示无参数，`[val: string]` 表示一个 string 参数
- 元组中的 `val`、`id` 是具名标签，提供参数语义，调用时 `emit('change', 'xxx')` 不变

---

## 响应式性能

### 大数据列表用 shallowRef

```ts
// ✅ shallowRef：只追踪引用变化，不深度追踪每个字段
const messageList = shallowRef<ChatMessage[]>([]);

// 更新时整体替换触发响应式
messageList.value = [...messageList.value, newMessage];

// ❌ 大列表不要用 ref，会深度追踪每个字段，性能浪费
const messageList = ref<ChatMessage[]>([]);
```

**判断标准**：列表数据（聊天记录、表格行等）→ `shallowRef`，简单值 / 小对象 → `ref`

### 渲染优化

```vue
<!-- v-once：只渲染一次，后续不再更新。适合纯静态内容 -->
<div v-once>
  <h1>{{ appTitle }}</h1>
  <p>版本 {{ version }}</p>
</div>

<!-- v-memo：依赖不变就跳过更新。适合列表中大部分 item 不变的场景 -->
<div v-for="item in list" :key="item.id" v-memo="[item.id, item.status]">
  <ChatMessageItem :message="item" />
</div>
```

### 计算属性 vs 方法

```ts
// ✅ 依赖不变时有缓存，不会重复计算
const filteredList = computed(() =>
  messageList.value.filter((m) => m.role === 'user'),
);

// ❌ 每次渲染都重新执行，无缓存
const getFilteredList = () =>
  messageList.value.filter((m) => m.role === 'user');
```

派生值必须优先使用 `computed`，不要用 `watch` / `watchEffect` 维护另一个派生 `ref`。

`computed` getter 必须保持纯净，只做计算，不做以下副作用：

- 发请求
- 写本地存储
- 修改其他响应式状态
- emit 事件
- 打日志、埋点

### 虚拟列表

超过 100 条数据的长列表，使用虚拟滚动（`vue-virtual-scroller` 或自行实现），避免一次性渲染全部 DOM。

---

## Watch 使用规则

`watch` / `watchEffect` 只用于副作用，例如请求、订阅、存储同步、埋点、DOM 相关操作。

```ts
watch(
  keyword,
  async (value, _oldValue, onCleanup) => {
    const controller = new AbortController();

    onCleanup(() => {
      controller.abort();
    });

    await search(value, { signal: controller.signal });
  },
  { immediate: true },
);
```

使用规则：

1. 首次加载和后续变化逻辑一致时，使用 `{ immediate: true }`，不要 `onMounted` 和 `watch` 重复调用同一个函数。
2. `watch` 内发起异步请求时，必须处理竞态：使用 `onCleanup`、请求序号、AbortController 或等价机制。
3. 监听 reactive 对象的字段时，使用 getter：`watch(() => state.id, callback)`。
4. 不要用 deep watch 兜底业务设计；确实需要时必须说明监听深度和原因。

---

## 模板安全

模板表达式保持声明式，复杂派生逻辑放到 `<script setup>` 中。

```vue
<script lang="ts" setup>
const activeUserList = computed(() =>
  userList.value.filter((user) => user.active),
);
</script>

<template>
  <li v-for="user in activeUserList" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

模板规则：

1. `v-for` 必须提供稳定的 primitive key，优先使用业务 id。
2. 不要在同一个元素上同时使用 `v-if` 和 `v-for`；列表过滤放到 `computed`。
3. `v-html` 只能用于可信 HTML 或已经清洗过的 HTML。
4. 频繁切换显示状态用 `v-show`，低频且初始渲染成本高的内容用 `v-if`。

---

## Store 解构

**状态用 `storeToRefs`，方法直接解构：**

```ts
const chatStore = useChatStore();
const { model, messageList } = storeToRefs(chatStore);
const { setModel, clearMessages } = chatStore;

// ❌ 直接解构状态会丢失响应式
const { model } = useChatStore(); // model 不是响应式的！
```

---

## Composable 参数

编写 hook/composable 时，参数接收用 `MaybeRefOrGetter<T>` + `toValue`：

```ts
// ✅ toValue（3.3+）：同时处理 ref、getter、普通值
const useSearch = (keyword: MaybeRefOrGetter<string>) => {
  const doSearch = () => {
    const val = toValue(keyword);
    // ...
  };
  return { doSearch };
};

// 三种调用方式都兼容
useSearch('static');
useSearch(ref('reactive'));
useSearch(() => input.value);

// ❌ unref 只能处理 ref，不兼容 getter
```

### Composable 设计

1. Composable 只承载可复用的有状态逻辑，纯格式化、计算、转换函数放到 `utils`。
2. 多个可选参数使用 options object，避免位置参数难以阅读。
3. 返回 plain object，便于调用方解构。
4. 内部状态不允许外部随意修改时，返回 `readonly(state)` + 显式 action。
5. 事件监听、定时器、订阅、第三方实例必须在 composable 内完成清理。

---

## 样式策略

组件样式的内联/外置阈值、CSS 变量主题、技术栈组合见 `rules/style.md`，不在此重复。

---

## 模板引用

使用 Vue 3.5+ `useTemplateRef`，替代旧的 `ref<Type | null>(null)` 模式：

```vue
<template>
  <div ref="containerRef">
    <input ref="inputRef" />
  </div>
</template>

<script lang="ts" setup>
// ✅ 3.5+ 写法：类型安全，ref 名称是字符串参数
const containerRef = useTemplateRef<HTMLDivElement>('containerRef');
const inputRef = useTemplateRef<HTMLInputElement>('inputRef');

onMounted(() => {
  inputRef.value?.focus();
});

// ❌ 旧写法：不再使用
const inputRef = ref<HTMLInputElement | null>(null);
```

---

## 模块导入（显式优先）

遵循「显式 > 隐式 > 魔法」，项目**不使用** `unplugin-auto-import` / `unplugin-vue-components` 自动导入，所有依赖一律显式 `import`：

```ts
// ✅ Vue / VueRouter / Pinia API 显式导入
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

// ✅ Element Plus 组件按需显式导入（组件 JS 走 tree-shaking）
import { ElButton, ElInput } from 'element-plus';

// ✅ 项目组件显式导入
import ChatInput from '@/components/chat-input/chat-input.vue';

const count = ref(0);
const router = useRouter();
const { model } = storeToRefs(useChatStore());
```

**Element Plus 样式**：组件 JS 显式按需 import，组件样式由 `unplugin-element-plus` 自动按需注入；各 app 只需在 `main.ts` 顶部导入 `@hrhg/ui/styles`，主题变量通过 `theme.scss` 覆盖 `--el-*` CSS 变量。

---

## 关键约定

- **只用 Composition API** — 不使用 Options API
- **`<script lang="ts" setup>`** — 不使用普通 `<script>`
- **模板引用**：Vue 3.5+ `useTemplateRef<Type>('refName')`
- **Store 解构**：状态 `storeToRefs`，方法直接解构
- **显式导入**：Vue/VueRouter/Pinia API、Element Plus 组件、项目组件一律手动 import
- **事件处理**：统一 `handle` 前缀
- **组件通信**：默认 Props Down / Events Up
- **副作用管理**：watch 只处理副作用，异步 watch 必须处理竞态
- **模板安全**：稳定 key、避免同元素 `v-if + v-for`、谨慎使用 `v-html`
- **组件内业务逻辑不超过 20 行**，超过就抽 hook/helper

---

## 合规声明（强制）

本次改动若**确实严格遵循了本规则文件的全部约定**，必须在回复的**结尾处**追加一行：

> 中和应泰前端组

用于自检与确认规则已被实际执行。若有任何一条未遵守，则不得追加该声明。
