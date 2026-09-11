<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
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

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await loadUsers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить пользователей'
  } finally {
    loading.value = false
  }
})

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

    <BaseCard class="bg-indigo-50 text-sm text-indigo-900">
      Новые аккаунты создаются через приглашение в Supabase (Auth → Invite user), так как это
      требует service role ключа, который не должен попадать в браузер. Здесь можно назначать роли
      уже существующим пользователям.
    </BaseCard>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>

    <BaseCard v-for="user in users" :key="user.id">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="font-medium text-slate-900">{{ user.full_name }}</p>
          <p v-if="user.phone" class="text-sm text-slate-500">{{ user.phone }}</p>
        </div>
        <div class="flex gap-1.5">
          <button
            v-for="role in ALL_ROLES"
            :key="role"
            type="button"
            class="rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50"
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
