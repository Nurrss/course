<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <h1 class="text-xl font-semibold text-slate-900">Кружки</h1>
        <p class="mt-1 text-sm text-slate-500">Учёт посещаемости кружков</p>
      </div>

      <BaseCard>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <BaseInput
            v-model="email"
            type="email"
            label="Email"
            autocomplete="username"
            placeholder="teacher@school.test"
          />
          <BaseInput
            v-model="password"
            type="password"
            label="Пароль"
            autocomplete="current-password"
            placeholder="••••••••"
          />

          <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>

          <BaseButton type="submit" full-width :disabled="loading">
            {{ loading ? 'Входим…' : 'Войти' }}
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
