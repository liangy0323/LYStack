<template>
  <div class="demo-card" :class="cardClass">
    <!-- 头部 -->
    <div v-if="title || $slots.header" class="demo-card__header">
      <slot name="header">
        <h3 class="demo-card__title">{{ title }}</h3>
        <span v-if="tag" class="demo-card__tag">{{ tag }}</span>
      </slot>
    </div>

    <!-- 内容 -->
    <div class="demo-card__body">
      <slot>
        <p class="demo-card__description">{{ description }}</p>
      </slot>
    </div>

    <!-- 底部操作 -->
    <div v-if="$slots.footer" class="demo-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  /** 卡片标题 */
  title?: string;
  /** 卡片副标题 / 描述 */
  description?: string;
  /** 右上角标签文本 */
  tag?: string;
  /** 是否带阴影 */
  shadow?: boolean;
  /** 是否带悬停效果 */
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  description: undefined,
  tag: undefined,
  shadow: false,
  hoverable: false,
});

const cardClass = computed(() => ({
  'demo-card--shadow': props.shadow,
  'demo-card--hoverable': props.hoverable,
}));
</script>

<style src="./index.css" scoped></style>
