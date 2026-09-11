import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    user: null as User | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.session,
  },
  actions: {
    async init() {
      if (this.initialized) return
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user ?? null
      this.initialized = true

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })
    },
    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.session = data.session
      this.user = data.user
    },
    async signOut() {
      await supabase.auth.signOut()
      this.session = null
      this.user = null
    },
  },
})
