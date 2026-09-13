<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus, MapPin, ChevronRight, LayoutGrid } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
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
      <BaseButton size="sm" :icon="Plus" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? 'Отмена' : 'Создать кружок' }}
      </BaseButton>
    </div>

    <BaseCard v-if="showCreateForm" class="animate-fade-in">
      <form class="space-y-3" @submit.prevent="onCreate">
        <BaseInput v-model="newClubName" label="Название кружка" placeholder="Например, Гитара" />
        <BaseInput v-model="newClubLocation" label="Место (необязательно)" placeholder="Каб. 12" :icon="MapPin" />
        <p v-if="createError" class="text-sm text-rose-600">{{ createError }}</p>
        <BaseButton type="submit" size="sm" :loading="creating">Создать</BaseButton>
      </form>
    </BaseCard>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchMyClubs" />
    <EmptyState
      v-else-if="clubs.length === 0"
      :icon="LayoutGrid"
      message="У вас пока нет кружков. Создайте первый, чтобы начать отмечать посещаемость."
    />

    <router-link
      v-for="club in clubs"
      :key="club.id"
      :to="`/teacher/clubs/${club.id}`"
      class="block"
    >
      <BaseCard interactive>
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-900">{{ club.name }}</p>
            <p v-if="club.location" class="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
              <MapPin class="h-3.5 w-3.5" />
              {{ club.location }}
            </p>
          </div>
          <ChevronRight class="h-5 w-5 shrink-0 text-slate-300" />
        </div>
      </BaseCard>
    </router-link>
  </div>
</template>
