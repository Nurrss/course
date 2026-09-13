<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

const authStore = useAuthStore()
const ready = ref(false)

onMounted(async () => {
  await authStore.init()
  ready.value = true
})
</script>

<template>
  <div v-if="!ready" class="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
    <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
      К
    </div>
    <BaseSpinner size="md" />
  </div>
  <router-view v-else />
</template>
