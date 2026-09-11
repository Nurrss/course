import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import type { AppRole, Profile } from '@/types/domain'

const ACTIVE_ROLE_STORAGE_KEY = 'krujki:active-role'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as Profile | null,
    roles: [] as AppRole[],
    activeRole: null as AppRole | null,
    loaded: false,
  }),
  getters: {
    isTeacher: (state) => state.roles.includes('teacher'),
    isCurator: (state) => state.roles.includes('curator'),
    isAdmin: (state) => state.roles.includes('admin'),
    hasMultipleRoles: (state) => state.roles.length > 1,
  },
  actions: {
    async load(userId: string) {
      const [{ data: profile, error: profileError }, { data: rolesRows, error: rolesError }] =
        await Promise.all([
          supabase.from('profiles').select('id, full_name, phone').eq('id', userId).single(),
          supabase.from('user_roles').select('role').eq('user_id', userId),
        ])

      if (profileError) throw profileError
      if (rolesError) throw rolesError

      this.profile = profile
      this.roles = (rolesRows ?? []).map((r) => r.role)

      const stored = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY) as AppRole | null
      this.activeRole =
        stored && this.roles.includes(stored) ? stored : (this.roles[0] ?? null)

      this.loaded = true
    },
    setActiveRole(role: AppRole) {
      if (!this.roles.includes(role)) return
      this.activeRole = role
      localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role)
    },
    reset() {
      this.profile = null
      this.roles = []
      this.activeRole = null
      this.loaded = false
    },
  },
})
