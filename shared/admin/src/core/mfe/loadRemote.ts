/**
 * 微前端远程组件加载器（MF 引擎核心）
 *
 * 运行时动态 import 子应用的 remoteEntry.js（Module Federation 标准格式），
 * 与壳子编译期解耦——壳子 build 一次永不更新，新 plugin 即插即用。
 *
 * remoteEntry.js 实际格式（@module-federation/vite 默认输出，具名导出）：
 *   export { get, init }
 *   // init()           → Promise<void>      初始化 shared scope
 *   // get(exposedPath) → Promise<factory>   factory() → Promise<module>
 *
 * 零基座依赖：只用原生 import() + vue 的 singleton 协商，子应用和基座都能直接 import 使用。
 */

interface RemoteEntry {
  init(shared?: unknown): Promise<void>
  get(exposedPath: string): Promise<() => Promise<any>>
}

const loadedRemotes = new Map<string, RemoteEntry>()
const initPromise = new Map<string, Promise<void>>()

/**
 * 宿主 shared scope：把基座的依赖以 singleton 形式提供给子应用协商。
 *
 * 不传的话 remoteEntry.init() 拿到空 scope，子应用 shared: { vue: { singleton } }
 * 协商不到宿主模块，会退回用自己打包的 vue 副本——两份 vue 运行时并存，
 * 子应用组件的 setup/render 跑在独立副本上，会出现组件渲染成空注释、
 * resolveComponent 查不到基座全局注册表等一系列问题。
 *
 * 注意：这里硬编码了 vue '3.5.44' / vue-router '4.6.4' / element-plus '2.14.7' / pinia '3.0.4' 版本号
 * （以版本号为 shared scope 的 key），基座升级任一依赖时这里要同步改，否则 MF singleton 协商会失效。
 */
function buildHostShared(): Record<string, Record<string, unknown>> {
  return {
    vue: {
      '3.5.44': {
        from: 'shell',
        get: () => import('vue'),
        loaded: true,
        shareConfig: { singleton: true, requiredVersion: false }
      }
    },
    'vue-router': {
      // 与 vue 一样必须有版本号这一层：MF shared scope 结构是 { 包名: { 版本: {...} } }，
      // 缺了版本层运行时解析出 undefined，singleton 协商会报 "Version from undefined"
      '4.6.4': {
        from: 'shell',
        get: () => import('vue-router'),
        loaded: true,
        shareConfig: { singleton: true, requiredVersion: false }
      }
    },
    // element-plus 也按 singleton 下发：子应用模板里的 el-* 由基座全局注册渲染，
    // 子应用代码里显式 import 的 ElMessage / ElConfigProvider 等也走这一份，
    // 这样基座 App.vue 的 ElConfigProvider 语言包对所有组件生效。
    // 版本号必须与基座 package.json 一致，升级 EP 时同步改这里。
    'element-plus': {
      '2.14.7': {
        from: 'shell',
        get: () => import('element-plus'),
        loaded: true,
        shareConfig: { singleton: true, requiredVersion: false }
      }
    },
    // pinia singleton：子应用需要读写基座已注册的 store（userStore/systemStore 等），
    // 必须共享同一份 pinia 实例，否则子应用 getActivePinia() 拿到自己的副本，取不到基座 store。
    'pinia': {
      '3.0.4': {
        from: 'shell',
        get: () => import('pinia'),
        loaded: true,
        shareConfig: { singleton: true, requiredVersion: false }
      }
    }
  }
}

/**
 * 加载并初始化一个 remoteEntry，返回 RemoteEntry 对象。
 * 同一个 URL 只 import 一次。
 */
async function loadRemoteEntry(url: string): Promise<RemoteEntry> {
  if (loadedRemotes.has(url)) return loadedRemotes.get(url)!

  // Vite 编译时遇到普通 import(url) 会尝试静态分析，
  // @vite-ignore 告诉它跳过，我们要的就是运行时动态加载。
  const mod = await import(/* @vite-ignore */ url)

  // @module-federation/vite 是具名导出 { get, init }，
  // 兼容其他实现（webpack 默认 export default）
  const remoteEntry: RemoteEntry = (mod as any).get && (mod as any).init
    ? { get: (mod as any).get, init: (mod as any).init }
    : (mod as any).default || mod

  if (!remoteEntry.get || !remoteEntry.init) {
    throw new Error(`[MFE] remoteEntry 格式错误，没有 get/init 方法: ${url}`)
  }

  // init 只执行一次，防并发；传入宿主 shared scope 供子应用 singleton 协商
  if (!initPromise.has(url)) {
    initPromise.set(url, Promise.resolve(remoteEntry.init(buildHostShared())))
  }
  await initPromise.get(url)

  loadedRemotes.set(url, remoteEntry)
  return remoteEntry
}

/**
 * 从 remoteEntry 里 get 一个 exposed 模块，取其 default 导出（通常是 Vue SFC）。
 *
 * @param url         remoteEntry.js 地址（比如 /app/devs/admin/dist/remoteEntry.js）
 * @param exposedPath exposed key（比如 ./views/index）
 */
export async function loadRemoteComponent(url: string, exposedPath: string): Promise<any> {
  const remoteEntry = await loadRemoteEntry(url)
  // get() 返回 Promise<factory>，await 解包后才是真正的工厂函数
  const factory = await remoteEntry.get(exposedPath)
  const mod = await factory()
  return mod.default ?? mod
}

/**
 * 把菜单接口 component 路径转换成 remote 的 exposed path。
 * 约定：前端 component 去掉插件前缀后，尾部的 /index 统一剥掉
 *       （因为 vite.config.ts 的 generateExposes 扫 src/views/<dir>/index.vue 时 key 不带 /index）
 *
 *   /devs/user/index → ./views/user   ✅ DB 写带 /index 的
 *   /devs/user       → ./views/user   ✅ DB 写不带 /index 的
 *   /devs/index      → ./views/index  ✅ 根页面
 *   /devs/model      → ./views/model  ✅ 单层 .vue 文件
 */
export function componentPathToExposed(componentPath: string): string {
  const segments = componentPath.replace(/^\/+/, '').split('/').filter(Boolean)
  // segments[0] 是 plugin 名（dves/devs），跳过，剩下才是 views 下的相对路径
  let rest = segments.slice(1).join('/') || 'index'
  // 剥掉尾部的 /index（与 vite.config.ts generateExposes 的 key 规则对齐）
  rest = rest.replace(/\/index$/, '')
  // 如果剥完为空（原 rest = 'index'），保留 'index' 作为默认
  if (rest === '') rest = 'index'
  return './views/' + rest
}

/**
 * 清理缓存（登出时或开发环境热更新时用）
 */
export function resetLoadedRemotes() {
  loadedRemotes.clear()
  initPromise.clear()
}
