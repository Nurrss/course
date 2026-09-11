<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { supabase } from '@/lib/supabaseClient'

const loading = ref(true)
const error = ref<string | null>(null)

const clubsCount = ref(0)
const classesCount = ref(0)
const studentsCount = ref(0)
const coveredStudentsCount = ref(0)
const weeklyAttendancePercent = ref<number | null>(null)

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const [clubs, classes, students, members, sessions] = await Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('club_members').select('student_id').eq('is_active', true),
      supabase.from('club_sessions').select('id').gte('session_date', isoDaysAgo(7)),
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
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold text-slate-900">Обзор</h1>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>

    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <BaseCard>
        <p class="text-2xl font-semibold text-slate-900">{{ clubsCount }}</p>
        <p class="text-sm text-slate-500">Активных кружков</p>
      </BaseCard>
      <BaseCard>
        <p class="text-2xl font-semibold text-slate-900">{{ classesCount }}</p>
        <p class="text-sm text-slate-500">Классов</p>
      </BaseCard>
      <BaseCard>
        <p class="text-2xl font-semibold text-slate-900">{{ studentsCount }}</p>
        <p class="text-sm text-slate-500">Учеников в школе</p>
      </BaseCard>
      <BaseCard>
        <p class="text-2xl font-semibold text-slate-900">{{ coveredStudentsCount }}</p>
        <p class="text-sm text-slate-500">Охвачено кружками</p>
      </BaseCard>
      <BaseCard>
        <p class="text-2xl font-semibold text-slate-900">
          {{ weeklyAttendancePercent === null ? '—' : `${weeklyAttendancePercent}%` }}
        </p>
        <p class="text-sm text-slate-500">Средняя посещаемость за неделю</p>
      </BaseCard>
    </div>
  </div>
</template>
