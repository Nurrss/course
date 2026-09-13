<script setup lang="ts">
import { LayoutDashboard, LayoutGrid, GraduationCap, Users } from '@lucide/vue'
import AppHeader from '@/components/ui/AppHeader.vue'

const navItems = [
  { label: 'Обзор', to: '/admin/overview', icon: LayoutDashboard },
  { label: 'Кружки', to: '/admin/clubs', icon: LayoutGrid },
  { label: 'Классы', to: '/admin/classes', icon: GraduationCap },
  { label: 'Пользователи', to: '/admin/users', icon: Users },
]
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
