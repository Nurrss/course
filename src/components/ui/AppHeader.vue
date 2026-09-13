<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LucideIcon } from '@lucide/vue'
import { LogOut } from '@lucide/vue'
import { useProfile } from '@/composables/useProfile'
import { useAuth } from '@/composables/useAuth'
import { ROLE_LABELS, ROLE_HOME } from '@/types/domain'
import type { AppRole } from '@/types/domain'

defineProps<{
  navItems: { label: string; to: string; icon?: LucideIcon }[]
}>()

const { profile, roles, hasMultipleRoles, setActiveRole } = useProfile()
const { signOut } = useAuth()
const router = useRouter()
const route = useRoute()

// Подсвечиваем ту роль, в разделе которой находимся сейчас, а не отдельное
// независимое состояние — иначе бейдж рассинхронизируется при навигации
// назад/вперёд или по прямой ссылке.
const currentRole = computed<AppRole | null>(() => {
  if (route.path.startsWith('/admin')) return 'admin'
  if (route.path.startsWith('/teacher')) return 'teacher'
  if (route.path.startsWith('/curator')) return 'curator'
  return null
})

const initials = computed(() =>
  (profile.value?.full_name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)

async function onRoleSwitch(role: AppRole) {
  setActiveRole(role)
  await router.push(ROLE_HOME[role])
}

async function onSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
    <div class="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
        >
          {{ initials }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">
            {{ profile?.full_name ?? 'Кружки' }}
          </p>
          <div v-if="hasMultipleRoles" class="mt-0.5 flex gap-1">
            <button
              v-for="role in roles"
              :key="role"
              class="rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors"
              :class="
                role === currentRole
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              "
              @click="onRoleSwitch(role)"
            >
              {{ ROLE_LABELS[role] }}
            </button>
          </div>
        </div>
      </div>
      <button
        class="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        @click="onSignOut"
      >
        <LogOut class="h-4 w-4" />
        <span class="hidden sm:inline">Выйти</span>
      </button>
    </div>
    <nav v-if="navItems.length > 1" class="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-2 thin-scrollbar">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
        active-class="!bg-indigo-600 !text-white"
      >
        <component :is="item.icon" v-if="item.icon" class="h-4 w-4" />
        {{ item.label }}
      </router-link>
    </nav>
  </header>
</template>
