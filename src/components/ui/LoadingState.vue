<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

withDefaults(defineProps<{ label?: string }>(), { label: 'Загрузка…' })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
    <BaseSpinner size="lg" />
    <p class="text-sm">{{ label }}</p>
  </div>
</template>
