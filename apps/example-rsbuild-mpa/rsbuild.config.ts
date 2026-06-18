/**
 * 导入工具类
 */
import { defineRsbuildConfig, resolveRoot } from '@repo/build-config/rsbuild';

/**
 * 导入常量
 */
import { pages } from './page.config.ts';

/**
 * 应用只声明「构建什么」：MPA 把 page.config.ts 这份唯一真相源传给 adapter，
 * 由 adapter 展开成 Rsbuild 多入口。应用层不接触任何 Rsbuild 多入口细节。
 */
export default defineRsbuildConfig({
  kind: 'mpa',
  appName: 'example-rsbuild-mpa',
  root: resolveRoot(import.meta.url),
  pages,
  port: 5373,
});
