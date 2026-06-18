<script setup lang="ts">
/**
 * 导入工具类
 */
import { isDef } from '@repo/shared/utils';

/**
 * MPA 关于页入口。与首页同属一个子包、共享 src/components，
 * 但作为独立 entry 单独打包，产出 about.html。
 */
const buildTool = 'Rsbuild';
</script>

<template>
  <main class="page">
    <h1>LYStack · 关于</h1>
    <p v-if="isDef(buildTool)">
      当前由 <strong>{{ buildTool }}</strong> 构建（MPA 多入口）
    </p>
    <a href="/index.html">← 返回首页</a>
  </main>
</template>
