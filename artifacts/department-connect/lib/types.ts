export const DEFAULT_DEPARTMENT_ID = "dept-001";

export type UserRole = "student" | "lecturer" | "admin";

export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  matric_number?: string;
  department_id: string;
  level?: string;
  phone?: string;
  avatar_url?: string;
  status: "pending" | "active" | "suspended";
  is_course_rep?: boolean;
  course_rep_for?: string | null;
  staff_id?: string;
  faculty?: string;
  profile_complete?: boolean;
  profile_flagged?: boolean;
  flag_reason?: string;
}

export interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "lecturer";
  matric_number?: string;
  level?: string;
  phone?: string;
  created_at: string;
}

export interface Semester {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  archived_at?: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  lecturer_id: string;
  lecturer_name?: string;
  co_lecturer_id?: string | null;
  co_lecturer_name?: string;
  department_id: string;
  enrolled_count: number;
  semester_id?: string | null;
}

export interface ClassSession {
  id: string;
  course_id: string;
  course_code?: string;
  course_title?: string;
  lecturer_id: string;
  lecturer_name?: string;
  date: string;
  time: string;
  venue: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "ended";
  expires_at?: string | null;
  attendance_locked?: boolean;
  semester_id?: string | null;
}

export interface Announcement {
  id: string;
  author_id: string;
  author_name: string;
  role: UserRole;
  title: string;
  body: string;
  type: "general" | "assignment" | "test" | "emergency" | "urgent" | "event";
  department_id: string;
  course_id?: string | null;
  created_at: string;
  read: boolean;
}

export interface Contribution {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  amount_per_student: number;
  deadline: string;
  department_id: string;
  created_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  contribution_id: string;
  student_id: string;
  transaction_id: string;
  amount: number;
  status: "pending" | "paid" | "verified" | "rejected" | "failed";
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  matric_number: string;
  time_recorded: string;
  course_title?: string;
  session_date?: string;
  device_hash?: string;
  flagged_duplicate_device?: boolean;
}

export interface LiveStatus {
  session_id: string;
  status: "idle" | "live" | "ended";
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  semester_id?: string | null;
}

export interface Material {
  id: string;
  session_id?: string | null;
  course_id: string;
  title: string;
  description?: string;
  file_url?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Issue {
  id: string;
  course_id: string;
  raised_by: string;
  raiser_name?: string;
  title: string;
  description: string;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
  escalated_at?: string | null;
  escalated_to_admin?: boolean;
}

export interface Message {
  id: string;
  course_id: string;
  sender_id: string;
  sender_name?: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface DirectReport {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  issue_type: "harassment" | "academic_misconduct" | "grading_dispute" | "safety_concern" | "discrimination" | "other";
  description: string;
  screenshot_url?: string;
  status: "pending" | "reviewed" | "resolved";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}
