// Транслитерация ФИО в латиницу для автогенерации логина (email), когда его
// не указали явно. Совпадает по алфавиту с копией на сервере
// (supabase/functions/admin-create-users/index.ts) — при правке менять оба места.

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ' ': '.',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9.]+/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
}

/** Подбирает свободный email на основе ФИО, избегая коллизий внутри пачки импорта. */
export function suggestEmail(fullName: string, taken: Set<string>): string {
  const base = slugify(fullName) || 'user'
  let candidate = `${base}@school.local`
  let counter = 2
  while (taken.has(candidate)) {
    candidate = `${base}${counter}@school.local`
    counter += 1
  }
  taken.add(candidate)
  return candidate
}

export function generatePassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += alphabet[randomValues[i] % alphabet.length]
  }
  return result
}
