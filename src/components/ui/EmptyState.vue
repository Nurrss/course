<script setup lang="ts">
import { Inbox, type LucideIcon } from '@lucide/vue'

withDefaults(defineProps<{ message: string; icon?: LucideIcon }>(), {
  icon: () => Inbox,
})
</script>

<template>
  <div class="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
    <component :is="icon" class="h-7 w-7 stroke-[1.5]" />
    <p class="max-w-xs text-sm">{{ message }}</p>
    <div v-if="$slots.default" class="mt-1">
      <slot />
    </div>
  </div>
</template>
