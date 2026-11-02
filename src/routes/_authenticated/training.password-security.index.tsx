import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  ListChecks,
  Clock,
  KeyRound,
  Fingerprint,
  Eye,
  RotateCcw,
  Trophy,
  ShieldCheck,
  Copy,
  BellOff,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/password-security/")({
  component: ModuleOverview,
});

function ModuleOverview() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to training
      </Link>

      <span className="chip mt-4">MODULE OVERVIEW</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Password Security &amp; MFA Awareness
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review the objectives, activities, and rules before you start the workshop. Everything
        uses fictional examples — never enter real passwords or codes during training.
      </p>

      <Section icon={Target} title="Learning objectives">
        <p>After this workshop you will be able to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Explain the risks of weak and reused passwords.</li>
          <li>Understand how attackers exploit passwords leaked in data breaches.</li>
          <li>Create strong, unique passwords for every account.</li>
          <li>Recognise why passwords and one-time codes (OTPs) must never be shared.</li>
          <li>Describe what MFA is and how it protects your accounts.</li>
          <li>Identify unexpected MFA approval requests and respond safely.</li>
          <li>Explain why a password manager makes good security easier.</li>
        </ul>
      </Section>

      <Section icon={ListChecks} title="Interactive workshop activities">
        <ul className="space-y-2 text-muted-foreground">
          <ActivityRow icon={KeyRound} title="Password Strength Challenge" body="Classify fictional passwords as weak, moderate, or strong and learn why predictable ones are risky." />
          <ActivityRow icon={Copy} title="Password Reuse Challenge" body="One breached shopping site, one reused password — trace what happens next." />
          <ActivityRow icon={Fingerprint} title="MFA Approval Challenge" body="Decide the safest response to expected and unexpected MFA prompts." />
          <ActivityRow icon={Eye} title="Spot the Security Mistake" body="Find the mistake in everyday workplace situations." />
          <ActivityRow icon={Search} title="Real-World Attack Scenarios" body="Choose the right response to password theft, credential leaks, and MFA fatigue." />
          <ActivityRow icon={BellOff} title="Final Knowledge Assessment" body="A 10-question scenario quiz with explanations and personalized feedback." />
        </ul>
      </Section>

      <Section icon={ShieldCheck} title="Rules">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>No hints are provided — the workshop will not tell you whether your decisions are correct until you review them.</li>
          <li>All passwords, codes, and situations are fictional examples for training only.</li>
          <li>Never type or share a real password, OTP, or confidential company information.</li>
          <li>You can complete the activities at your own pace; your final score comes from the 10-question assessment.</li>
        </ul>
      </Section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Clock} title="Duration" body="≈ 40 minutes" />
        <Stat icon={ListChecks} title="Format" body="5 activities + 10-question assessment" />
        <Stat icon={Trophy} title="Scoring" body="Final quiz score out of 10 with feedback" />
      </div>

      <Section icon={Trophy} title="Scoring information">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Each activity gives instant feedback so you can learn as you go — activities are not scored.</li>
          <li>The final assessment has 10 questions worth 1 point each.</li>
          <li>Your result includes a performance level and personalized feedback.</li>
          <li>You can restart the workshop any time to improve your result.</li>
        </ul>
      </Section>

      <Link
        to="/training/password-security/workshop"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Start Workshop <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <RotateCcw className="h-3 w-3" /> Completed before? Restarting resets your progress and records a new attempt.
      </div>
    </div>
  );
}

function ActivityRow({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>
        <b className="text-foreground">{title}</b> — {body}
      </span>
    </li>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="soc-card mt-6 p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      </div>
      <div className="mt-3 text-sm text-foreground/90">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="soc-card p-4">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
