<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
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

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadClasses(), loadCurators()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить данные'
  } finally {
    loading.value = false
  }
})

async function onCreate() {
  if (!newClassName.value.trim()) return
  creating.value = true
  error.value = null
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
    error.value = e instanceof Error ? e.message : 'Не удалось создать класс'
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
      <p class="mb-2 text-sm font-medium text-slate-700">Создать класс</p>
      <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="onCreate">
        <BaseInput v-model="newClassName" label="Название" placeholder="Например, 9А" />
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Куратор (необязательно)</span>
          <select
            v-model="newClassCuratorId"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Не назначен</option>
            <option v-for="c in curators" :key="c.id" :value="c.id">{{ c.full_name }}</option>
          </select>
        </label>
        <BaseButton type="submit" size="sm" class="sm:col-span-3 sm:w-fit" :disabled="creating">
          {{ creating ? 'Создаём…' : 'Создать' }}
        </BaseButton>
      </form>
    </BaseCard>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>

    <BaseCard v-for="klass in classes" :key="klass.id">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="font-medium text-slate-900">{{ klass.name }}</p>
          <p class="text-sm text-slate-500">{{ klass.student_count }} учеников · {{ klass.school_year }} уч. год</p>
        </div>
        <select
          :value="klass.curator_id ?? ''"
          class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          @change="onReassignCurator(klass, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Не назначен</option>
          <option v-for="c in curators" :key="c.id" :value="c.id">{{ c.full_name }}</option>
        </select>
      </div>
    </BaseCard>
  </div>
</template>
