import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Inbox, ArrowRight, Trophy, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, roles } = useAuth();
  const isStaff = roles.some((r) => ["super_admin", "admin", "manager"].includes(r));

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

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip">CYBERSECURITY · DASHBOARD</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Employee"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch a cybersecurity training session whenever you're ready.
          </p>
        </div>
        {isStaff && (
          <Link
            to="/admin"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Open admin console →
          </Link>
        )}
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <KPI icon={Inbox} label="Sessions completed" value={String(myScores?.length ?? 0)} />
        <KPI icon={Trophy} label="Last score" value={myScores?.[0] ? `${myScores[0].total}/100` : "—"} />
        <KPI
          icon={Target}
          label="Average accuracy"
          value={
            myScores && myScores.length > 0
              ? `${Math.round(myScores.reduce((a, s) => a + Number(s.accuracy ?? 0), 0) / myScores.length)}%`
              : "—"
          }
        />
      </section>

      <h2 className="mt-12 text-lg font-semibold">Available training</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="soc-card flex flex-col p-6">
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="chip chip-success">ACTIVE</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold">Training</h3>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">
            Enter the virtual office, investigate the 10 messages in your inbox, and submit
            your investigation. You'll receive a personalized learning report. More
            cybersecurity training modules will be added to this section soon.
          </p>
          <Link
            to="/training/$slug"
            params={{ slug: "phishing-inbox" }}
            className="mt-4 inline-flex items-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Launch training <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {myScores && myScores.length > 0 && (
          <div className="soc-card p-6">
            <h3 className="text-lg font-semibold">Recent sessions</h3>
            <ul className="mt-3 divide-y divide-border text-sm">
              {myScores.slice(0, 5).map((s) => (
                <li key={s.session_id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{new Date(s.created_at).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Accuracy {s.accuracy}%</div>
                  </div>
                  <Link
                    to="/results/$sessionId"
                    params={{ sessionId: s.session_id! }}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {s.total}/100
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="soc-card flex items-center gap-4 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-semibold mono">{value}</div>
      </div>
    </div>
  );
}
