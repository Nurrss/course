<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, CalendarX } from '@lucide/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AttendanceStatusBadge from '@/components/attendance/AttendanceStatusBadge.vue'
import { useClubs } from '@/composables/useClubs'
import { useAttendance, type ClubMemberWithStudent } from '@/composables/useAttendance'
import { formatShortIsoDate } from '@/lib/date'
import type { AttendanceRecord, Club, ClubSession } from '@/types/domain'

const props = defineProps<{ id: string }>()

const { fetchClub } = useClubs()
const { fetchMembers, fetchHistory } = useAttendance()

const club = ref<Club | null>(null)
const members = ref<ClubMemberWithStudent[]>([])
const sessions = ref<ClubSession[]>([])
const attendance = ref<AttendanceRecord[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const attendanceBySessionAndStudent = computed(() => {
  const map = new Map<string, AttendanceRecord>()
  for (const a of attendance.value) {
    map.set(`${a.session_id}:${a.student_id}`, a)
  }
  return map
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [clubData, membersData, historyData] = await Promise.all([
      fetchClub(props.id),
      fetchMembers(props.id),
      fetchHistory(props.id),
    ])
    club.value = clubData
    members.value = membersData
    sessions.value = historyData.sessions
    attendance.value = historyData.attendance
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить историю посещаемости'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div>
      <router-link
        :to="`/teacher/clubs/${id}`"
        class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft class="h-4 w-4" /> {{ club?.name ?? 'Кружок' }}
      </router-link>
      <h1 class="mt-1 text-lg font-semibold text-slate-900">История посещаемости</h1>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="sessions.length === 0" :icon="CalendarX" message="Занятий ещё не было." />

    <div v-else class="overflow-x-auto thin-scrollbar">
      <BaseCard padding="none">
        <table class="w-full min-w-[480px] text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="py-3 pl-4 pr-3 font-medium">Ученик</th>
              <th
                v-for="s in sessions"
                :key="s.id"
                class="whitespace-nowrap px-2 py-3 text-center font-medium"
              >
                {{ formatShortIsoDate(s.session_date) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id" class="border-b border-slate-100 last:border-0">
              <td class="whitespace-nowrap py-2.5 pl-4 pr-3 font-medium text-slate-900">
                {{ m.student.full_name }}
              </td>
              <td v-for="s in sessions" :key="s.id" class="px-2 py-2.5 text-center">
                <AttendanceStatusBadge
                  :status="attendanceBySessionAndStudent.get(`${s.id}:${m.student_id}`)?.status ?? 'not_marked'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </div>
  </div>
</template>
