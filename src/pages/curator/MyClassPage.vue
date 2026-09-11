<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
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
  loading.value = true
  try {
    await loadClass()
    await loadStatuses()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить класс'
  } finally {
    loading.value = false
  }
  subscribe()
})

const filteredRows = computed(() => {
  if (!onlyAbsent.value) return rows.value
  return rows.value.filter((r) => r.clubs.some((c) => c.status === 'absent'))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold text-slate-900">
        Мой класс{{ klass ? ` · ${klass.name}` : '' }}
      </h1>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        <input v-model="onlyAbsent" type="checkbox" class="rounded border-slate-300" />
        Только пропустившие
      </label>
    </div>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>
    <p v-else-if="!klass" class="text-sm text-slate-400">Вам ещё не назначен класс.</p>
    <p v-else-if="filteredRows.length === 0" class="text-sm text-slate-400">Никого не найдено.</p>

    <BaseCard v-for="row in filteredRows" :key="row.id" class="!p-0">
      <router-link
        :to="`/curator/students/${row.id}`"
        class="flex items-center justify-between gap-3 p-4 hover:bg-slate-50"
      >
        <p class="font-medium text-slate-900">{{ row.full_name }}</p>
        <div class="flex flex-wrap justify-end gap-1.5">
          <AttendanceStatusBadge v-if="row.clubs.length === 0" status="not_registered" />
          <div v-for="c in row.clubs" :key="c.club_name" class="flex items-center gap-1">
            <span class="text-xs text-slate-400">{{ c.club_name }}:</span>
            <AttendanceStatusBadge :status="c.status" />
          </div>
        </div>
      </router-link>
    </BaseCard>
  </div>
</template>
