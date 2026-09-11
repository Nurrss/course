<script setup lang="ts">
import type { AttendanceStatus } from '@/types/domain'

defineProps<{
  fullName: string
  className?: string
  status: AttendanceStatus | null
  busy?: boolean
}>()

const emit = defineEmits<{ mark: [status: AttendanceStatus] }>()

const buttons: { status: AttendanceStatus; label: string; active: string }[] = [
  { status: 'present', label: 'Пришёл', active: 'bg-emerald-600 text-white' },
  { status: 'late', label: 'Опоздал', active: 'bg-amber-500 text-white' },
  { status: 'absent', label: 'Не пришёл', active: 'bg-rose-600 text-white' },
]
</script>

<template>
  <div class="flex flex-col gap-2 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div class="min-w-0">
      <p class="truncate font-medium text-slate-900">{{ fullName }}</p>
      <p v-if="className" class="text-xs text-slate-400">{{ className }}</p>
    </div>
    <div class="flex shrink-0 gap-1.5" :class="{ 'opacity-50 pointer-events-none': busy }">
      <button
        v-for="btn in buttons"
        :key="btn.status"
        type="button"
        class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
        :class="status === btn.status ? btn.active : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
        @click="emit('mark', btn.status)"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>
