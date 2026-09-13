import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { todayIso } from '@/lib/date'
import type { AttendanceRecord, AttendanceStatus, ClubMember, ClubSession, Student } from '@/types/domain'

export interface ClubMemberWithStudent extends ClubMember {
  student: Student
}

export function useAttendance() {
  async function findTodaySession(clubId: string): Promise<ClubSession | null> {
    const { data, error } = await supabase
      .from('club_sessions')
      .select('*')
      .eq('club_id', clubId)
      .eq('session_date', todayIso())
      .maybeSingle()
    if (error) throw error
    return data
  }

  async function getOrCreateTodaySession(clubId: string): Promise<ClubSession> {
    const authStore = useAuthStore()
    const date = todayIso()

    const { data: existing, error: findErr } = await supabase
      .from('club_sessions')
      .select('*')
      .eq('club_id', clubId)
      .eq('session_date', date)
      .maybeSingle()
    if (findErr) throw findErr
    if (existing) return existing

    const { data: created, error: createErr } = await supabase
      .from('club_sessions')
      .insert({ club_id: clubId, session_date: date, created_by: authStore.user?.id })
      .select()
      .single()
    if (createErr) throw createErr
    return created
  }

  async function fetchMembers(clubId: string): Promise<ClubMemberWithStudent[]> {
    const { data, error } = await supabase
      .from('club_members')
      .select('*, student:students(*)')
      .eq('club_id', clubId)
      .eq('is_active', true)
      .order('registered_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as ClubMemberWithStudent[]
  }

  async function fetchAttendanceForSession(
    sessionId: string,
  ): Promise<Map<string, AttendanceRecord>> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId)
    if (error) throw error
    const map = new Map<string, AttendanceRecord>()
    for (const row of data ?? []) {
      map.set(row.student_id, row)
    }
    return map
  }

  async function setAttendance(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
  ): Promise<AttendanceRecord> {
    const authStore = useAuthStore()
    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          status,
          marked_by: authStore.user?.id,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,student_id' },
      )
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function searchStudents(query: string): Promise<(Student & { class_name: string })[]> {
    if (!query.trim()) return []
    const { data, error } = await supabase
      .from('students')
      .select('*, class:classes(name)')
      .ilike('full_name', `%${query.trim()}%`)
      .eq('is_active', true)
      .limit(20)
    if (error) throw error
    return (data ?? []).map((s: any) => ({ ...s, class_name: s.class?.name ?? '' }))
  }

  async function addMember(clubId: string, studentId: string): Promise<ClubMemberWithStudent> {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Не авторизован')
    const { data, error } = await supabase
      .from('club_members')
      .upsert(
        {
          club_id: clubId,
          student_id: studentId,
          registered_by: authStore.user.id,
          is_active: true,
        },
        { onConflict: 'club_id,student_id' },
      )
      .select('*, student:students(*)')
      .single()
    if (error) throw error
    return data as unknown as ClubMemberWithStudent
  }

  async function removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('club_members')
      .update({ is_active: false })
      .eq('id', memberId)
    if (error) throw error
  }

  async function fetchHistory(clubId: string) {
    const { data: sessions, error: sessionsErr } = await supabase
      .from('club_sessions')
      .select('*')
      .eq('club_id', clubId)
      .order('session_date', { ascending: false })
    if (sessionsErr) throw sessionsErr

    const sessionIds = (sessions ?? []).map((s) => s.id)
    if (sessionIds.length === 0) return { sessions: [], attendance: [] as AttendanceRecord[] }

    const { data: attendance, error: attendanceErr } = await supabase
      .from('attendance')
      .select('*')
      .in('session_id', sessionIds)
    if (attendanceErr) throw attendanceErr

    return { sessions: sessions ?? [], attendance: attendance ?? [] }
  }

  return {
    findTodaySession,
    getOrCreateTodaySession,
    fetchMembers,
    fetchAttendanceForSession,
    setAttendance,
    searchStudents,
    addMember,
    removeMember,
    fetchHistory,
  }
}
