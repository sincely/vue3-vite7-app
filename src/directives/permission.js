import { useUserStore } from '@/store/user'

/**
 * 权限指令
 * 使用方法：v-permission="'system:user:add'"
 * 或者：v-permission="['system:user:add', 'system:user:edit']"
 */
function checkPermission(el, binding) {
  const userStore = useUserStore()

  const { value } = binding
  if (!value) return

  if (Array.isArray(value)) {
    if (value.length > 0) {
      const hasPermission = value.some((permission) => userStore.hasPermission(permission))
      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  } else {
    if (!userStore.hasPermission(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}

/**
 * 角色指令
 * 使用方法：v-role="'admin'"
 * 或者：v-role="['admin', 'editor']"
 */
function checkRole(el, binding) {
  const userStore = useUserStore()

  const { value } = binding
  if (!value) return

  if (Array.isArray(value)) {
    if (value.length > 0) {
      const hasRole = value.some((role) => userStore.hasRole(role))
      if (!hasRole) {
        el.parentNode?.removeChild(el)
      }
    }
  } else {
    if (!userStore.hasRole(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}

const permissionDirective = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

const roleDirective = {
  mounted(el, binding) {
    checkRole(el, binding)
  },
  updated(el, binding) {
    checkRole(el, binding)
  }
}

export function setupPermissionDirectives(app) {
  app.directive('permission', permissionDirective)
  app.directive('role', roleDirective)
}
