<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowLeft, CalendarClock, Sparkles, Pencil, X, Save } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
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

// --- Редактирование данных ученика ---

const editing = ref(false)
const editName = ref('')
const editContact = ref('')
const editSaving = ref(false)
const editError = ref<string | null>(null)

function toggleEdit() {
  if (!student.value) return
  editing.value = !editing.value
  if (editing.value) {
    editName.value = student.value.full_name
    editContact.value = student.value.parent_contact ?? ''
    editError.value = null
  }
}

async function onSaveStudent() {
  if (!student.value || !editName.value.trim()) return
  editSaving.value = true
  editError.value = null
  try {
    const { error: err } = await supabase
      .from('students')
      .update({ full_name: editName.value.trim(), parent_contact: editContact.value.trim() || null })
      .eq('id', student.value.id)
    if (err) throw err
    student.value.full_name = editName.value.trim()
    student.value.parent_contact = editContact.value.trim() || null
    editing.value = false
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Не удалось сохранить изменения'
  } finally {
    editSaving.value = false
  }
}
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
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-lg font-semibold text-slate-900">{{ student.full_name }}</h1>
        <button
          type="button"
          class="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
          :class="editing ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
          @click="toggleEdit"
        >
          <component :is="editing ? X : Pencil" class="h-3.5 w-3.5" />
          {{ editing ? 'Отмена' : 'Изменить' }}
        </button>
      </div>

      <BaseCard v-if="editing" class="animate-fade-in">
        <div class="space-y-3">
          <BaseInput v-model="editName" label="ФИО" />
          <BaseInput v-model="editContact" label="Контакт родителя" placeholder="+7 700 000 0000" />
          <p v-if="editError" class="text-sm text-rose-600">{{ editError }}</p>
          <BaseButton size="sm" :loading="editSaving" :icon="Save" @click="onSaveStudent">
            Сохранить
          </BaseButton>
        </div>
      </BaseCard>
      <p v-else-if="student.parent_contact" class="text-sm text-slate-500">
        Контакт родителя: {{ student.parent_contact }}
      </p>

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
