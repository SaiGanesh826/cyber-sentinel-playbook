import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { startInboxSession } from "@/lib/inbox.functions";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, ArrowRight, Inbox, Target, Flag, FileSearch, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/$slug")({
  component: MissionBriefing,
});

function MissionBriefing() {
  const navigate = useNavigate();
  const start = useServerFn(startInboxSession);
  const [launching, setLaunching] = useState(false);

  async function launch() {
    setLaunching(true);
    try {
      const res = await start();
      navigate({ to: "/play/$sessionId", params: { sessionId: res.session_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to start session");
      setLaunching(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>
      <span className="chip mt-4">MISSION BRIEFING</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Training — Inbox Investigation
      </h1>
      <p className="mt-3 text-muted-foreground">
        You are about to enter a virtual workstation. Treat this exactly like a normal
        workday at Nipun.
      </p>

      <div className="soc-card mt-8 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-accent" />
          <div className="space-y-3 text-sm">
            <p className="font-medium text-foreground">
              You are working as an employee in the organization.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Review your inbox carefully — 10 emails are waiting.</li>
              <li>Investigate emails exactly as you would during your daily work.</li>
              <li>
                If you believe an email is suspicious or phishing, click{" "}
                <b className="text-foreground">Report to Security</b> and complete the
                incident investigation form.
              </li>
              <li>
                If you believe an email is legitimate, simply close it and move on — no
                action required.
              </li>
              <li>You may open emails in any order and revisit them as often as you like.</li>
              <li>
                <b className="text-foreground">No hints will be provided</b>, and the
                platform will not tell you whether your decisions are correct.
              </li>
              <li>
                Your investigation will be evaluated only after you click{" "}
                <b className="text-foreground">Submit Investigation</b>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Inbox} title="10 emails" body="Mix of legitimate, suspicious, and phishing." />
        <Stat icon={FileSearch} title="Free-form" body="Open any email in any order, as many times as you need." />
        <Stat icon={Flag} title="Report only what's bad" body="Don't report safe emails — that's a false alarm." />
      </div>

      <button
        disabled={launching}
        onClick={launch}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {launching ? "Booting workstation…" : "Enter virtual office"}
        <ArrowRight className="h-4 w-4" />
      </button>
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

// Suppress unused param warning
void Target;
