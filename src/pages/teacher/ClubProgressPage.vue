<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { useClubs } from '@/composables/useClubs'
import { useAttendance, type ClubMemberWithStudent } from '@/composables/useAttendance'
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

const selectedStudentId = ref('')
const title = ref('')
const description = ref('')
const saving = ref(false)
const error = ref<string | null>(null)

async function loadEntries() {
  const { data, error: err } = await supabase
    .from('progress_entries')
    .select('id, student_id, title, description, entry_date')
    .eq('club_id', props.id)
    .order('entry_date', { ascending: false })
  if (err) throw err
  entries.value = data ?? []
}

onMounted(async () => {
  loading.value = true
  const [clubData, membersData] = await Promise.all([fetchClub(props.id), fetchMembers(props.id)])
  club.value = clubData
  members.value = membersData
  await loadEntries()
  loading.value = false
})

function studentName(studentId: string): string {
  return members.value.find((m) => m.student_id === studentId)?.student.full_name ?? '—'
}

async function onSubmit() {
  if (!selectedStudentId.value || !title.value.trim()) return
  saving.value = true
  error.value = null
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
    error.value = e instanceof Error ? e.message : 'Не удалось сохранить запись'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <router-link :to="`/teacher/clubs/${id}`" class="text-sm text-slate-400 hover:text-slate-600">
        ← {{ club?.name ?? 'Кружок' }}
      </router-link>
      <h1 class="mt-1 text-lg font-semibold text-slate-900">Прогресс учеников</h1>
    </div>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>

    <template v-else>
      <BaseCard>
        <form class="space-y-3" @submit.prevent="onSubmit">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Ученик</span>
            <select
              v-model="selectedStudentId"
              class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="" disabled>Выберите ученика</option>
              <option v-for="m in members" :key="m.student_id" :value="m.student_id">
                {{ m.student.full_name }}
              </option>
            </select>
          </label>
          <BaseInput v-model="title" label="Достижение" placeholder="Например, выучил аккорд Am" />
          <BaseInput v-model="description" label="Комментарий (необязательно)" />
          <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
          <BaseButton type="submit" size="sm" :disabled="saving">
            {{ saving ? 'Сохраняем…' : 'Добавить запись' }}
          </BaseButton>
        </form>
      </BaseCard>

      <p v-if="entries.length === 0" class="text-sm text-slate-400">Записей пока нет.</p>
      <BaseCard v-for="entry in entries" :key="entry.id">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium text-slate-900">{{ entry.title }}</p>
            <p class="text-sm text-slate-500">{{ studentName(entry.student_id) }}</p>
            <p v-if="entry.description" class="mt-1 text-sm text-slate-600">{{ entry.description }}</p>
          </div>
          <span class="shrink-0 text-xs text-slate-400">
            {{ new Date(entry.entry_date).toLocaleDateString('ru-RU') }}
          </span>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
