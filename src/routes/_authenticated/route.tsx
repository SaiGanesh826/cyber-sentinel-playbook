import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck,
  LayoutDashboard,
  GraduationCap,
  Trophy,
  LogOut,
  Settings,
  Users,
  Megaphone,
  FileWarning,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthedShell,
});

function AuthedShell() {
  const { profile, roles, signOut, loading } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isStaff = roles.some((r) => ["super_admin", "admin", "manager"].includes(r));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mono text-xs text-muted-foreground">Loading session…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-surface/60 backdrop-blur lg:block">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-border">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">SOC Defender</div>
            <div className="mono text-[10px] text-muted-foreground">
              {isStaff ? "Admin console" : "Analyst workspace"}
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3 text-sm">
          <NavItem to="/dashboard" active={path === "/dashboard"} icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem to="/training" active={path.startsWith("/training")} icon={GraduationCap}>
            Training
          </NavItem>
          <NavItem to="/leaderboard" active={path.startsWith("/leaderboard")} icon={Trophy}>
            Leaderboard
          </NavItem>
          {isStaff && (
            <>
              <div className="mono mt-4 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                Administration
              </div>
              <NavItem to="/admin" active={path === "/admin"} icon={LayoutDashboard}>
                Overview
              </NavItem>
              <NavItem to="/admin/registrations" active={path.startsWith("/admin/registrations")} icon={ClipboardCheck}>
                Registrations
              </NavItem>
              <NavItem to="/admin/employees" active={path.startsWith("/admin/employees")} icon={Users}>
                Employees
              </NavItem>
              <NavItem to="/admin/campaigns" active={path.startsWith("/admin/campaigns")} icon={Megaphone}>
                Campaigns
              </NavItem>
              <NavItem to="/admin/scenarios" active={path.startsWith("/admin/scenarios")} icon={FileWarning}>
                Scenarios
              </NavItem>
              <NavItem to="/admin/reports" active={path.startsWith("/admin/reports")} icon={BarChart3}>
                Reports
              </NavItem>
            </>
          )}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          <div className="rounded-md bg-surface-2 px-3 py-2">
            <div className="truncate text-sm font-medium">{profile?.full_name || "Analyst"}</div>
            <div className="mono truncate text-[11px] text-muted-foreground">{profile?.email}</div>
            <div className="mt-2 flex gap-2">
              <span className="chip">{roles[0] ?? "employee"}</span>
              <button
                onClick={signOut}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">SOC Defender</span>
        </Link>
        <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </header>

      <main className="lg:pl-60">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as any}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
