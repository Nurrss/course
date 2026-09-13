<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import BaseButton from './BaseButton.vue'

withDefaults(defineProps<{ message: string; retryLabel?: string }>(), {
  retryLabel: 'Повторить',
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-8 text-center"
  >
    <TriangleAlert class="h-6 w-6 text-rose-500" />
    <p class="max-w-sm text-sm text-rose-700">{{ message }}</p>
    <BaseButton size="sm" variant="secondary" @click="emit('retry')">
      {{ retryLabel }}
    </BaseButton>
  </div>
</template>
