import type { NavigationGuardWithThis } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { ROLE_HOME } from '@/types/domain'
import type { AppRole } from '@/types/domain'

/**
 * Выбирает домашний экран для пользователя: сначала ту роль, в которой он
 * работал в прошлый раз (запоминается в profileStore), иначе — по приоритету
 * admin → teacher → curator.
 */
function defaultRouteForRoles(roles: AppRole[], preferred: AppRole | null): string {
  if (preferred && roles.includes(preferred)) return ROLE_HOME[preferred]
  if (roles.includes('admin')) return ROLE_HOME.admin
  if (roles.includes('teacher')) return ROLE_HOME.teacher
  if (roles.includes('curator')) return ROLE_HOME.curator
  return '/no-access'
}

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  await authStore.init()

  const isPublic = to.meta.public === true

  if (!authStore.isAuthenticated) {
    if (isPublic) return true
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!profileStore.loaded && authStore.user) {
    try {
      await profileStore.load(authStore.user.id)
    } catch (e) {
      console.error('Не удалось загрузить профиль пользователя', e)
      await authStore.signOut()
      return { path: '/login' }
    }
  }

  if (to.path === '/login' || to.path === '/') {
    return defaultRouteForRoles(profileStore.roles, profileStore.activeRole)
  }

  if (to.path === '/no-access') {
    return profileStore.roles.length > 0
      ? defaultRouteForRoles(profileStore.roles, profileStore.activeRole)
      : true
  }

  const requiredRoles = to.meta.roles as AppRole[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const allowed = requiredRoles.some((role) => profileStore.roles.includes(role))
    if (!allowed) {
      return defaultRouteForRoles(profileStore.roles, profileStore.activeRole)
    }
  }

  return true
}
