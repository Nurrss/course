# Кружки — учёт посещаемости

Vue 3 + Vite + Pinia + Vue Router + Supabase + Tailwind.

## Запуск

```bash
npm install
cp .env.example .env   # укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase

SQL-миграции лежат в `supabase/migrations`, тестовые данные — в `supabase/seed.sql`.

Локально (через Supabase CLI + Docker):

```bash
supabase start
supabase db reset   # применяет миграции и seed.sql
```

Для удалённого проекта примените файлы из `supabase/migrations` по порядку через SQL Editor
в Supabase Studio (или `supabase db push`), затем сгенерируйте актуальные типы:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

Тестовые пользователи из `seed.sql` (пароль `password123`):

- `admin@school.test` — администратор
- `kurator.9a@school.test` — куратор 9А и учитель кружка «Гитара» (совмещение ролей)
- `kurator.9b@school.test` — куратор 9Б
- `teacher.chess@school.test`, `teacher.dance@school.test` — учителя кружков
