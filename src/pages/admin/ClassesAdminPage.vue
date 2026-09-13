<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus, Users, GraduationCap } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { supabase } from '@/lib/supabaseClient'

interface ClassRowUi {
  id: string
  name: string
  school_year: string
  curator_id: string | null
  curator: { full_name: string } | null
  student_count: number
}

interface CuratorOption {
  id: string
  full_name: string
}

const classes = ref<ClassRowUi[]>([])
const curators = ref<CuratorOption[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const newClassName = ref('')
const newClassCuratorId = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

async function loadClasses() {
  const { data, error: err } = await supabase
    .from('classes')
    .select('id, name, school_year, curator_id, curator:profiles(full_name), students(count)')
    .order('name', { ascending: true })
  if (err) throw err
  classes.value = (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    school_year: c.school_year,
    curator_id: c.curator_id,
    curator: c.curator,
    student_count: c.students?.[0]?.count ?? 0,
  }))
}

async function loadCurators() {
  const { data, error: err } = await supabase
    .from('user_roles')
    .select('user_id, profile:profiles(id, full_name)')
    .eq('role', 'curator')
  if (err) throw err
  curators.value = (data ?? [])
    .map((r: any) => r.profile)
    .filter(Boolean)
    .sort((a: CuratorOption, b: CuratorOption) => a.full_name.localeCompare(b.full_name))
}

async function load() {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadClasses(), loadCurators()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить данные'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onCreate() {
  if (!newClassName.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    const { error: err } = await supabase.from('classes').insert({
      name: newClassName.value.trim(),
      curator_id: newClassCuratorId.value || null,
    })
    if (err) throw err
    newClassName.value = ''
    newClassCuratorId.value = ''
    await loadClasses()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Не удалось создать класс'
  } finally {
    creating.value = false
  }
}

async function onReassignCurator(klass: ClassRowUi, curatorId: string) {
  const { error: err } = await supabase
    .from('classes')
    .update({ curator_id: curatorId || null })
    .eq('id', klass.id)
  if (err) {
    error.value = err.message
    return
  }
  await loadClasses()
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold text-slate-900">Классы</h1>

    <BaseCard>
      <p class="mb-3 text-sm font-medium text-slate-700">Создать класс</p>
      <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="onCreate">
        <BaseInput v-model="newClassName" label="Название" placeholder="Например, 9А" />
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Куратор (необязательно)</span>
          <select
            v-model="newClassCuratorId"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition-shadow focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="">Не назначен</option>
            <option v-for="c in curators" :key="c.id" :value="c.id">{{ c.full_name }}</option>
          </select>
        </label>
        <p v-if="createError" class="text-sm text-rose-600 sm:col-span-3">{{ createError }}</p>
        <BaseButton type="submit" size="sm" class="sm:col-span-3 sm:w-fit" :loading="creating" :icon="Plus">
          Создать
        </BaseButton>
      </form>
    </BaseCard>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="classes.length === 0" :icon="GraduationCap" message="Классов пока нет." />

    <BaseCard v-for="klass in classes" :key="klass.id">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="font-medium text-slate-900">{{ klass.name }}</p>
          <p class="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <Users class="h-3.5 w-3.5" /> {{ klass.student_count }} учеников · {{ klass.school_year }} уч. год
          </p>
        </div>
        <select
          :value="klass.curator_id ?? ''"
          class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
          @change="onReassignCurator(klass, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Не назначен</option>
          <option v-for="c in curators" :key="c.id" :value="c.id">{{ c.full_name }}</option>
        </select>
      </div>
    </BaseCard>
  </div>
</template>
