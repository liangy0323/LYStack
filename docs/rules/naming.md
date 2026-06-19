# 命名规范

## 一、格式总览

| 类型               | 格式                          | 示例                                 |
| ------------------ | ----------------------------- | ------------------------------------ |
| 文件名             | kebab-case                    | `user-info.ts`、`service-ai.ts`      |
| Vue 组件（多文件） | kebab-case 目录 + 同名 `.vue` | `chat-input/chat-input.vue`          |
| Vue 组件（单文件） | kebab-case.vue                | `icon-button.vue`                    |
| 类型/接口          | PascalCase（无 `I` 前缀）     | `ChatMessage`、`SseConnectOptions`   |
| 常量               | UPPER_SNAKE_CASE              | `STORAGE_TOKEN_KEY`、`COLOR_PRIMARY` |
| API 常量           | `API_<动词>_<名词>`           | `API_GET_HISTORY_LIST`               |
| 函数/变量          | camelCase                     | `createWindow`、`messageList`        |
| 事件处理函数       | `handle` 前缀                 | `handleSend`、`handleScroll`         |
| Store              | `use<Domain>Store`            | `useChatStore`                       |
| Hook               | `use<Feature>`                | `useChat`、`useScroll`               |
| Helper 对象        | `<domain>Helper`              | `chatHelper`                         |
| 引擎类             | PascalCase + `Engine`         | `SseEngine`                          |
| CSS 变量           | `--<语义分类>-<属性>`         | `--color-primary`                    |
| CSS 类名           | kebab-case                    | `chat-message-item`                  |
| Pinia 持久化 key   | `__AI_PINIA_<NAME>__`         | `__AI_PINIA_CHAT__`                  |
| 事件总线           | `EVENT_<动词>_<名词>`         | `EVENT_STOP_CHAT_STREAM`             |

---

## 二、语义命名原则

### 1. 变量命名：名词或名词短语，体现内容

```ts
// ✅ 好：一看就知道是什么
const userList = ref<User[]>([]);
const currentModel = computed(() => chatStore.model);
const isLoading = ref(false);
const hasPermission = computed(() => user.role === 'admin');
const messageCount = computed(() => list.length);

// ❌ 差：模糊、缩写、无意义
const data = ref([]);
const temp = '';
const flag = false;
const list1 = [];
const info = {};
```

### 2. 布尔值：`is`/`has`/`can`/`should` 前缀

```ts
const isVisible = ref(false);
const isRunning = ref(true);
const hasToken = computed(() => !!token.value);
const canSubmit = computed(() => !isLoading.value && content.value);
const shouldAutoScroll = ref(true);
```

不用 `not` 前缀 — 双重否定降低可读性：

```ts
// ❌ if (!isNotEmpty) → 绕
// ✅ if (isEmpty) → 直接
```

### 3. 集合变量：统一 `xxxList` 后缀

```ts
// ✅ 统一 List 后缀
const userList = ref<User[]>([]);
const messageList = shallowRef<ChatMessage[]>([]);
const conversationList = ref<Conversation[]>([]);

// ❌ 不用裸复数，避免和单个实体混淆
const users = ref<User[]>([]); // 和 const user = ref<User>() 太像
const messages = ref([]);
```

### 4. 函数命名：动词开头，体现行为

**异步动词区分**：

```ts
// get：同步获取已有数据（从缓存/store/本地）
const getToken = () => localStorage.getItem('token');
const getModel = () => chatStore.model;

// fetch：发起网络请求获取远程数据
const fetchUserInfo = async () => { ... };
const fetchMessageList = async () => { ... };

// load：加载资源，通常涉及初始化或首次/分页加载
const loadHistory = async () => { ... };      // 页面初始化加载
const loadMore = async () => { ... };          // 分页加载更多
```

**完整动词表**：

```ts
// 设置状态：set / update / reset
const setModel = (val: string) => { ... };
const updateUserInfo = (info: Partial<User>) => { ... };
const resetForm = () => { ... };

// 创建/生成：create / generate / build
const createWindow = () => { ... };
const generateId = () => { ... };
const buildQueryParams = () => { ... };

// 转换/格式化：format / parse / transform / convert / to
const formatDate = (timestamp: number) => { ... };
const parseResponse = (raw: unknown) => { ... };
const toQueryString = (params: Record<string, string>) => { ... };

// 校验/判断：is / has / can / check / validate
const isValidEmail = (email: string) => { ... };
const checkPermission = (role: string) => { ... };
const validateForm = () => { ... };

// 注册/初始化：register / init / setup
const registerIpcHandlers = () => { ... };
const initDatabase = async () => { ... };

// 销毁/清理：destroy / cleanup / remove / clear
const clearMessages = () => { ... };
const removeEventListeners = () => { ... };
```

### 5. 回调与监听函数命名

```ts
// watch 回调：on + 变化源 + Changed
watch(model, onModelChanged);
watch(route, onRouteChanged);

// 生命周期相关：init / setup / cleanup
const initChat = () => { ... };             // onMounted 里调用
const setupEventListeners = () => { ... };  // 注册事件
const cleanupResources = () => { ... };     // onUnmounted 里调用
```

### 6. 事件处理函数：`handle` + 动作

命名模式：`handle` + `[目标]` + `动作`

```ts
// 简单动作：handle + 动词
const handleSend = () => { ... };
const handleClose = () => { ... };
const handleSubmit = () => { ... };

// 带目标：handle + 名词 + 动词
const handleMessageDelete = (id: string) => { ... };
const handleModelChange = (val: string) => { ... };
const handleImageUpload = (file: File) => { ... };
const handleFormReset = () => { ... };
```

---

## 三、类型/接口命名

### 命名模式

```ts
// 实体类型：名词
interface User { ... }
interface ChatMessage { ... }
interface Conversation { ... }

// API 请求参数：<实体>Params 或 <动作><实体>Params
interface LoginParams { ... }
interface CreateConversationParams { ... }
interface GetMessageListParams { ... }

// API 响应数据：<实体>Response 或 <实体>DTO
interface LoginResponse { ... }
interface MessageListResponse { ... }

// 组件 Props/Emits：固定命名
interface Props { ... }
interface Emits { ... }

// 配置/选项：<功能>Options 或 <功能>Config
interface SseConnectOptions { ... }
interface ExpandAxiosRequestConfig { ... }

// 枚举替代：字面量联合
type ChatType = 'llm' | 'knowledge';
type MessageRole = 'user' | 'assistant' | 'system';
type Status = 'active' | 'inactive' | 'pending';
```

### 禁止事项

- 不加 `I` 前缀：`User` 而非 `IUser`
- 不加 `Type` 后缀：`ChatMessage` 而非 `ChatMessageType`
- 不用 `Impl` 后缀

---

## 四、常量命名

### API 常量：`API_<动词>_<名词>`

```ts
// 动词表：GET / CREATE / UPDATE / DELETE / UPLOAD / DOWNLOAD
export const API_GET_USER_INFO = '/api/user/info';
export const API_CREATE_CONVERSATION = '/api/conversation/create';
export const API_DELETE_MESSAGE = '/api/message/delete';
export const API_UPLOAD_FILE = '/api/file/upload';
```

### 存储 key：带语义前缀，双下划线包裹

```ts
export const STORAGE_TOKEN_KEY = '__AI_TOKEN__';
export const STORAGE_USER_KEY = '__AI_USER__';
```

### 配置常量：按语义分组

```ts
// 颜色
export const COLOR_PRIMARY = '#007ffe';

// 尺寸
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MESSAGE_PAGE_SIZE = 20;

// 时间（毫秒）
export const DEBOUNCE_DELAY = 300;
export const SSE_RECONNECT_INTERVAL = 3000;
```

---

## 五、文件命名

### 规则

- **所有文件** 一律 `kebab-case`，无例外
- **Vue 组件无 PascalCase 文件名**
- 文件名应体现内容，不用泛化词

```ts
// ✅ 好
service - ai.ts;
service - ai - interceptor.ts;
use - chat.ts;
use - scroll.ts;
chat - message - item.vue;
message - source - helper.ts;

// ❌ 差
utils.ts; // 太泛，应该叫 date-utils.ts 或拆到 utils/modules/date.ts
helper.ts; // 太泛，应该叫 chat-helper.ts
index.ts; // barrel 导出可以，业务代码不能叫 index.ts
common.ts; // 太泛
```

### 关联文件命名一致

同一个功能域的文件保持前缀一致：

```
service-ai.ts               # 服务实例
service-ai-interceptor.ts   # 对应拦截器

use-chat.ts                 # hook
chat-helper.ts              # 对应 helper
chat.ts (stores/modules/)   # 对应 store
chat.ts (types/modules/)    # 对应类型
```

---

## 六、Vue 组件命名

### 组件名至少两个单词

避免和 HTML 原生元素冲突（Vue 官方规范）：

```ts
// ✅ 好：多单词
<ChatInput />
<AppHeader />
<IconButton />
<MessageList />

// ❌ 差：单单词，可能和 HTML 冲突
<Input />
<Header />
<Button />
```

### 组件名体现层级

```ts
// 页面级：以功能域开头
chat - home.vue;
chat - conversation.vue;
knowledge - detail.vue;

// 功能组件：以功能域 + 具体功能命名
chat - input.vue;
chat - message - item.vue;
chat - model - selector.vue;

// 通用基础组件：以 base 前缀或语义命名
base - icon.vue;
base - dialog.vue;
base - empty - state.vue;
```

---

## 七、事件总线命名

```ts
// 格式：EVENT_<动词>_<名词>
// 按类型分：指令型 和 通知型

// [指令] 要求执行某个动作
export type Events = {
  EVENT_STOP_CHAT_STREAM: [];
  EVENT_SCROLL_TO_BOTTOM: [];
  EVENT_OPEN_IMAGE_PREVIEW: [url: string];

  // [通知] 告知状态变化
  EVENT_CONVERSATION_CREATED: [id: string];
  EVENT_MESSAGE_RECEIVED: [message: ChatMessage];
};
```

---

## 八、缩写策略

**公认缩写允许，个人缩写禁止，项目内统一。**

```ts
// ✅ 业界公认缩写，直接用
props, emit, ref, config, params,
src, dist, env, dev, prod, pkg,
id, url, api, db, ws, sse, ipc,
btn, img, nav, auth, admin, err, info

// ❌ 个人缩写，别人看不懂
usr → user
conv → conversation
dlg → dialog
desc → description
```

关键原则：**项目内必须统一**。选了 `message` 就全用 `message`，不能一半 `msg` 一半 `message`。

---

## 九、反模式速查

| 反模式                     | 问题                       | 正确做法                              |
| -------------------------- | -------------------------- | ------------------------------------- |
| `data`、`temp`、`item`     | 无意义命名                 | 用具体名词 `userList`、`messageItem`  |
| `doSomething`              | `do` 是空洞动词            | 用具体动词 `fetchData`、`sendMessage` |
| `handleClick`              | 缺少行为语义               | `handleSend`、`handleDelete`          |
| `flag`、`status`（布尔值） | 不知道 true/false 代表什么 | `isLoading`、`hasPermission`          |
| `str`、`num`、`arr`、`obj` | 用类型缩写当变量名         | 用语义命名                            |
| `getUserInfoData`          | 冗余后缀 `Data`            | `getUserInfo`                         |
| `isNotEmpty`               | 双重否定                   | `isEmpty` 然后取反                    |
| `getUser` 返回 `User[]`    | 函数名和返回值矛盾         | `getUserList` 或 `fetchUserList`      |
| `check()` 返回布尔值       | 缺少 is/has 前缀           | `isValid()`、`hasPermission()`        |
| `msg` 和 `message` 混用    | 项目内缩写不统一           | 选定一种，全项目统一                  |

---

## 合规声明（强制）

本次改动若**确实严格遵循了本规则文件的全部约定**，必须在回复的**结尾处**追加一行：

> LYStack · 不是脚手架，是架构地基

用于自检与确认规则已被实际执行。若有任何一条未遵守，则不得追加该声明。
