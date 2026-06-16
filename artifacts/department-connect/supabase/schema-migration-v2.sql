-- ============================================================
-- Department Connect - Safe Migration v2
-- System Additions: QR Security, Semesters, Escalation, Audit
-- Run AFTER schema-migration.sql. ALTER/CREATE IF NOT EXISTS only.
-- ============================================================

-- ============================================================
-- 1. PROFILE ADDITIONS (profile requirements + mismatch flag)
-- ============================================================
alter table profiles add column if not exists staff_id text;
alter table profiles add column if not exists faculty text;
alter table profiles add column if not exists profile_complete boolean default false;
alter table profiles add column if not exists profile_flagged boolean default false;
alter table profiles add column if not exists flag_reason text;

-- ============================================================
-- 2. SEMESTERS
-- ============================================================
create table if not exists semesters (
  id text primary key default (gen_random_uuid()::text),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  archived_at timestamptz,
  created_at timestamptz default now()
);

-- Only one active semester at a time (enforced by app logic; DB hint)
create unique index if not exists semesters_active_unique
  on semesters (is_active) where is_active = true;

-- Add semester_id to courses, sessions, enrollments
alter table courses add column if not exists semester_id text references semesters(id) on delete set null;
alter table class_sessions add column if not exists semester_id text references semesters(id) on delete set null;
alter table enrollments add column if not exists semester_id text references semesters(id) on delete set null;
alter table attendance add column if not exists semester_id text references semesters(id) on delete set null;

-- Co-lecturing: second lecturer on a course
alter table courses add column if not exists co_lecturer_id text references profiles(id) on delete set null;

-- ============================================================
-- 3. QR SECURITY — attendance lock + expiry + device fingerprint
-- ============================================================
alter table class_sessions add column if not exists expires_at timestamptz;
alter table class_sessions add column if not exists attendance_locked boolean default false;
alter table attendance add column if not exists device_hash text;
alter table attendance add column if not exists flagged_duplicate_device boolean default false;

-- ============================================================
-- 4. ISSUES — escalation support
-- ============================================================
alter table issues add column if not exists escalated_at timestamptz;
alter table issues add column if not exists escalated_to_admin boolean default false;

-- ============================================================
-- 5. DIRECT REPORTS (student → admin escalation path)
-- ============================================================
create table if not exists direct_reports (
  id text primary key default (gen_random_uuid()::text),
  reporter_id text not null references profiles(id) on delete cascade,
  reporter_name text,
  issue_type text not null check (issue_type in (
    'harassment', 'academic_misconduct', 'grading_dispute',
    'safety_concern', 'discrimination', 'other'
  )),
  description text not null,
  screenshot_url text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'resolved')),
  reviewed_by text references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. AUDIT LOG
-- ============================================================
create table if not exists audit_log (
  id text primary key default (gen_random_uuid()::text),
  actor_id text references profiles(id) on delete set null,
  actor_name text,
  action text not null,
  target_id text,
  target_type text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Prevent any edits or deletes on audit_log via RLS
alter table audit_log enable row level security;
drop policy if exists admin_read_audit on audit_log;
create policy admin_read_audit on audit_log
  for select using (true);
-- No insert/update/delete policies for clients — all writes via service role

-- ============================================================
-- 7. RLS for new tables
-- ============================================================
alter table semesters enable row level security;
drop policy if exists anon_all on semesters;
create policy anon_all on semesters for all using (true) with check (true);

alter table direct_reports enable row level security;
drop policy if exists anon_all on direct_reports;
create policy anon_all on direct_reports for all using (true) with check (true);

-- ============================================================
-- 8. REALTIME for new tables
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_reports'
  ) then
    alter publication supabase_realtime add table direct_reports;
  end if;
exception when undefined_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'semesters'
  ) then
    alter publication supabase_realtime add table semesters;
  end if;
exception when undefined_object then null;
end $$;
