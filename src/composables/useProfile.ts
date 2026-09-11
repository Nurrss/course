import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'

export function useProfile() {
  const store = useProfileStore()
  const { profile, roles, activeRole, isTeacher, isCurator, isAdmin, hasMultipleRoles } =
    storeToRefs(store)

  return {
    profile,
    roles,
    activeRole,
    isTeacher,
    isCurator,
    isAdmin,
    hasMultipleRoles,
    setActiveRole: store.setActiveRole,
  }
}
