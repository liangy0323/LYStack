# 样式规范

## 设计令牌体系（两层架构）

令牌集中定义在 `packages/ui/src/styles/modules/`，采用 **Palette + Semantic 两层架构**，支持 `data-theme` 主题切换。`@repo/ui` 通过 `./styles` 导出统一入口（`index.css`），各 app 在入口处引入。

> 底座样式用**纯 CSS + CSS 变量**实现，不依赖 SCSS——保证零预处理依赖、构建工具无关。业务项目若需要 SCSS，可自行在应用层引入，不影响底座令牌体系。

### 双主题机制

主题通过 `html[data-theme]` 切换，取值为 `'light' | 'dark'`：

- 默认 `:root`（等价 `[data-theme='light']`）为亮色主题（`color-scheme: light`）；`[data-theme='dark']` 为暗色主题。
- 切换主题只需改写 `html` 上的 `data-theme` 属性，组件零改动。
- 业务侧如何驱动 `data-theme`（用户手动切换、跟随系统 `prefers-color-scheme`、或由宿主环境注入）由应用层自行决定，底座只负责令牌定义与切换响应。

### 第一层 Palette（原始调色板）

挂在 `:root`（`tokens.css`），与主题无关的基础色阶，**仅供语义层引用，禁止在组件中直接使用**：

```css
:root {
  --palette-blue-500: #3b82f6;
  --palette-red-500: #ef4444;
  --palette-gray-900: #1a1a1a;
  --palette-white: #ffffff;
  /* ... */
}
```

### 第二层 Semantic（语义令牌）

挂在 `:root[data-theme='light']` / `[data-theme='dark']`（`theme.css`），**组件中唯一可引用的层**。切换主题只需覆盖本层，业务组件零改动：

```css
:root,
:root[data-theme='light'] {
  color-scheme: light;
  --color-primary: var(--palette-blue-500);
  --color-text-base: var(--palette-gray-900);
  --bg-color-body: var(--palette-gray-50);
  /* ... */
}

[data-theme='dark'] {
  color-scheme: dark;
  --color-primary: var(--palette-blue-400);
  --color-text-base: var(--palette-gray-200);
  --bg-color-body: var(--palette-gray-980);
  /* ... */
}
```

### 非颜色令牌（与主题无关，挂 `:root`）

| 类别 | 令牌                              | 单位 | 说明                           |
| ---- | --------------------------------- | ---- | ------------------------------ |
| 字号 | `--font-size-xs/sm/base/md/lg/xl` | rem  | 基准 1rem=14px                 |
| 间距 | `--spacing-xs/sm/md/base/lg/xl`   | px   | 4/8/12/16/24/32px              |
| 圆角 | `--radius-sm/base/md/lg/xl/round` | px   | 4/6/8/12/16px + 全圆           |
| 阴影 | `--shadow-sm/base/md/lg`          | -    | 多级投影                       |
| 过渡 | `--transition-fast/base`          | -    | 150ms / 200ms ease             |
| 涨跌 | `--color-rise/fall`               | -    | 金融场景可选，中性底座默认保留 |

### 令牌使用规则

- 组件中**只引用语义令牌**（`var(--color-*)`）与非颜色令牌（`var(--font-size-*)` 等），**禁止写裸色值**，禁止直接用 `--palette-*`。
- 新增颜色：先在 Palette 加色阶，再在语义层映射，**不得跳过 Palette 直接在语义层写色值**。

### 多主题实现规则（强制）

主题差异**只能**通过「Palette → 语义层 → 组件引用语义变量」三步落地，组件样式对主题完全无感知。

**严禁**在组件（含 `<style scoped>`）中出现任何主题判断选择器，例如：

```css
/* ❌ 绝对禁止：在组件里硬编码主题选择器 + 裸色值 */
[data-theme='dark'] .theme-toggle {
  background: rgba(255, 255, 255, 0.16);
}

[data-theme='light'] .xxx {
  color: #000;
}
```

正确做法——主题色值全部在令牌层切换，组件只引用一个语义变量：

```css
/* 1) Palette（tokens.css）：加原始色阶 */
:root {
  --palette-overlay-dark: rgba(0, 0, 0, 0.5);
  --palette-overlay-light: rgba(255, 255, 255, 0.16);
}

/* 2) 语义层（theme.css）：按主题映射 */
:root,
:root[data-theme='light'] {
  --overlay-bg-color: var(--palette-overlay-dark);
}
[data-theme='dark'] {
  --overlay-bg-color: var(--palette-overlay-light);
}
```

```css
/* 3) 组件：只引用语义变量，零主题判断 */
.theme-toggle {
  background: var(--overlay-bg-color);
}
```

强制条款：

1. **组件样式禁止出现 `[data-theme='xxx']`、`:global(...)` 等主题选择器**，主题判断只允许存在于 `theme.css`。
2. 需要随主题变化的颜色，**必须新增/复用语义令牌**，组件引用 `var(--xxx)`，禁止在组件里写两套色值。
3. 新增语义令牌时，`light` 与 `dark` 两个主题块**必须同时定义**，避免某主题下变量缺失。
4. 语义令牌命名带语义前缀（如 `--overlay-bg-color`、`--bg-color-panel`），不得以具体色值或主题名命名。

---

## 样式入口聚合

`packages/ui/src/styles/index.css` 作为统一入口，通过 `@import` 聚合各模块：

```css
@import './modules/tokens.css'; /* Palette + 非颜色令牌 */
@import './modules/theme.css'; /* Semantic 语义层（light/dark）*/
@import './modules/base.css'; /* CSS reset + 全局 body 样式 */
```

各 app 只需在入口（`main.ts` 或 `bootstrap`）顶部导入一次 `@repo/ui/styles`，全量令牌与主题即可生效。

---

## 技术栈组合

**纯 CSS + CSS 变量 + BEM**：

- **CSS 变量**：设计令牌（主题色、字号、间距、圆角），支持运行时主题切换，零预处理依赖。
- **BEM**：类名命名规范，保证语义化与可维护性。
- 业务应用如需 SCSS / Tailwind 等方案，可在应用层自行引入，不影响底座令牌体系。

---

# 业务应用样式规范（使用 SCSS 时）

> 以下为**业务应用层**的样式编写规范。底座 `@repo/ui` 本身用纯 CSS，但业务项目普遍使用 SCSS——若你的应用引入 SCSS，建议遵循下面的 BEM + mixins 约定，保证可维护性。**禁止使用任何原子类**（含自定义全局工具类），高频样式组合通过 SCSS `@mixin` 复用。

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
