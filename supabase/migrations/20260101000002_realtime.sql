-- Включаем Realtime для таблиц, которые слушает куратор (раздел 8 ТЗ)

alter publication supabase_realtime add table attendance;
alter publication supabase_realtime add table club_sessions;
