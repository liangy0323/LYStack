# 错误处理规范

## 错误分层

| 层级             | 职责                                | 处理方式                          |
| ---------------- | ----------------------------------- | --------------------------------- |
| **Axios 拦截器** | 网络错误、401、500 等通用 HTTP 错误 | 统一 toast 提示，401 跳转登录     |
| **API 层**       | 业务错误码                          | 返回给调用方，由上层决定如何展示  |
| **Hook/Helper**  | 业务流程异常                        | try/catch + 状态标记（`isError`） |
| **组件**         | 用户反馈                            | 展示错误 UI（空状态、重试按钮）   |

**原则：错误在最近的有意义层级处理，不要吞掉也不要层层透传。**

---

## 异步函数容错

### 基本模式

```ts
const fetchData = async (): Promise<void> => {
  try {
    loading.value = true;
    const res = await fetchMessageList(params);
    messageList.value = res.data ?? [];
  } catch {
    showErrorMessage('加载失败，请重试');
  } finally {
    loading.value = false;
  }
};
```

### 关键规则

- `finally` 中**必须**重置 loading 状态，不论成功还是失败
- 空数据用 `??` 或 `?? []` 兜底，不信任后端一定返回预期结构
- `catch` 中不使用 `catch (e)` 如果不需要 error 对象

---

## 异步竞态防护

用户快速操作（连点、切换页面）导致旧请求覆盖新结果：

```ts
// ✅ AbortController 取消过期请求
let abortController: AbortController | null = null;

const fetchData = async (id: string): Promise<void> => {
  abortController?.abort();
  abortController = new AbortController();

  try {
    const res = await fetchDetail(id, { signal: abortController.signal });
    detail.value = res.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    showErrorMessage('加载失败');
  }
};
```

```ts
// ✅ 简单场景用版本号守卫
let requestVersion = 0;

const fetchData = async (id: string): Promise<void> => {
  const version = ++requestVersion;
  const res = await fetchDetail(id);
  if (version !== requestVersion) return;
  detail.value = res.data;
};
```

---

## 防重复提交

```ts
const isSubmitting = ref(false);

const handleSubmit = async (): Promise<void> => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    await submitForm(formData);
    showSuccessMessage('提交成功');
  } catch {
    showErrorMessage('提交失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};
```

---

## 空值防御

```ts
// ✅ 可选链 + 空值合并
const userName = user?.name ?? '未知用户';
const list = response?.data?.records ?? [];
const count = response?.data?.total ?? 0;

// ❌ 不做防御，后端异常时直接崩溃
const userName = user.name;
const list = response.data.records;
```

---

## SSE/流式连接错误处理

```ts
// 区分可恢复和不可恢复错误
const connectSse = () => {
  fetchEventSource(url, {
    onmessage: (event) => { ... },
    onerror: (error) => {
      if (isAuthError(error)) {
        // 不可恢复：停止重连，跳转登录
        throw error;
      }
      // 可恢复：让 fetchEventSource 自动重连
    },
  });
};
```

---

## 组件错误边界

关键页面使用 `onErrorCaptured` 防止白屏：

```ts
onErrorCaptured((error, instance, info) => {
  console.error('组件错误:', error, info);
  showErrorMessage('页面出现异常，请刷新重试');
  return false;
});
```
