import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DEMO_CREDENTIALS, DEMO_USERS, User } from "@/lib/demoData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ error?: string }>;
  loginAsDemo: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "dc_demo_user_id";

function resolveIdentifier(identifier: string): string | undefined {
  const lower = identifier.toLowerCase();
  if (DEMO_CREDENTIALS[lower]) return DEMO_CREDENTIALS[lower];
  const byMatric = DEMO_USERS.find(
    (u) => u.matric_number?.toLowerCase() === lower
  );
  if (byMatric) return byMatric.id;
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const profile = DEMO_USERS.find(
            (u) => u.email === data.session!.user.email
          );
          if (profile) setUser(profile);
        }
        setLoading(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            const profile = DEMO_USERS.find(
              (u) => u.email === session.user.email
            );
            if (profile) setUser(profile);
          } else {
            setUser(null);
          }
        }
      );
      return () => listener.subscription.unsubscribe();
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then((id) => {
        if (id) {
          const found = DEMO_USERS.find((u) => u.id === id);
          if (found) setUser(found);
        }
        setLoading(false);
      });
    }
  }, []);

  const login = async (identifier: string, _password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: _password,
      });
      if (error) return { error: error.message };
      return {};
    }
    const userId = resolveIdentifier(identifier);
    if (!userId) return { error: "Invalid email, matric number, or password" };
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return { error: "User not found" };
    await AsyncStorage.setItem(STORAGE_KEY, found.id);
    setUser(found);
    return {};
  };

  const loginAsDemo = async (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return;
    await AsyncStorage.setItem(STORAGE_KEY, found.id);
    setUser(found);
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
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
