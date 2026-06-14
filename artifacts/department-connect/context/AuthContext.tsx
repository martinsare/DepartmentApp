import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DEMO_CREDENTIALS, DEMO_USERS, User, UserRole } from "@/lib/demoData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ error?: string; role?: UserRole }>;
  loginAsDemo: (userId: string) => Promise<{ role?: UserRole }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "dc_demo_user_id";

function resolveIdentifier(identifier: string): string | undefined {
  const lower = identifier.toLowerCase();
  if (DEMO_CREDENTIALS[lower]) return DEMO_CREDENTIALS[lower];
  const byMatric = DEMO_USERS.find((u) => u.matric_number?.toLowerCase() === lower);
  if (byMatric) return byMatric.id;
  return undefined;
}

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
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Restore session from Supabase
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session?.user?.email) {
          const profile = await fetchProfile(data.session.user.email);
          setUser(profile ?? DEMO_USERS.find((u) => u.email === data.session!.user.email) ?? null);
        }
        setLoading(false);
      });

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user?.email) {
          const profile = await fetchProfile(session.user.email);
          setUser(profile ?? DEMO_USERS.find((u) => u.email === session.user.email) ?? null);
        } else {
          setUser(null);
        }
      });
      return () => listener.subscription.unsubscribe();
    } else {
      // Demo mode — restore from AsyncStorage
      AsyncStorage.getItem(STORAGE_KEY).then((id) => {
        if (id) {
          const found = DEMO_USERS.find((u) => u.id === id);
          if (found) setUser(found);
        }
        setLoading(false);
      });
    }
  }, []);

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ error?: string; role?: UserRole }> => {
    if (isSupabaseConfigured && supabase) {
      // Try Supabase auth first
      const { error, data } = await supabase.auth.signInWithPassword({
        email: identifier.toLowerCase(),
        password,
      });
      if (!error && data.user?.email) {
        const profile = await fetchProfile(data.user.email);
        if (profile) {
          setUser(profile);
          return { role: profile.role };
        }
      }
      // Fall through to demo login if Supabase auth fails (demo users aren't in auth)
    }

    // Demo mode login (email, matric number, or password = anything)
    const userId = resolveIdentifier(identifier);
    if (!userId) return { error: "Invalid email, matric number, or password" };
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return { error: "User not found" };
    await AsyncStorage.setItem(STORAGE_KEY, found.id);
    setUser(found);
    return { role: found.role };
  };

  const loginAsDemo = async (userId: string): Promise<{ role?: UserRole }> => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return {};
    await AsyncStorage.setItem(STORAGE_KEY, found.id);
    setUser(found);
    return { role: found.role };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
