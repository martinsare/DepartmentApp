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

-- ============================================================
-- SEED DEMO DATA
-- ============================================================

insert into profiles (id, role, full_name, email, department_id, phone) values
  ('admin-001', 'admin',    'Dr. Admin Kofi',           'admin@dept.edu',  'dept-001', '+233 55 123 4567'),
  ('lect-001',  'lecturer', 'Dr. James Mensah',          'james@dept.edu',  'dept-001', '+233 55 234 5678'),
  ('lect-002',  'lecturer', 'Prof. Sarah Acheampong',    'sarah@dept.edu',  'dept-001', '+233 55 345 6789')
on conflict (id) do nothing;

insert into profiles (id, role, full_name, email, matric_number, department_id, level) values
  ('stud-001', 'student', 'John Asante',    'john@student.edu',  'CS/21/001', 'dept-001', '300L'),
  ('stud-002', 'student', 'Mary Osei',      'mary@student.edu',  'CS/21/002', 'dept-001', '300L'),
  ('stud-003', 'student', 'Kwame Boateng',  'kwame@student.edu', 'CS/21/003', 'dept-001', '200L'),
  ('stud-004', 'student', 'Abena Sarpong',  'abena@student.edu', 'CS/22/001', 'dept-001', '200L'),
  ('stud-005', 'student', 'Fiifi Darko',    'fiifi@student.edu', 'CS/22/002', 'dept-001', '200L')
on conflict (id) do nothing;

insert into courses (id, title, code, lecturer_id, department_id, enrolled_count) values
  ('course-001', 'Introduction to Computer Science', 'CS101', 'lect-001', 'dept-001', 45),
  ('course-002', 'Software Engineering',             'SE201', 'lect-002', 'dept-001', 38),
  ('course-003', 'Data Structures & Algorithms',     'DS301', 'lect-001', 'dept-001', 32),
  ('course-004', 'Database Management Systems',      'DB401', 'lect-002', 'dept-001', 29)
on conflict (id) do nothing;

insert into class_sessions (id, course_id, lecturer_id, date, time, venue, status) values
  ('sess-001', 'course-001', 'lect-001', current_date::text,                     '09:00', 'LT Block A', 'ongoing'),
  ('sess-002', 'course-002', 'lect-002', current_date::text,                     '14:00', 'Lab 3',      'scheduled'),
  ('sess-003', 'course-003', 'lect-001', (current_date + 1)::text,              '10:00', 'LT Block B', 'scheduled'),
  ('sess-004', 'course-004', 'lect-002', (current_date + 1)::text,              '13:00', 'Lab 1',      'scheduled'),
  ('sess-005', 'course-001', 'lect-001', (current_date + 7)::text,              '09:00', 'LT Block A', 'scheduled'),
  ('sess-006', 'course-003', 'lect-001', (current_date - 1)::text,              '10:00', 'LT Block B', 'ended')
on conflict (id) do nothing;

insert into live_status (session_id, status, updated_at) values
  ('sess-001', 'entry_open', now())
on conflict (session_id) do nothing;

insert into announcements (id, author_id, title, body, type, department_id, created_at) values
  ('ann-001', 'admin-001', 'Power Outage Notice',
   'There will be a scheduled power outage tomorrow from 8AM to 12PM. All morning classes will be held in the open courtyard. Please plan accordingly.',
   'emergency', 'dept-001', now() - interval '30 minutes'),
  ('ann-002', 'lect-001', 'CS101 Assignment 3 Due',
   'Assignment 3 on recursion and dynamic programming is due this Friday at 11:59 PM. Submit via the department portal. Late submissions will not be accepted.',
   'assignment', 'dept-001', now() - interval '3 hours'),
  ('ann-003', 'lect-002', 'SE201 Venue Change',
   'Today''s Software Engineering lecture has been moved from Lab 2 to Lab 3 due to maintenance. Please take note.',
   'general', 'dept-001', now() - interval '5 hours'),
  ('ann-004', 'admin-001', 'Midterm Exam Schedule Released',
   'The midterm examination timetable has been published on the department notice board. Exams run from Week 8 to Week 9. Please check your individual schedules.',
   'test', 'dept-001', now() - interval '24 hours'),
  ('ann-005', 'lect-001', 'DS301 Quiz Next Week',
   'There will be a short quiz on sorting algorithms at the start of next week''s DS301 class. Review bubble sort, merge sort, and quicksort.',
   'test', 'dept-001', now() - interval '48 hours')
on conflict (id) do nothing;

insert into contributions (id, title, description, target_amount, amount_per_student, deadline, department_id, created_by, created_at) values
  ('contrib-001', 'Departmental Dues 2025',
   'Annual departmental dues to fund student activities, departmental events, and shared resources for the 2025 academic year.',
   500000, 2000, (current_date + 7)::text, 'dept-001', 'admin-001', now() - interval '14 days'),
  ('contrib-002', 'Final Year Project Fund',
   'Contribution towards final year project materials, printing, and binding costs for all graduating students.',
   250000, 5000, (current_date + 1)::text, 'dept-001', 'admin-001', now() - interval '30 days')
on conflict (id) do nothing;

insert into payments (id, contribution_id, student_id, transaction_id, amount, status, created_at) values
  ('pay-001', 'contrib-001', 'stud-001', 'TXN-2025-001', 2000, 'paid', now() - interval '5 days'),
  ('pay-002', 'contrib-002', 'stud-002', 'TXN-2025-002', 5000, 'paid', now() - interval '3 days')
on conflict (id) do nothing;

insert into attendance (id, session_id, student_id, matric_number, time_recorded) values
  ('att-001', 'sess-006', 'stud-001', 'CS/21/001', '10:05'),
  ('att-002', 'sess-001', 'stud-002', 'CS/21/002', '09:03'),
  ('att-003', 'sess-006', 'stud-002', 'CS/21/002', '10:02'),
  ('att-004', 'sess-001', 'stud-001', 'CS/21/001', '09:01')
on conflict (id) do nothing;

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
