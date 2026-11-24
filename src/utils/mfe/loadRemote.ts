/**
 * 转发导出：真正的实现已收敛到 @admin/core/mfe/loadRemote
 * 既有代码 `import { loadRemoteComponent } from '@/utils/mfe/loadRemote'` 继续可用。
 *
 * 注意：buildHostShared() 里硬编码了 vue '3.5.44' / vue-router '4.6.4' / element-plus '2.14.7' / pinia '3.0.4' 版本号，
 * 如果基座升级这几个依赖要同步改共享包里的版本号，否则 MF singleton 协商会失效。
 */
export {
  loadRemoteComponent,
  componentPathToExposed,
  resetLoadedRemotes
} from '@admin/core/mfe/loadRemote'
