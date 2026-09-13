<script setup lang="ts">
withDefaults(defineProps<{ interactive?: boolean; padding?: 'none' | 'sm' | 'md' }>(), {
  interactive: false,
  padding: 'md',
})

const paddings: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
}
</script>

<template>
  <div
    class="rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02] transition-colors"
    :class="[paddings[padding], interactive ? 'hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-900/[0.04]' : '']"
  >
    <slot />
  </div>
</template>
