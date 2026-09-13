<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Filter, GraduationCap, ChevronRight } from '@lucide/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AttendanceStatusBadge from '@/components/attendance/AttendanceStatusBadge.vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { useRealtimeAttendance } from '@/composables/useRealtimeAttendance'
import type { AttendanceStatus, ClassRow, StudentTodayStatus } from '@/types/domain'

type DisplayStatus = AttendanceStatus | 'not_marked' | 'no_session' | 'not_registered'

interface StudentRow {
  id: string
  full_name: string
  clubs: { club_name: string; status: DisplayStatus }[]
}

const authStore = useAuthStore()
const klass = ref<ClassRow | null>(null)
const rows = ref<StudentRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const onlyAbsent = ref(false)

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function resolveStatus(row: StudentTodayStatus): DisplayStatus {
  if (!row.session_id) return 'no_session'
  return row.attendance_status ?? 'not_marked'
}

async function loadClass() {
  if (!authStore.user) return
  const { data, error: err } = await supabase
    .from('classes')
    .select('*')
    .eq('curator_id', authStore.user.id)
    .limit(1)
    .maybeSingle()
  if (err) throw err
  klass.value = data
}

async function loadStatuses() {
  if (!klass.value) {
    rows.value = []
    return
  }

  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('class_id', klass.value.id)
    .eq('is_active', true)
    .order('full_name', { ascending: true })
  if (studentsErr) throw studentsErr

  const { data: statuses, error: statusesErr } = await supabase
    .from('v_student_today_status')
    .select('*')
    .eq('class_id', klass.value.id)
  if (statusesErr) throw statusesErr

  const byStudent = new Map<string, StudentTodayStatus[]>()
  for (const row of statuses ?? []) {
    const list = byStudent.get(row.student_id) ?? []
    list.push(row)
    byStudent.set(row.student_id, list)
  }

  rows.value = (students ?? []).map((s) => {
    const clubRows = byStudent.get(s.id) ?? []
    return {
      id: s.id,
      full_name: s.full_name,
      clubs: clubRows.map((r) => ({ club_name: r.club_name, status: resolveStatus(r) })),
    }
  })
}

async function load() {
  loading.value = true
  error.value = null
  try {
    await loadClass()
    await loadStatuses()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить класс'
  } finally {
    loading.value = false
  }
}

async function refresh() {
  try {
    error.value = null
    await loadStatuses()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось обновить данные'
  }
}

const { subscribe } = useRealtimeAttendance(refresh)

onMounted(async () => {
  await load()
  subscribe()
})

const filteredRows = computed(() => {
  if (!onlyAbsent.value) return rows.value
  return rows.value.filter((r) => r.clubs.some((c) => c.status === 'absent'))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-lg font-semibold text-slate-900">
        Мой класс<span v-if="klass" class="text-slate-400"> · {{ klass.name }}</span>
      </h1>
      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        :class="onlyAbsent ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'"
        @click="onlyAbsent = !onlyAbsent"
      >
        <Filter class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Только пропустившие</span>
        <span class="sm:hidden">Пропустившие</span>
      </button>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState
      v-else-if="!klass"
      :icon="GraduationCap"
      message="Вам ещё не назначен класс. Обратитесь к администратору."
    />
    <EmptyState
      v-else-if="filteredRows.length === 0"
      message="Никого не найдено."
    />

    <BaseCard v-for="row in filteredRows" :key="row.id" padding="none" interactive>
      <router-link :to="`/curator/students/${row.id}`" class="flex items-center gap-3 p-4">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600"
        >
          {{ initialsOf(row.full_name) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-slate-900">{{ row.full_name }}</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <AttendanceStatusBadge v-if="row.clubs.length === 0" status="not_registered" />
            <div v-for="c in row.clubs" :key="c.club_name" class="flex items-center gap-1">
              <span class="text-xs text-slate-400">{{ c.club_name }}:</span>
              <AttendanceStatusBadge :status="c.status" />
            </div>
          </div>
        </div>
        <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
      </router-link>
    </BaseCard>
  </div>
</template>
