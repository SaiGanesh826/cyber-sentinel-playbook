import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { NipunLogo, BRAND } from "@/components/brand";
import { Inbox, Eye, GraduationCap, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: `${BRAND.name} — ${BRAND.tagline}` },
      {
        name: "description",
        content:
          "Internal cybersecurity awareness training for Nipun employees. Investigate real phishing emails inside a realistic virtual office.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 soc-grid opacity-30 pointer-events-none" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center" aria-label="Nipun home">
          <NipunLogo className="h-14 w-auto" />
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            to="/auth"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ tab: "signup" } as any}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Register
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="chip">EMPLOYEE TRAINING · LIVE</span>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
              Sharpen your team against{" "}
              <span className="text-primary">real phishing</span> threats.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              Nipun's awareness platform places employees inside a realistic
              virtual office and corporate mailbox. Investigate suspicious messages
              just like you would at work, report what looks wrong, and receive a
              personalized learning report after every session.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ tab: "signup" } as any}
                className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Start training
              </Link>
              <Link
                to="/auth"
                className="rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-muted"
              >
                I have an account
              </Link>
            </div>
          </div>

          <div className="soc-card relative overflow-hidden p-2">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="mono ml-3 text-xs text-muted-foreground">
                inbox · employee@nipun.com
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-md bg-muted px-5 py-12">
              <NipunLogo className="h-32 w-auto" />
              <p className="mono mt-6 text-center text-xs text-muted-foreground">
                Nipun · Internal Cybersecurity Awareness
              </p>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={Inbox} title="Realistic inbox" body="Outlook-style email client with 10 workplace messages." />
          <Feature icon={Eye} title="Virtual office" body="Investigate from a corporate desktop, not a quiz." />
          <Feature icon={GraduationCap} title="Hidden scoring" body="Behavior is silently evaluated server-side." />
          <Feature icon={Activity} title="Learning report" body="Strengths, gaps, and best practices after every run." />
        </section>
      </main>
      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nipun · Internal use only · {BRAND.shortTagline}
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="soc-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
