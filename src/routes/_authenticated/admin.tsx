import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: who } = await supabase.auth.getUser();
    if (!who.user) throw redirect({ to: "/auth" });
    const { data: rolesRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", who.user.id);
    const roles = (rolesRows ?? []).map((r: any) => r.role);
    if (!roles.some((r: string) => ["super_admin", "admin", "manager"].includes(r))) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
