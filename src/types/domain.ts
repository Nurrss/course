import type { AppRole, AttendanceStatus } from './database.types'

export type { AppRole, AttendanceStatus }

export interface Profile {
  id: string
  full_name: string
  phone: string | null
}

export interface ClassRow {
  id: string
  name: string
  curator_id: string | null
  school_year: string
}

export interface Student {
  id: string
  full_name: string
  class_id: string
  parent_contact: string | null
  is_active: boolean
}

export interface Club {
  id: string
  name: string
  teacher_id: string
  description: string | null
  location: string | null
  schedule_weekday: number | null
  schedule_time: string | null
  is_active: boolean
}

export interface ClubMember {
  id: string
  club_id: string
  student_id: string
  registered_by: string
  registered_at: string
  is_active: boolean
}

export interface ClubSession {
  id: string
  club_id: string
  session_date: string
  created_by: string | null
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  marked_by: string | null
  marked_at: string
  comment: string | null
}

export interface StudentTodayStatus {
  student_id: string
  full_name: string
  class_id: string
  club_id: string
  club_name: string
  session_id: string | null
  session_date: string | null
  attendance_status: AttendanceStatus | null
}

export const ROLE_LABELS: Record<AppRole, string> = {
  teacher: 'Учитель',
  curator: 'Куратор',
  admin: 'Администратор',
}

/** Домашний экран для каждой роли — единый источник для роутера и переключателя ролей. */
export const ROLE_HOME: Record<AppRole, string> = {
  admin: '/admin/overview',
  teacher: '/teacher/clubs',
  curator: '/curator/class',
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Пришёл',
  absent: 'Не пришёл',
  late: 'Опоздал',
}
