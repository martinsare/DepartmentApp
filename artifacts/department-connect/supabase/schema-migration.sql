-- ============================================================
-- Department Connect - Safe Migration
-- Run this in Supabase SQL Editor on an existing database.
-- Uses ALTER/CREATE IF NOT EXISTS only — does NOT drop data.
-- ============================================================

-- 1. Add course-rep fields to profiles
alter table profiles add column if not exists is_course_rep boolean default false;
alter table profiles add column if not exists course_rep_for text references courses(id) on delete set null;

-- 2. Add course_id to announcements (course-scoped announcements, nullable = dept-wide)
alter table announcements add column if not exists course_id text references courses(id) on delete cascade;

-- 3. Enrollments: which students belong to which courses
create table if not exists enrollments (
  id text primary key,
  student_id text not null references profiles(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);

-- 4. Materials: files/notes per class session
create table if not exists materials (
  id text primary key,
  session_id text references class_sessions(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  uploaded_by text not null references profiles(id),
  created_at timestamptz default now()
);

-- 5. Issues: raised by course rep, seen by lecturer
create table if not exists issues (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  raised_by text not null references profiles(id),
  title text not null,
  description text not null,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved')),
  created_at timestamptz default now()
);

-- 6. Messages: direct messages between lecturer and course rep
create table if not exists messages (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  sender_id text not null references profiles(id),
  recipient_id text not null references profiles(id),
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 7. Invitations (was missing from original schema)
create table if not exists invitations (
  id text primary key default (gen_random_uuid()::text),
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('student', 'lecturer')),
  matric_number text,
  level text,
  phone text,
  created_at timestamptz default now()
);

-- RLS: open policies for demo (matches existing pattern)
alter table enrollments enable row level security;
alter table materials enable row level security;
alter table issues enable row level security;
alter table messages enable row level security;
alter table invitations enable row level security;

drop policy if exists anon_all on enrollments;
create policy anon_all on enrollments for all using (true) with check (true);

drop policy if exists anon_all on materials;
create policy anon_all on materials for all using (true) with check (true);

drop policy if exists anon_all on issues;
create policy anon_all on issues for all using (true) with check (true);

drop policy if exists anon_all on messages;
create policy anon_all on messages for all using (true) with check (true);

drop policy if exists anon_all on invitations;
create policy anon_all on invitations for all using (true) with check (true);

-- Realtime for messages
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
exception when undefined_object then null;
end $$;

-- Realtime for issues
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'issues'
  ) then
    alter publication supabase_realtime add table issues;
  end if;
exception when undefined_object then null;
end $$;
