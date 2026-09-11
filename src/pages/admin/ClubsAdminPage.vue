<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { supabase } from '@/lib/supabaseClient'

interface ClubRow {
  id: string
  name: string
  location: string | null
  is_active: boolean
  teacher_id: string
  teacher: { full_name: string } | null
}

interface TeacherOption {
  id: string
  full_name: string
}

const clubs = ref<ClubRow[]>([])
const teachers = ref<TeacherOption[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const newClubName = ref('')
const newClubLocation = ref('')
const newClubTeacherId = ref('')
const creating = ref(false)

async function loadClubs() {
  const { data, error: err } = await supabase
    .from('clubs')
    .select('id, name, location, is_active, teacher_id, teacher:profiles(full_name)')
    .order('created_at', { ascending: true })
  if (err) throw err
  clubs.value = (data ?? []) as unknown as ClubRow[]
}

async function loadTeachers() {
  const { data, error: err } = await supabase
    .from('user_roles')
    .select('user_id, profile:profiles(id, full_name)')
    .eq('role', 'teacher')
  if (err) throw err
  teachers.value = (data ?? [])
    .map((r: any) => r.profile)
    .filter(Boolean)
    .sort((a: TeacherOption, b: TeacherOption) => a.full_name.localeCompare(b.full_name))
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadClubs(), loadTeachers()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить данные'
  } finally {
    loading.value = false
  }
})

async function onCreate() {
  if (!newClubName.value.trim() || !newClubTeacherId.value) return
  creating.value = true
  error.value = null
  try {
    const { error: err } = await supabase.from('clubs').insert({
      name: newClubName.value.trim(),
      location: newClubLocation.value.trim() || null,
      teacher_id: newClubTeacherId.value,
    })
    if (err) throw err
    newClubName.value = ''
    newClubLocation.value = ''
    newClubTeacherId.value = ''
    await loadClubs()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось создать кружок'
  } finally {
    creating.value = false
  }
}

async function onReassignTeacher(club: ClubRow, teacherId: string) {
  const { error: err } = await supabase.from('clubs').update({ teacher_id: teacherId }).eq('id', club.id)
  if (err) {
    error.value = err.message
    return
  }
  await loadClubs()
}

async function onToggleActive(club: ClubRow) {
  const { error: err } = await supabase
    .from('clubs')
    .update({ is_active: !club.is_active })
    .eq('id', club.id)
  if (err) {
    error.value = err.message
    return
  }
  club.is_active = !club.is_active
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold text-slate-900">Кружки</h1>

    <BaseCard>
      <p class="mb-2 text-sm font-medium text-slate-700">Создать кружок</p>
      <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="onCreate">
        <BaseInput v-model="newClubName" label="Название" placeholder="Например, Гитара" />
        <BaseInput v-model="newClubLocation" label="Место" placeholder="Каб. 12" />
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Учитель</span>
          <select
            v-model="newClubTeacherId"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="" disabled>Выберите учителя</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
          </select>
        </label>
        <BaseButton type="submit" size="sm" class="sm:col-span-3 sm:w-fit" :disabled="creating">
          {{ creating ? 'Создаём…' : 'Создать' }}
        </BaseButton>
      </form>
    </BaseCard>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>

    <BaseCard v-for="club in clubs" :key="club.id">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="font-medium text-slate-900">
            {{ club.name }}
            <span v-if="!club.is_active" class="ml-1 text-xs text-slate-400">(неактивен)</span>
          </p>
          <p v-if="club.location" class="text-sm text-slate-500">{{ club.location }}</p>
        </div>
        <div class="flex items-center gap-2">
          <select
            :value="club.teacher_id"
            class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            @change="onReassignTeacher(club, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
          </select>
          <BaseButton size="sm" variant="ghost" @click="onToggleActive(club)">
            {{ club.is_active ? 'Отключить' : 'Включить' }}
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
