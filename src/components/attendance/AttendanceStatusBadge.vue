<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clock, X, CircleDashed, HelpCircle, UserX } from '@lucide/vue'
import type { AttendanceStatus } from '@/types/domain'

const props = defineProps<{
  status: AttendanceStatus | 'not_marked' | 'no_session' | 'not_registered' | null
}>()

const config = computed(() => {
  switch (props.status) {
    case 'present':
      return { label: 'Пришёл', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15', icon: Check }
    case 'late':
      return { label: 'Опоздал', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15', icon: Clock }
    case 'absent':
      return { label: 'Не пришёл', classes: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15', icon: X }
    case 'not_marked':
      return { label: 'Ещё не отмечен', classes: 'bg-slate-100 text-slate-500', icon: CircleDashed }
    case 'no_session':
      return { label: 'Занятие ещё не началось', classes: 'bg-slate-100 text-slate-500', icon: Clock }
    case 'not_registered':
      return { label: 'Не записан ни на один кружок', classes: 'bg-slate-50 text-slate-400 italic', icon: UserX }
    default:
      return { label: '—', classes: 'bg-slate-100 text-slate-400', icon: HelpCircle }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
    :class="config.classes"
  >
    <component :is="config.icon" class="h-3 w-3 shrink-0" />
    {{ config.label }}
  </span>
</template>
