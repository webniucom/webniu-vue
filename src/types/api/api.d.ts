/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */
declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }
  /** 认证类型 */
  namespace asyncSystem {
    interface SiteConfig {
      systemInfo: any
      systemSetting: {
        isRegister: boolean
        isCaptcha: boolean
        forgetPassword: boolean
        isInstall: boolean
      }
      systemPath: {
        menuList: string
      }
      systemTheme: any
    }
  }
  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      username: string
      password: string
      captcha: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
      nickname: string
      redirection?: string
    }

    /** 用户信息 */
    interface UserInfo {
      isSuperAdmin: boolean
      buttons: string[]
      info: any
      // userId: number
      // userName: string
      // email: string
      // avatar?: string
      roles: string[]
      token: string
      fastEnter?: FastEnterConfig
    }
    /** 快速入口基础项类型 */
    interface FastEnterBaseItem {
      /** 名称 */
      name: string
      /** 是否启用 */
      enabled?: boolean
      /** 排序权重 */
      order?: number
      /** 路由名称 */
      routeName?: string
      /** 外部链接 */
      link?: string
    }
    /** 快速入口应用项类型 */
    interface FastEnterApplication extends FastEnterBaseItem {
      /** 应用描述 */
      description: string
      /** 图标代码 */
      icon: string
      /** 图标颜色 */
      iconColor: string
    }
    /** 快速入口配置类型 */
    interface FastEnterConfig {
      /** 应用列表 */
      applications: FastEnterApplication[]
      /** 显示条件（屏幕宽度） */
      minWidth?: number
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 字典列表 */
    type DictList = Api.Common.PaginatedResponse<DictListItem>

    /** 字典列表项 */
    interface DictListItem {
      id: number
      model: string
      name: string
      label: string
      sort: number
    }

    /** 字典搜索参数 */
    type DictSearchParams = Partial<
      Pick<DictListItem, 'id' | 'model' | 'name' | 'label'> & Api.Common.CommonSearchParams
    >

    /** 字典分组列表 */
    type DictGroupList = Api.Common.PaginatedResponse<DictGroupListItem>

    /** 字典分组列表项 */
    interface DictGroupListItem {
      id: number
      model: string
      name: string
      label: string
      sort: number
    }

    /** 字典分组搜索参数 */
    type DictGroupSearchParams = Partial<
      Pick<DictGroupListItem, 'id' | 'name' | 'code'> & Api.Common.CommonSearchParams
    >

    /** 字典项列表 */
    type DictItemList = Api.Common.PaginatedResponse<DictItemListItem>

    /** 字典数据项列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >
  }

  /** 安装类型 */
  namespace Install {
    /** 环境检测项 */
    interface EnvironmentItem {
      title: string
      recommend: string
      current: string
    }

    /** 目录权限检测项 */
    interface CatalogueItem {
      dir: string
      path: string
      read: string
      write: string
    }

    /** 环境检测响应 */
    interface DetectionResponse {
      environment: EnvironmentItem[]
      catalogue: CatalogueItem[]
    }
  }
}
