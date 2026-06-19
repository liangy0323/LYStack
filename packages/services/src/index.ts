/**
 * @repo/services 聚合出口。
 *
 * 可按子路径精确引入以获得更好的 tree-shaking：
 *   import { AxiosFactory, configureServiceAuth } from '@repo/services/core';
 *   import { apiService } from '@repo/services/api';
 */

export * from './core/index.ts';
export * from './types/index.ts';
