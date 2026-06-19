/**
 * Plop 脚手架配置 —— 子包 / 子页面的生成规则唯一真相源。
 *
 * 提供两个生成器：
 *   - `pnpm new:app`：创建子应用（SPA-Vite / SPA-Rsbuild / MPA-Rsbuild 三选一），
 *     从 plop-templates/app 下对应模板展开，并把端口登记到 app.config.ts。
 *   - `pnpm new:page`：在已有的 MPA 子应用中创建子页面，
 *     生成 App.vue / main.ts，并把页面条目注入该应用 page.config.ts 的锚点。
 *
 * 设计取舍：模板与示例应用一一对应（保持 catalog: / workspace:* 依赖、tsconfig
 * 继承、env.d.ts、bootstrap 约定一致），避免「示例能跑、新建的不能跑」的漂移。
 */

import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const APPS_DIR = resolve(ROOT, 'apps');

/**
 * 应用类型 → 模板目录映射。新增模板时在此登记即可被 new:app 复用。
 */
const APP_KIND_TEMPLATES = {
  'spa-vite': 'spa-vite',
  'spa-rsbuild': 'spa-rsbuild',
  'mpa-rsbuild': 'mpa-rsbuild',
};

/**
 * 校验应用 / 页面名：仅允许小写字母、数字与连字符（kebab-case），
 * 与产出的 html 文件名、目录名直接对应，避免大小写 / 特殊字符引发的跨平台问题。
 * @param {string} value 待校验名称
 * @returns {true | string} 合法返回 true，否则返回错误说明
 */
function validateKebabName(value) {
  if (!value || !value.trim()) {
    return '名称不能为空';
  }
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return '只允许小写字母、数字与连字符，且以字母开头（kebab-case）';
  }
  return true;
}

/**
 * 扫描 apps 目录，找出所有 MPA 应用（以含 page.config.ts 为判据）。
 * new:page 只对 MPA 应用有意义，故在此收敛候选项，避免选到 SPA 应用。
 * @returns {string[]} MPA 应用名列表
 */
function listMpaApps() {
  if (!existsSync(APPS_DIR)) {
    return [];
  }
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(resolve(APPS_DIR, entry.name, 'page.config.ts')))
    .map((entry) => entry.name);
}

/**
 * @param {import('plop').NodePlopAPI} plop
 */
export default function (plop) {
  // 在插件装载期一次性解析 MPA 应用清单：plopfile 每次 `pnpm plop` 调用都会重新
  // 求值，故此处即反映当前磁盘状态。用静态数组而非函数，才能兼容 plop 的 CLI
  // bypass 模式（`plop page <app>`，其内部对 list 选项调用 choices.find）。
  const mpaApps = listMpaApps();
  // 子包内 `pnpm new:page` 经 pnpm 透传 npm_package_name；仅当它确为 MPA 应用时
  // 才作为默认选项（从根目录运行时该值为 "lystack"，不应命中）。
  const defaultApp = mpaApps.includes(process.env.npm_package_name ?? '') ? process.env.npm_package_name : undefined;

  /**
   * 生成器：创建子应用。
   */
  plop.setGenerator('app', {
    description: '创建子应用（apps/*）',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: '应用名（kebab-case，将作为 apps/<name> 与包名）：',
        validate: validateKebabName,
      },
      {
        type: 'list',
        name: 'kind',
        message: '构建形态：',
        choices: [
          { name: 'SPA · Vite', value: 'spa-vite' },
          { name: 'SPA · Rsbuild', value: 'spa-rsbuild' },
          { name: 'MPA · Rsbuild（多入口）', value: 'mpa-rsbuild' },
        ],
      },
      {
        type: 'input',
        name: 'port',
        message: '开发服务端口：',
        default: '5400',
        validate: (value) => {
          const port = Number(value);
          return Number.isInteger(port) && port >= 1024 && port <= 65535 ? true : '请输入 1024-65535 之间的整数';
        },
      },
    ],
    actions: (answers) => {
      const templateDir = APP_KIND_TEMPLATES[answers.kind];
      const appPath = resolve(APPS_DIR, answers.name);
      if (existsSync(appPath)) {
        throw new Error(`[plop] 应用 "${answers.name}" 已存在：${appPath}`);
      }

      return [
        {
          type: 'addMany',
          destination: 'apps/{{name}}',
          base: `plop-templates/app/${templateDir}`,
          templateFiles: `plop-templates/app/${templateDir}/**`,
          // .hbs 后缀由 plop 默认剥离；保留模板内的相对目录结构
          globOptions: { dot: true },
        },
        // 把端口登记到 app.config.ts 的 APP_PORTS（PLOP_INJECT_PORT 锚点）
        {
          type: 'modify',
          path: 'app.config.ts',
          pattern: /(\n[ \t]*)\/\* PLOP_INJECT_PORT \*\//,
          template: "$1/**$1 * {{name}}$1 */$1'{{name}}': {{port}},$1/* PLOP_INJECT_PORT */",
        },
      ];
    },
  });

  /**
   * 生成器：在 MPA 应用中创建子页面。
   */
  plop.setGenerator('page', {
    description: '在 MPA 应用中创建子页面（apps/<mpa-app>/src/pages/*）',
    prompts: [
      {
        type: 'list',
        name: 'app',
        message: '目标 MPA 应用：',
        // 子包内 `pnpm new:page` 透传 $npm_package_name 作为默认应用，免去再次选择
        default: defaultApp,
        choices: mpaApps,
      },
      {
        type: 'input',
        name: 'name',
        message: '页面名（kebab-case，将作为路由目录与 <name>.html）：',
        validate: validateKebabName,
      },
      {
        type: 'input',
        name: 'title',
        message: '页面标题：',
        default: (answers) => `LYStack · ${answers.name}`,
      },
    ],
    actions: (answers) => {
      if (mpaApps.length === 0) {
        throw new Error('[plop] 未找到任何 MPA 应用（含 page.config.ts），请先用 `pnpm new:app` 创建 MPA 应用');
      }
      if (!mpaApps.includes(answers.app)) {
        throw new Error(
          `[plop] "${answers.app}" 不是有效的 MPA 应用（含 page.config.ts），可选：${mpaApps.join(', ') || '无'}`,
        );
      }
      const pagePath = resolve(APPS_DIR, answers.app, 'src', 'pages', answers.name);
      if (existsSync(pagePath)) {
        throw new Error(`[plop] 页面 "${answers.name}" 已存在：${pagePath}`);
      }

      return [
        {
          type: 'add',
          path: 'apps/{{app}}/src/pages/{{name}}/App.vue',
          templateFile: 'plop-templates/page/App.vue.hbs',
        },
        {
          type: 'add',
          path: 'apps/{{app}}/src/pages/{{name}}/main.ts',
          templateFile: 'plop-templates/page/main.ts.hbs',
        },
        // 把页面条目注入 page.config.ts 的 pages 数组（PLOP_INJECT_PAGE 锚点）
        {
          type: 'modify',
          path: 'apps/{{app}}/page.config.ts',
          pattern: /(\n[ \t]*)\/\* PLOP_INJECT_PAGE \*\//,
          template:
            "$1{$1  name: '{{name}}',$1  entry: './src/pages/{{name}}/main.ts',$1  title: '{{title}}',$1},$1/* PLOP_INJECT_PAGE */",
        },
      ];
    },
  });
}
