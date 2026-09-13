<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose'
    active?: boolean
    as?: 'span' | 'button'
  }>(),
  { tone: 'neutral', active: true, as: 'span' },
)

const tones: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-500',
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
}

const activeTones: Record<string, string> = {
  neutral: 'bg-slate-700 text-white',
  indigo: 'bg-indigo-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-500 text-white',
  rose: 'bg-rose-600 text-white',
}
</script>

<template>
  <component
    :is="as"
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
    :class="active ? activeTones[tone] : tones[tone]"
  >
    <slot />
  </component>
</template>
