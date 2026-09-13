<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as XLSX from 'xlsx'
import {
  Info,
  Users,
  UserPlus,
  FileSpreadsheet,
  Upload,
  Download,
  Dices,
  Eye,
  EyeOff,
  CircleCheck,
  CircleX,
  Pencil,
  X,
  Save,
  KeyRound,
  Mail,
} from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { supabase } from '@/lib/supabaseClient'
import { generatePassword, suggestEmail } from '@/lib/transliterate'
import type { AppRole } from '@/types/domain'
import { ROLE_LABELS } from '@/types/domain'

interface UserRow {
  id: string
  full_name: string
  phone: string | null
  roles: AppRole[]
}

interface NewUserPayload {
  full_name: string
  email?: string
  roles: AppRole[]
  password: string
}

interface CreateResultRow {
  full_name: string
  email: string
  roles: AppRole[]
  success: boolean
  error?: string
}

const ALL_ROLES: AppRole[] = ['teacher', 'curator', 'admin']
const ROLE_TOKEN_MAP: Record<string, AppRole> = {
  учитель: 'teacher',
  teacher: 'teacher',
  куратор: 'curator',
  curator: 'curator',
  администратор: 'admin',
  admin: 'admin',
  админ: 'admin',
}

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

// ---------------------------------------------------------------------------
// Создание и администрирование пользователей — через Edge Function, которая
// одна имеет доступ к service role ключу (создание аккаунта, чужой email,
// сброс пароля обычным ключом сделать нельзя).
// ---------------------------------------------------------------------------

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error: err } = await supabase.functions.invoke<T & { error?: string }>(
    'admin-create-users',
    { body },
  )
  if (err) {
    throw new Error(
      'Не удалось вызвать серверную функцию. Убедитесь, что Edge Function ' +
        '"admin-create-users" задеплоена в вашем проекте Supabase. ' +
        (err.message ?? ''),
    )
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

async function createUsers(payload: NewUserPayload[]): Promise<CreateResultRow[]> {
  const data = await invokeAdmin<{ results?: CreateResultRow[] }>({ users: payload })
  return data.results ?? []
}

// --- Просмотр / редактирование существующего пользователя ---

const editingUserId = ref<string | null>(null)
const editFullName = ref('')
const editPhone = ref('')
const editEmail = ref<string | null>(null)
const editEmailLoading = ref(false)
const editSaving = ref(false)
const editError = ref<string | null>(null)
const editSuccess = ref(false)

const resetPassword = ref('')
const resetShowPassword = ref(false)
const resetSaving = ref(false)
const resetError = ref<string | null>(null)
const resetSuccess = ref(false)

async function toggleEdit(user: UserRow) {
  if (editingUserId.value === user.id) {
    editingUserId.value = null
    return
  }
  editingUserId.value = user.id
  editFullName.value = user.full_name
  editPhone.value = user.phone ?? ''
  editEmail.value = null
  editError.value = null
  editSuccess.value = false
  resetPassword.value = ''
  resetShowPassword.value = false
  resetError.value = null
  resetSuccess.value = false

  editEmailLoading.value = true
  try {
    const data = await invokeAdmin<{ email?: string }>({ action: 'get_user', user_id: user.id })
    editEmail.value = data.email ?? '—'
  } catch (e) {
    editEmail.value = null
    editError.value = e instanceof Error ? e.message : 'Не удалось получить email'
  } finally {
    editEmailLoading.value = false
  }
}

async function onSaveProfile(user: UserRow) {
  const fullName = editFullName.value.trim()
  if (!fullName) {
    editError.value = 'ФИО не может быть пустым'
    return
  }
  editSaving.value = true
  editError.value = null
  editSuccess.value = false
  try {
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: editPhone.value.trim() || null })
      .eq('id', user.id)
    if (err) throw err
    user.full_name = fullName
    user.phone = editPhone.value.trim() || null
    editSuccess.value = true
    await loadUsers()
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Не удалось сохранить изменения'
  } finally {
    editSaving.value = false
  }
}

function fillResetPassword() {
  resetPassword.value = generatePassword()
  resetShowPassword.value = true
}

async function onResetPassword(user: UserRow) {
  resetError.value = null
  resetSuccess.value = false
  if (resetPassword.value.trim().length < 6) {
    resetError.value = 'Пароль должен быть не короче 6 символов'
    return
  }
  resetSaving.value = true
  try {
    await invokeAdmin({ action: 'reset_password', user_id: user.id, password: resetPassword.value.trim() })
    resetSuccess.value = true
    resetPassword.value = ''
    resetShowPassword.value = false
  } catch (e) {
    resetError.value = e instanceof Error ? e.message : 'Не удалось сбросить пароль'
  } finally {
    resetSaving.value = false
  }
}

// --- Форма ручного создания ---

const manualFirstName = ref('')
const manualLastName = ref('')
const manualRoles = ref<AppRole[]>([])
const manualPassword = ref('')
const manualShowPassword = ref(false)
const manualSaving = ref(false)
const manualError = ref<string | null>(null)
const manualResult = ref<CreateResultRow | null>(null)

function toggleManualRole(role: AppRole) {
  manualRoles.value = manualRoles.value.includes(role)
    ? manualRoles.value.filter((r) => r !== role)
    : [...manualRoles.value, role]
}

function fillGeneratedPassword() {
  manualPassword.value = generatePassword()
  manualShowPassword.value = true
}

async function onCreateManual() {
  manualError.value = null
  manualResult.value = null
  const fullName = `${manualFirstName.value.trim()} ${manualLastName.value.trim()}`.trim()
  if (!fullName || manualRoles.value.length === 0 || !manualPassword.value.trim()) {
    manualError.value = 'Укажите имя, фамилию, хотя бы одну роль и пароль'
    return
  }
  manualSaving.value = true
  try {
    const [result] = await createUsers([
      { full_name: fullName, roles: manualRoles.value, password: manualPassword.value.trim() },
    ])
    manualResult.value = result
    if (result.success) {
      manualFirstName.value = ''
      manualLastName.value = ''
      manualRoles.value = []
      manualPassword.value = ''
      manualShowPassword.value = false
      await loadUsers()
    }
  } catch (e) {
    manualError.value = e instanceof Error ? e.message : 'Не удалось создать пользователя'
  } finally {
    manualSaving.value = false
  }
}

// --- Импорт из Excel ---

const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResults = ref<CreateResultRow[]>([])

function parseRoles(cell: string): AppRole[] {
  return cell
    .split(/[,;/]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((token) => ROLE_TOKEN_MAP[token])
    .filter((r): r is AppRole => Boolean(r))
}

async function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importError.value = null
  importResults.value = []
  importing.value = true
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })

    const dataRows = rows.slice(1) // первая строка — заголовки, пропускаем
    const takenEmails = new Set<string>()
    const payload: NewUserPayload[] = []
    const skipped: CreateResultRow[] = []

    for (const row of dataRows) {
      const [firstName, lastName, roleCell, passwordCell] = row.map((c) => (c ?? '').toString().trim())
      if (!firstName && !lastName && !roleCell && !passwordCell) continue // пустая строка

      const fullName = `${firstName} ${lastName}`.trim()
      const roles = parseRoles(roleCell ?? '')
      const password = (passwordCell ?? '').trim()

      if (!fullName || roles.length === 0 || !password) {
        skipped.push({
          full_name: fullName || '—',
          email: '',
          roles,
          success: false,
          error: 'Не хватает имени, роли или пароля в строке',
        })
        continue
      }

      payload.push({
        full_name: fullName,
        email: suggestEmail(fullName, takenEmails),
        roles,
        password,
      })
    }

    if (payload.length === 0 && skipped.length === 0) {
      importError.value = 'Файл пуст или не содержит данных после строки заголовков'
      return
    }

    const created = payload.length > 0 ? await createUsers(payload) : []
    importResults.value = [...created, ...skipped]
    if (created.some((r) => r.success)) {
      await loadUsers()
    }
  } catch (e) {
    importError.value = e instanceof Error ? e.message : 'Не удалось прочитать файл'
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function downloadTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Имя', 'Фамилия', 'Роль', 'Пароль'],
    ['Айгуль', 'Сериковна', 'Куратор', 'Passw0rd1'],
    ['Марат', 'Иванов', 'Учитель, Куратор', 'Passw0rd2'],
  ])
  sheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Пользователи')
  XLSX.writeFile(workbook, 'shablon-polzovateli.xlsx')
}

const importSuccessCount = computed(() => importResults.value.filter((r) => r.success).length)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold text-slate-900">Пользователи</h1>

    <div class="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
      <Info class="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Аккаунт и пароль создаются сразу здесь (форма ниже или импорт из Excel). Email для входа
        подбирается автоматически из ФИО — он появится в результатах, передайте его человеку вместе
        с паролем. Если нужен вход через приглашение по личной почте — используйте Supabase
        (Auth → Invite user).
      </span>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <BaseCard>
        <p class="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <UserPlus class="h-4 w-4" /> Создать вручную
        </p>
        <form class="space-y-3" @submit.prevent="onCreateManual">
          <div class="grid grid-cols-2 gap-3">
            <BaseInput v-model="manualFirstName" label="Имя" placeholder="Айгуль" />
            <BaseInput v-model="manualLastName" label="Фамилия" placeholder="Сериковна" />
          </div>

          <div>
            <span class="mb-1.5 block text-sm font-medium text-slate-700">Роль</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="role in ALL_ROLES"
                :key="role"
                type="button"
                class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                :class="
                  manualRoles.includes(role)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                "
                @click="toggleManualRole(role)"
              >
                {{ ROLE_LABELS[role] }}
              </button>
            </div>
          </div>

          <div class="flex items-end gap-2">
            <BaseInput
              v-model="manualPassword"
              label="Пароль"
              :type="manualShowPassword ? 'text' : 'password'"
              placeholder="Минимум 6 символов"
              class="flex-1"
            />
            <button
              type="button"
              class="mb-0.5 rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
              title="Показать/скрыть пароль"
              @click="manualShowPassword = !manualShowPassword"
            >
              <component :is="manualShowPassword ? EyeOff : Eye" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="mb-0.5 rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
              title="Сгенерировать пароль"
              @click="fillGeneratedPassword"
            >
              <Dices class="h-4 w-4" />
            </button>
          </div>

          <p v-if="manualError" class="text-sm text-rose-600">{{ manualError }}</p>
          <div
            v-if="manualResult"
            class="rounded-lg px-3 py-2 text-sm"
            :class="manualResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
          >
            <template v-if="manualResult.success">
              Создано: <strong>{{ manualResult.email }}</strong>
            </template>
            <template v-else>{{ manualResult.error }}</template>
          </div>

          <BaseButton type="submit" size="sm" :loading="manualSaving" :icon="UserPlus">
            Создать пользователя
          </BaseButton>
        </form>
      </BaseCard>

      <BaseCard>
        <p class="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <FileSpreadsheet class="h-4 w-4" /> Импорт из Excel
        </p>
        <p class="mb-2 text-sm text-slate-500">Формат файла — 4 столбца, первая строка с заголовками:</p>
        <div class="mb-3 overflow-x-auto rounded-lg border border-slate-200 thin-scrollbar">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500">
                <th class="px-2 py-1.5 text-left font-medium">Имя</th>
                <th class="px-2 py-1.5 text-left font-medium">Фамилия</th>
                <th class="px-2 py-1.5 text-left font-medium">Роль</th>
                <th class="px-2 py-1.5 text-left font-medium">Пароль</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-slate-600">
                <td class="px-2 py-1.5">Айгуль</td>
                <td class="px-2 py-1.5">Сериковна</td>
                <td class="px-2 py-1.5">Куратор</td>
                <td class="px-2 py-1.5">Passw0rd1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mb-3 text-xs text-slate-400">
          В «Роль» можно указать несколько через запятую (например «Учитель, Куратор») — это для
          людей, совмещающих роли. Email для входа подберётся автоматически.
        </p>

        <div class="flex flex-wrap gap-2">
          <BaseButton size="sm" variant="secondary" :icon="Download" @click="downloadTemplate">
            Скачать шаблон
          </BaseButton>
          <BaseButton
            size="sm"
            :loading="importing"
            :icon="Upload"
            @click="fileInput?.click()"
          >
            Выбрать файл
          </BaseButton>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            class="hidden"
            @change="onFileSelected"
          />
        </div>

        <p v-if="importError" class="mt-3 text-sm text-rose-600">{{ importError }}</p>

        <div v-if="importResults.length > 0" class="mt-4 space-y-2">
          <p class="text-sm font-medium text-slate-700">
            Готово: {{ importSuccessCount }} из {{ importResults.length }}
          </p>
          <div class="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
            <div
              v-for="(r, i) in importResults"
              :key="i"
              class="flex items-start gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0"
            >
              <component
                :is="r.success ? CircleCheck : CircleX"
                class="mt-0.5 h-4 w-4 shrink-0"
                :class="r.success ? 'text-emerald-500' : 'text-rose-500'"
              />
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-900">{{ r.full_name }}</p>
                <p v-if="r.success" class="text-xs text-slate-500">{{ r.email }}</p>
                <p v-else class="text-xs text-rose-600">{{ r.error }}</p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
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
        <div class="flex items-center gap-2">
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
          <button
            type="button"
            class="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
            :class="editingUserId === user.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
            @click="toggleEdit(user)"
          >
            <component :is="editingUserId === user.id ? X : Pencil" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div v-if="editingUserId === user.id" class="mt-4 space-y-4 border-t border-slate-100 pt-4">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <Mail class="h-4 w-4 shrink-0" />
          <span v-if="editEmailLoading">Загружаем email…</span>
          <span v-else-if="editEmail">{{ editEmail }}</span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <BaseInput v-model="editFullName" label="ФИО" />
          <BaseInput v-model="editPhone" label="Телефон" placeholder="+7 700 000 0000" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <BaseButton size="sm" :loading="editSaving" :icon="Save" @click="onSaveProfile(user)">
            Сохранить
          </BaseButton>
          <p v-if="editSuccess" class="text-sm text-emerald-600">Сохранено</p>
          <p v-if="editError" class="text-sm text-rose-600">{{ editError }}</p>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <KeyRound class="h-4 w-4" /> Сбросить пароль
          </p>
          <div class="flex flex-wrap items-end gap-2">
            <BaseInput
              v-model="resetPassword"
              :type="resetShowPassword ? 'text' : 'password'"
              placeholder="Новый пароль"
              class="max-w-[220px]"
            />
            <button
              type="button"
              class="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
              title="Показать/скрыть пароль"
              @click="resetShowPassword = !resetShowPassword"
            >
              <component :is="resetShowPassword ? EyeOff : Eye" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
              title="Сгенерировать пароль"
              @click="fillResetPassword"
            >
              <Dices class="h-4 w-4" />
            </button>
            <BaseButton size="sm" variant="secondary" :loading="resetSaving" @click="onResetPassword(user)">
              Сбросить
            </BaseButton>
          </div>
          <p v-if="resetSuccess" class="mt-2 text-sm text-emerald-600">Пароль обновлён</p>
          <p v-if="resetError" class="mt-2 text-sm text-rose-600">{{ resetError }}</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
