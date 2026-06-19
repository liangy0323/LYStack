/**
 * 导入 node 模块
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * 导入类型声明
 */
import type { EnvMode } from '../types.ts';

/**
 * 公共环境快照：与全局 PublicEnv 契约一致，仅含可暴露到客户端的字段
 */
type PublicEnvSnapshot = PublicEnv;

/**
 * 标记仓库根的文件：底座以 pnpm workspace 为根，向上查找此文件定位根目录
 */
const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

/**
 * 暴露到客户端的变量前缀：只有带此前缀的变量会被注入打包产物，
 * 其余仅构建期可见，避免误把密钥打进前端代码。
 */
const PUBLIC_ENV_PREFIX = 'PUBLIC_';

/**
 * 从应用根目录向上查找仓库根（含 pnpm-workspace.yaml 的目录）。
 *
 * .env.* 统一放在 Monorepo 根，而各 app 在子目录运行，故需先定位根目录，
 * 再以根为基准加载环境文件，保证所有 app 读到同一份环境配置。
 * @param fromDir 起始目录（通常是应用 root）
 * @returns 仓库根目录绝对路径；未找到则回退到起始目录
 */
function findWorkspaceRoot(fromDir: string): string {
  let current = resolve(fromDir);

  while (true) {
    if (existsSync(resolve(current, WORKSPACE_MARKER))) {
      return current;
    }
    const parent = dirname(current);
    // 已到文件系统顶层仍未找到，回退起始目录，避免死循环
    if (parent === current) {
      return resolve(fromDir);
    }
    current = parent;
  }
}

/**
 * 解析单个 .env 文件内容为键值对。
 *
 * 轻量实现：仅支持 KEY=VALUE、# 注释与首尾引号剥离，
 * 不引入 dotenv 依赖，保持构建配置层零运行时副作用。
 * @param content 文件文本内容
 * @returns 解析出的键值对
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    // 跳过空行与注释行
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    // 剥离成对的首尾引号
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key !== '') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 按 Vite 约定叠加加载多个 .env 文件，后加载者覆盖先加载者。
 *
 * 加载顺序：.env → .env.[mode] → .env.local → .env.[mode].local。
 * @param repoRoot 仓库根目录
 * @param envMode 当前应用环境
 * @returns 合并后的原始键值对
 */
function loadRawEnv(repoRoot: string, envMode: EnvMode): Record<string, string> {
  const files = ['.env', `.env.${envMode}`, '.env.local', `.env.${envMode}.local`];

  let merged: Record<string, string> = {};
  for (const file of files) {
    const filePath = resolve(repoRoot, file);
    if (existsSync(filePath)) {
      merged = { ...merged, ...parseEnvFile(readFileSync(filePath, 'utf-8')) };
    }
  }

  return merged;
}

/**
 * 加载可暴露到客户端的公共环境快照。
 *
 * 双构建工具（Vite / Rsbuild）的 define 机制与前缀约定不同，底座统一在此
 * 筛出 PUBLIC_ 前缀变量，并强制带上 APP_ENV，聚合为单一快照，
 * 由两个 adapter 注入同名全局对象，从根上抹平构建工具差异。
 *
 * 运行模式（dev / prod）不在此维护：Vite / Rsbuild 会按命令原生注入
 * import.meta.env.DEV/PROD/MODE 与 process.env.NODE_ENV，无需重复携带。
 * @param appRoot 应用根目录（用于定位仓库根）
 * @param envMode 当前应用环境
 * @returns 公共环境快照
 */
export function loadPublicEnv(appRoot: string, envMode: EnvMode): PublicEnvSnapshot {
  const repoRoot = findWorkspaceRoot(appRoot);
  const raw = loadRawEnv(repoRoot, envMode);

  const publicEntries: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith(PUBLIC_ENV_PREFIX)) {
      publicEntries[key] = value;
    }
  }

  // APP_ENV 以当前构建环境为准
  return {
    ...publicEntries,
    APP_ENV: envMode,
  };
}

/**
 * 把公共环境快照转换为构建工具的 define 映射。
 *
 * 注入到固定字面量全局 __PUBLIC_ENV__：避免依赖各构建工具对「动态 key
 * 成员访问」的支持差异，@repo/shared/env 优先读取这一对象。
 * @param snapshot 公共环境快照
 * @returns define 映射（键为待替换标识符，值为序列化后的字面量）
 */
export function buildPublicEnvDefine(snapshot: PublicEnvSnapshot): Record<string, string> {
  return {
    __PUBLIC_ENV__: JSON.stringify(snapshot),
  };
}
