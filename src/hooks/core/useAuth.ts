/**
 * 转发导出：真正的实现已收敛到 @admin/core/auth/useAuth
 * 既有代码 `import { useAuth } from '@/hooks/core/useAuth'` 继续可用。
 *
 * 基座原版有「前端模式（从 userStore.info.buttons 读）」和「后端模式」两种，
 * 共享版只实现后端模式（从 route.meta.authList 读），这也是 webniu 实际在用的模式。
 */
export { useAuth } from '@admin/core/auth/useAuth'
export type { AuthItem } from '@admin/core/auth/useAuth'
