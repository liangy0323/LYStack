/**
 * 导入模块
 */
import { createApp } from 'vue';
import { bootstrap } from './bootstrap/index.ts';

/**
 * 导入全局样式（CSS 令牌 + 基础重置）
 */
import '@repo/ui/styles';

/**
 * 导入组件
 */
import App from './App.vue';

// 先装配，再挂载：保证组件渲染前所有依赖已就绪
bootstrap();

createApp(App).mount('#app');
