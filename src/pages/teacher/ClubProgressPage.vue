<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowLeft, Sparkles, Send } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { useClubs } from '@/composables/useClubs'
import { useAttendance, type ClubMemberWithStudent } from '@/composables/useAttendance'
import { formatIsoDate } from '@/lib/date'
import type { Club } from '@/types/domain'

interface ProgressEntry {
  id: string
  student_id: string
  title: string
  description: string | null
  entry_date: string
}

const props = defineProps<{ id: string }>()

const { fetchClub } = useClubs()
const { fetchMembers } = useAttendance()
const authStore = useAuthStore()

const club = ref<Club | null>(null)
const members = ref<ClubMemberWithStudent[]>([])
const entries = ref<ProgressEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const selectedStudentId = ref('')
const title = ref('')
const description = ref('')
const saving = ref(false)
const submitError = ref<string | null>(null)

async function loadEntries() {
  const { data, error: err } = await supabase
    .from('progress_entries')
    .select('id, student_id, title, description, entry_date')
    .eq('club_id', props.id)
    .order('entry_date', { ascending: false })
  if (err) throw err
  entries.value = data ?? []
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [clubData, membersData] = await Promise.all([fetchClub(props.id), fetchMembers(props.id)])
    club.value = clubData
    members.value = membersData
    await loadEntries()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить прогресс'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function studentName(studentId: string): string {
  return members.value.find((m) => m.student_id === studentId)?.student.full_name ?? '—'
}

async function onSubmit() {
  if (!selectedStudentId.value || !title.value.trim()) return
  saving.value = true
  submitError.value = null
  try {
    const { error: err } = await supabase.from('progress_entries').insert({
      club_id: props.id,
      student_id: selectedStudentId.value,
      title: title.value.trim(),
      description: description.value.trim() || null,
      created_by: authStore.user?.id,
    })
    if (err) throw err
    title.value = ''
    description.value = ''
    await loadEntries()
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Не удалось сохранить запись'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <router-link
        :to="`/teacher/clubs/${id}`"
        class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft class="h-4 w-4" /> {{ club?.name ?? 'Кружок' }}
      </router-link>
      <h1 class="mt-1 text-lg font-semibold text-slate-900">Прогресс учеников</h1>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <BaseCard>
        <form class="space-y-3" @submit.prevent="onSubmit">
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-slate-700">Ученик</span>
            <select
              v-model="selectedStudentId"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition-shadow focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="" disabled>Выберите ученика</option>
              <option v-for="m in members" :key="m.student_id" :value="m.student_id">
                {{ m.student.full_name }}
              </option>
            </select>
          </label>
          <BaseInput v-model="title" label="Достижение" placeholder="Например, выучил аккорд Am" />
          <BaseInput v-model="description" label="Комментарий (необязательно)" />
          <p v-if="submitError" class="text-sm text-rose-600">{{ submitError }}</p>
          <BaseButton type="submit" size="sm" :loading="saving" :icon="Send">Добавить запись</BaseButton>
        </form>
      </BaseCard>

      <EmptyState v-if="entries.length === 0" :icon="Sparkles" message="Записей о прогрессе пока нет." />
      <BaseCard v-for="entry in entries" :key="entry.id">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-slate-900">{{ entry.title }}</p>
            <p class="text-sm text-slate-500">{{ studentName(entry.student_id) }}</p>
            <p v-if="entry.description" class="mt-1 text-sm text-slate-600">{{ entry.description }}</p>
          </div>
          <span class="shrink-0 text-xs text-slate-400">{{ formatIsoDate(entry.entry_date) }}</span>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
