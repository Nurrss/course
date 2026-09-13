<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Mail, Lock, LogIn, TriangleAlert } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { useAuth } from '@/composables/useAuth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await signIn(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось войти'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-indigo-50/40 px-4 py-10"
  >
    <div class="w-full max-w-sm animate-fade-in">
      <div class="mb-6 flex flex-col items-center text-center">
        <div
          class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/30"
        >
          К
        </div>
        <h1 class="text-xl font-semibold text-slate-900">Кружки</h1>
        <p class="mt-1 text-sm text-slate-500">Учёт посещаемости кружков после уроков</p>
      </div>

      <BaseCard>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <BaseInput
            v-model="email"
            type="email"
            label="Email"
            autocomplete="username"
            placeholder="teacher@school.test"
            :icon="Mail"
          />
          <BaseInput
            v-model="password"
            type="password"
            label="Пароль"
            autocomplete="current-password"
            placeholder="••••••••"
            :icon="Lock"
          />

          <div
            v-if="error"
            class="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <BaseButton type="submit" full-width :loading="loading" :icon="LogIn">
            {{ loading ? 'Входим…' : 'Войти' }}
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
