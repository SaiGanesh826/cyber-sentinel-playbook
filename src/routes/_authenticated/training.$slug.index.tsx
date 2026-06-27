import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  ListChecks,
  Clock,
  Mail,
  Flag,
  Trophy,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/$slug/")({
  component: ModuleOverview,
});

function ModuleOverview() {
  const { slug } = Route.useParams();

  // Only phishing-awareness is active; any other slug falls back to the same view.
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to training
      </Link>

      <span className="chip mt-4">MODULE OVERVIEW</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Phishing Awareness Training</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review the objectives, rules, and scoring before you start the assessment.
      </p>

      <Section icon={Target} title="Module objective">
        Evaluate your ability to recognise legitimate and suspicious business emails, identify
        phishing indicators, and choose the safest response inside a realistic corporate inbox.
      </Section>

      <Section icon={ListChecks} title="Assessment instructions">
        <p>During this assessment you should:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Review a realistic business inbox.</li>
          <li>Examine the sender's email address.</li>
          <li>Check the subject line.</li>
          <li>Read the email content carefully.</li>
          <li>Inspect hyperlinks and attachments.</li>
          <li>Identify phishing indicators (red flags).</li>
          <li>Decide whether the email is <b>Legitimate</b> or <b>Suspicious</b>.</li>
          <li>Select the most appropriate action: <b>Open</b>, <b>Verify</b>, <b>Report</b>, or <b>Ignore / Delete</b>.</li>
          <li>Complete the assessment within the allotted time.</li>
        </ul>
      </Section>

      <Section icon={ShieldCheck} title="Rules">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>No hints will be provided — the platform will not tell you whether your decisions are correct.</li>
          <li>You may open emails in any order and revisit them as often as you like.</li>
          <li>Clicking a suspicious link in a phishing email reduces your score and is recorded.</li>
          <li>Your work is evaluated only after you click <b>Submit Investigation</b>.</li>
        </ul>
      </Section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Clock} title="Time limit" body="60 minutes" />
        <Stat icon={Mail} title="Emails" body="Mix of legitimate and suspicious, randomised per attempt" />
        <Stat icon={Flag} title="Identify" body="Phishing indicators, classification, and correct action" />
      </div>

      <Section icon={Trophy} title="Scoring information">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Correctly classifying each email earns points.</li>
          <li>Correctly identifying red flags earns bonus points.</li>
          <li>False alarms (reporting legitimate emails) reduce your score.</li>
          <li>Clicking on suspicious links applies a penalty.</li>
          <li>Completing legitimate security actions (such as MFA enrolment) earns bonus points.</li>
        </ul>
      </Section>

      <Link
        to="/training/$slug/start"
        params={{ slug }}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Start Assessment <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
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
