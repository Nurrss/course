import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const store = useAuthStore()
  const { user, session, isAuthenticated } = storeToRefs(store)

  return {
    user,
    session,
    isAuthenticated,
    signIn: store.signIn,
    signOut: store.signOut,
  }
}
