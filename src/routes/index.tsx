import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Inbox, Eye, GraduationCap, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Send authenticated users to the app shell
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "SOC Defender — Realistic Phishing Awareness Training" },
      {
        name: "description",
        content:
          "Train your workforce on real phishing investigations, not multiple-choice quizzes. Built for enterprise security teams.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 soc-grid opacity-30 pointer-events-none" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">SOC Defender</div>
            <div className="mono text-[10px] text-muted-foreground">
              v1.0 · cyber-awareness platform
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/auth"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ tab: "signup" } as any}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="chip">SOC · TRAINING · LIVE</span>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
              Train your team on{" "}
              <span className="text-primary">real phishing</span>, not quizzes.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              SOC Defender hands employees a real inbox, a real suspicious email,
              and a real investigation. We silently track every action, then grade
              the submission with the same six categories a SOC analyst is judged
              on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ tab: "signup" } as any}
                className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Launch the platform
              </Link>
              <Link
                to="/auth"
                className="rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-accent"
              >
                I have an account
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <Stat label="Concurrent users" value="200+" />
              <Stat label="Hidden categories" value="6" />
              <Stat label="Modules ready" value="9" />
            </div>
          </div>

          <div className="soc-card relative overflow-hidden p-2">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="mono ml-3 text-xs text-muted-foreground">
                analyst@soc ~ inbox
              </span>
            </div>
            <div className="rounded-md bg-background/60 p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="mono">From: hr-payroll@micros0ft-support.com</span>
                <span className="chip chip-warn">UNVERIFIED</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">
                URGENT: Action required — Verify your payroll details by today 5PM
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Dear Employee, our records indicate your direct-deposit information
                is out of date. Please verify your account within 4 hours…
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip chip-danger">Look-alike domain</span>
                <span className="chip chip-danger">Urgency</span>
                <span className="chip chip-danger">Suspicious link</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={Inbox} title="Realistic inbox" body="A corporate email client UI — not a quiz." />
          <Feature icon={Eye} title="Silent telemetry" body="Every hover, click, and inspection is recorded." />
          <Feature icon={GraduationCap} title="Hidden scoring" body="Six SOC-style categories evaluated server-side." />
          <Feature icon={Activity} title="Personalized feedback" body="Strengths, gaps, and best practices after every run." />
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="soc-card px-4 py-3">
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <div className="soc-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
