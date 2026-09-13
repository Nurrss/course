// Edge Function: административные операции с пользователями (создание,
// просмотр email, сброс пароля).
//
// Работает под service role ключом (доступен в Deno.env только на сервере,
// никогда не попадает в браузер). Вызывающий должен быть аутентифицирован
// и иметь роль 'admin' — проверяется через has_role() от его собственного
// JWT, то есть по тем же правилам, что и RLS.
//
// Деплой: supabase functions deploy admin-create-users --project-ref <ref>
// (или вставить этот файл в Supabase Studio → Edge Functions → соответствующая
// функция → Deploy).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const ALLOWED_ROLES = ['teacher', 'curator', 'admin'] as const
type AppRole = (typeof ALLOWED_ROLES)[number]

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ' ': '.',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9.]+/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
}

interface IncomingUser {
  full_name: string
  email?: string
  roles: string[]
  password: string
}

interface CreateResultRow {
  full_name: string
  email: string
  roles: string[]
  success: boolean
  error?: string
}

type RequestBody =
  | { action?: 'create'; users: IncomingUser[] }
  | { action: 'get_user'; user_id: string }
  | { action: 'reset_password'; user_id: string; password: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleCreate(adminClient: ReturnType<typeof createClient>, users: IncomingUser[]) {
  if (!Array.isArray(users) || users.length === 0) {
    return json({ error: 'Список пользователей пуст' }, 400)
  }
  if (users.length > 500) {
    return json({ error: 'За один раз можно импортировать не более 500 пользователей' }, 400)
  }

  const results: CreateResultRow[] = []
  const usedEmails = new Set<string>()

  for (const u of users) {
    const fullName = (u.full_name ?? '').trim()
    const password = (u.password ?? '').trim()
    const roles = (u.roles ?? []).filter((r): r is AppRole => ALLOWED_ROLES.includes(r as AppRole))

    if (!fullName || !password || roles.length === 0) {
      results.push({
        full_name: fullName || '—',
        email: u.email ?? '',
        roles,
        success: false,
        error: 'Не хватает имени, пароля или роли',
      })
      continue
    }
    if (password.length < 6) {
      results.push({
        full_name: fullName,
        email: u.email ?? '',
        roles,
        success: false,
        error: 'Пароль короче 6 символов',
      })
      continue
    }

    let email = (u.email ?? '').trim().toLowerCase()
    if (!email) {
      const base = slugify(fullName) || 'user'
      email = `${base}@school.local`
      let counter = 2
      while (usedEmails.has(email)) {
        email = `${base}${counter}@school.local`
        counter += 1
      }
    }
    usedEmails.add(email)

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError || !created.user) {
      results.push({
        full_name: fullName,
        email,
        roles,
        success: false,
        error: createError?.message ?? 'Не удалось создать пользователя',
      })
      continue
    }

    const { error: rolesError } = await adminClient
      .from('user_roles')
      .insert(roles.map((role) => ({ user_id: created.user!.id, role })))

    if (rolesError) {
      results.push({ full_name: fullName, email, roles, success: false, error: rolesError.message })
      continue
    }

    results.push({ full_name: fullName, email, roles, success: true })
  }

  return json({ results })
}

async function handleGetUser(adminClient: ReturnType<typeof createClient>, userId: string) {
  if (!userId) return json({ error: 'Не указан пользователь' }, 400)
  const { data, error } = await adminClient.auth.admin.getUserById(userId)
  if (error || !data.user) {
    return json({ error: error?.message ?? 'Пользователь не найден' }, 404)
  }
  return json({ email: data.user.email ?? '' })
}

async function handleResetPassword(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  password: string,
) {
  if (!userId) return json({ error: 'Не указан пользователь' }, 400)
  const trimmed = (password ?? '').trim()
  if (trimmed.length < 6) {
    return json({ error: 'Пароль должен быть не короче 6 символов' }, 400)
  }
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: trimmed })
  if (error) return json({ error: error.message }, 400)
  return json({ success: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Не авторизован' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Клиент от имени вызывающего — чтобы проверить его права ровно так же,
    // как это делает RLS (has_role читает auth.uid() из его JWT).
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: isAdmin, error: roleCheckError } = await callerClient.rpc('has_role', {
      _role: 'admin',
    })
    if (roleCheckError || !isAdmin) {
      return json({ error: 'Требуются права администратора' }, 403)
    }

    const body = (await req.json()) as RequestBody
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (body.action === 'get_user') {
      return await handleGetUser(adminClient, body.user_id)
    }
    if (body.action === 'reset_password') {
      return await handleResetPassword(adminClient, body.user_id, body.password)
    }
    return await handleCreate(adminClient, body.users)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Внутренняя ошибка сервера' }, 500)
  }
})
