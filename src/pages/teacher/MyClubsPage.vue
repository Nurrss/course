<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useClubs } from '@/composables/useClubs'

const { clubs, loading, error, fetchMyClubs, createClub } = useClubs()

const showCreateForm = ref(false)
const newClubName = ref('')
const newClubLocation = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

onMounted(fetchMyClubs)

async function onCreate() {
  if (!newClubName.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    await createClub({ name: newClubName.value.trim(), location: newClubLocation.value.trim() || undefined })
    newClubName.value = ''
    newClubLocation.value = ''
    showCreateForm.value = false
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Не удалось создать кружок'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold text-slate-900">Мои кружки</h1>
      <BaseButton size="sm" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? 'Отмена' : '+ Создать кружок' }}
      </BaseButton>
    </div>

    <BaseCard v-if="showCreateForm">
      <form class="space-y-3" @submit.prevent="onCreate">
        <BaseInput v-model="newClubName" label="Название кружка" placeholder="Например, Гитара" />
        <BaseInput v-model="newClubLocation" label="Место (необязательно)" placeholder="Каб. 12" />
        <p v-if="createError" class="text-sm text-rose-600">{{ createError }}</p>
        <BaseButton type="submit" size="sm" :disabled="creating">
          {{ creating ? 'Создаём…' : 'Создать' }}
        </BaseButton>
      </form>
    </BaseCard>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>
    <p v-else-if="clubs.length === 0" class="text-sm text-slate-400">
      У вас пока нет кружков. Создайте первый.
    </p>

    <router-link
      v-for="club in clubs"
      :key="club.id"
      :to="`/teacher/clubs/${club.id}`"
      class="block"
    >
      <BaseCard class="transition hover:border-indigo-300">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900">{{ club.name }}</p>
            <p v-if="club.location" class="text-sm text-slate-500">{{ club.location }}</p>
          </div>
          <span class="text-slate-300">→</span>
        </div>
      </BaseCard>
    </router-link>
  </div>
</template>
