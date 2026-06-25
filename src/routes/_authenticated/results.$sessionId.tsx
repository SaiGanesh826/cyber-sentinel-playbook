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
    return (
      <div className="px-6 py-12 text-sm text-muted-foreground">Scoring…</div>
    );
  if (error || !data)
    return (
      <div className="px-6 py-12 text-sm text-destructive">
        Could not load results.
      </div>
    );

  const breakdown = data.breakdown as Record<
    string,
    { score: number; max: number; correct?: boolean }
  >;
  const feedback = data.feedback as any;
  const minutes = Math.floor(data.time_taken_seconds / 60);
  const seconds = data.time_taken_seconds % 60;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">INVESTIGATION COMPLETE</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Submission locked & reviewed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here's how your investigation was evaluated.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Return to dashboard
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          icon={Trophy}
          label="Final score"
          value={`${data.total} / 100`}
          tone={data.total >= 75 ? "success" : data.total >= 50 ? "warn" : "danger"}
        />
        <SummaryStat
          icon={Target}
          label="Accuracy"
          value={`${data.accuracy}%`}
        />
        <SummaryStat
          icon={Timer}
          label="Time taken"
          value={`${minutes}m ${seconds}s`}
        />
      </section>

      <section className="soc-card p-6">
        <h2 className="text-lg font-semibold">Score breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(breakdown).map(([k, v]) => (
            <div key={k} className="rounded-md border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{k.replaceAll("_", " ")}</span>
                <span className="mono font-semibold">
                  {v.score}/{v.max}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(v.score / v.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeedbackList
        title="Correctly identified"
        tone="success"
        icon={CheckCircle2}
        items={feedback.correctly_identified.map((f: any) => ({
          title: f.label,
          body: f.explanation,
          aside: f.best_practice,
          asideLabel: "Best practice",
        }))}
        emptyText="You didn't flag any of the real indicators."
      />

      <FeedbackList
        title="Incorrect selections (false positives)"
        tone="warn"
        icon={AlertTriangle}
        items={feedback.incorrect.map((f: any) => ({
          title: f.label,
          body: f.explanation,
        }))}
        emptyText="No false positives — clean reporting."
      />

      <FeedbackList
        title="Missed indicators"
        tone="danger"
        icon={XCircle}
        items={feedback.missed.map((f: any) => ({
          title: f.label,
          body: f.explanation,
          aside: f.best_practice,
          asideLabel: "How to detect",
        }))}
        emptyText="Nothing missed — excellent work."
      />

      <section className="soc-card p-6">
        <h2 className="text-lg font-semibold">Incident report review</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            {feedback.report_review.classification.correct ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
            )}
            <span>
              Classification — you said{" "}
              <b>{feedback.report_review.classification.submitted}</b>; correct
              answer was <b>{feedback.report_review.classification.expected}</b>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            {feedback.report_review.recommended_action.correct ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
            )}
            <span>
              Recommended action — you selected{" "}
              <b>{feedback.report_review.recommended_action.submitted}</b>; SOC
              expects{" "}
              <b>{feedback.report_review.recommended_action.expected}</b>.
            </span>
          </li>
          <li className="text-muted-foreground">
            Summary quality: {feedback.report_review.summary_quality}
          </li>
        </ul>
      </section>

      <section className="soc-card p-6">
        <h2 className="text-lg font-semibold">Personalized learning summary</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="chip chip-success">STRENGTHS</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {feedback.learning_summary.strengths.length === 0 ? (
                <li className="text-muted-foreground">No standout strengths this run.</li>
              ) : (
                feedback.learning_summary.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{s}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <div className="chip chip-warn">FOCUS AREAS</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {feedback.learning_summary.improvements.length === 0 ? (
                <li className="text-muted-foreground">Nothing to improve — great run.</li>
              ) : (
                feedback.learning_summary.improvements.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <span>{s}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Back to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone?: "success" | "warn" | "danger";
}) {
  const toneColor =
    tone === "success"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-primary";
  return (
    <div className="soc-card p-5">
      <Icon className={`h-5 w-5 ${toneColor}`} />
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold mono ${toneColor}`}>{value}</div>
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
  items: { title: string; body: string; aside?: string; asideLabel?: string }[];
  emptyText: string;
}) {
  const chipClass =
    tone === "success" ? "chip-success" : tone === "warn" ? "chip-warn" : "chip-danger";
  return (
    <section className="soc-card p-6">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-5 w-5 ${
            tone === "success"
              ? "text-success"
              : tone === "warn"
                ? "text-warning"
                : "text-destructive"
          }`}
        />
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className={`chip ${chipClass} ml-2`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-md border border-border bg-surface-2 p-3">
              <div className="font-medium text-sm">{it.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{it.body}</p>
              {it.aside && (
                <p className="mt-2 text-xs">
                  <span className="mono uppercase tracking-wider text-primary">
                    {it.asideLabel} —
                  </span>{" "}
                  <span className="text-muted-foreground">{it.aside}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
