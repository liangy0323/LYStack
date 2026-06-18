/**
 * 导入模块
 */
import { createApp } from 'vue';
import { bootstrap } from './bootstrap/index.ts';

/**
 * 导入组件
 */
import App from './App.vue';

// 先装配，再挂载：保证组件渲染前所有依赖已就绪
bootstrap();

createApp(App).mount('#app');
