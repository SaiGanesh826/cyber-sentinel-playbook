import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Globe,
  Users,
  DatabaseLock,
  Smartphone,
  Building2,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: TrainingPage,
});

type Module = {
  slug: string;
  title: string;
  description: string;
  duration: string;
  status: "available" | "coming_soon";
  icon: any;
};

const MODULES: Module[] = [
  {
    slug: "phishing-awareness",
    title: "Phishing Awareness Training",
    description:
      "Investigate a realistic business inbox and identify legitimate vs. suspicious emails the way a SOC analyst would.",
    duration: "≈ 45 min",
    status: "available",
    icon: ShieldCheck,
  },
  {
    slug: "password-security",
    title: "Password Security",
    description: "Build strong credential hygiene, password managers, and recovery workflows.",
    duration: "≈ 20 min",
    status: "coming_soon",
    icon: KeyRound,
  },
  {
    slug: "safe-internet-browsing",
    title: "Safe Internet Browsing",
    description: "Recognise unsafe websites, browser warnings, and common drive-by traps.",
    duration: "≈ 20 min",
    status: "coming_soon",
    icon: Globe,
  },
  {
    slug: "social-engineering",
    title: "Social Engineering",
    description: "Defend against pretexting, vishing, smishing, and impersonation attempts.",
    duration: "≈ 25 min",
    status: "coming_soon",
    icon: Users,
  },
  {
    slug: "data-protection",
    title: "Data Protection",
    description: "Classify, handle, and share sensitive information without leaks.",
    duration: "≈ 25 min",
    status: "coming_soon",
    icon: DatabaseLock,
  },
  {
    slug: "mobile-security",
    title: "Mobile Security",
    description: "Lock down phones and tablets that access company data.",
    duration: "≈ 20 min",
    status: "coming_soon",
    icon: Smartphone,
  },
  {
    slug: "physical-security",
    title: "Physical Security",
    description: "Badges, tailgating, clean desks, and other on-site risks.",
    duration: "≈ 15 min",
    status: "coming_soon",
    icon: Building2,
  },
];

function TrainingPage() {
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
          <span className="chip">CYBERSECURITY · AWARENESS TRAINING</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Employee"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose an awareness module below. New modules will appear here as they are released.
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

      <h2 className="mt-10 text-lg font-semibold">Awareness modules</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => (
          <ModuleCard key={mod.slug} module={mod} />
        ))}
      </div>

      {myScores && myScores.length > 0 && (
        <>
          <h2 className="mt-12 text-lg font-semibold">Recent attempts</h2>
          <div className="soc-card mt-3 p-6">
            <ul className="divide-y divide-border text-sm">
              {myScores.map((s) => (
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
        </>
      )}
    </div>
  );
}

function ModuleCard({ module: mod }: { module: Module }) {
  const Icon = mod.icon;
  const available = mod.status === "available";
  return (
    <div className="soc-card flex flex-col p-6">
      <div className="flex items-start justify-between">
        <div
          className={`grid h-12 w-12 place-items-center rounded-md ${
            available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        {available ? (
          <span className="chip chip-success">AVAILABLE</span>
        ) : (
          <span className="chip">COMING SOON</span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold leading-snug">{mod.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{mod.description}</p>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
        Duration · {mod.duration}
      </div>
      {available ? (
        <Link
          to="/training/$slug"
          params={{ slug: mod.slug }}
          className="mt-4 inline-flex items-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Take Assessment <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <button
          disabled
          className="mt-4 inline-flex items-center gap-2 self-start rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
        >
          <Lock className="h-3.5 w-3.5" /> Coming soon
        </button>
      )}
    </div>
  );
}
