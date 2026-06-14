export type UserRole = "admin" | "lecturer" | "student";

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

const today = new Date();
const todayStr = today.toISOString().split("T")[0]!;
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0]!;
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split("T")[0]!;
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0]!;

export const DEMO_DEPARTMENT_ID = "dept-001";

export const DEMO_USERS: User[] = [
  {
    id: "admin-001",
    role: "admin",
    full_name: "Dr. Admin Kofi",
    email: "admin@dept.edu",
    department_id: DEMO_DEPARTMENT_ID,
    phone: "+233 55 123 4567",
  },
  {
    id: "lect-001",
    role: "lecturer",
    full_name: "Dr. James Mensah",
    email: "james@dept.edu",
    department_id: DEMO_DEPARTMENT_ID,
    phone: "+233 55 234 5678",
  },
  {
    id: "lect-002",
    role: "lecturer",
    full_name: "Prof. Sarah Acheampong",
    email: "sarah@dept.edu",
    department_id: DEMO_DEPARTMENT_ID,
    phone: "+233 55 345 6789",
  },
  {
    id: "stud-001",
    role: "student",
    full_name: "John Asante",
    email: "john@student.edu",
    matric_number: "CS/21/001",
    department_id: DEMO_DEPARTMENT_ID,
    level: "300L",
  },
  {
    id: "stud-002",
    role: "student",
    full_name: "Mary Osei",
    email: "mary@student.edu",
    matric_number: "CS/21/002",
    department_id: DEMO_DEPARTMENT_ID,
    level: "300L",
  },
  {
    id: "stud-003",
    role: "student",
    full_name: "Kwame Boateng",
    email: "kwame@student.edu",
    matric_number: "CS/21/003",
    department_id: DEMO_DEPARTMENT_ID,
    level: "200L",
  },
  {
    id: "stud-004",
    role: "student",
    full_name: "Abena Sarpong",
    email: "abena@student.edu",
    matric_number: "CS/22/001",
    department_id: DEMO_DEPARTMENT_ID,
    level: "200L",
  },
  {
    id: "stud-005",
    role: "student",
    full_name: "Fiifi Darko",
    email: "fiifi@student.edu",
    matric_number: "CS/22/002",
    department_id: DEMO_DEPARTMENT_ID,
    level: "200L",
  },
];

export const DEMO_COURSES: Course[] = [
  {
    id: "course-001",
    title: "Introduction to Computer Science",
    code: "CS101",
    lecturer_id: "lect-001",
    lecturer_name: "Dr. James Mensah",
    department_id: DEMO_DEPARTMENT_ID,
    enrolled_count: 45,
  },
  {
    id: "course-002",
    title: "Software Engineering",
    code: "SE201",
    lecturer_id: "lect-002",
    lecturer_name: "Prof. Sarah Acheampong",
    department_id: DEMO_DEPARTMENT_ID,
    enrolled_count: 38,
  },
  {
    id: "course-003",
    title: "Data Structures & Algorithms",
    code: "DS301",
    lecturer_id: "lect-001",
    lecturer_name: "Dr. James Mensah",
    department_id: DEMO_DEPARTMENT_ID,
    enrolled_count: 32,
  },
  {
    id: "course-004",
    title: "Database Management Systems",
    code: "DB401",
    lecturer_id: "lect-002",
    lecturer_name: "Prof. Sarah Acheampong",
    department_id: DEMO_DEPARTMENT_ID,
    enrolled_count: 29,
  },
];

export const DEMO_SESSIONS: ClassSession[] = [
  {
    id: "sess-001",
    course_id: "course-001",
    course_code: "CS101",
    course_title: "Introduction to Computer Science",
    lecturer_id: "lect-001",
    lecturer_name: "Dr. James Mensah",
    date: todayStr,
    time: "09:00",
    venue: "LT Block A",
    status: "ongoing",
  },
  {
    id: "sess-002",
    course_id: "course-002",
    course_code: "SE201",
    course_title: "Software Engineering",
    lecturer_id: "lect-002",
    lecturer_name: "Prof. Sarah Acheampong",
    date: todayStr,
    time: "14:00",
    venue: "Lab 3",
    status: "scheduled",
  },
  {
    id: "sess-003",
    course_id: "course-003",
    course_code: "DS301",
    course_title: "Data Structures & Algorithms",
    lecturer_id: "lect-001",
    lecturer_name: "Dr. James Mensah",
    date: tomorrowStr,
    time: "10:00",
    venue: "LT Block B",
    status: "scheduled",
  },
  {
    id: "sess-004",
    course_id: "course-004",
    course_code: "DB401",
    course_title: "Database Management Systems",
    lecturer_id: "lect-002",
    lecturer_name: "Prof. Sarah Acheampong",
    date: tomorrowStr,
    time: "13:00",
    venue: "Lab 1",
    status: "scheduled",
  },
  {
    id: "sess-005",
    course_id: "course-001",
    course_code: "CS101",
    course_title: "Introduction to Computer Science",
    lecturer_id: "lect-001",
    lecturer_name: "Dr. James Mensah",
    date: nextWeekStr,
    time: "09:00",
    venue: "LT Block A",
    status: "scheduled",
  },
  {
    id: "sess-006",
    course_id: "course-003",
    course_code: "DS301",
    course_title: "Data Structures & Algorithms",
    lecturer_id: "lect-001",
    lecturer_name: "Dr. James Mensah",
    date: yesterdayStr,
    time: "10:00",
    venue: "LT Block B",
    status: "ended",
  },
];

export const DEMO_LIVE_STATUS: Record<string, LiveStatus> = {
  "sess-001": {
    session_id: "sess-001",
    status: "entry_open",
    updated_at: new Date().toISOString(),
  },
};

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    author_id: "admin-001",
    author_name: "Dr. Admin Kofi",
    role: "admin",
    title: "Power Outage Notice",
    body: "There will be a scheduled power outage tomorrow from 8AM to 12PM. All morning classes will be held in the open courtyard. Please plan accordingly.",
    type: "emergency",
    department_id: DEMO_DEPARTMENT_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: "ann-002",
    author_id: "lect-001",
    author_name: "Dr. James Mensah",
    role: "lecturer",
    title: "CS101 Assignment 3 Due",
    body: "Assignment 3 on recursion and dynamic programming is due this Friday at 11:59 PM. Submit via the department portal. Late submissions will not be accepted.",
    type: "assignment",
    department_id: DEMO_DEPARTMENT_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
  },
  {
    id: "ann-003",
    author_id: "lect-002",
    author_name: "Prof. Sarah Acheampong",
    role: "lecturer",
    title: "SE201 Venue Change",
    body: "Today's Software Engineering lecture has been moved from Lab 2 to Lab 3 due to maintenance. Please take note.",
    type: "general",
    department_id: DEMO_DEPARTMENT_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
  },
  {
    id: "ann-004",
    author_id: "admin-001",
    author_name: "Dr. Admin Kofi",
    role: "admin",
    title: "Midterm Exam Schedule Released",
    body: "The midterm examination timetable has been published on the department notice board. Exams run from Week 8 to Week 9. Please check your individual schedules.",
    type: "test",
    department_id: DEMO_DEPARTMENT_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: "ann-005",
    author_id: "lect-001",
    author_name: "Dr. James Mensah",
    role: "lecturer",
    title: "DS301 Quiz Next Week",
    body: "There will be a short quiz on sorting algorithms at the start of next week's DS301 class. Review bubble sort, merge sort, and quicksort.",
    type: "test",
    department_id: DEMO_DEPARTMENT_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

export const DEMO_CONTRIBUTIONS: Contribution[] = [
  {
    id: "contrib-001",
    title: "Departmental Dues 2025",
    description:
      "Annual departmental dues to fund student activities, departmental events, and shared resources for the 2025 academic year.",
    target_amount: 500000,
    amount_per_student: 2000,
    deadline: nextWeekStr,
    department_id: DEMO_DEPARTMENT_ID,
    created_by: "admin-001",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    paid_count: 28,
    total_students: 45,
  },
  {
    id: "contrib-002",
    title: "Final Year Project Fund",
    description:
      "Contribution towards final year project materials, printing, and binding costs for all graduating students.",
    target_amount: 250000,
    amount_per_student: 5000,
    deadline: tomorrowStr,
    department_id: DEMO_DEPARTMENT_ID,
    created_by: "admin-001",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    paid_count: 15,
    total_students: 45,
  },
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: "pay-001",
    contribution_id: "contrib-001",
    student_id: "stud-001",
    transaction_id: "TXN-2025-001",
    amount: 2000,
    status: "paid",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "pay-002",
    contribution_id: "contrib-002",
    student_id: "stud-002",
    transaction_id: "TXN-2025-002",
    amount: 5000,
    status: "paid",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-001",
    session_id: "sess-006",
    student_id: "stud-001",
    student_name: "John Asante",
    matric_number: "CS/21/001",
    time_recorded: "10:05",
    course_title: "Data Structures & Algorithms",
    session_date: yesterdayStr,
  },
  {
    id: "att-002",
    session_id: "sess-001",
    student_id: "stud-002",
    student_name: "Mary Osei",
    matric_number: "CS/21/002",
    time_recorded: "09:03",
    course_title: "Introduction to Computer Science",
    session_date: todayStr,
  },
  {
    id: "att-003",
    session_id: "sess-006",
    student_id: "stud-002",
    student_name: "Mary Osei",
    matric_number: "CS/21/002",
    time_recorded: "10:02",
    course_title: "Data Structures & Algorithms",
    session_date: yesterdayStr,
  },
  {
    id: "att-004",
    session_id: "sess-001",
    student_id: "stud-001",
    student_name: "John Asante",
    matric_number: "CS/21/001",
    time_recorded: "09:01",
    course_title: "Introduction to Computer Science",
    session_date: todayStr,
  },
];

export const DEMO_CREDENTIALS: Record<string, string> = {
  "admin@dept.edu": "admin-001",
  "james@dept.edu": "lect-001",
  "sarah@dept.edu": "lect-002",
  "john@student.edu": "stud-001",
  "mary@student.edu": "stud-002",
  "kwame@student.edu": "stud-003",
  "abena@student.edu": "stud-004",
  "fiifi@student.edu": "stud-005",
};
