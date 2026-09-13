<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowLeft, CalendarClock, Sparkles } from '@lucide/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AttendanceStatusBadge from '@/components/attendance/AttendanceStatusBadge.vue'
import { supabase } from '@/lib/supabaseClient'
import { formatIsoDate } from '@/lib/date'
import type { AttendanceStatus, Student } from '@/types/domain'

const props = defineProps<{ id: string }>()

interface HistoryRow {
  id: string
  status: AttendanceStatus
  session_date: string
  club_name: string
}

interface ProgressRow {
  id: string
  title: string
  description: string | null
  entry_date: string
  club_name: string
}

const student = ref<Student | null>(null)
const history = ref<HistoryRow[]>([])
const progress = ref<ProgressRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [{ data: studentData, error: studentErr }, { data: historyData, error: historyErr }, { data: progressData, error: progressErr }] =
      await Promise.all([
        supabase.from('students').select('*').eq('id', props.id).single(),
        supabase
          .from('attendance')
          .select('id, status, session:club_sessions(session_date, club:clubs(name))')
          .eq('student_id', props.id)
          .order('marked_at', { ascending: false }),
        supabase
          .from('progress_entries')
          .select('id, title, description, entry_date, club:clubs(name)')
          .eq('student_id', props.id)
          .order('entry_date', { ascending: false }),
      ])
    if (studentErr) throw studentErr
    if (historyErr) throw historyErr
    if (progressErr) throw progressErr

    student.value = studentData
    history.value = (historyData ?? []).map((r: any) => ({
      id: r.id,
      status: r.status,
      session_date: r.session?.session_date ?? '',
      club_name: r.session?.club?.name ?? '',
    }))
    progress.value = (progressData ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      entry_date: r.entry_date,
      club_name: r.club?.name ?? '',
    }))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить данные ученика'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <router-link
      to="/curator/class"
      class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
    >
      <ArrowLeft class="h-4 w-4" /> Мой класс
    </router-link>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else-if="student">
      <h1 class="text-lg font-semibold text-slate-900">{{ student.full_name }}</h1>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-slate-700">История посещаемости</h2>
        <EmptyState v-if="history.length === 0" :icon="CalendarClock" message="Записей пока нет." />
        <BaseCard v-for="h in history" :key="h.id" padding="sm">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-900">{{ h.club_name }}</p>
              <p class="text-xs text-slate-400">
                {{ h.session_date ? formatIsoDate(h.session_date) : '' }}
              </p>
            </div>
            <AttendanceStatusBadge :status="h.status" />
          </div>
        </BaseCard>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-slate-700">Прогресс</h2>
        <EmptyState v-if="progress.length === 0" :icon="Sparkles" message="Записей о прогрессе пока нет." />
        <BaseCard v-for="p in progress" :key="p.id" padding="sm">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900">{{ p.title }}</p>
              <p class="text-xs text-slate-400">{{ p.club_name }}</p>
              <p v-if="p.description" class="mt-1 text-sm text-slate-600">{{ p.description }}</p>
            </div>
            <span class="shrink-0 text-xs text-slate-400">{{ formatIsoDate(p.entry_date) }}</span>
          </div>
        </BaseCard>
      </section>
    </template>
  </div>
</template>
