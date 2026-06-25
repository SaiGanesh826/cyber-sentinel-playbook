import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  ClipboardCheck,
  Megaphone,
  FileWarning,
  BarChart3,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pending, employees, sessions, scores] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("game_sessions").select("id", { count: "exact", head: true }),
        supabase.from("scores").select("total"),
      ]);
      const totals = (scores.data ?? []).map((s) => s.total);
      const avg = totals.length
        ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
        : 0;
      return {
        pending: pending.count ?? 0,
        employees: employees.count ?? 0,
        sessions: sessions.count ?? 0,
        avg,
      };
    },
  });

  return (
    <div className="px-6 py-10 lg:px-10">
      <span className="chip">ADMIN · OVERVIEW</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        SOC operations center
      </h1>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending registrations"
          value={String(stats?.pending ?? "—")}
          to="/admin/registrations"
          icon={ClipboardCheck}
          accent="warn"
        />
        <StatCard
          label="Active employees"
          value={String(stats?.employees ?? "—")}
          to="/admin/employees"
          icon={Users}
        />
        <StatCard
          label="Investigations run"
          value={String(stats?.sessions ?? "—")}
          to="/admin/reports"
          icon={Activity}
        />
        <StatCard
          label="Average score"
          value={`${stats?.avg ?? 0}/100`}
          to="/admin/reports"
          icon={BarChart3}
        />
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          to="/admin/campaigns"
          title="Campaign management"
          body="Create awareness campaigns and generate employee registration links."
          icon={Megaphone}
        />
        <AdminCard
          to="/admin/scenarios"
          title="Phishing scenarios"
          body="Author, edit, and toggle the email scenarios employees train on."
          icon={FileWarning}
        />
        <AdminCard
          to="/admin/reports"
          title="Reports & analytics"
          body="Per-employee and per-campaign performance. Exportable."
          icon={BarChart3}
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  to,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  to: string;
  icon: any;
  accent?: "warn";
}) {
  return (
    <Link to={to as any} className="soc-card block p-5 transition hover:border-primary/50">
      <Icon
        className={`h-5 w-5 ${accent === "warn" ? "text-warning" : "text-primary"}`}
      />
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold mono">{value}</div>
    </Link>
  );
}

function AdminCard({
  to,
  title,
  body,
  icon: Icon,
}: {
  to: string;
  title: string;
  body: string;
  icon: any;
}) {
  return (
    <Link to={to as any} className="soc-card block p-6 transition hover:border-primary/50">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
