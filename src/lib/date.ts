// Все даты в проекте — календарные дни без времени (Postgres `date`), поэтому
// работаем с ними как со строками "YYYY-MM-DD" в локальной таймзоне устройства,
// а не через `Date#toISOString()` (UTC) — иначе "сегодня" и отображаемые даты
// могут съезжать на день в зависимости от часового пояса.

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toLocalIsoDate(new Date())
}

export function daysAgoIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toLocalIsoDate(date)
}

/** Форматирует "YYYY-MM-DD" как календарную дату, без сдвига часовым поясом. */
export function formatIsoDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', options)
}

export function formatShortIsoDate(isoDate: string): string {
  return formatIsoDate(isoDate, { day: '2-digit', month: '2-digit' })
}
