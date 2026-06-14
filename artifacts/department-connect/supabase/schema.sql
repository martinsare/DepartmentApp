-- ============================================================
-- Department Connect — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
create table if not exists profiles (
  id           text primary key,
  role         text not null check (role in ('admin','lecturer','student')),
  full_name    text not null,
  email        text unique not null,
  matric_number text,
  department_id text not null default 'dept-001',
  level        text,
  phone        text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- ── courses ───────────────────────────────────────────────
create table if not exists courses (
  id            text primary key,
  title         text not null,
  code          text not null,
  lecturer_id   text not null references profiles(id),
  department_id text not null default 'dept-001',
  enrolled_count integer default 0,
  created_at    timestamptz default now()
);

-- ── class_sessions ────────────────────────────────────────
create table if not exists class_sessions (
  id          text primary key,
  course_id   text not null references courses(id),
  lecturer_id text not null references profiles(id),
  date        text not null,
  time        text not null,
  venue       text not null,
  status      text not null default 'scheduled'
              check (status in ('scheduled','ongoing','cancelled','ended')),
  created_at  timestamptz default now()
);

-- ── live_status ───────────────────────────────────────────
create table if not exists live_status (
  session_id text primary key references class_sessions(id) on delete cascade,
  status     text not null,
  updated_at timestamptz default now()
);

-- ── announcements ─────────────────────────────────────────
create table if not exists announcements (
  id            text primary key,
  author_id     text not null references profiles(id),
  title         text not null,
  body          text not null,
  type          text not null default 'general'
                check (type in ('general','assignment','test','emergency')),
  department_id text not null default 'dept-001',
  created_at    timestamptz default now()
);

-- ── contributions ─────────────────────────────────────────
create table if not exists contributions (
  id                 text primary key,
  title              text not null,
  description        text,
  target_amount      numeric not null,
  amount_per_student numeric not null,
  deadline           text not null,
  department_id      text not null default 'dept-001',
  created_by         text not null references profiles(id),
  created_at         timestamptz default now()
);

-- ── payments ──────────────────────────────────────────────
create table if not exists payments (
  id              text primary key,
  contribution_id text not null references contributions(id) on delete cascade,
  student_id      text not null references profiles(id),
  transaction_id  text not null,
  amount          numeric not null,
  status          text not null default 'pending'
                  check (status in ('paid','pending','failed')),
  created_at      timestamptz default now(),
  unique (contribution_id, student_id)
);

-- ── attendance ────────────────────────────────────────────
create table if not exists attendance (
  id            text primary key,
  session_id    text not null references class_sessions(id) on delete cascade,
  student_id    text not null references profiles(id),
  matric_number text not null,
  time_recorded text not null,
  created_at    timestamptz default now(),
  unique (session_id, student_id)
);

-- ── enable realtime ───────────────────────────────────────
alter publication supabase_realtime add table announcements;
alter publication supabase_realtime add table live_status;
alter publication supabase_realtime add table class_sessions;

-- ── Row Level Security (open for dept app — tighten for production) ──
alter table profiles      enable row level security;
alter table courses       enable row level security;
alter table class_sessions enable row level security;
alter table live_status   enable row level security;
alter table announcements enable row level security;
alter table contributions enable row level security;
alter table payments      enable row level security;
alter table attendance    enable row level security;

-- Allow full access via anon key (suitable for this demo)
create policy "anon_all" on profiles       for all using (true) with check (true);
create policy "anon_all" on courses        for all using (true) with check (true);
create policy "anon_all" on class_sessions for all using (true) with check (true);
create policy "anon_all" on live_status    for all using (true) with check (true);
create policy "anon_all" on announcements  for all using (true) with check (true);
create policy "anon_all" on contributions  for all using (true) with check (true);
create policy "anon_all" on payments       for all using (true) with check (true);
create policy "anon_all" on attendance     for all using (true) with check (true);
