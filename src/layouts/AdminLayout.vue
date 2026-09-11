<script setup lang="ts">
import AppHeader from '@/components/ui/AppHeader.vue'

const navItems = [
  { label: 'Обзор', to: '/admin/overview' },
  { label: 'Кружки', to: '/admin/clubs' },
  { label: 'Классы', to: '/admin/classes' },
  { label: 'Пользователи', to: '/admin/users' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader :nav-items="navItems" />
    <main class="mx-auto max-w-4xl px-4 py-4">
      <router-view />
    </main>
  </div>
</template>
