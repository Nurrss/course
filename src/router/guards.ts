import type { NavigationGuardWithThis } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import type { AppRole } from '@/types/domain'

function defaultRouteForRoles(roles: AppRole[]): string {
  if (roles.includes('admin')) return '/admin/overview'
  if (roles.includes('teacher')) return '/teacher/clubs'
  if (roles.includes('curator')) return '/curator/class'
  return '/login'
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

  if (to.path === '/login') {
    return defaultRouteForRoles(profileStore.roles)
  }

  if (to.path === '/') {
    return defaultRouteForRoles(profileStore.roles)
  }

  const requiredRoles = to.meta.roles as AppRole[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const allowed = requiredRoles.some((role) => profileStore.roles.includes(role))
    if (!allowed) {
      return defaultRouteForRoles(profileStore.roles)
    }
  }

  return true
}
