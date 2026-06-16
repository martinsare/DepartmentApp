import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { DEFAULT_DEPARTMENT_ID } from "@/lib/types";

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "lecturer" | "admin";
  matric_number?: string;
  level?: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; role?: UserRole }>;
  signup: (data: SignUpData) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(email: string): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    role: data.role as UserRole,
    full_name: data.full_name,
    email: data.email,
    matric_number: data.matric_number ?? undefined,
    department_id: data.department_id,
    level: data.level ?? undefined,
    phone: data.phone ?? undefined,
    avatar_url: data.avatar_url ?? undefined,
    status: data.status ?? "pending",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user?.email) {
        const profile = await fetchProfile(data.session.user.email);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const profile = await fetchProfile(session.user.email);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string; role?: UserRole }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: "Supabase is not configured. Please check your environment variables." };
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Incorrect email or password." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "Please verify your email before logging in." };
      }
      return { error: error.message };
    }

    if (data.user?.email) {
      const profile = await fetchProfile(data.user.email);
      if (profile) {
        if (profile.status === "pending") {
          await supabase.auth.signOut();
          return { error: "Your account is pending approval from your department admin. You will be notified once approved." };
        }
        if (profile.status === "suspended") {
          await supabase.auth.signOut();
          return { error: "Your account has been suspended. Please contact your department admin." };
        }
        setUser(profile);
        return { role: profile.role };
      }
      return { error: "Account found but profile is missing. Contact your department admin." };
    }

    return { error: "Login failed. Please try again." };
  };

  const signup = async (signUpData: SignUpData): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: "Supabase is not configured. Please check your environment variables." };
    }

    const { error: authError, data } = await supabase.auth.signUp({
      email: signUpData.email.toLowerCase().trim(),
      password: signUpData.password,
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return { error: "An account with this email already exists." };
      }
      return { error: authError.message };
    }

    if (!data.user) return { error: "Signup failed. Please try again." };

    const profileId = data.user.id;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: profileId,
      role: signUpData.role,
      full_name: signUpData.full_name.trim(),
      email: signUpData.email.toLowerCase().trim(),
      matric_number: signUpData.matric_number?.trim() || null,
      level: signUpData.level || null,
      phone: signUpData.phone?.trim() || null,
      department_id: DEFAULT_DEPARTMENT_ID,
      status: signUpData.role === "admin" ? "active" : "pending",
    }, {
      onConflict: "id",
    });

    if (profileError) {
      console.warn("Profile setup failed:", profileError);
      return { error: profileError.message };
    }

    // Auto-approve if this email was pre-invited by admin
    if (supabase) {
      const { data: invite } = await supabase
        .from("invitations")
        .select("id")
        .eq("email", signUpData.email.toLowerCase().trim())
        .maybeSingle();
      if (invite) {
        await supabase.from("profiles").update({ status: "active" }).eq("id", profileId);
        await supabase.from("invitations").delete().eq("id", invite.id);
      }
    }

    return {};
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: "Supabase is not configured." };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: undefined }
    );
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
