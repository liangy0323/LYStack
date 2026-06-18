# 样式规范

## 设计令牌体系（两层架构）

令牌集中定义在 `packages/ui/src/styles/modules/`，采用 **Palette + Semantic 两层架构**，支持 `data-theme` 主题切换。`@hrhg/ui` 通过 `./styles` 导出统一入口，各 app 在构建配置中引入。

### 双主题与 CEF 注入机制

本项目运行在 CEF（Chromium Embedded Framework）客户端内。客户端会把**当前主题名注入到 `window.THEME_NAME`，取值为 `'black' | 'white'`**，bridge 层据此同步到 `html[data-theme]`。因此：

- 主题名固定为 `black` / `white`（**不是 light/dark**），必须与客户端注入值一致。
- `black` 为暗色主题（`color-scheme: dark`，主色蓝 `#1276e9`）；`white` 为亮色主题（`color-scheme: light`，主色红 `#f92317`）。
- `window.THEME_NAME` 的类型声明在 `@hrhg/build-config/env`（`type ClientThemeName = 'black' | 'white'`），全局可用。
- dev 环境可用 `@hrhg/ui` 的 `ThemeToggle` 组件模拟客户端切换（直接改写 `window.THEME_NAME`）。

### 第一层 Palette（原始调色板）

挂在 `:root`（`tokens.scss`），与主题无关的基础色阶，**仅供语义层引用，禁止在组件中直接使用**：

```scss
:root {
  --palette-blue-500: #1276e9;
  --palette-red-500: #f92317;
  --palette-gray-900: #21242b;
  --palette-white: #ffffff;
  /* ... */
}
```

### 第二层 Semantic（语义令牌）

挂在 `html[data-theme='black'|'white']`（`theme.scss`），**组件中唯一可引用的层**。切换主题只需覆盖本层，业务组件零改动：

```scss
html[data-theme='black'] {
  color-scheme: dark;
  --color-primary: var(--palette-blue-500);
  --color-text-base: var(--palette-gray-400);
  --body-bg-color: var(--palette-black);
  /* ... */
}

html[data-theme='white'] {
  color-scheme: light;
  --color-primary: var(--palette-red-500);
  --color-text-base: var(--palette-gray-800);
  --body-bg-color: var(--palette-white);
  /* ... */
}
```

### 非颜色令牌（与主题无关，挂 `:root`）

| 类别     | 令牌                               | 单位 | 说明                                         |
| -------- | ---------------------------------- | ---- | -------------------------------------------- |
| 字号     | `--font-size-xs/sm/base/lg/xl/2xl` | rem  | 基准 1rem=14px，跟随 `--font-scale` 动态缩放 |
| 间距     | `--spacing-xs/sm/md/lg/xl/2xl`     | px   | 4/8/12/16/20/24px，不随字体缩放              |
| 圆角     | `--radius-sm/md`                   | px   | 4/8px                                        |
| 涨跌     | `--color-rise/fall`                | -    | 涨 `#fe0000` / 跌 `#02ab5d`                  |
| 字体缩放 | `--font-scale`                     | 数值 | 全局字体缩放系数（运行时修改）               |

### 令牌使用规则

- 组件中**只引用语义令牌**（`var(--color-*)`）与非颜色令牌（`var(--font-size-*)` 等），**禁止写裸色值**，禁止直接用 `--palette-*`。
- 新增颜色：先在 Palette 加色阶，再在语义层映射，**不得跳过 Palette 直接在语义层写色值**。

### 多主题实现规则（强制）

主题差异**只能**通过「Palette → 语义层 → 组件引用语义变量」三步落地，组件样式对主题完全无感知。

**严禁**在组件（含 `<style scoped>`）中出现任何主题判断选择器，例如：

```scss
// ❌ 绝对禁止：在组件里硬编码主题选择器 + 裸色值
:global(html[data-theme='black']) .theme-toggle {
  background: rgba(255, 255, 255, 0.16);
}

html[data-theme='white'] .xxx {
  color: #000;
}
```

正确做法——主题色值全部在令牌层切换，组件只引用一个语义变量：

```scss
// 1) Palette（tokens.scss）：加原始色阶
:root {
  --palette-overlay-dark: rgba(0, 0, 0, 0.5);
  --palette-overlay-light: rgba(255, 255, 255, 0.16);
}

// 2) 语义层（theme.scss）：按主题映射
html[data-theme='black'] {
  --overlay-bg-color: var(--palette-overlay-light);
}
html[data-theme='white'] {
  --overlay-bg-color: var(--palette-overlay-dark);
}
```

```scss
// 3) 组件：只引用语义变量，零主题判断
.theme-toggle {
  background: var(--overlay-bg-color);
}
```

强制条款：

1. **组件样式禁止出现 `html[data-theme='xxx']`、`:global(...)` 等主题选择器**，主题判断只允许存在于 `theme.scss`。
2. 需要随主题变化的颜色，**必须新增/复用语义令牌**，组件引用 `var(--xxx)`，禁止在组件里写两套色值。
3. 新增语义令牌时，`black` 与 `white` 两个主题块**必须同时定义**，避免某主题下变量缺失。
4. 语义令牌命名带语义前缀（如 `--overlay-bg-color`、`--panel-bg-color`），不得以具体色值或主题名命名。

---

## 样式入口聚合

`packages/ui/src/styles/index.scss` 作为统一入口，通过 `@use` 聚合各模块：

```scss
@use './modules/tokens.scss'; // Palette + 非颜色令牌
@use './modules/theme.scss'; // Semantic 语义层（black/white）
@use './modules/base.scss'; // CSS reset + 全局 body 样式
@use './modules/message.scss'; // ElMessage 主题覆盖
```

Element Plus 组件样式由 `@hrhg/build-config` 内置的 `unplugin-element-plus` 在构建期按需注入。各 app 只需要在 `main.ts` 顶部导入 `@hrhg/ui/styles`，项目级主题变量在 `packages/ui/src/styles/modules/theme.scss` 中覆盖 `--el-*` CSS 变量；禁止再全量引入 `element-plus/theme-chalk/src/index.scss`。

---

## 技术栈组合

**SCSS + BEM + CSS 变量**：

- **SCSS**：所有组件样式、嵌套、mixin 复用
- **BEM**：类名命名规范，保证语义化与可维护性
- **CSS 变量**：设计令牌（主题色、字号、间距、圆角），支持运行时主题切换

> **强制约定**：所有样式统一用 SCSS + BEM 编写，**禁止使用任何原子类**（含自定义全局工具类）。高频样式组合通过 SCSS `@mixin` 复用，模板中只保留语义化 BEM 类。

---

## Vue 组件样式策略

| 条件         | 方式                                                   |
| ------------ | ------------------------------------------------------ |
| 样式 ≤ 50 行 | 内联 `<style lang="scss" scoped>`                      |
| 样式 > 50 行 | 外部文件 `<style lang="scss" src="./xxx.scss" scoped>` |
| 多组件共享   | 拆出外部文件                                           |

---

## 命名

- CSS 变量：`--color-primary`、`--border-color`（kebab-case 带语义前缀）
- CSS 类名：严格遵循 **BEM** 命名规范（见下方详细说明）
- Element Plus 覆盖样式集中在 `modules/element.css`

---

## SCSS BEM 规范

所有 SCSS 文件**必须严格遵循 BEM（Block Element Modifier）结构**，利用 SCSS 的 `&` 嵌套语法实现。

### 命名规则

| 层级                   | 格式                                            | 分隔符             | 示例                                        |
| ---------------------- | ----------------------------------------------- | ------------------ | ------------------------------------------- |
| **Block（块）**        | `prefix-block`                                  | `-` 连接前缀与块名 | `.bee-header`、`.page-chat`                 |
| **Element（元素）**    | `block__element`                                | `__` 双下划线      | `.bee-header__nav`、`.bee-header__logo-img` |
| **Modifier（修饰符）** | `block--modifier` 或 `block__element--modifier` | `--` 双连字符      | `.bee-back-to-top--visible`                 |

### 核心原则

1. **Block 作为唯一顶层类名**，一个 Block 对应一个 SCSS 根选择器
2. **Element 只能属于 Block**，不能嵌套 Element（`block__el1__el2` ❌）
3. **Element 多词用 `-` 连接**（`__nav-link`、`__item-title`、`__card-author`）
4. **Modifier 表示状态/变体**（`--visible`、`--active`、`--disabled`）
5. **交互伪类（`:hover`、`:focus`）直接嵌套在对应 Element 内部**，不额外创建 Modifier

### SCSS 写法示例

```scss
@use './vars' as v;

/* 顶部 Header */
.bee-header {
  position: fixed;
  display: flex;
  align-items: center;
  height: 64px;
  background: v.$color-bg-header;

  // Element — 用 & 拼接双下划线
  &__logo {
    display: flex;
    align-items: center;
  }

  &__logo-img {
    height: 30px;
  }

  &__nav {
    flex: 1;
    display: flex;
    align-items: center;
  }

  &__nav-link {
    display: block;
    padding: 0 20px;
    cursor: pointer;

    // 交互伪类直接嵌套
    &:hover {
      color: v.$color-primary;
    }
  }

  &__download {
    position: relative;
    display: flex;

    // 跨 Element 交互：hover 父级控制子级显隐
    &:hover .bee-header__download-menu {
      display: block;
    }
  }

  &__download-menu {
    display: none;
    position: absolute;
  }
}

/* 回到顶部 */
.bee-back-to-top {
  position: fixed;
  opacity: 0;
  visibility: hidden;

  // Modifier — 用 & 拼接双连字符
  &--visible {
    opacity: 1;
    visibility: visible;

    &:hover {
      opacity: 0.8;
    }
  }
}
```

### 禁止写法

```scss
// ❌ Element 嵌套 Element（产生 block__el1__el2）
.bee-header {
  &__nav {
    &__link { ... }   // → .bee-header__nav__link ❌
  }
}

// ✅ 正确：扁平化，多词用 - 连接
.bee-header {
  &__nav { ... }
  &__nav-link { ... } // → .bee-header__nav-link ✅
}

// ❌ 不使用 BEM，直接后代选择器
.bee-header .nav .link { ... }

// ❌ Block 内部定义无前缀的裸类名
.bee-header {
  .logo { ... }       // ❌ 应该用 &__logo
}
```

### @keyframes 命名

动画关键帧使用 `block名-动画描述` 格式，kebab-case：

```scss
@keyframes bee-float-bubble { ... }
@keyframes bee-marquee { ... }
```

---

## SCSS Mixins 用法

高频样式组合统一封装在 `modules/mixins.scss`，通过 `@include` 复用。**禁止把组合写成全局工具类**（那等于重新发明原子类）。

### 可用 mixin

| mixin                            | 作用                          |
| -------------------------------- | ----------------------------- |
| `flex-center`                    | flex 水平垂直居中             |
| `flex-between`                   | flex 两端对齐 + 垂直居中      |
| `flex-col-center`                | flex 列布局 + 居中            |
| `flex-vcenter`                   | flex 仅垂直居中（不约束主轴） |
| `text-ellipsis`                  | 单行文本省略号                |
| `text-ellipsis-multi($lines: 2)` | 多行文本省略号                |
| `absolute-center`                | 绝对定位居中                  |
| `absolute-fill`                  | 绝对定位铺满父级              |
| `scrollbar-hidden`               | 隐藏滚动条                    |

### 引用方式（组件按需 `@use`）

```scss
@use '@/styles/modules/mixins' as m;

.bee-header__logo {
  @include m.flex-center;
  gap: 8px;
}

.bee-card__title {
  @include m.text-ellipsis;
}
```

> mixins.scss 无 CSS 输出，按需 `@use` 不会产生重复样式，因此**不进入 `index.scss` 入口聚合**。

---

## 合规声明（强制）

本次改动若**确实严格遵循了本规则文件的全部约定**，必须在回复的**结尾处**追加一行：

> 中和应泰前端组

用于自检与确认规则已被实际执行。若有任何一条未遵守，则不得追加该声明。
