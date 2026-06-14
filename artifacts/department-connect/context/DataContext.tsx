import React, { createContext, useContext, useState } from "react";
import {
  Announcement,
  AttendanceRecord,
  ClassSession,
  Contribution,
  Course,
  DEMO_ANNOUNCEMENTS,
  DEMO_ATTENDANCE,
  DEMO_CONTRIBUTIONS,
  DEMO_LIVE_STATUS,
  DEMO_PAYMENTS,
  DEMO_SESSIONS,
  DEMO_COURSES,
  DEMO_USERS,
  LiveStatus,
  Payment,
  User,
} from "@/lib/demoData";

interface DataContextValue {
  sessions: ClassSession[];
  courses: Course[];
  announcements: Announcement[];
  contributions: Contribution[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  liveStatus: Record<string, LiveStatus>;
  users: User[];
  markAnnouncementRead: (id: string) => void;
  updateSessionStatus: (id: string, status: ClassSession["status"]) => void;
  updateLiveStatus: (sessionId: string, status: LiveStatus["status"]) => void;
  addSession: (session: ClassSession) => void;
  addAnnouncement: (ann: Announcement) => void;
  addPayment: (payment: Payment) => void;
  addContribution: (c: Contribution) => void;
  addCourse: (c: Course) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ClassSession[]>(DEMO_SESSIONS);
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(DEMO_ANNOUNCEMENTS);
  const [contributions, setContributions] = useState<Contribution[]>(DEMO_CONTRIBUTIONS);
  const [payments, setPayments] = useState<Payment[]>(DEMO_PAYMENTS);
  const [attendance] = useState<AttendanceRecord[]>(DEMO_ATTENDANCE);
  const [liveStatus, setLiveStatus] =
    useState<Record<string, LiveStatus>>(DEMO_LIVE_STATUS);

  const markAnnouncementRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const updateSessionStatus = (id: string, status: ClassSession["status"]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const updateLiveStatus = (
    sessionId: string,
    status: LiveStatus["status"]
  ) => {
    setLiveStatus((prev) => ({
      ...prev,
      [sessionId]: { session_id: sessionId, status, updated_at: new Date().toISOString() },
    }));
  };

  const addSession = (session: ClassSession) => {
    setSessions((prev) => [session, ...prev]);
  };

  const addAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => [ann, ...prev]);
  };

  const addPayment = (payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
  };

  const addContribution = (c: Contribution) =>
    setContributions((prev) => [c, ...prev]);

  const addCourse = (c: Course) =>
    setCourses((prev) => [c, ...prev]);

  const updateCourse = (id: string, patch: Partial<Course>) =>
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

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
        users: DEMO_USERS,
        markAnnouncementRead,
        updateSessionStatus,
        updateLiveStatus,
        addSession,
        addAnnouncement,
        addPayment,
        addContribution,
        addCourse,
        updateCourse,
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
