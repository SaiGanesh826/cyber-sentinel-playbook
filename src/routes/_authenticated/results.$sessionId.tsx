import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getResults } from "@/lib/soc.functions";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  Timer,
  Target,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/results/$sessionId")({
  component: ResultsPage,
});

function ResultsPage() {
  const { sessionId } = Route.useParams();
  const fetchResults = useServerFn(getResults);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["results", sessionId],
    queryFn: () => fetchResults({ data: { session_id: sessionId } }),
  });

  if (isLoading)
    return <div className="px-6 py-12 text-sm text-muted-foreground">Evaluating your investigation…</div>;
  if (error || !data)
    return <div className="px-6 py-12 text-sm text-destructive">Could not load results.</div>;

  const feedback = data.feedback as any;
  const isInbox = feedback?.kind === "inbox";
  const minutes = Math.floor(data.time_taken_seconds / 60);
  const seconds = data.time_taken_seconds % 60;

  if (!isInbox) {
    // Legacy single-scenario feedback shape — minimal fallback
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Session complete</h1>
        <p className="mt-2 text-sm text-muted-foreground">Score: {data.total}/100</p>
      </div>
    );
  }

  const overall = feedback.overall;
  const ls = feedback.learning_summary;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">INVESTIGATION COMPLETE</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Learning report</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your submission has been locked. Use this report to strengthen your judgment.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Return to dashboard
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <SummaryStat icon={Trophy} label="Final score" value={`${data.total}/100`}
          tone={data.total >= 75 ? "success" : data.total >= 50 ? "warn" : "danger"} />
        <SummaryStat icon={Target} label="Accuracy" value={`${data.accuracy}%`} />
        <SummaryStat icon={Timer} label="Time taken" value={`${minutes}m ${seconds}s`} />
        <SummaryStat icon={ShieldCheck} label="Reported correctly"
          value={`${overall.correct_reported_count}/${overall.bad_total}`} />
      </section>

      <section className="soc-card p-6">
        <h2 className="text-lg font-semibold">Overall results</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Mini label="Correctly reported" value={overall.correct_reported_count} tone="success" />
          <Mini label="Correctly ignored" value={overall.correctly_ignored_count} tone="success" />
          <Mini label="Incorrectly reported" value={overall.incorrect_reported_count} tone="warn" />
          <Mini label="Missed" value={overall.missed_count} tone="danger" />
        </div>
        {(overall.clicked_suspicious_links.length > 0 || overall.opened_malicious_attachments.length > 0) && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            ⚠ Behavioral risk: clicked {overall.clicked_suspicious_links.length} suspicious link(s),
            opened {overall.opened_malicious_attachments.length} risky attachment(s).
          </div>
        )}
      </section>

      <FeedbackList
        title="Correctly reported emails"
        tone="success"
        icon={CheckCircle2}
        items={feedback.correct_reported.map((f: any) => ({
          title: f.subject,
          subtitle: f.sender,
          body: f.rationale,
          flags: f.red_flags,
        }))}
        emptyText="You didn't report any of the phishing or suspicious emails."
      />

      <FeedbackList
        title="Incorrectly reported (false alarms)"
        tone="warn"
        icon={AlertTriangle}
        items={feedback.incorrect_reported.map((f: any) => ({
          title: f.subject,
          subtitle: f.sender,
          body: `Why this email was safe: ${f.rationale}`,
        }))}
        emptyText="No false alarms — clean reporting."
      />

      <FeedbackList
        title="Missed phishing / suspicious emails"
        tone="danger"
        icon={XCircle}
        items={feedback.missed.map((f: any) => ({
          title: f.subject,
          subtitle: f.sender,
          body: f.rationale,
          flags: f.missed_indicators,
        }))}
        emptyText="Nothing missed — excellent work."
      />

      {feedback.report_reviews.length > 0 && (
        <section className="soc-card p-6">
          <h2 className="text-lg font-semibold">Incident report review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed feedback on each report you submitted.
          </p>
          <div className="mt-4 space-y-4">
            {feedback.report_reviews.map((r: any) => (
              <article key={r.email_id} className="rounded-md border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-sm">{r.subject}</h3>
                  <span className={`chip ${
                    r.classification_submitted === r.classification_expected
                      ? "chip-success"
                      : "chip-danger"
                  }`}>
                    You said: {r.classification_submitted} · Correct: {r.classification_expected}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                  <ReviewBlock title="Correct findings" tone="success" items={(r.correct_findings ?? []).map((x: any) => x.label)} empty="—" />
                  <ReviewBlock title="Missing findings" tone="warn" items={(r.missing_findings ?? []).map((x: any) => x.label)} empty="None" />
                  <ReviewBlock title="Incorrect findings" tone="danger" items={r.incorrect_findings ?? []} empty="None" />
                  <ReviewBlock title="Suggested improvements" tone="muted" items={r.suggestions ?? []} empty="Looks good" />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <SummaryCard icon={CheckCircle2} title="Strengths" tone="success" items={ls.strengths} empty="No standout strengths this run." />
        <SummaryCard icon={AlertTriangle} title="Weaknesses" tone="warn" items={ls.weaknesses} empty="Nothing to improve — great run." />
        <SummaryCard icon={ListChecks} title="Security best practices" tone="muted" items={ls.best_practices} />
        <SummaryCard icon={Lightbulb} title="Recommendations for you" tone="info" items={ls.recommendations} empty="Keep practicing." />
      </section>

      <div className="flex justify-end">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Back to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "success" | "warn" | "danger" }) {
  const toneColor =
    tone === "success" ? "text-success" : tone === "warn" ? "text-accent" : tone === "danger" ? "text-destructive" : "text-primary";
  return (
    <div className="soc-card p-5">
      <Icon className={`h-5 w-5 ${toneColor}`} />
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold mono ${toneColor}`}>{value}</div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: "success" | "warn" | "danger" }) {
  const cls = tone === "success" ? "text-success" : tone === "warn" ? "text-accent" : "text-destructive";
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold mono ${cls}`}>{value}</div>
    </div>
  );
}

function FeedbackList({
  title,
  tone,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  tone: "success" | "warn" | "danger";
  icon: any;
  items: { title: string; subtitle?: string; body: string; flags?: { label: string; explanation: string }[] }[];
  emptyText: string;
}) {
  const chipClass = tone === "success" ? "chip-success" : tone === "warn" ? "chip-warn" : "chip-danger";
  const color = tone === "success" ? "text-success" : tone === "warn" ? "text-accent" : "text-destructive";
  return (
    <section className="soc-card p-6">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className={`chip ${chipClass} ml-2`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-md border border-border bg-muted/30 p-4">
              <div className="text-sm font-semibold">{it.title}</div>
              {it.subtitle && (
                <div className="mono mt-0.5 text-xs text-muted-foreground">{it.subtitle}</div>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
              {it.flags && it.flags.length > 0 && (
                <ul className="mt-2 space-y-1.5 text-xs">
                  {it.flags.map((f, j) => (
                    <li key={j}>
                      <span className="font-medium text-foreground">• {f.label}</span>
                      <span className="text-muted-foreground"> — {f.explanation}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewBlock({ title, tone, items, empty }: { title: string; tone: "success" | "warn" | "danger" | "muted"; items: string[]; empty: string }) {
  const color =
    tone === "success" ? "text-success" : tone === "warn" ? "text-accent" : tone === "danger" ? "text-destructive" : "text-muted-foreground";
  return (
    <div>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{title}</div>
      {items.length === 0 ? (
        <div className="mt-1 text-muted-foreground">{empty}</div>
      ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {items.map((s, i) => (<li key={i}>{s}</li>))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, title, tone, items, empty }: { icon: any; title: string; tone: "success" | "warn" | "muted" | "info"; items: string[]; empty?: string }) {
  const cls =
    tone === "success" ? "text-success" : tone === "warn" ? "text-accent" : tone === "info" ? "text-primary" : "text-foreground";
  return (
    <div className="soc-card p-5">
      <div className={`flex items-center gap-2 ${cls}`}>
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty ?? "—"}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
