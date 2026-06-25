import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { NipunLogo } from "@/components/brand";
import {
  LayoutDashboard,
  GraduationCap,
  Trophy,
  LogOut,
  Users,
  Megaphone,
  FileWarning,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
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

// Friendly role labels — Super Admin is NEVER shown to employees.
function publicRoleLabel(roles: string[]): string {
  if (roles.includes("super_admin") || roles.includes("admin")) return "Administrator";
  if (roles.includes("manager")) return "Manager";
  return "Employee";
}

function AuthedShell() {
  const { profile, roles, signOut, loading } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isStaff = roles.some((r) => ["super_admin", "admin", "manager"].includes(r));
  const isSuperAdmin = roles.includes("super_admin");
  const isOfficeMode = path.startsWith("/play/");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mono text-xs text-muted-foreground">Loading session…</div>
      </div>
    );
  }

  // Inside the virtual office, hide all chrome.
  if (isOfficeMode) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <div className="flex h-24 items-center justify-center px-5 border-b border-border">
          <NipunLogo className="h-14 w-auto" />
        </div>
        <nav className="flex flex-col gap-1 p-3 text-sm">
          <NavItem to="/dashboard" active={path === "/dashboard"} icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem to="/training/phishing-inbox" active={path.startsWith("/training")} icon={GraduationCap}>
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
              {isSuperAdmin && (
                <NavItem
                  to="/admin/administrators"
                  active={path.startsWith("/admin/administrators")}
                  icon={ShieldCheck}
                >
                  Administrators
                </NavItem>
              )}
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
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="truncate text-sm font-medium">{profile?.full_name || "Employee"}</div>
            <div className="mono truncate text-[11px] text-muted-foreground">{profile?.email}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="chip">{publicRoleLabel(roles)}</span>
              <button
                onClick={signOut}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <NipunLogo className="h-7 w-auto" />
          <span className="text-sm font-semibold">Cyber Awareness</span>
        </Link>
        <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </header>

      <main className="lg:pl-64">
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
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
