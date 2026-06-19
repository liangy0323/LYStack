<script setup lang="ts">
/**
 * LYStack MPA · 首页
 *
 * 集中演示 @repo/shared、@repo/services、@repo/ui
 * 三个核心包的用法，验证多入口构建链路完整。
 */

// ── Vue ──
import { computed, ref } from 'vue';

// ── @repo/shared ──
import { getAppEnv, getEnv, isDev } from '@repo/shared/env';
import { createRequestSeq, isDef, isNonEmptyString, safeJsonParse } from '@repo/shared/utils';
import { STORAGE_TOKEN_KEY } from '@repo/shared/constants';

// ── @repo/services ──
import { apiService } from '@repo/services/api';
import { servicesCoreHelper } from '@repo/services/core';

// ── @repo/ui ──
import { DemoCard } from '@repo/ui';

// ── 响应式状态 ──
const count = ref(0);
const nextSeq = createRequestSeq();
const lastSeq = ref<number | null>(null);

const appEnv = getAppEnv();
const apiBaseUrl = getEnv('PUBLIC_API_BASE_URL', 'http://localhost:3000/api');
const tokenKey = STORAGE_TOKEN_KEY;

const hasToken = computed(() => {
  try {
    return isNonEmptyString(servicesCoreHelper.getAuthenticationToken());
  } catch {
    return false;
  }
});

const buildTool = 'Rsbuild';
const buildMode = isDev() ? 'development' : 'production';
const jsonDemo = safeJsonParse<{ name: string }>('{"name":"LYStack"}', { name: 'fallback' });

function increment(): void {
  count.value += 1;
  lastSeq.value = nextSeq();
}

const apiStatus = ref<'idle' | 'pending' | 'done' | 'error'>('idle');
const apiMessage = ref('');

async function testApiCall(): Promise<void> {
  apiStatus.value = 'pending';
  apiMessage.value = '';
  try {
    const res = await apiService.get<{ message: string }>('/health');
    apiStatus.value = 'done';
    apiMessage.value = `收到响应: code=${res.code}, data=${JSON.stringify(res.data)}`;
  } catch (err: unknown) {
    apiStatus.value = 'error';
    const msg = err instanceof Error ? err.message : String(err);
    apiMessage.value = `预期内的错误（无后端）: ${msg}`;
  }
}
</script>

<template>
  <div class="app-shell">
    <!-- ── 品牌横条 ── -->
    <header class="hero">
      <div class="hero__badge">LYStack</div>
      <h1 class="hero__title">构建工具无关的企业级<br />Vue3 Monorepo 底座</h1>
      <p class="hero__desc">一套代码，Vite / Rsbuild 双构建 · SPA / MPA 双形态 · 零 UI 框架绑定</p>
      <div class="hero__meta">
        <span class="tag tag--build">{{ buildTool }} MPA</span>
        <span class="tag tag--env">{{ appEnv }}</span>
        <span class="tag tag--mode">{{ buildMode }}</span>
      </div>
    </header>

    <!-- ── 三栏核心包展示 ── -->
    <section class="grid">
      <!-- @repo/shared -->
      <DemoCard title="@repo/shared" tag="环境 · 工具 · 常量" :shadow="true" :hoverable="true">
        <ul class="feature-list">
          <li>
            <code>getEnv('PUBLIC_API_BASE_URL')</code> → <em>{{ apiBaseUrl }}</em>
          </li>
          <li>
            <code>getAppEnv()</code> → <em>{{ appEnv }}</em>
          </li>
          <li>
            <code>STORAGE_TOKEN_KEY</code> → <em>"{{ tokenKey }}"</em>
          </li>
          <li>
            <code>safeJsonParse</code> → <em>{{ jsonDemo.name }}</em>
          </li>
        </ul>
        <template #footer>
          <span class="badge badge--ok">已集成</span>
        </template>
      </DemoCard>

      <!-- @repo/services -->
      <DemoCard title="@repo/services" tag="HTTP · 认证 · 拦截器" :shadow="true" :hoverable="true">
        <ul class="feature-list">
          <li>AxiosFactory 多实例架构</li>
          <li>依赖反转：token 由 app 注入</li>
          <li>错误展示：可插拔 messenger</li>
        </ul>
        <div class="service-status">
          <span>Token 状态：</span>
          <span :class="hasToken ? 'badge badge--ok' : 'badge badge--warn'">
            {{ hasToken ? '已注入' : '未登录（正常）' }}
          </span>
        </div>
        <template #footer>
          <button type="button" class="btn btn--sm" :disabled="apiStatus === 'pending'" @click="testApiCall">
            {{ apiStatus === 'pending' ? '请求中…' : '测试 API 调用' }}
          </button>
        </template>
      </DemoCard>

      <!-- @repo/ui -->
      <DemoCard title="@repo/ui" tag="组件 · 样式令牌" :shadow="true" :hoverable="true">
        <ul class="feature-list">
          <li>DemoCard 组件（当前卡片即用它渲染）</li>
          <li>CSS 令牌体系（palette → semantic）</li>
          <li>亮色 / 暗色双主题</li>
        </ul>
        <div class="counter-inline">
          <button type="button" class="btn btn--pill" @click="increment">count = {{ count }}</button>
          <span v-if="isDef(lastSeq)" class="seq-hint"> 请求序号 #{{ lastSeq }} </span>
        </div>
        <template #footer>
          <span class="badge badge--ok">已集成</span>
        </template>
      </DemoCard>
    </section>

    <!-- ── API 调用状态条 ── -->
    <div v-if="apiStatus !== 'idle'" class="api-toast" :class="`api-toast--${apiStatus}`">
      {{ apiMessage }}
    </div>

    <!-- ── 底部 ── -->
    <footer class="footer">
      <nav class="footer__nav">
        <a href="/index.html" class="footer__link footer__link--active">首页</a>
        <a href="/about.html" class="footer__link">关于 LYStack →</a>
      </nav>
      <p class="footer__hint">MPA 多入口 · 各页面独立打包 · 由 page.config.ts 唯一真相源驱动</p>
    </footer>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════
   LYStack 品牌风格 — 演示页专用
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
  padding: 48px 0 40px;
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
  line-height: 1.3;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin: var(--spacing-xl) 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.feature-list li {
  padding: 4px 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
  line-height: 1.6;
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

.service-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
}

.counter-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
.seq-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: var(--font-size-xs);
  border-radius: var(--radius-round);
  font-weight: 500;
}
.badge--ok {
  color: var(--color-success);
  background: var(--color-success-bg);
}
.badge--warn {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn--sm {
  padding: 6px 14px;
  font-size: var(--font-size-xs);
}
.btn--pill {
  padding: 6px 18px;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-radius: var(--radius-round);
}
.btn--pill:hover {
  background: var(--color-primary-light);
}

.api-toast {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-base);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: 'SF Mono', 'Fira Code', monospace;
  word-break: break-all;
}
.api-toast--pending {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}
.api-toast--done {
  color: var(--color-success);
  background: var(--color-success-bg);
}
.api-toast--error {
  color: var(--color-warning);
  background: var(--color-warning-bg);
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
