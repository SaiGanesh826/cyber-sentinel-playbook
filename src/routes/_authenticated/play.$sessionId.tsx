import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { logAction, submitInvestigation } from "@/lib/soc.functions";
import { toast } from "sonner";
import {
  ShieldCheck,
  AlertTriangle,
  Send,
  Inbox,
  Reply,
  Forward,
  Paperclip,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Field } from "@/routes/auth";

export const Route = createFileRoute("/_authenticated/play/$sessionId")({
  component: PlayScreen,
});

interface Scenario {
  id: string;
  title: string;
  difficulty: string;
  email: {
    sender_name: string;
    sender_email: string;
    reply_to?: string;
    to: string;
    subject: string;
    received_at: string;
    body_html: string;
    attachments: { name: string; size: string }[];
    links: { text: string; href: string }[];
  };
}

function PlayScreen() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const log = useServerFn(logAction);
  const submit = useServerFn(submitInvestigation);

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [headersOpen, setHeadersOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [classification, setClassification] = useState<"phishing" | "spam" | "legitimate" | "unsure">("unsure");
  const [recommendedAction, setRecommendedAction] = useState<
    "report_to_soc" | "delete" | "reply" | "click_link" | "forward_colleague"
  >("report_to_soc");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [urls, setUrls] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      // Pull scenario via redacted RPC: we re-call startSession? No — we look up via session.
      // Actually startSession already returned data; navigate kept only sessionId.
      // We'll re-fetch via a thin server endpoint: call a small fn. For simplicity use a
      // direct query: session -> scenario.id -> phishing_scenarios is admin-only. So use a server fn.
      // Implementation: store scenario in sessionStorage right after startSession would be cleaner,
      // but here we just re-call startSession to fetch redacted view.
      try {
        const { data: s } = await supabase
          .from("game_sessions")
          .select("scenario_id, status")
          .eq("id", sessionId)
          .single();
        if (!s) throw new Error("Session not found");
        if (s.status !== "in_progress") {
          navigate({ to: "/results/$sessionId", params: { sessionId } });
          return;
        }
        // Fetch redacted scenario via a public endpoint inside the function:
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        const res = await fetch(`/api/scenario/${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load scenario");
        const json = await res.json();
        setScenario(json);
      } catch (e: any) {
        toast.error(e?.message ?? "Could not load");
      }
    })();
  }, [sessionId, navigate]);

  function record(action_type: string, target?: string, meta?: any) {
    log({ data: { session_id: sessionId, action_type, target, meta } }).catch(() => {});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (summary.trim().length < 20) {
      toast.error("Your incident summary should be at least 20 characters.");
      return;
    }
    setSubmitting(true);
    const red_flags = Object.entries(flags).filter(([_, v]) => v).map(([k]) => k);
    const suspicious_urls = Object.entries(urls).filter(([_, v]) => v).map(([k]) => k);
    try {
      const res = await submit({
        data: {
          session_id: sessionId,
          classification,
          red_flags,
          suspicious_urls,
          recommended_action: recommendedAction,
          summary,
          notes,
        },
      });
      navigate({ to: "/results/$sessionId", params: { sessionId: res.session_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
      setSubmitting(false);
    }
  }

  if (!scenario) {
    return (
      <div className="px-6 py-12 text-sm text-muted-foreground">
        Opening inbox…
      </div>
    );
  }

  const e = scenario.email;
  // candidate red-flag list: shuffle a mix of real indicators + distractors
  // We don't have the answer mapping here — the user just picks free-form items
  // that the server scores. We expose generic, plausible labels.
  const indicatorChoices: { id: string; label: string }[] = [
    { id: "sender_domain", label: "Sender domain looks suspicious (look-alike)" },
    { id: "urgency", label: "Creates urgency or pressure" },
    { id: "generic_greeting", label: "Generic greeting (\"Dear Employee\")" },
    { id: "suspicious_link", label: "Mismatched or suspicious link" },
    { id: "suspicious_attachment", label: "Unexpected / risky attachment" },
    { id: "company_logo", label: "Uses a company logo" },
    { id: "signature_block", label: "Signature block at the bottom" },
    { id: "spelling", label: "Spelling or grammar issues" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface/60 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Inbox · Internal Mail</span>
          </div>
          <div className="mono text-xs text-muted-foreground">
            session {sessionId.slice(0, 8)} · live
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
        {/* Email panel */}
        <article className="soc-card overflow-hidden">
          <header className="border-b border-border p-5">
            <h1 className="text-xl font-semibold">{e.subject}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs mono">
                {e.sender_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="font-medium">{e.sender_name}</div>
                <button
                  className="mono text-xs text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setHeadersOpen((v) => !v);
                    record("inspect_sender", e.sender_email);
                  }}
                >
                  &lt;{e.sender_email}&gt;
                </button>
              </div>
              <div className="ml-auto mono text-xs text-muted-foreground">
                {e.received_at}
              </div>
            </div>

            <button
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setHeadersOpen((v) => !v);
                record("expand_headers");
              }}
            >
              {headersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Email headers
            </button>
            {headersOpen && (
              <div className="mt-2 rounded-md border border-border bg-background/50 p-3 mono text-xs text-muted-foreground space-y-0.5">
                <div>From: {e.sender_name} &lt;{e.sender_email}&gt;</div>
                {e.reply_to && <div>Reply-To: {e.reply_to}</div>}
                <div>To: {e.to}</div>
                <div>Subject: {e.subject}</div>
                <div>Received: {e.received_at}</div>
                <div>SPF: <span className="text-destructive">fail</span> · DKIM: <span className="text-destructive">none</span> · DMARC: <span className="text-destructive">fail</span></div>
              </div>
            )}
          </header>

          <div
            className="prose prose-invert max-w-none p-6 text-sm leading-relaxed"
            // Render scenario HTML, but intercept link clicks to log
            dangerouslySetInnerHTML={{
              __html: e.body_html.replace(/<a /g, '<a data-soc-link="1" '),
            }}
            onMouseOverCapture={(ev) => {
              const t = ev.target as HTMLElement;
              if (t.tagName === "A") {
                const href = (t as HTMLAnchorElement).href;
                record("hover_link", href);
              }
            }}
            onClickCapture={(ev) => {
              const t = ev.target as HTMLElement;
              if (t.tagName === "A") {
                ev.preventDefault();
                const href = (t as HTMLAnchorElement).href;
                record("click_link", href);
                toast.warning("Link click recorded — not opening external URLs during training.");
              }
            }}
          />

          {e.attachments.length > 0 && (
            <div className="border-t border-border p-5">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Attachments
              </div>
              <ul className="space-y-2">
                {e.attachments.map((a) => (
                  <li key={a.name}>
                    <button
                      onClick={() => {
                        record("open_attachment", a.name);
                        toast.warning(
                          "Attachment open recorded — file not executed during training.",
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="mono">{a.name}</span>
                      <span className="text-muted-foreground">· {a.size}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <footer className="flex flex-wrap gap-2 border-t border-border p-4">
            <ToolbarBtn onClick={() => record("reply_clicked")} icon={Reply}>
              Reply
            </ToolbarBtn>
            <ToolbarBtn onClick={() => record("forward_clicked")} icon={Forward}>
              Forward
            </ToolbarBtn>
            <ToolbarBtn onClick={() => record("delete_clicked")} icon={AlertTriangle}>
              Delete
            </ToolbarBtn>
            <button
              className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => setReportOpen(true)}
            >
              <ShieldCheck className="h-4 w-4" /> Open investigation report
            </button>
          </footer>
        </article>

        {/* Side hint card */}
        <aside className="soc-card h-fit p-5 text-sm">
          <span className="chip">NEW MESSAGE</span>
          <p className="mt-3 text-muted-foreground">
            A new email has arrived. Review it carefully and take any actions you
            believe are appropriate. When you are satisfied with your investigation,
            submit it for review.
          </p>
        </aside>
      </div>

      {/* Report drawer */}
      {reportOpen && (
        <div className="fixed inset-0 z-40 flex bg-background/80 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <span className="chip">INCIDENT REPORT</span>
                <h2 className="mt-2 text-lg font-semibold">Submit your investigation</h2>
              </div>
              <button
                onClick={() => setReportOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
              <Field label="Email classification">
                <select
                  className="soc-input"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as any)}
                >
                  <option value="unsure">Unsure</option>
                  <option value="legitimate">Legitimate</option>
                  <option value="spam">Spam (unwanted)</option>
                  <option value="phishing">Phishing</option>
                </select>
              </Field>

              <div>
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Indicators you observed
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {indicatorChoices.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={!!flags[c.id]}
                        onChange={(e) => {
                          setFlags((f) => ({ ...f, [c.id]: e.target.checked }));
                          if (e.target.checked) record("flag_indicator", c.id);
                        }}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {e.links.length > 0 && (
                <div>
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    URLs you consider suspicious
                  </span>
                  <div className="space-y-2">
                    {e.links.map((l) => (
                      <label
                        key={l.href}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={!!urls[l.href]}
                          onChange={(ev) => {
                            setUrls((u) => ({ ...u, [l.href]: ev.target.checked }));
                            if (ev.target.checked) record("flag_url", l.href);
                          }}
                        />
                        <span className="mono break-all">{l.href}</span>
                        <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Field label="Recommended action">
                <select
                  className="soc-input"
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value as any)}
                >
                  <option value="report_to_soc">Report to SOC / IT Security</option>
                  <option value="delete">Delete the email</option>
                  <option value="reply">Reply to the sender</option>
                  <option value="forward_colleague">Forward to a colleague</option>
                  <option value="click_link">Click the link to verify</option>
                </select>
              </Field>

              <Field label="Incident summary (what, where, who, why suspicious)">
                <textarea
                  className="soc-input min-h-[100px]"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Received an email from hr-payroll@micros0ft-support.com requesting payroll verification within 4h. Sender domain is a look-alike, link points to external host…"
                />
              </Field>

              <Field label="Additional notes (optional)">
                <textarea
                  className="soc-input min-h-[60px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting…" : "Submit investigation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}
