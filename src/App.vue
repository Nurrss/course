<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const ready = ref(false)

onMounted(async () => {
  await authStore.init()
  ready.value = true
})
</script>

<template>
  <div v-if="!ready" class="flex min-h-screen items-center justify-center text-slate-400">
    Загрузка…
  </div>
  <router-view v-else />
</template>
