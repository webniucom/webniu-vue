/**
 * 共享包第三方依赖类型补充
 *
 * 这些包自身不带类型声明，而共享组件会直接 import。
 * 声明放在共享包内，基座与任何子应用都自动生效，不需要各自再写一份。
 */

declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string): void
  const FileSaver: { saveAs: typeof saveAs }
  export default FileSaver
}

declare module 'vue-img-cutter'
