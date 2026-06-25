import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AppRole } from "@/lib/auth-context";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  status: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadIdentity = useCallback(async (u: User | null) => {
    if (!u) {
      setRoles([]);
      setProfile(null);
      return;
    }
    const [{ data: rolesRows }, { data: profileRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", u.id),
      supabase
        .from("profiles")
        .select("id, full_name, email, department, status")
        .eq("id", u.id)
        .maybeSingle(),
    ]);
    setRoles(((rolesRows ?? []) as { role: AppRole }[]).map((r) => r.role));
    setProfile((profileRow as Profile | null) ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    await loadIdentity(data.user ?? null);
  }, [loadIdentity]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      await loadIdentity(u);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      )
        return;
      const u = session?.user ?? null;
      setUser(u);
      // defer identity load to avoid Supabase deadlock inside listener
      setTimeout(() => {
        loadIdentity(u);
      }, 0);
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadIdentity, router, queryClient]);

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  }, [queryClient, router]);

  return (
    <AuthContext.Provider
      value={{ user, roles, profile, loading, refresh, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
