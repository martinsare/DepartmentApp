export type UserRole = "admin" | "lecturer" | "student";

export type UserStatus = "pending" | "active" | "suspended";

export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  matric_number?: string;
  department_id: string;
  avatar_url?: string;
  level?: string;
  phone?: string;
  status?: UserStatus;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  lecturer_id: string;
  department_id: string;
  lecturer_name?: string;
  enrolled_count?: number;
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
  status: "scheduled" | "ongoing" | "cancelled" | "ended";
}

export interface LiveStatus {
  session_id: string;
  status:
    | "lecturer_arrived"
    | "class_started"
    | "entry_open"
    | "entry_closing"
    | "entry_closed"
    | "class_ended";
  updated_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  author_name: string;
  role: UserRole;
  title: string;
  body: string;
  type: "general" | "assignment" | "test" | "emergency";
  department_id: string;
  created_at: string;
  read?: boolean;
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
  paid_count?: number;
  total_students?: number;
}

export interface Payment {
  id: string;
  contribution_id: string;
  student_id: string;
  transaction_id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
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
}

export const DEFAULT_DEPARTMENT_ID = "dept-001";
