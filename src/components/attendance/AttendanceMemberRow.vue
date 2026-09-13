<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clock, X } from '@lucide/vue'
import type { AttendanceStatus } from '@/types/domain'

const props = defineProps<{
  fullName: string
  className?: string
  status: AttendanceStatus | null
  busy?: boolean
}>()

const emit = defineEmits<{ mark: [status: AttendanceStatus] }>()

const initials = computed(() =>
  props.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)

const buttons: { status: AttendanceStatus; label: string; icon: typeof Check; active: string }[] = [
  { status: 'present', label: 'Пришёл', icon: Check, active: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' },
  { status: 'late', label: 'Опоздал', icon: Clock, active: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' },
  { status: 'absent', label: 'Не пришёл', icon: X, active: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' },
]
</script>

<template>
  <div
    class="flex flex-col gap-2.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600"
      >
        {{ initials }}
      </div>
      <div class="min-w-0">
        <p class="truncate font-medium text-slate-900">{{ fullName }}</p>
        <p v-if="className" class="text-xs text-slate-400">{{ className }}</p>
      </div>
    </div>
    <div class="flex shrink-0 gap-1.5 pl-12 sm:pl-0" :class="{ 'opacity-50 pointer-events-none': busy }">
      <button
        v-for="btn in buttons"
        :key="btn.status"
        type="button"
        class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95"
        :class="status === btn.status ? btn.active : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
        @click="emit('mark', btn.status)"
      >
        <component :is="btn.icon" class="h-3.5 w-3.5" />
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>
