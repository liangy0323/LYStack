<script setup lang="ts">
/**
 * 导入工具类
 */
import { createRequestSeq } from '@repo/shared/utils';

/**
 * MPA 首页入口。多入口由 page.config.ts 唯一真相源驱动，
 * 各页面互不依赖、独立打包，共享 @repo/shared 的能力。
 */
const nextSeq = createRequestSeq();
const seq = nextSeq();
</script>

<template>
  <main class="page">
    <h1>LYStack · 首页</h1>
    <p>当前由 <strong>Rsbuild</strong> 构建（MPA 多入口）</p>
    <p class="hint">来自 @repo/shared 的请求序号：{{ seq }}</p>
    <a href="/about.html">前往关于页 →</a>
  </main>
</template>
