<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LayoutGrid, GraduationCap, Users, UserCheck, Percent, type LucideIcon } from '@lucide/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { supabase } from '@/lib/supabaseClient'
import { daysAgoIso } from '@/lib/date'

const loading = ref(true)
const error = ref<string | null>(null)

const clubsCount = ref(0)
const classesCount = ref(0)
const studentsCount = ref(0)
const coveredStudentsCount = ref(0)
const weeklyAttendancePercent = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [clubs, classes, students, members, sessions] = await Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('club_members').select('student_id').eq('is_active', true),
      supabase.from('club_sessions').select('id').gte('session_date', daysAgoIso(7)),
    ])

    if (clubs.error) throw clubs.error
    if (classes.error) throw classes.error
    if (students.error) throw students.error
    if (members.error) throw members.error
    if (sessions.error) throw sessions.error

    clubsCount.value = clubs.count ?? 0
    classesCount.value = classes.count ?? 0
    studentsCount.value = students.count ?? 0
    coveredStudentsCount.value = new Set((members.data ?? []).map((m) => m.student_id)).size

    const sessionIds = (sessions.data ?? []).map((s) => s.id)
    if (sessionIds.length > 0) {
      const { data: attendance, error: attErr } = await supabase
        .from('attendance')
        .select('status')
        .in('session_id', sessionIds)
      if (attErr) throw attErr
      const total = attendance?.length ?? 0
      const present = (attendance ?? []).filter((a) => a.status === 'present' || a.status === 'late').length
      weeklyAttendancePercent.value = total > 0 ? Math.round((present / total) * 100) : null
    } else {
      weeklyAttendancePercent.value = null
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить статистику'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const stats = computed<{ value: string; label: string; icon: LucideIcon; tone: string }[]>(() => [
  { value: String(clubsCount.value), label: 'Активных кружков', icon: LayoutGrid, tone: 'bg-indigo-50 text-indigo-600' },
  { value: String(classesCount.value), label: 'Классов', icon: GraduationCap, tone: 'bg-violet-50 text-violet-600' },
  { value: String(studentsCount.value), label: 'Учеников в школе', icon: Users, tone: 'bg-slate-100 text-slate-600' },
  { value: String(coveredStudentsCount.value), label: 'Охвачено кружками', icon: UserCheck, tone: 'bg-emerald-50 text-emerald-600' },
  {
    value: weeklyAttendancePercent.value === null ? '—' : `${weeklyAttendancePercent.value}%`,
    label: 'Средняя посещаемость за неделю',
    icon: Percent,
    tone: 'bg-amber-50 text-amber-600',
  },
])
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold text-slate-900">Обзор</h1>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <BaseCard v-for="stat in stats" :key="stat.label">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="stat.tone">
          <component :is="stat.icon" class="h-4 w-4" />
        </div>
        <p class="mt-3 text-2xl font-semibold text-slate-900">{{ stat.value }}</p>
        <p class="text-sm text-slate-500">{{ stat.label }}</p>
      </BaseCard>
    </div>
  </div>
</template>
