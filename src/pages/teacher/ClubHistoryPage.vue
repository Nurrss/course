<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import AttendanceStatusBadge from '@/components/attendance/AttendanceStatusBadge.vue'
import { useClubs } from '@/composables/useClubs'
import { useAttendance, type ClubMemberWithStudent } from '@/composables/useAttendance'
import type { AttendanceRecord, Club, ClubSession } from '@/types/domain'

const props = defineProps<{ id: string }>()

const { fetchClub } = useClubs()
const { fetchMembers, fetchHistory } = useAttendance()

const club = ref<Club | null>(null)
const members = ref<ClubMemberWithStudent[]>([])
const sessions = ref<ClubSession[]>([])
const attendance = ref<AttendanceRecord[]>([])
const loading = ref(true)

const attendanceBySessionAndStudent = computed(() => {
  const map = new Map<string, AttendanceRecord>()
  for (const a of attendance.value) {
    map.set(`${a.session_id}:${a.student_id}`, a)
  }
  return map
})

onMounted(async () => {
  loading.value = true
  const [clubData, membersData, historyData] = await Promise.all([
    fetchClub(props.id),
    fetchMembers(props.id),
    fetchHistory(props.id),
  ])
  club.value = clubData
  members.value = membersData
  sessions.value = historyData.sessions
  attendance.value = historyData.attendance
  loading.value = false
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <router-link :to="`/teacher/clubs/${id}`" class="text-sm text-slate-400 hover:text-slate-600">
        ← {{ club?.name ?? 'Кружок' }}
      </router-link>
      <h1 class="mt-1 text-lg font-semibold text-slate-900">История посещаемости</h1>
    </div>

    <p v-if="loading" class="text-sm text-slate-400">Загрузка…</p>
    <p v-else-if="sessions.length === 0" class="text-sm text-slate-400">Занятий ещё не было.</p>

    <div v-else class="overflow-x-auto">
      <BaseCard>
        <table class="w-full min-w-[480px] text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="py-2 pr-3 font-medium">Ученик</th>
              <th
                v-for="s in sessions"
                :key="s.id"
                class="py-2 px-2 text-center font-medium whitespace-nowrap"
              >
                {{ new Date(s.session_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id" class="border-b border-slate-100 last:border-0">
              <td class="py-2 pr-3 font-medium text-slate-900 whitespace-nowrap">
                {{ m.student.full_name }}
              </td>
              <td v-for="s in sessions" :key="s.id" class="py-2 px-2 text-center">
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
