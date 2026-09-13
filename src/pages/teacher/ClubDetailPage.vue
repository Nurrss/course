<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, History, TrendingUp, PlayCircle, Search, UserPlus, Users } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AttendanceMemberRow from '@/components/attendance/AttendanceMemberRow.vue'
import { useClubs } from '@/composables/useClubs'
import { useAttendance, type ClubMemberWithStudent } from '@/composables/useAttendance'
import type { AttendanceStatus, AttendanceRecord, Club, ClubSession, Student } from '@/types/domain'

const props = defineProps<{ id: string }>()

const { fetchClub } = useClubs()
const {
  findTodaySession,
  getOrCreateTodaySession,
  fetchMembers,
  fetchAttendanceForSession,
  setAttendance,
  searchStudents,
  addMember,
} = useAttendance()

const club = ref<Club | null>(null)
const session = ref<ClubSession | null>(null)
const members = ref<ClubMemberWithStudent[]>([])
const attendanceMap = ref<Map<string, AttendanceRecord>>(new Map())
const loading = ref(true)
const loadError = ref<string | null>(null)
const startingSession = ref(false)
const busyStudentId = ref<string | null>(null)
const actionError = ref<string | null>(null)

const query = ref('')
const searchResults = ref<(Student & { class_name: string })[]>([])
const searching = ref(false)

const presentCount = computed(
  () => [...attendanceMap.value.values()].filter((a) => a.status === 'present').length,
)

async function loadAll() {
  loading.value = true
  loadError.value = null
  try {
    const [clubData, membersData, sessionData] = await Promise.all([
      fetchClub(props.id),
      fetchMembers(props.id),
      findTodaySession(props.id),
    ])
    club.value = clubData
    members.value = membersData
    session.value = sessionData
    if (sessionData) {
      attendanceMap.value = await fetchAttendanceForSession(sessionData.id)
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить данные кружка'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

async function onStartSession() {
  startingSession.value = true
  actionError.value = null
  try {
    session.value = await getOrCreateTodaySession(props.id)
    attendanceMap.value = await fetchAttendanceForSession(session.value.id)
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Не удалось начать занятие'
  } finally {
    startingSession.value = false
  }
}

async function onMark(studentId: string, status: AttendanceStatus) {
  if (!session.value) return
  busyStudentId.value = studentId
  actionError.value = null
  const prev = attendanceMap.value.get(studentId)
  try {
    const record = await setAttendance(session.value.id, studentId, status)
    attendanceMap.value.set(studentId, record)
    attendanceMap.value = new Map(attendanceMap.value)
  } catch (e) {
    if (prev) attendanceMap.value.set(studentId, prev)
    actionError.value = e instanceof Error ? e.message : 'Не удалось сохранить отметку'
  } finally {
    busyStudentId.value = null
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, (value) => {
  clearTimeout(searchTimer)
  if (!value.trim()) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const results = await searchStudents(value)
      const memberIds = new Set(members.value.map((m) => m.student_id))
      searchResults.value = results.filter((s) => !memberIds.has(s.id))
    } finally {
      searching.value = false
    }
  }, 300)
})

async function onAddStudent(studentId: string) {
  actionError.value = null
  try {
    const member = await addMember(props.id, studentId)
    members.value.push(member)
    searchResults.value = searchResults.value.filter((s) => s.id !== studentId)
    query.value = ''
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Не удалось добавить ученика'
  }
}
</script>

<template>
  <div class="space-y-4">
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadAll" />

    <template v-else-if="club">
      <div>
        <router-link
          to="/teacher/clubs"
          class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft class="h-4 w-4" /> Мои кружки
        </router-link>
        <div class="mt-1 flex items-center justify-between">
          <h1 class="text-lg font-semibold text-slate-900">{{ club.name }}</h1>
          <div class="flex gap-3 text-sm">
            <router-link
              :to="`/teacher/clubs/${id}/history`"
              class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
            >
              <History class="h-4 w-4" /> История
            </router-link>
            <router-link
              :to="`/teacher/clubs/${id}/progress`"
              class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
            >
              <TrendingUp class="h-4 w-4" /> Прогресс
            </router-link>
          </div>
        </div>
      </div>

      <div
        v-if="actionError"
        class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
      >
        {{ actionError }}
      </div>

      <BaseCard v-if="!session">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-slate-500">Занятие на сегодня ещё не начато.</p>
          <BaseButton size="sm" :loading="startingSession" :icon="PlayCircle" @click="onStartSession">
            Начать занятие
          </BaseButton>
        </div>
      </BaseCard>

      <template v-else>
        <div class="flex items-center justify-between text-sm text-slate-500">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Занятие сегодня
          </span>
          <span class="font-medium text-slate-700">Пришло {{ presentCount }} из {{ members.length }}</span>
        </div>

        <BaseCard>
          <EmptyState
            v-if="members.length === 0"
            :icon="Users"
            message="В кружке пока нет учеников. Добавьте их ниже."
          />
          <AttendanceMemberRow
            v-for="member in members"
            :key="member.id"
            :full-name="member.student.full_name"
            :status="attendanceMap.get(member.student_id)?.status ?? null"
            :busy="busyStudentId === member.student_id"
            @mark="(status) => onMark(member.student_id, status)"
          />
        </BaseCard>
      </template>

      <BaseCard>
        <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <UserPlus class="h-4 w-4" /> Добавить ученика
        </p>
        <BaseInput v-model="query" placeholder="Поиск по ФИО…" :icon="Search" />
        <p v-if="searching" class="mt-2 text-xs text-slate-400">Ищем…</p>
        <div v-else-if="searchResults.length > 0" class="mt-2 space-y-1">
          <button
            v-for="s in searchResults"
            :key="s.id"
            type="button"
            class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-slate-50"
            @click="onAddStudent(s.id)"
          >
            <span>{{ s.full_name }} <span class="text-slate-400">· {{ s.class_name }}</span></span>
            <span class="font-medium text-indigo-600">Добавить</span>
          </button>
        </div>
        <p v-else-if="query.trim()" class="mt-2 text-xs text-slate-400">Никого не найдено.</p>
      </BaseCard>
    </template>
  </div>
</template>
