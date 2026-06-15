import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { sendApprovalEmail, sendInviteEmail, sendRejectionEmail } from "@/lib/email";
import { scheduleAnnouncementNotification } from "@/lib/notifications";
import {
  Announcement,
  AttendanceRecord,
  ClassSession,
  Contribution,
  Course,
  Invitation,
  LiveStatus,
  Payment,
  User,
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
  addAttendance: (record: AttendanceRecord) => void;
  approveUser: (userId: string, role: User["role"], name: string, email: string) => Promise<void>;
  rejectUser: (userId: string, name: string, email: string) => Promise<void>;
  addInvitedUser: (data: Omit<Invitation, "id" | "created_at">) => Promise<{ error?: string }>;
  removeInvitation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function buildUserMap(users: User[]): Map<string, User> {
  return new Map(users.map((u) => [u.id, u]));
}

function buildCourseMap(courses: Course[]): Map<string, Course> {
  return new Map(courses.map((c) => [c.id, c]));
}

function enrichSessions(
  rows: any[],
  courseMap: Map<string, Course>,
  userMap: Map<string, User>
): ClassSession[] {
  return rows.map((r) => {
    const course = courseMap.get(r.course_id);
    const lecturer = userMap.get(r.lecturer_id);
    return {
      id: r.id,
      course_id: r.course_id,
      course_code: course?.code,
      course_title: course?.title,
      lecturer_id: r.lecturer_id,
      lecturer_name: lecturer?.full_name,
      date: r.date,
      time: r.time,
      venue: r.venue,
      status: r.status,
    } satisfies ClassSession;
  });
}

function enrichCourses(rows: any[], userMap: Map<string, User>): Course[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    code: r.code,
    lecturer_id: r.lecturer_id,
    lecturer_name: userMap.get(r.lecturer_id)?.full_name,
    department_id: r.department_id,
    enrolled_count: r.enrolled_count ?? 0,
  }));
}

function enrichAnnouncements(
  rows: any[],
  userMap: Map<string, User>,
  readIds: Set<string>
): Announcement[] {
  return rows.map((r) => {
    const author = userMap.get(r.author_id);
    return {
      id: r.id,
      author_id: r.author_id,
      author_name: author?.full_name ?? "Unknown",
      role: (author?.role ?? "admin") as Announcement["role"],
      title: r.title,
      body: r.body,
      type: r.type,
      department_id: r.department_id,
      created_at: r.created_at,
      read: readIds.has(r.id),
    } satisfies Announcement;
  });
}

function enrichAttendance(rows: any[], userMap: Map<string, User>): AttendanceRecord[] {
  return rows.map((r) => ({
    id: r.id,
    session_id: r.session_id,
    student_id: r.student_id,
    student_name: userMap.get(r.student_id)?.full_name,
    matric_number: r.matric_number,
    time_recorded: r.time_recorded,
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
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const readIdsRef = useRef<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const [
        { data: profileRows },
        { data: courseRows },
        { data: sessionRows },
        { data: annRows },
        { data: contribRows },
        { data: paymentRows },
        { data: attendRows },
        { data: liveRows },
        { data: inviteRows },
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("courses").select("*"),
        supabase.from("class_sessions").select("*").order("date").order("time"),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("contributions").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("live_status").select("*"),
        supabase.from("invitations").select("*").order("created_at", { ascending: false }),
      ]);

      const fetchedUsers: User[] = (profileRows ?? []).map((r: any) => ({
        id: r.id,
        role: r.role,
        full_name: r.full_name,
        email: r.email,
        matric_number: r.matric_number ?? undefined,
        department_id: r.department_id,
        level: r.level ?? undefined,
        phone: r.phone ?? undefined,
        avatar_url: r.avatar_url ?? undefined,
        status: r.status ?? "pending",
      }));

      const userMap = buildUserMap(fetchedUsers);
      const fetchedCourses = enrichCourses(courseRows ?? [], userMap);
      const courseMap = buildCourseMap(fetchedCourses);

      setUsers(fetchedUsers);
      setCourses(fetchedCourses);
      setSessions(enrichSessions(sessionRows ?? [], courseMap, userMap));
      setAnnouncements(enrichAnnouncements(annRows ?? [], userMap, readIdsRef.current));
      setContributions((contribRows ?? []) as Contribution[]);
      setPayments((paymentRows ?? []) as Payment[]);
      setAttendance(enrichAttendance(attendRows ?? [], userMap));
      setLiveStatus(rowsToLiveStatus(liveRows ?? []));
      setInvitations(
        (inviteRows ?? []).map((r: any) => ({
          id: r.id,
          email: r.email,
          full_name: r.full_name,
          role: r.role as Invitation["role"],
          matric_number: r.matric_number ?? undefined,
          level: r.level ?? undefined,
          phone: r.phone ?? undefined,
          created_at: r.created_at,
        }))
      );
    } catch (e) {
      console.warn("Supabase fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    fetchAll();

    const sb = supabase;

    const annChannel = sb
      .channel("rt-announcements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, (payload) => {
        const r = payload.new as any;
        setUsers((currentUsers) => {
          const uMap = buildUserMap(currentUsers);
          const ann: Announcement = {
            id: r.id,
            author_id: r.author_id,
            author_name: uMap.get(r.author_id)?.full_name ?? "Unknown",
            role: (uMap.get(r.author_id)?.role ?? "admin") as Announcement["role"],
            title: r.title,
            body: r.body,
            type: r.type,
            department_id: r.department_id,
            created_at: r.created_at,
            read: false,
          };
          setAnnouncements((prev) => {
            if (prev.find((a) => a.id === ann.id)) return prev;
            scheduleAnnouncementNotification(ann.title, ann.body, ann.type);
            return [ann, ...prev];
          });
          return currentUsers;
        });
      })
      .subscribe();

    const liveChannel = sb
      .channel("rt-live-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_status" }, (payload) => {
        const r = (payload.new ?? payload.old) as any;
        if (!r?.session_id) return;
        setLiveStatus((prev) => ({
          ...prev,
          [r.session_id]: { session_id: r.session_id, status: r.status, updated_at: r.updated_at },
        }));
      })
      .subscribe();

    const sessChannel = sb
      .channel("rt-sessions")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "class_sessions" }, (payload) => {
        const r = payload.new as any;
        setSessions((prev) =>
          prev.map((s) => (s.id === r.id ? { ...s, status: r.status } : s))
        );
      })
      .subscribe();

    return () => {
      sb.removeChannel(annChannel);
      sb.removeChannel(liveChannel);
      sb.removeChannel(sessChannel);
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
    setLiveStatus((prev) => ({
      ...prev,
      [sessionId]: { session_id: sessionId, status, updated_at },
    }));
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("live_status")
        .upsert({ session_id: sessionId, status, updated_at }, { onConflict: "session_id" });
    }
  }, []);

  const addSession = useCallback(async (session: ClassSession) => {
    setSessions((prev) => [session, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("class_sessions").insert({
        id: session.id,
        course_id: session.course_id,
        lecturer_id: session.lecturer_id,
        date: session.date,
        time: session.time,
        venue: session.venue,
        status: session.status,
      });
    }
  }, []);

  const addAnnouncement = useCallback(async (ann: Announcement) => {
    setAnnouncements((prev) => {
      if (prev.find((a) => a.id === ann.id)) return prev;
      return [ann, ...prev];
    });
    scheduleAnnouncementNotification(ann.title, ann.body, ann.type);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("announcements").insert({
        id: ann.id,
        author_id: ann.author_id,
        title: ann.title,
        body: ann.body,
        type: ann.type,
        department_id: ann.department_id,
        created_at: ann.created_at,
      });
    }
  }, []);

  const addPayment = useCallback(async (payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("payments").upsert({
        id: payment.id,
        contribution_id: payment.contribution_id,
        student_id: payment.student_id,
        transaction_id: payment.transaction_id,
        amount: payment.amount,
        status: payment.status,
        created_at: payment.created_at,
      }, { onConflict: "contribution_id,student_id" });
    }
  }, []);

  const addContribution = useCallback(async (c: Contribution) => {
    setContributions((prev) => [c, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("contributions").insert({
        id: c.id,
        title: c.title,
        description: c.description,
        target_amount: c.target_amount,
        amount_per_student: c.amount_per_student,
        deadline: c.deadline,
        department_id: c.department_id,
        created_by: c.created_by,
        created_at: c.created_at,
      });
    }
  }, []);

  const addCourse = useCallback(async (c: Course) => {
    setCourses((prev) => [c, ...prev]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("courses").insert({
        id: c.id,
        title: c.title,
        code: c.code,
        lecturer_id: c.lecturer_id,
        department_id: c.department_id,
        enrolled_count: c.enrolled_count ?? 0,
      });
    }
  }, []);

  const updateCourse = useCallback(async (id: string, patch: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (isSupabaseConfigured && supabase) {
      const dbPatch: Record<string, any> = {};
      if (patch.title) dbPatch.title = patch.title;
      if (patch.code) dbPatch.code = patch.code;
      if (patch.enrolled_count !== undefined) dbPatch.enrolled_count = patch.enrolled_count;
      await supabase.from("courses").update(dbPatch).eq("id", id);
    }
  }, []);

  const addAttendance = useCallback(async (record: AttendanceRecord) => {
    setAttendance((prev) => {
      if (prev.find((a) => a.session_id === record.session_id && a.student_id === record.student_id)) return prev;
      return [record, ...prev];
    });
    if (isSupabaseConfigured && supabase) {
      await supabase.from("attendance").upsert({
        id: record.id,
        session_id: record.session_id,
        student_id: record.student_id,
        matric_number: record.matric_number,
        time_recorded: record.time_recorded,
      }, { onConflict: "session_id,student_id" });
    }
  }, []);

  const approveUser = useCallback(async (userId: string, role: User["role"], name: string, email: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "active" as const, role } : u))
    );
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

  const addInvitedUser = useCallback(async (
    data: Omit<Invitation, "id" | "created_at">
  ): Promise<{ error?: string }> => {
    const newInv: Invitation = {
      id: Math.random().toString(36).slice(2),
      ...data,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("invitations").insert({
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        matric_number: data.matric_number ?? null,
        level: data.level ?? null,
        phone: data.phone ?? null,
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

  return (
    <DataContext.Provider
      value={{
        sessions,
        courses,
        announcements,
        contributions,
        payments,
        attendance,
        liveStatus,
        users,
        loading,
        markAnnouncementRead,
        updateSessionStatus,
        updateLiveStatus,
        addSession,
        addAnnouncement,
        addPayment,
        addContribution,
        addCourse,
        updateCourse,
        addAttendance,
        approveUser,
        rejectUser,
        addInvitedUser,
        removeInvitation,
        invitations,
        refresh: fetchAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
