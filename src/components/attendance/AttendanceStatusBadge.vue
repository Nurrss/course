<script setup lang="ts">
import { computed } from 'vue'
import type { AttendanceStatus } from '@/types/domain'

const props = defineProps<{
  status: AttendanceStatus | 'not_marked' | 'no_session' | 'not_registered' | null
}>()

const config = computed(() => {
  switch (props.status) {
    case 'present':
      return { label: 'Пришёл', classes: 'bg-emerald-100 text-emerald-700' }
    case 'late':
      return { label: 'Опоздал', classes: 'bg-amber-100 text-amber-700' }
    case 'absent':
      return { label: 'Не пришёл', classes: 'bg-rose-100 text-rose-700' }
    case 'not_marked':
      return { label: 'Ещё не отмечен', classes: 'bg-slate-100 text-slate-500' }
    case 'no_session':
      return { label: 'Занятие ещё не началось', classes: 'bg-slate-100 text-slate-500' }
    case 'not_registered':
      return { label: 'Не записан ни на один кружок', classes: 'bg-slate-100 text-slate-400 italic' }
    default:
      return { label: '—', classes: 'bg-slate-100 text-slate-400' }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
    :class="config.classes"
  >
    {{ config.label }}
  </span>
</template>
