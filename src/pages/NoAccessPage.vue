<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ShieldOff } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { useAuth } from '@/composables/useAuth'

const { signOut } = useAuth()
const router = useRouter()

async function onSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <BaseCard class="max-w-sm text-center">
      <div class="mb-3 flex justify-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <ShieldOff class="h-6 w-6" />
        </div>
      </div>
      <h1 class="text-lg font-semibold text-slate-900">Роль ещё не назначена</h1>
      <p class="mt-2 text-sm text-slate-500">
        Ваш аккаунт создан, но администратор ещё не назначил вам роль. Попросите его сделать это в
        разделе «Пользователи», затем войдите снова.
      </p>
      <BaseButton class="mt-5" variant="secondary" full-width @click="onSignOut">Выйти</BaseButton>
    </BaseCard>
  </div>
</template>
