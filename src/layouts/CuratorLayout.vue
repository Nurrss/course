<script setup lang="ts">
import { GraduationCap } from '@lucide/vue'
import AppHeader from '@/components/ui/AppHeader.vue'

const navItems = [{ label: 'Мой класс', to: '/curator/class', icon: GraduationCap }]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader :nav-items="navItems" />
    <main class="mx-auto max-w-4xl px-4 py-5">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
