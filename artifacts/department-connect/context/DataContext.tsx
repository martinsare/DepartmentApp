import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { sendApprovalEmail, sendInviteEmail, sendRejectionEmail } from "@/lib/email";
import { scheduleAnnouncementNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import {
  Announcement, AttendanceRecord, AuditEntry, ClassSession, Contribution,
  Course, DirectReport, Enrollment, Invitation, Issue, LiveStatus, Material,
  Message, Payment, Semester, User,
} from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface DataContextValue {
  sessions: ClassSession[];
  courses: Course[];
  announcements: Announcement[];
  contributions: Contribution[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  liveStatus: Record<string, LiveStatus>;
  users: User[];
  invitations: Invitation[];
  enrollments: Enrollment[];
  materials: Material[];
  issues: Issue[];
  messages: Message[];
  semesters: Semester[];
  directReports: DirectReport[];
  auditLog: AuditEntry[];
  loading: boolean;
  markAnnouncementRead: (id: string) => void;
  updateSessionStatus: (id: string, status: ClassSession["status"]) => void;
  updateLiveStatus: (sessionId: string, status: LiveStatus["status"]) => void;
  addSession: (session: ClassSession) => void;
  addAnnouncement: (ann: Announcement) => void;
  addPayment: (payment: Payment) => void;
  addContribution: (c: Contribution) => void;
  addCourse: (c: Course) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  addAttendance: (record: AttendanceRecord) => Promise<{ error?: string }>;
  approveUser: (userId: string, role: User["role"], name: string, email: string) => Promise<void>;
  rejectUser: (userId: string, name: string, email: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  addInvitedUser: (data: Omit<Invitation, "id" | "created_at">) => Promise<{ error?: string }>;
  removeInvitation: (id: string) => Promise<void>;
  assignCourseRep: (studentId: string, courseId: string) => Promise<{ error?: string; warning?: string }>;
  removeCourseRep: (studentId: string) => Promise<{ error?: string }>;
  addMaterial: (material: Material) => Promise<void>;
  addIssue: (issue: Issue) => Promise<void>;
  updateIssueStatus: (issueId: string, status: Issue["status"]) => Promise<void>;
  escalateIssue: (issueId: string, actorId: string, actorName: string) => Promise<void>;
  sendMessage: (message: Message) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  createSemester: (semester: Semester) => Promise<void>;
  closeSemester: (semesterId: string, actorId: string, actorName: string) => Promise<void>;
  submitDirectReport: (data: Omit<DirectReport, "id" | "status" | "created_at">) => Promise<void>;
  reviewDirectReport: (reportId: string, reviewerId: string, reviewerName: string) => Promise<void>;
  unenrollStudent: (studentId: string, courseId: string, actorId: string, actorName: string) => Promise<void>;
  flagProfileMismatch: (userId: string, reason: string, actorId: string, actorName: string) => Promise<void>;
  clearProfileFlag: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function buildUserMap(users: User[]): Map<string, User> {
  return new Map(users.map((u) => [u.id, u]));
}
function buildCourseMap(courses: Course[]): Map<string, Course> {
  return new Map(courses.map((c) => [c.id, c]));
}

function enrichSessions(rows: any[], courseMap: Map<string, Course>, userMap: Map<string, User>): ClassSession[] {
  return rows.map((r) => {
    const course = courseMap.get(r.course_id);
    const lecturer = userMap.get(r.lecturer_id);
    return {
      id: r.id, course_id: r.course_id, course_code: course?.code, course_title: course?.title,
      lecturer_id: r.lecturer_id, lecturer_name: lecturer?.full_name,
      date: r.date, time: r.time, venue: r.venue, status: r.status,
      expires_at: r.expires_at ?? null, attendance_locked: r.attendance_locked ?? false,
      semester_id: r.semester_id ?? null,
    } satisfies ClassSession;
  });
}

function enrichCourses(rows: any[], userMap: Map<string, User>): Course[] {
  return rows.map((r) => ({
    id: r.id, title: r.title, code: r.code, lecturer_id: r.lecturer_id,
    lecturer_name: userMap.get(r.lecturer_id)?.full_name,
    co_lecturer_id: r.co_lecturer_id ?? null,
    co_lecturer_name: r.co_lecturer_id ? userMap.get(r.co_lecturer_id)?.full_name : undefined,
    department_id: r.department_id, enrolled_count: r.enrolled_count ?? 0,
    semester_id: r.semester_id ?? null,
  }));
}

function enrichAnnouncements(rows: any[], userMap: Map<string, User>, readIds: Set<string>): Announcement[] {
  return rows.map((r) => {
    const author = userMap.get(r.author_id);
    return {
      id: r.id, author_id: r.author_id, author_name: author?.full_name ?? "Unknown",
      role: (author?.role ?? "admin") as Announcement["role"],
      title: r.title, body: r.body, type: r.type,
      department_id: r.department_id, course_id: r.course_id ?? null,
      created_at: r.created_at, read: readIds.has(r.id),
    } satisfies Announcement;
  });
}

function enrichAttendance(rows: any[], userMap: Map<string, User>): AttendanceRecord[] {
  return rows.map((r) => ({
    id: r.id, session_id: r.session_id, student_id: r.student_id,
    student_name: userMap.get(r.student_id)?.full_name,
    matric_number: r.matric_number, time_recorded: r.time_recorded,
    course_title: r.course_title, session_date: r.session_date,
    device_hash: r.device_hash ?? undefined,
    flagged_duplicate_device: r.flagged_duplicate_device ?? false,
  }));
}

function enrichIssues(rows: any[], userMap: Map<string, User>): Issue[] {
  return rows.map((r) => ({
    id: r.id, course_id: r.course_id, raised_by: r.raised_by,
    raiser_name: userMap.get(r.raised_by)?.full_name,
    title: r.title, description: r.description,
    status: r.status as Issue["status"], created_at: r.created_at,
    escalated_at: r.escalated_at ?? null, escalated_to_admin: r.escalated_to_admin ?? false,
  }));
}

function enrichMessages(rows: any[], userMap: Map<string, User>): Message[] {
  return rows.map((r) => ({
    id: r.id, course_id: r.course_id,
    sender_id: r.sender_id, sender_name: userMap.get(r.sender_id)?.full_name,
    recipient_id: r.recipient_id, body: r.body,
    read: r.read ?? false, created_at: r.created_at,
  }));
}

function rowsToLiveStatus(rows: any[]): Record<string, LiveStatus> {
  const map: Record<string, LiveStatus> = {};
  for (const r of rows) {
    map[r.session_id] = { session_id: r.session_id, status: r.status, updated_at: r.updated_at };
  }
  return map;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, LiveStatus>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const readIdsRef = useRef<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("courses").select("*"),
        supabase.from("class_sessions").select("*").order("date").order("time"),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("contributions").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("live_status").select("*"),
        supabase.from("invitations").select("*").order("created_at", { ascending: false }),
        supabase.from("enrollments").select("*"),
        supabase.from("materials").select("*").order("created_at", { ascending: false }),
        supabase.from("issues").select("*").order("created_at", { ascending: false }),
        supabase.from("messages").select("*").order("created_at"),
        supabase.from("semesters").select("*").order("created_at", { ascending: false }),
        supabase.from("direct_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200),
      ]);

      const get = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" ? r.value.data ?? [] : [];

      const profileRows = get(results[0]);
      const courseRows = get(results[1]);
      const sessionRows = get(results[2]);
      const annRows = get(results[3]);
      const contribRows = get(results[4]);
      const paymentRows = get(results[5]);
      const attendRows = get(results[6]);
      const liveRows = get(results[7]);
      const inviteRows = get(results[8]);
      const enrollRows = get(results[9]);
      const materialRows = get(results[10]);
      const issueRows = get(results[11]);
      const messageRows = get(results[12]);
      const semesterRows = get(results[13]);
      const directReportRows = get(results[14]);
      const auditRows = get(results[15]);

      const fetchedUsers: User[] = profileRows.map((r: any) => ({
        id: r.id, role: r.role, full_name: r.full_name, email: r.email,
        matric_number: r.matric_number ?? undefined, department_id: r.department_id,
        level: r.level ?? undefined, phone: r.phone ?? undefined,
        avatar_url: r.avatar_url ?? undefined, status: r.status ?? "pending",
        is_course_rep: r.is_course_rep ?? false, course_rep_for: r.course_rep_for ?? null,
        staff_id: r.staff_id ?? undefined, faculty: r.faculty ?? undefined,
        profile_complete: r.profile_complete ?? false,
        profile_flagged: r.profile_flagged ?? false, flag_reason: r.flag_reason ?? undefined,
      }));

      const userMap = buildUserMap(fetchedUsers);
      const fetchedCourses = enrichCourses(courseRows, userMap);
      const courseMap = buildCourseMap(fetchedCourses);

      setUsers(fetchedUsers);
      setCourses(fetchedCourses);
      setSessions(enrichSessions(sessionRows, courseMap, userMap));
      setAnnouncements(enrichAnnouncements(annRows, userMap, readIdsRef.current));
      setContributions(contribRows as Contribution[]);
      setPayments(paymentRows as Payment[]);
      setAttendance(enrichAttendance(attendRows, userMap));
      setLiveStatus(rowsToLiveStatus(liveRows));
      setInvitations(inviteRows.map((r: any) => ({
        id: r.id, email: r.email, full_name: r.full_name,
        role: r.role as Invitation["role"], matric_number: r.matric_number ?? undefined,
        level: r.level ?? undefined, phone: r.phone ?? undefined, created_at: r.created_at,
      })));
      setEnrollments(enrollRows.map((r: any) => ({
        id: r.id, student_id: r.student_id, course_id: r.course_id,
        enrolled_at: r.enrolled_at, semester_id: r.semester_id ?? null,
      })));
      setMaterials(materialRows.map((r: any) => ({
        id: r.id, session_id: r.session_id ?? null, course_id: r.course_id,
        title: r.title, description: r.description ?? undefined,
        file_url: r.file_url ?? undefined, uploaded_by: r.uploaded_by, created_at: r.created_at,
      })));
      setIssues(enrichIssues(issueRows, userMap));
      setMessages(enrichMessages(messageRows, userMap));
      setSemesters(semesterRows.map((r: any) => ({
        id: r.id, name: r.name, start_date: r.start_date, end_date: r.end_date,
        is_active: r.is_active ?? false, archived_at: r.archived_at ?? null,
        created_at: r.created_at,
      })));
      setDirectReports(directReportRows.map((r: any) => ({
        id: r.id, reporter_id: r.reporter_id, reporter_name: r.reporter_name ?? undefined,
        issue_type: r.issue_type, description: r.description,
        screenshot_url: r.screenshot_url ?? undefined, status: r.status,
        reviewed_by: r.reviewed_by ?? null, reviewed_at: r.reviewed_at ?? null,
        created_at: r.created_at,
      })));
      setAuditLog(auditRows.map((r: any) => ({
        id: r.id, actor_id: r.actor_id ?? null, actor_name: r.actor_name ?? null,
        action: r.action, target_id: r.target_id ?? null, target_type: r.target_type ?? null,
        metadata: r.metadata ?? null, created_at: r.created_at,
      })));
    } catch (e) {
      console.warn("Supabase fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return; }
    fetchAll();
    const sb = supabase;

    const annChannel = sb.channel("rt-announcements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, (payload) => {
        const r = payload.new as any;
        setUsers((currentUsers) => {
          const uMap = buildUserMap(currentUsers);
          const ann: Announcement = {
            id: r.id, author_id: r.author_id, author_name: uMap.get(r.author_id)?.full_name ?? "Unknown",
            role: (uMap.get(r.author_id)?.role ?? "admin") as Announcement["role"],
            title: r.title, body: r.body, type: r.type,
            department_id: r.department_id, course_id: r.course_id ?? null,
            created_at: r.created_at, read: false,
          };
          setAnnouncements((prev) => {
            if (prev.find((a) => a.id === ann.id)) return prev;
            scheduleAnnouncementNotification(ann.title, ann.body, ann.type as any);
            return [ann, ...prev];
          });
          return currentUsers;
        });
      }).subscribe();

    const liveChannel = sb.channel("rt-live-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_status" }, (payload) => {
        const r = (payload.new ?? payload.old) as any;
        if (!r?.session_id) return;
        setLiveStatus((prev) => ({
          ...prev,
          [r.session_id]: { session_id: r.session_id, status: r.status, updated_at: r.updated_at },
        }));
      }).subscribe();

    const sessChannel = sb.channel("rt-sessions")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "class_sessions" }, (payload) => {
        const r = payload.new as any;
        setSessions((prev) => prev.map((s) => s.id === r.id ? {
          ...s, status: r.status, expires_at: r.expires_at ?? null,
          attendance_locked: r.attendance_locked ?? false,
        } : s));
      }).subscribe();

    const msgChannel = sb.channel("rt-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const r = payload.new as any;
        setMessages((prev) => {
          if (prev.find((m) => m.id === r.id)) return prev;
          return [...prev, {
            id: r.id, course_id: r.course_id, sender_id: r.sender_id,
            recipient_id: r.recipient_id, body: r.body, read: r.read ?? false, created_at: r.created_at,
          }];
        });
      }).subscribe();

    const drChannel = sb.channel("rt-direct-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_reports" }, () => {
        fetchAll();
      }).subscribe();

    return () => {
      sb.removeChannel(annChannel);
      sb.removeChannel(liveChannel);
      sb.removeChannel(sessChannel);
      sb.removeChannel(msgChannel);
      sb.removeChannel(drChannel);
    };
  }, [fetchAll]);

  const markAnnouncementRead = useCallback((id: string) => {
    readIdsRef.current.add(id);
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }, []);

  const updateSessionStatus = useCallback(async (id: string, status: ClassSession["status"]) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("class_sessions").update({ status }).eq("id", id);
    }
  }, []);

  const updateLiveStatus = useCallback(async (sessionId: string, status: LiveStatus["status"]) => {
    const updated_at = new Date().toISOString();
    setLiveStatus((prev) => ({ ...prev, [sessionId]: { session_id: sessionId, status, updated_at } }));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("live_status").upsert(
        { session_id: sessionId, status, updated_at }, { onConflict: "session_id" }
      );
    }
  }, []);

  const addSession = useCallback(async (session: ClassSession) => {
    setSessions((prev) => [session, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("class_sessions").insert({
        id: session.id, course_id: session.course_id, lecturer_id: session.lecturer_id,
        date: session.date, time: session.time, venue: session.venue, status: session.status,
        expires_at: session.expires_at ?? null, attendance_locked: session.attendance_locked ?? false,
        semester_id: session.semester_id ?? null,
      });
    }
  }, []);

  const addAnnouncement = useCallback(async (ann: Announcement) => {
    setAnnouncements((prev) => {
      if (prev.find((a) => a.id === ann.id)) return prev;
      return [ann, ...prev];
    });
    scheduleAnnouncementNotification(ann.title, ann.body, ann.type as any);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("announcements").insert({
        id: ann.id, author_id: ann.author_id, title: ann.title, body: ann.body,
        type: ann.type, department_id: ann.department_id,
        course_id: ann.course_id ?? null, created_at: ann.created_at,
      });
    }
  }, []);

  const addPayment = useCallback(async (payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("payments").upsert({
        id: payment.id, contribution_id: payment.contribution_id,
        student_id: payment.student_id, transaction_id: payment.transaction_id,
        amount: payment.amount, status: payment.status, created_at: payment.created_at,
      }, { onConflict: "contribution_id,student_id" });
    }
  }, []);

  const addContribution = useCallback(async (c: Contribution) => {
    setContributions((prev) => [c, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("contributions").insert({
        id: c.id, title: c.title, description: c.description,
        target_amount: c.target_amount, amount_per_student: c.amount_per_student,
        deadline: c.deadline, department_id: c.department_id,
        created_by: c.created_by, created_at: c.created_at,
      });
    }
  }, []);

  const addCourse = useCallback(async (c: Course) => {
    setCourses((prev) => [c, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("courses").insert({
        id: c.id, title: c.title, code: c.code, lecturer_id: c.lecturer_id,
        department_id: c.department_id, enrolled_count: c.enrolled_count ?? 0,
        co_lecturer_id: c.co_lecturer_id ?? null, semester_id: c.semester_id ?? null,
      });
    }
  }, []);

  const updateCourse = useCallback(async (id: string, patch: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (isSupabaseConfigured && supabase) {
      const dbPatch: Record<string, any> = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.code !== undefined) dbPatch.code = patch.code;
      if (patch.enrolled_count !== undefined) dbPatch.enrolled_count = patch.enrolled_count;
      if (patch.lecturer_id !== undefined) dbPatch.lecturer_id = patch.lecturer_id;
      if (patch.co_lecturer_id !== undefined) dbPatch.co_lecturer_id = patch.co_lecturer_id;
      await supabase.from("courses").update(dbPatch).eq("id", id);
    }
  }, []);

  const addAttendance = useCallback(async (record: AttendanceRecord): Promise<{ error?: string }> => {
    const session = sessions.find((s) => s.id === record.session_id);
    if (session?.attendance_locked) {
      return { error: "Attendance for this session is locked. Contact your lecturer." };
    }
    if (session?.expires_at && new Date() > new Date(session.expires_at)) {
      return { error: "QR code has expired. Contact your lecturer to unlock." };
    }
    const duplicate = attendance.find((a) => a.session_id === record.session_id && a.student_id === record.student_id);
    if (duplicate) {
      return { error: "You have already recorded attendance for this session." };
    }
    const deviceDuplicate = record.device_hash
      ? attendance.find((a) => a.session_id === record.session_id && a.device_hash === record.device_hash && a.student_id !== record.student_id)
      : null;
    const flagged = !!deviceDuplicate;

    setAttendance((prev) => [...prev, { ...record, flagged_duplicate_device: flagged }]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("attendance").upsert({
        id: record.id, session_id: record.session_id, student_id: record.student_id,
        matric_number: record.matric_number, time_recorded: record.time_recorded,
        device_hash: record.device_hash ?? null, flagged_duplicate_device: flagged,
      }, { onConflict: "session_id,student_id" });
    }
    return {};
  }, [sessions, attendance]);

  const approveUser = useCallback(async (userId: string, role: User["role"], name: string, email: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "active" as const, role } : u)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("profiles").update({ status: "active", role }).eq("id", userId);
    }
    sendApprovalEmail(name, email);
  }, []);

  const rejectUser = useCallback(async (userId: string, name: string, email: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("profiles").delete().eq("id", userId);
    }
    sendRejectionEmail(name, email);
  }, []);

  const suspendUser = useCallback(async (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "suspended" as const } : u)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("profiles").update({ status: "suspended" }).eq("id", userId);
      await supabase.from("class_sessions").update({ status: "cancelled" }).eq("lecturer_id", userId).in("status", ["scheduled", "ongoing"]);
      setSessions((prev) => prev.map((s) =>
        s.lecturer_id === userId && (s.status === "scheduled" || s.status === "ongoing")
          ? { ...s, status: "cancelled" as const } : s
      ));
    }
  }, []);

  const addInvitedUser = useCallback(async (data: Omit<Invitation, "id" | "created_at">): Promise<{ error?: string }> => {
    const newInv: Invitation = {
      id: Math.random().toString(36).slice(2), ...data, created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("invitations").insert({
        email: data.email, full_name: data.full_name, role: data.role,
        matric_number: data.matric_number ?? null, level: data.level ?? null, phone: data.phone ?? null,
      });
      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          return { error: "This email has already been invited." };
        }
        return { error: error.message };
      }
    }
    setInvitations((prev) => [newInv, ...prev]);
    sendInviteEmail(data.full_name, data.email, data.role);
    return {};
  }, []);

  const removeInvitation = useCallback(async (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("invitations").delete().eq("id", id);
    }
  }, []);

  const assignCourseRep = useCallback(async (studentId: string, courseId: string): Promise<{ error?: string; warning?: string }> => {
    if (!isSupabaseConfigured || !supabase) return { error: "Not connected" };

    const student = users.find((u) => u.id === studentId);
    let warning: string | undefined;

    if (student?.is_course_rep && student.course_rep_for && student.course_rep_for !== courseId) {
      const otherCourse = courses.find((c) => c.id === student.course_rep_for);
      warning = `This student is already course rep for ${otherCourse?.code ?? student.course_rep_for}. Assigning them here will remove them from that course.`;
      await supabase.from("profiles").update({ is_course_rep: false, course_rep_for: null }).eq("id", studentId);
      setUsers((prev) => prev.map((u) => u.id === studentId ? { ...u, is_course_rep: false, course_rep_for: null } : u));
    }

    const existing = users.find((u) => u.is_course_rep && u.course_rep_for === courseId && u.id !== studentId);
    if (existing) {
      await supabase.from("profiles").update({ is_course_rep: false, course_rep_for: null }).eq("id", existing.id);
      setUsers((prev) => prev.map((u) => u.id === existing.id ? { ...u, is_course_rep: false, course_rep_for: null } : u));
    }

    const { error } = await supabase.from("profiles").update({ is_course_rep: true, course_rep_for: courseId }).eq("id", studentId);
    if (error) return { error: error.message };
    setUsers((prev) => prev.map((u) => u.id === studentId ? { ...u, is_course_rep: true, course_rep_for: courseId } : u));
    return { warning };
  }, [users, courses]);

  const removeCourseRep = useCallback(async (studentId: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) return { error: "Not connected" };
    const { error } = await supabase.from("profiles").update({ is_course_rep: false, course_rep_for: null }).eq("id", studentId);
    if (error) return { error: error.message };
    setUsers((prev) => prev.map((u) => u.id === studentId ? { ...u, is_course_rep: false, course_rep_for: null } : u));
    return {};
  }, []);

  const addMaterial = useCallback(async (material: Material) => {
    setMaterials((prev) => [material, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("materials").insert({
        id: material.id, session_id: material.session_id ?? null, course_id: material.course_id,
        title: material.title, description: material.description ?? null,
        file_url: material.file_url ?? null, uploaded_by: material.uploaded_by,
        created_at: material.created_at,
      });
    }
  }, []);

  const addIssue = useCallback(async (issue: Issue) => {
    setIssues((prev) => [issue, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("issues").insert({
        id: issue.id, course_id: issue.course_id, raised_by: issue.raised_by,
        title: issue.title, description: issue.description,
        status: issue.status, created_at: issue.created_at,
      });
    }
  }, []);

  const updateIssueStatus = useCallback(async (issueId: string, status: Issue["status"]) => {
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status } : i)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("issues").update({ status }).eq("id", issueId);
    }
  }, []);

  const escalateIssue = useCallback(async (issueId: string, actorId: string, actorName: string) => {
    const now = new Date().toISOString();
    setIssues((prev) => prev.map((i) =>
      i.id === issueId ? { ...i, escalated_at: now, escalated_to_admin: true } : i
    ));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("issues").update({ escalated_at: now, escalated_to_admin: true }).eq("id", issueId);
    }
    await logAudit("issue_escalated", actorId, actorName, issueId, "issue");
  }, []);

  const sendMessage = useCallback(async (message: Message) => {
    setMessages((prev) => [...prev, message]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("messages").insert({
        id: message.id, course_id: message.course_id, sender_id: message.sender_id,
        recipient_id: message.recipient_id, body: message.body,
        read: false, created_at: message.created_at,
      });
    }
  }, []);

  const markMessageRead = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("messages").update({ read: true }).eq("id", messageId);
    }
  }, []);

  const createSemester = useCallback(async (semester: Semester) => {
    setSemesters((prev) => [semester, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("semesters").insert({
        id: semester.id, name: semester.name, start_date: semester.start_date,
        end_date: semester.end_date, is_active: semester.is_active, created_at: semester.created_at,
      });
    }
  }, []);

  const closeSemester = useCallback(async (semesterId: string, actorId: string, actorName: string) => {
    const now = new Date().toISOString();
    setSemesters((prev) => prev.map((s) =>
      s.id === semesterId ? { ...s, is_active: false, archived_at: now } : s
    ));
    setUsers((prev) => prev.map((u) =>
      u.is_course_rep ? { ...u, is_course_rep: false, course_rep_for: null } : u
    ));
    setSessions((prev) => prev.map((s) =>
      s.semester_id === semesterId && (s.status === "scheduled" || s.status === "ongoing")
        ? { ...s, status: "ended" as const, attendance_locked: true } : s
    ));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("semesters").update({ is_active: false, archived_at: now }).eq("id", semesterId);
      await supabase.from("profiles").update({ is_course_rep: false, course_rep_for: null }).eq("is_course_rep", true);
      await supabase.from("class_sessions")
        .update({ attendance_locked: true })
        .eq("semester_id", semesterId);
    }
    await logAudit("semester_closed", actorId, actorName, semesterId, "semester", { name: semesters.find((s) => s.id === semesterId)?.name });
  }, [semesters]);

  const submitDirectReport = useCallback(async (data: Omit<DirectReport, "id" | "status" | "created_at">) => {
    const now = new Date().toISOString();
    const newReport: DirectReport = {
      id: `dr-${Date.now()}`, ...data, status: "pending", created_at: now,
    };
    setDirectReports((prev) => [newReport, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("direct_reports").insert({
        id: newReport.id, reporter_id: data.reporter_id,
        reporter_name: data.reporter_name ?? null, issue_type: data.issue_type,
        description: data.description, screenshot_url: data.screenshot_url ?? null,
        status: "pending", created_at: now,
      });
    }
    await logAudit("direct_report_submitted", data.reporter_id, data.reporter_name ?? null, newReport.id, "direct_report");
  }, []);

  const reviewDirectReport = useCallback(async (reportId: string, reviewerId: string, reviewerName: string) => {
    const now = new Date().toISOString();
    setDirectReports((prev) => prev.map((r) =>
      r.id === reportId ? { ...r, status: "reviewed" as const, reviewed_by: reviewerId, reviewed_at: now } : r
    ));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("direct_reports").update({
        status: "reviewed", reviewed_by: reviewerId, reviewed_at: now,
      }).eq("id", reportId);
    }
  }, []);

  const unenrollStudent = useCallback(async (studentId: string, courseId: string, actorId: string, actorName: string) => {
    setEnrollments((prev) => prev.filter((e) => !(e.student_id === studentId && e.course_id === courseId)));
    const student = users.find((u) => u.id === studentId);
    if (student?.is_course_rep && student.course_rep_for === courseId) {
      setUsers((prev) => prev.map((u) => u.id === studentId ? { ...u, is_course_rep: false, course_rep_for: null } : u));
      if (isSupabaseConfigured && supabase) {
        await supabase.from("profiles").update({ is_course_rep: false, course_rep_for: null }).eq("id", studentId);
      }
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.from("enrollments").delete().eq("student_id", studentId).eq("course_id", courseId);
    }
    await logAudit("student_unenrolled", actorId, actorName, studentId, "profile", { course_id: courseId });
  }, [users]);

  const flagProfileMismatch = useCallback(async (userId: string, reason: string, actorId: string, actorName: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, profile_flagged: true, flag_reason: reason } : u));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("profiles").update({ profile_flagged: true, flag_reason: reason }).eq("id", userId);
    }
    await logAudit("profile_flagged", actorId, actorName, userId, "profile", { reason });
  }, []);

  const clearProfileFlag = useCallback(async (userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, profile_flagged: false, flag_reason: undefined } : u));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("profiles").update({ profile_flagged: false, flag_reason: null }).eq("id", userId);
    }
  }, []);

  return (
    <DataContext.Provider value={{
      sessions, courses, announcements, contributions, payments, attendance,
      liveStatus, users, invitations, enrollments, materials, issues, messages,
      semesters, directReports, auditLog, loading,
      markAnnouncementRead, updateSessionStatus, updateLiveStatus,
      addSession, addAnnouncement, addPayment, addContribution, addCourse, updateCourse,
      addAttendance, approveUser, rejectUser, suspendUser, addInvitedUser, removeInvitation,
      assignCourseRep, removeCourseRep, addMaterial, addIssue, updateIssueStatus, escalateIssue,
      sendMessage, markMessageRead, createSemester, closeSemester,
      submitDirectReport, reviewDirectReport, unenrollStudent, flagProfileMismatch, clearProfileFlag,
      refresh: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
