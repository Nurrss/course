import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Club } from '@/types/domain'
import { useAuthStore } from '@/stores/auth'

export function useClubs() {
  const clubs = ref<Club[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMyClubs() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('clubs')
      .select('*')
      .eq('teacher_id', authStore.user.id)
      .order('created_at', { ascending: true })
    if (err) {
      error.value = err.message
    } else {
      clubs.value = data ?? []
    }
    loading.value = false
  }

  async function createClub(input: {
    name: string
    description?: string
    location?: string
    schedule_weekday?: number | null
    schedule_time?: string | null
  }) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Не авторизован')
    const { data, error: err } = await supabase
      .from('clubs')
      .insert({ ...input, teacher_id: authStore.user.id })
      .select()
      .single()
    if (err) throw err
    clubs.value.push(data)
    return data
  }

  async function fetchClub(id: string): Promise<Club | null> {
    const { data, error: err } = await supabase.from('clubs').select('*').eq('id', id).single()
    if (err) throw err
    return data
  }

  return { clubs, loading, error, fetchMyClubs, createClub, fetchClub }
}
