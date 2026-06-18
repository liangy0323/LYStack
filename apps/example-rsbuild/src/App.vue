<script setup lang="ts">
/**
 * 导入模块
 */
import { ref } from 'vue';

/**
 * 导入工具类
 */
import { createRequestSeq, isDef } from '@repo/shared/utils';

/**
 * 最小示例：仅为证明底座可运行，且应用能正常消费 @repo/shared。
 * 刻意不引入任何 UI 框架——底座只提供架构骨架，UI 由使用者自选接入。
 */
const count = ref(0);
const nextSeq = createRequestSeq();
const lastSeq = ref<number | null>(null);

function increment(): void {
  count.value += 1;
  lastSeq.value = nextSeq();
}
</script>

<template>
  <main class="app">
    <h1>LYStack</h1>
    <p class="subtitle">构建工具无关的企业级 Vue3 Monorepo 底座</p>

    <section class="card">
      <p>当前由 <strong>Rsbuild</strong> 构建（SPA）</p>
      <button type="button" @click="increment">count = {{ count }}</button>
      <p v-if="isDef(lastSeq)" class="hint">
        来自 @repo/shared 的请求序号：{{ lastSeq }}
      </p>
    </section>
  </main>
</template>
