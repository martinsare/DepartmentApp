import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? "";
const supabaseAnonKey = process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "lecturer" | "student";
          full_name: string;
          email: string;
          matric_number: string | null;
          department_id: string;
          level: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          code: string;
          lecturer_id: string;
          department_id: string;
          enrolled_count: number;
          created_at: string;
        };
      };
      class_sessions: {
        Row: {
          id: string;
          course_id: string;
          lecturer_id: string;
          date: string;
          time: string;
          venue: string;
          status: "scheduled" | "ongoing" | "cancelled" | "ended";
          created_at: string;
        };
      };
      live_status: {
        Row: {
          session_id: string;
          status: string;
          updated_at: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          type: "general" | "assignment" | "test" | "emergency";
          department_id: string;
          created_at: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          title: string;
          description: string;
          target_amount: number;
          amount_per_student: number;
          deadline: string;
          department_id: string;
          created_by: string;
          created_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          contribution_id: string;
          student_id: string;
          transaction_id: string;
          amount: number;
          status: "paid" | "pending" | "failed";
          created_at: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          matric_number: string;
          time_recorded: string;
          created_at: string;
        };
      };
    };
  };
};
