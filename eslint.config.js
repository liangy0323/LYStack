import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from '@vue/eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // 类型纪律红线：禁止 any（后端 DTO 等确需处用 inline disable 显式豁免）
      '@typescript-eslint/no-explicit-any': 'error',
      // 未使用变量：允许 ^_ 前缀占位
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Vue SFC 用 vue-eslint-parser，内部 <script lang="ts"> 委托给 ts 解析器
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  /**
   * 组件目录内的 index.vue 是标准的 barrel 导出模式，豁免 multi-word 命名规则。
   */
  {
    files: ['packages/**/components/**/index.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  /**
   * 强制收口环境变量读取：禁止业务层直接出现 process.env / import.meta.env，
   * 一律走 @repo/shared/env。这从规则上保障「构建可插拔」不被破坏。
   * env 层自身（packages/shared/src/env/**）豁免。
   */
  {
    files: ['apps/**/src/**/*.{ts,tsx,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
          message: '禁止在业务代码中直接读取 process.env，请使用 @repo/shared/env 的 getEnv()。',
        },
        {
          selector: "MemberExpression[object.property.name='env'][object.object.type='MetaProperty']",
          message: '禁止在业务代码中直接读取 import.meta.env，请使用 @repo/shared/env 的 getEnv()。',
        },
      ],
    },
  },

  prettier,
);
