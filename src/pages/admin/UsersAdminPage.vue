<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Info, Users } from '@lucide/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { supabase } from '@/lib/supabaseClient'
import type { AppRole } from '@/types/domain'
import { ROLE_LABELS } from '@/types/domain'

interface UserRow {
  id: string
  full_name: string
  phone: string | null
  roles: AppRole[]
}

const ALL_ROLES: AppRole[] = ['teacher', 'curator', 'admin']

const users = ref<UserRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const busyKey = ref<string | null>(null)

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

async function loadUsers() {
  const [{ data: profiles, error: profilesErr }, { data: roles, error: rolesErr }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').order('full_name', { ascending: true }),
    supabase.from('user_roles').select('user_id, role'),
  ])
  if (profilesErr) throw profilesErr
  if (rolesErr) throw rolesErr

  const rolesByUser = new Map<string, AppRole[]>()
  for (const r of roles ?? []) {
    const list = rolesByUser.get(r.user_id) ?? []
    list.push(r.role)
    rolesByUser.set(r.user_id, list)
  }

  users.value = (profiles ?? []).map((p) => ({
    ...p,
    roles: rolesByUser.get(p.id) ?? [],
  }))
}

async function load() {
  loading.value = true
  error.value = null
  try {
    await loadUsers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить пользователей'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onToggleRole(user: UserRow, role: AppRole) {
  const key = `${user.id}:${role}`
  busyKey.value = key
  error.value = null
  const hasRole = user.roles.includes(role)
  try {
    if (hasRole) {
      const { error: err } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id)
        .eq('role', role)
      if (err) throw err
      user.roles = user.roles.filter((r) => r !== role)
    } else {
      const { error: err } = await supabase.from('user_roles').insert({ user_id: user.id, role })
      if (err) throw err
      user.roles = [...user.roles, role]
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось изменить роль'
  } finally {
    busyKey.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold text-slate-900">Пользователи</h1>

    <div class="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
      <Info class="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Новые аккаунты создаются через приглашение в Supabase (Auth → Invite user), так как это
        требует service role ключа, который не должен попадать в браузер. Здесь можно назначать роли
        уже существующим пользователям.
      </span>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="users.length === 0" :icon="Users" message="Пользователей пока нет." />

    <BaseCard v-for="user in users" :key="user.id">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
          >
            {{ initialsOf(user.full_name) }}
          </div>
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-900">{{ user.full_name }}</p>
            <p v-if="user.phone" class="text-sm text-slate-500">{{ user.phone }}</p>
          </div>
        </div>
        <div class="flex gap-1.5">
          <button
            v-for="role in ALL_ROLES"
            :key="role"
            type="button"
            class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
            :class="
              user.roles.includes(role)
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            "
            :disabled="busyKey === `${user.id}:${role}`"
            @click="onToggleRole(user, role)"
          >
            {{ ROLE_LABELS[role] }}
          </button>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
