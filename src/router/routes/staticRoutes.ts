import { AppRouteRecordRaw } from '@/utils/router'

/**
 * 静态路由配置（不需要权限就能访问的路由）
 *
 * 属性说明：
 * isHideTab: true 表示不在标签页中显示
 *
 * 注意事项：
 * 1、path、name 不要和动态路由冲突，否则会导致路由冲突无法访问
 * 2、静态路由不管是否登录都可以访问
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@views/admin/system/auth/login/index.vue'),
    meta: { title: 'menus.login.title', isHideTab: true }
  },
  {
    path: '/auth/install',
    name: 'Install',
    component: () => import('@views/admin/system/auth/install/index.vue'),
    meta: { title: '安装向导', isHideTab: true }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('@views/admin/system/auth/register/index.vue'),
    meta: { title: 'menus.register.title', isHideTab: true }
  },
  {
    path: '/auth/forget-password',
    name: 'ForgetPassword',
    component: () => import('@views/admin/system/auth/forget-password/index.vue'),
    meta: { title: 'menus.forgetPassword.title', isHideTab: true }
  },
  {
    path: '/auth/reset-password',
    name: 'ResetPassword',
    component: () => import('@views/admin/system/auth/reset-password/index.vue'),
    meta: { title: '重置密码', isHideTab: true }
  },
  {
    path: '/403',
    name: 'Exception403',
    component: () => import('@views/admin/system/exception/403/index.vue'),
    meta: { title: '403', isHideTab: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Exception404',
    component: () => import('@views/admin/system/exception/404/index.vue'),
    meta: { title: '404', isHideTab: true }
  },
  {
    path: '/500',
    name: 'Exception500',
    component: () => import('@views/admin/system/exception/500/index.vue'),
    meta: { title: '500', isHideTab: true }
  },
  {
    path: '/outside',
    component: () => import('@views/admin/index/index.vue'),
    name: 'Outside',
    meta: { title: 'menus.outside.title' },
    children: [
      // iframe 内嵌页面
      {
        path: '/outside/iframe/:path',
        name: 'Iframe',
        component: () => import('@/views/admin/system/outside/Iframe.vue'),
        meta: { title: 'iframe' }
      }
    ]
  }
]
