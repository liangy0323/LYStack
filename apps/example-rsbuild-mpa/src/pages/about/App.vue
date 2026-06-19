<script setup lang="ts">
/**
 * LYStack MPA · 关于页
 *
 * 展示项目架构信息与技术栈，验证跨页面 @repo/* 包消费能力。
 */

// ── @repo/shared ──
import { getAppEnv, isDev } from '@repo/shared/env';
import { isDef, safeJsonParse } from '@repo/shared/utils';
import { STORAGE_TOKEN_KEY } from '@repo/shared/constants';

// ── @repo/ui ──
import { DemoCard } from '@repo/ui';

// ── 关于页数据 ──
const buildTool = 'Rsbuild';
const buildMode = isDev() ? 'development' : 'production';
const appEnv = getAppEnv();
const tokenKey = STORAGE_TOKEN_KEY;

/** 从 localStorage 读取 token 演示（Raw 边界用法，真实业务用 servicesCoreHelper） */
const tokenPreview = (() => {
  try {
    const raw = localStorage.getItem(tokenKey);
    return isDef(raw) ? raw : '(未设置)';
  } catch {
    return '(不可用)';
  }
})();

/**
 * 静态架构数据 —— 用 safeJsonParse 演示类型安全解析。
 * 真实场景中这些数据可能来自远程配置接口。
 */
const archData = safeJsonParse<{
  packages: string[];
  features: string[];
}>(
  JSON.stringify({
    packages: ['@repo/shared', '@repo/services', '@repo/ui', '@repo/build-config'],
    features: ['Vite SPA', 'Rsbuild SPA', 'Rsbuild MPA', '亮/暗双主题', '依赖反转服务层'],
  }),
  { packages: [], features: [] },
);
</script>

<template>
  <div class="app-shell">
    <!-- ── 页面头部 ── -->
    <header class="hero">
      <div class="hero__badge">LYStack</div>
      <h1 class="hero__title">关于项目</h1>
      <p class="hero__desc">通用 Vue3 企业级 Monorepo 底座 · 构建工具可插拔 · 零 UI 框架绑定</p>
      <div class="hero__meta">
        <span class="tag tag--build">{{ buildTool }} MPA · about 页</span>
        <span class="tag tag--env">{{ appEnv }}</span>
        <span class="tag tag--mode">{{ buildMode }}</span>
      </div>
    </header>

    <!-- ── 包列表 ── -->
    <section class="section">
      <h2 class="section__title">核心包</h2>
      <div class="grid grid--2col">
        <DemoCard
          v-for="pkg in archData.packages"
          :key="pkg"
          :title="pkg"
          :tag="
            pkg === '@repo/shared'
              ? '环境 · 工具 · 常量'
              : pkg === '@repo/services'
                ? 'HTTP · 认证 · 拦截器'
                : pkg === '@repo/ui'
                  ? '组件 · 样式令牌'
                  : '构建 · 适配器'
          "
          :shadow="true"
        >
          <p class="pkg-desc">
            {{
              pkg === '@repo/shared'
                ? '跨应用通用工具、环境变量读取层、类型定义与常量。构建工具无关，所有 app 共享。'
                : pkg === '@repo/services'
                  ? '可实例化的 Axios 工厂 + 依赖反转的认证注入 + 可插拔错误消息展示。'
                  : pkg === '@repo/ui'
                    ? 'CSS 令牌体系（palette → semantic）+ 基础组件 + 亮暗双主题。零 UI 框架依赖。'
                    : 'Vite / Rsbuild 双适配器 + page.config.ts 契约 + SPA/MPA 统一抽象。'
            }}
          </p>
        </DemoCard>
      </div>
    </section>

    <!-- ── 技术特性 ── -->
    <section class="section">
      <h2 class="section__title">技术特性</h2>
      <DemoCard :shadow="true">
        <ul class="feature-list">
          <li v-for="feat in archData.features" :key="feat">{{ feat }}</li>
        </ul>
      </DemoCard>
    </section>

    <!-- ── 运行时状态 ── -->
    <section class="section">
      <h2 class="section__title">运行时状态</h2>
      <div class="grid grid--3col">
        <DemoCard title="环境变量" tag="env" :shadow="true">
          <ul class="feature-list">
            <li>
              <code>APP_ENV</code> → <em>{{ appEnv }}</em>
            </li>
            <li>
              <code>isDev()</code> → <em>{{ isDev() }}</em>
            </li>
          </ul>
        </DemoCard>
        <DemoCard title="Token 存储" tag="constants" :shadow="true">
          <ul class="feature-list">
            <li>
              <code>STORAGE_TOKEN_KEY</code> → <em>"{{ tokenKey }}"</em>
            </li>
            <li>
              localStorage 值 → <em>{{ tokenPreview }}</em>
            </li>
          </ul>
        </DemoCard>
        <DemoCard title="构建信息" tag="build" :shadow="true">
          <ul class="feature-list">
            <li>
              构建工具 → <em>{{ buildTool }}</em>
            </li>
            <li>页面形态 → <em>MPA</em></li>
            <li>
              构建模式 → <em>{{ buildMode }}</em>
            </li>
          </ul>
        </DemoCard>
      </div>
    </section>

    <!-- ── 底部导航 ── -->
    <footer class="footer">
      <nav class="footer__nav">
        <a href="/index.html" class="footer__link">← 返回首页</a>
        <span class="footer__link footer__link--active">关于 LYStack</span>
      </nav>
      <p class="footer__hint">当前页面为独立入口（about.html），与首页各自打包，共享 @repo/* 能力</p>
    </footer>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════
   LYStack 品牌风格 — 关于页
   ═══════════════════════════════════════════════════ */

.app-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-base);
  font-family:
    system-ui,
    -apple-system,
    'Microsoft YaHei',
    sans-serif;
}

.hero {
  text-align: center;
  padding: 40px 0 32px;
}
.hero__badge {
  display: inline-block;
  padding: 4px 16px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-radius: var(--radius-round);
  margin-bottom: var(--spacing-base);
}
.hero__title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-base);
  margin-bottom: var(--spacing-sm);
}
.hero__desc {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  max-width: 520px;
  margin: 0 auto var(--spacing-lg);
}
.hero__meta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 3px 12px;
  font-size: var(--font-size-xs);
  border-radius: var(--radius-round);
  font-weight: 500;
}
.tag--build {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}
.tag--env {
  color: var(--color-success);
  background: var(--color-success-bg);
}
.tag--mode {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

/* ── Sections ── */
.section {
  margin-bottom: var(--spacing-xl);
}
.section__title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-base);
  margin-bottom: var(--spacing-base);
  padding-left: var(--spacing-sm);
  border-left: 3px solid var(--color-primary);
}

.grid {
  display: grid;
  gap: var(--spacing-lg);
}
.grid--2col {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}
.grid--3col {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.feature-list li {
  padding: 6px 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
  line-height: 1.6;
}
.feature-list li::before {
  content: '▸ ';
  color: var(--color-primary);
}
.feature-list code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  padding: 1px 5px;
  border-radius: var(--radius-sm);
}
.feature-list em {
  font-style: normal;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.pkg-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.footer {
  text-align: center;
  padding: var(--spacing-xl) 0 var(--spacing-base);
  border-top: 1px solid var(--border-color-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.footer__nav {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}
.footer__link {
  color: var(--color-primary);
  font-weight: 500;
}
.footer__link:hover {
  text-decoration: underline;
}
.footer__link--active {
  color: var(--color-text-secondary);
  pointer-events: none;
}
.footer__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
}
</style>
