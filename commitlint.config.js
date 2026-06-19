/**
 * commitlint 配置：约束提交信息遵循 Conventional Commits 规范。
 *
 * 提交信息格式：<type>(<scope>): <subject>，如 feat(env): 增加多环境变量加载。
 * 常用 type：feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert。
 */
export default {
  extends: ['@commitlint/config-conventional'],
};
