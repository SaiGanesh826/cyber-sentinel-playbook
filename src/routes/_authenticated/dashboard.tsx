import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { claimSuperAdmin } from "@/lib/soc.functions";
import { useQuery } from "@tanstack/react-query";
import {
  MailWarning,
  KeyRound,
  Bug,
  Network,
  ShieldAlert,
  Users,
  DatabaseZap,
  Usb,
  UserX,
  Lock,
  Activity,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, any> = {
  "mail-warning": MailWarning,
  "key-round": KeyRound,
  bug: Bug,
  network: Network,
  "shield-alert": ShieldAlert,
  users: Users,
  "database-lock": DatabaseZap,
  usb: Usb,
  "user-x": UserX,
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, roles, refresh } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(false);
  const claim = useServerFn(claimSuperAdmin);

  const { data: modules, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_modules")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: myScores } = useQuery({
    queryKey: ["my-scores", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("scores")
        .select("total, accuracy, created_at, session_id")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  // Bootstrap: if no super_admin exists yet, allow the first user to claim it.
  const { data: needsBootstrap } = useQuery({
    queryKey: ["needs-bootstrap"],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "super_admin");
      return (count ?? 0) === 0;
    },
  });

  async function doClaim() {
    setBootstrapping(true);
    try {
      await claim();
      toast.success("You are now the super administrator.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBootstrapping(false);
    }
  }

  const isStaff = roles.some((r) =>
    ["super_admin", "admin", "manager"].includes(r),
  );

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip">SOC · ANALYST</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Analyst"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a training module to launch a live exercise.
          </p>
        </div>
        {isStaff && (
          <Link
            to="/admin"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Open admin console →
          </Link>
        )}
      </div>

      {needsBootstrap && (
        <div className="soc-card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <span className="chip chip-warn">FIRST-RUN SETUP</span>
            <h3 className="mt-2 font-semibold">No super administrator yet</h3>
            <p className="text-sm text-muted-foreground">
              Claim this account as the platform super admin to access the admin
              console.
            </p>
          </div>
          <button
            disabled={bootstrapping}
            onClick={doClaim}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {bootstrapping ? "Claiming…" : "Claim super admin"}
          </button>
        </div>
      )}

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <KPI label="Modules available" value={String(modules?.filter((m) => m.is_enabled && m.is_available).length ?? 0)} />
        <KPI label="Exercises completed" value={String(myScores?.length ?? 0)} />
        <KPI
          label="Last score"
          value={myScores?.[0] ? `${myScores[0].total}/100` : "—"}
        />
      </section>

      <h2 className="mt-12 text-lg font-semibold">Training modules</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="soc-card h-44 animate-pulse" />
            ))
          : modules?.map((m) => {
              const Icon = ICONS[m.icon ?? ""] ?? Activity;
              const active = m.is_enabled && m.is_available;
              return (
                <div key={m.id} className="soc-card flex flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {active ? (
                      <span className="chip chip-success">ACTIVE</span>
                    ) : (
                      <span className="chip chip-muted">
                        <Lock className="h-3 w-3" />
                        Coming soon
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold">{m.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {m.description}
                  </p>
                  {active ? (
                    <Link
                      to="/training/$slug"
                      params={{ slug: m.slug }}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      Launch <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <div className="mt-4 text-xs text-muted-foreground">
                      Not available yet
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="soc-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold mono">{value}</div>
    </div>
  );
}
