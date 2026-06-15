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
}

export interface Course {
  id: string;
  title: string;
  code: string;
  lecturer_id: string;
  lecturer_name?: string;
  department_id: string;
  enrolled_count: number;
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
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
}

export interface Announcement {
  id: string;
  author_id: string;
  author_name: string;
  role: UserRole;
  title: string;
  body: string;
  type: "general" | "urgent" | "event";
  department_id: string;
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
  status: "pending" | "verified" | "rejected";
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  matric_number: string;
  time_recorded: string;
}

export interface LiveStatus {
  session_id: string;
  status: "idle" | "live" | "ended";
  updated_at: string;
}
