<script setup lang="ts">
import AppHeader from '@/components/ui/AppHeader.vue'

const navItems = [{ label: 'Мои кружки', to: '/teacher/clubs' }]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader :nav-items="navItems" />
    <main class="mx-auto max-w-2xl px-4 py-4">
      <router-view />
    </main>
  </div>
</template>
