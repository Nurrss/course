-- Платформа учёта посещаемости кружков — начальная схема
-- Раздел 4 ТЗ

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Профили пользователей
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Роли (many-to-many)
-- ---------------------------------------------------------------------------
create type app_role as enum ('teacher', 'curator', 'admin');

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

-- ---------------------------------------------------------------------------
-- Классы
-- ---------------------------------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  curator_id uuid references profiles(id),
  school_year text not null default to_char(now(), 'YYYY'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ученики
-- ---------------------------------------------------------------------------
create table students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_id uuid not null references classes(id) on delete cascade,
  parent_contact text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Кружки
-- ---------------------------------------------------------------------------
create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references profiles(id),
  description text,
  location text,
  schedule_weekday smallint,
  schedule_time time,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Регистрация ученика в кружок (учителем)
-- ---------------------------------------------------------------------------
create table club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  registered_by uuid not null references profiles(id),
  registered_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique (club_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Занятия (сессии) кружка
-- ---------------------------------------------------------------------------
create table club_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  session_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (club_id, session_date)
);

-- ---------------------------------------------------------------------------
-- Посещаемость
-- ---------------------------------------------------------------------------
create type attendance_status as enum ('present', 'absent', 'late');

create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references club_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status attendance_status not null default 'absent',
  marked_by uuid references profiles(id),
  marked_at timestamptz not null default now(),
  comment text,
  unique (session_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Этап 2: дневник прогресса
-- ---------------------------------------------------------------------------
create table progress_entries (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  session_id uuid references club_sessions(id) on delete set null,
  entry_date date not null default current_date,
  title text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Индексы
-- ---------------------------------------------------------------------------
create index on students (class_id);
create index on club_members (club_id);
create index on club_members (student_id);
create index on club_sessions (club_id, session_date);
create index on attendance (session_id);
create index on attendance (student_id);
create index on progress_entries (student_id);
create index on user_roles (user_id);
create index on clubs (teacher_id);
create index on classes (curator_id);

-- ---------------------------------------------------------------------------
-- Вью: статус ученика "сегодня"
-- ---------------------------------------------------------------------------
create view v_student_today_status as
select
  s.id as student_id,
  s.full_name,
  s.class_id,
  c.id as club_id,
  c.name as club_name,
  cs.id as session_id,
  cs.session_date,
  a.status as attendance_status
from students s
join club_members cm on cm.student_id = s.id and cm.is_active = true
join clubs c on c.id = cm.club_id
left join club_sessions cs on cs.club_id = c.id and cs.session_date = current_date
left join attendance a on a.session_id = cs.id and a.student_id = s.id;
