import { onBeforeUnmount } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

/**
 * Подписывается на изменения посещаемости и занятий в реальном времени.
 * RLS применяется и на Realtime-события, поэтому клиент получит только
 * те строки, которые ему разрешено читать (свой класс / свой кружок).
 */
export function useRealtimeAttendance(onChange: () => void) {
  let channel: RealtimeChannel | null = null

  function subscribe() {
    channel = supabase
      .channel('attendance-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_sessions' }, onChange)
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  onBeforeUnmount(unsubscribe)

  return { subscribe, unsubscribe }
}
