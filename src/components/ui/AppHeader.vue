<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProfile } from '@/composables/useProfile'
import { useAuth } from '@/composables/useAuth'
import { ROLE_LABELS } from '@/types/domain'

defineProps<{
  navItems: { label: string; to: string }[]
}>()

const { profile, roles, activeRole, hasMultipleRoles, setActiveRole } = useProfile()
const { signOut } = useAuth()
const router = useRouter()

async function onRoleSwitch(role: (typeof roles.value)[number]) {
  setActiveRole(role)
  if (role === 'admin') await router.push('/admin/overview')
  if (role === 'teacher') await router.push('/teacher/clubs')
  if (role === 'curator') await router.push('/curator/class')
}

async function onSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="flex items-center justify-between gap-2 px-4 py-3">
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-slate-900">
          {{ profile?.full_name ?? 'Кружки' }}
        </p>
        <div v-if="hasMultipleRoles" class="mt-1 flex gap-1">
          <button
            v-for="role in roles"
            :key="role"
            class="rounded-full px-2 py-0.5 text-xs font-medium transition"
            :class="
              role === activeRole
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            "
            @click="onRoleSwitch(role)"
          >
            {{ ROLE_LABELS[role] }}
          </button>
        </div>
      </div>
      <button
        class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
        @click="onSignOut"
      >
        Выйти
      </button>
    </div>
    <nav v-if="navItems.length > 1" class="flex gap-1 overflow-x-auto px-4 pb-2">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        active-class="!bg-indigo-600 !text-white"
      >
        {{ item.label }}
      </router-link>
    </nav>
  </header>
</template>
