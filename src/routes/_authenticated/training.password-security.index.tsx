import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, KeyRound, Smartphone, ShieldCheck, Siren, Clock, Lock, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/password-security/")({
  head: () => ({
    meta: [
      { title: "Password Security & MFA Awareness — Nipun" },
      { name: "description", content: "A 30-minute, four-mission simulation on passwords and multi-factor authentication." },
    ],
  }),
  component: ModuleOverview,
});

const MISSIONS = [
  { icon: KeyRound, title: "Password Detective", body: "Inspect six recovered passwords and flag the ones an attacker could crack." },
  { icon: Smartphone, title: "MFA Panic Room", body: "Your phone lights up with sign-in requests. Approve or deny each one." },
  { icon: ShieldCheck, title: "Secure Your Digital Life", body: "Drag everyday habits into SAFE or UNSAFE." },
  { icon: Siren, title: "Final Mission: Save the Employee Account", body: "Respond to a live account-compromise incident as clues unfold." },
];

function ModuleOverview() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10" style={{ fontFamily: "Cambria, Georgia, serif" }}>
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to training
      </Link>
      <span className="chip mt-4">INTERACTIVE WORKSHOP</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Password Security &amp; MFA Awareness</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Step into four short missions and make the security decisions an employee faces every day. All examples are fictional.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MISSIONS.map((m, i) => (
          <div key={m.title} className="soc-card p-5">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><m.icon className="h-5 w-5" /></div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Mission {i + 1}</span>
            </div>
            <h3 className="mt-3 font-semibold">{m.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Info icon={Clock} title="30 minutes" body="One shared timer for all missions" />
        <Info icon={Eye} title="No hints" body="Answers revealed in your final report" />
        <Info icon={Lock} title="One attempt" body="Retakes only with admin approval" />
      </div>

      <Link to="/training/password-security/workshop" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
        Enter workshop <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Info({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="soc-card p-4">
      <Icon className="h-4 w-4 text-accent" />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{body}</div>
    </div>
  );
}
