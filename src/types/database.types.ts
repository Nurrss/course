// Типы БД. Написаны вручную по схеме из supabase/migrations.
// Когда появится подключённый проект Supabase, замените этот файл на
// результат `supabase gen types typescript --local > src/types/database.types.ts`.

export type AppRole = 'teacher' | 'curator' | 'admin'
export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: AppRole
        }
        Insert: {
          id?: string
          user_id: string
          role: AppRole
        }
        Update: {
          id?: string
          user_id?: string
          role?: AppRole
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      classes: {
        Row: {
          id: string
          name: string
          curator_id: string | null
          school_year: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          curator_id?: string | null
          school_year?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          curator_id?: string | null
          school_year?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'classes_curator_id_fkey'
            columns: ['curator_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          id: string
          full_name: string
          class_id: string
          parent_contact: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          class_id: string
          parent_contact?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          class_id?: string
          parent_contact?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'students_class_id_fkey'
            columns: ['class_id']
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      clubs: {
        Row: {
          id: string
          name: string
          teacher_id: string
          description: string | null
          location: string | null
          schedule_weekday: number | null
          schedule_time: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id: string
          description?: string | null
          location?: string | null
          schedule_weekday?: number | null
          schedule_time?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string
          description?: string | null
          location?: string | null
          schedule_weekday?: number | null
          schedule_time?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clubs_teacher_id_fkey'
            columns: ['teacher_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      club_members: {
        Row: {
          id: string
          club_id: string
          student_id: string
          registered_by: string
          registered_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          club_id: string
          student_id: string
          registered_by: string
          registered_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          club_id?: string
          student_id?: string
          registered_by?: string
          registered_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'club_members_club_id_fkey'
            columns: ['club_id']
            referencedRelation: 'clubs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'club_members_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'club_members_registered_by_fkey'
            columns: ['registered_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      club_sessions: {
        Row: {
          id: string
          club_id: string
          session_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          session_date: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          session_date?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'club_sessions_club_id_fkey'
            columns: ['club_id']
            referencedRelation: 'clubs'
            referencedColumns: ['id']
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          session_id: string
          student_id: string
          status: AttendanceStatus
          marked_by: string | null
          marked_at: string
          comment: string | null
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          status?: AttendanceStatus
          marked_by?: string | null
          marked_at?: string
          comment?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          status?: AttendanceStatus
          marked_by?: string | null
          marked_at?: string
          comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'club_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      progress_entries: {
        Row: {
          id: string
          club_id: string
          student_id: string
          session_id: string | null
          entry_date: string
          title: string
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          student_id: string
          session_id?: string | null
          entry_date?: string
          title: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          student_id?: string
          session_id?: string | null
          entry_date?: string
          title?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'progress_entries_club_id_fkey'
            columns: ['club_id']
            referencedRelation: 'clubs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'progress_entries_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      v_student_today_status: {
        Row: {
          student_id: string
          full_name: string
          class_id: string
          club_id: string
          club_name: string
          session_id: string | null
          session_date: string | null
          attendance_status: AttendanceStatus | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: { _role: AppRole }
        Returns: boolean
      }
    }
    Enums: {
      app_role: AppRole
      attendance_status: AttendanceStatus
    }
    CompositeTypes: Record<string, never>
  }
}
