<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const sizes: Record<string, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
}
</script>

<template>
  <span
    class="inline-block animate-spin rounded-full border-slate-200 border-t-indigo-600"
    :class="sizes[size]"
    role="status"
    aria-label="Загрузка"
  />
</template>
