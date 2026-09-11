-- RLS-политики и вспомогательные функции
-- Раздел 5 ТЗ

-- ---------------------------------------------------------------------------
-- Вспомогательная функция проверки роли
-- ---------------------------------------------------------------------------
create or replace function has_role(_role app_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

-- ---------------------------------------------------------------------------
-- Автосоздание профиля при регистрации пользователя в auth.users
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles: self or admin can select"
on profiles for select
using (id = auth.uid() or has_role('admin'));

create policy "profiles: self or admin can update"
on profiles for update
using (id = auth.uid() or has_role('admin'))
with check (id = auth.uid() or has_role('admin'));

create policy "profiles: admin can insert"
on profiles for insert
with check (has_role('admin'));

create policy "profiles: admin can delete"
on profiles for delete
using (has_role('admin'));

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------
alter table user_roles enable row level security;

create policy "user_roles: self or admin can select"
on user_roles for select
using (user_id = auth.uid() or has_role('admin'));

create policy "user_roles: admin manages roles"
on user_roles for all
using (has_role('admin'))
with check (has_role('admin'));

-- ---------------------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------------------
alter table classes enable row level security;

create policy "classes: any authenticated user can select"
on classes for select
using (auth.role() = 'authenticated');

create policy "classes: admin manages classes"
on classes for insert
with check (has_role('admin'));

create policy "classes: admin updates classes"
on classes for update
using (has_role('admin'))
with check (has_role('admin'));

create policy "classes: admin deletes classes"
on classes for delete
using (has_role('admin'));

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
alter table students enable row level security;

create policy "students: teacher/curator/admin can select"
on students for select
using (
  has_role('admin')
  or has_role('teacher')
  or exists (
    select 1 from classes cl
    where cl.id = students.class_id and cl.curator_id = auth.uid()
  )
);

create policy "students: curator manages own class students"
on students for insert
with check (
  has_role('admin')
  or exists (
    select 1 from classes cl
    where cl.id = students.class_id and cl.curator_id = auth.uid()
  )
);

create policy "students: curator updates own class students"
on students for update
using (
  has_role('admin')
  or exists (
    select 1 from classes cl
    where cl.id = students.class_id and cl.curator_id = auth.uid()
  )
)
with check (
  has_role('admin')
  or exists (
    select 1 from classes cl
    where cl.id = students.class_id and cl.curator_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- clubs
-- ---------------------------------------------------------------------------
alter table clubs enable row level security;

create policy "clubs: teacher manages own clubs"
on clubs for all
using (teacher_id = auth.uid() or has_role('admin'))
with check (teacher_id = auth.uid() or has_role('admin'));

create policy "clubs: curator and admin read clubs"
on clubs for select
using (has_role('curator') or has_role('admin'));

-- ---------------------------------------------------------------------------
-- club_members
-- ---------------------------------------------------------------------------
alter table club_members enable row level security;

create policy "club_members: teacher manages own club members"
on club_members for all
using (
  exists (select 1 from clubs where clubs.id = club_members.club_id and clubs.teacher_id = auth.uid())
  or has_role('admin')
)
with check (
  exists (select 1 from clubs where clubs.id = club_members.club_id and clubs.teacher_id = auth.uid())
  or has_role('admin')
);

create policy "club_members: curator reads members of own class students"
on club_members for select
using (
  exists (
    select 1 from students s
    join classes cl on cl.id = s.class_id
    where s.id = club_members.student_id and cl.curator_id = auth.uid()
  )
  or has_role('admin')
);

-- ---------------------------------------------------------------------------
-- club_sessions
-- ---------------------------------------------------------------------------
alter table club_sessions enable row level security;

create policy "club_sessions: teacher manages own club sessions"
on club_sessions for all
using (
  exists (select 1 from clubs where clubs.id = club_sessions.club_id and clubs.teacher_id = auth.uid())
  or has_role('admin')
)
with check (
  exists (select 1 from clubs where clubs.id = club_sessions.club_id and clubs.teacher_id = auth.uid())
  or has_role('admin')
);

create policy "club_sessions: curator reads sessions of relevant clubs"
on club_sessions for select
using (
  has_role('admin')
  or exists (
    select 1 from club_members cm
    join students s on s.id = cm.student_id
    join classes cl on cl.id = s.class_id
    where cm.club_id = club_sessions.club_id and cl.curator_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
alter table attendance enable row level security;

create policy "attendance: teacher marks attendance on own sessions"
on attendance for all
using (
  exists (
    select 1 from club_sessions cs
    join clubs c on c.id = cs.club_id
    where cs.id = attendance.session_id and c.teacher_id = auth.uid()
  )
  or has_role('admin')
)
with check (
  exists (
    select 1 from club_sessions cs
    join clubs c on c.id = cs.club_id
    where cs.id = attendance.session_id and c.teacher_id = auth.uid()
  )
  or has_role('admin')
);

create policy "attendance: curator reads attendance of own class students"
on attendance for select
using (
  exists (
    select 1 from students s
    join classes cl on cl.id = s.class_id
    where s.id = attendance.student_id and cl.curator_id = auth.uid()
  )
  or has_role('admin')
);

-- ---------------------------------------------------------------------------
-- progress_entries (Этап 2)
-- ---------------------------------------------------------------------------
alter table progress_entries enable row level security;

create policy "progress_entries: teacher manages own club progress"
on progress_entries for all
using (
  exists (select 1 from clubs where clubs.id = progress_entries.club_id and clubs.teacher_id = auth.uid())
  or has_role('admin')
)
with check (
  exists (select 1 from clubs where clubs.id = progress_entries.club_id and clubs.teacher_id = auth.uid())
  or has_role('admin')
);

create policy "progress_entries: curator reads progress of own class students"
on progress_entries for select
using (
  exists (
    select 1 from students s
    join classes cl on cl.id = s.class_id
    where s.id = progress_entries.student_id and cl.curator_id = auth.uid()
  )
  or has_role('admin')
);
