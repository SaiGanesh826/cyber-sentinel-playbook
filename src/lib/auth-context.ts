import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "admin" | "manager" | "employee";

export interface AuthContextValue {
  user: User | null;
  roles: AppRole[];
  profile: {
    id: string;
    full_name: string;
    email: string;
    department: string | null;
    status: string;
  } | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function hasAnyRole(roles: AppRole[], wanted: AppRole[]) {
  return roles.some((r) => wanted.includes(r));
}
