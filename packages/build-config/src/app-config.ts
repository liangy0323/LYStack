/**
 * 仓库根 app.config.ts 的包内单一接线点。
 *
 * 为什么集中在此 re-export：根配置位于仓库根（build-config 包目录之外），
 * 跨层相对路径脆弱。这里只写一次相对路径，包内其余文件统一从本模块引用，
 * 后续根配置位置调整也只需改这一处。
 */
export { APP_PORTS, DEFAULT_DEV_PORT, DEFAULT_HTML_CONFIG, resolveAppPort } from '../../../app.config.ts';
