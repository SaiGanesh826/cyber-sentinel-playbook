import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  logInboxAction,
  submitInboxTraining,
} from "@/lib/inbox.functions";
import { getInboxClient, type InboxClientEmail } from "@/lib/inbox-data";
import { NipunLogo } from "@/components/brand";
import {
  Mail,
  Globe,
  Trash2,
  FileText,
  Wifi,
  Inbox,
  Search,
  Send,
  Star,
  Archive,
  AlertTriangle,
  Reply,
  Forward,
  ShieldAlert,
  Paperclip,
  X,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/play/$sessionId")({
  component: VirtualOffice,
});

type EmailStatus = "unopened" | "opened" | "reported";

interface IncidentReport {
  email_id: string;
  classification: "phishing" | "suspicious" | "spam" | "legitimate";
  incident_type: string;
  red_flags: string[];
  suspicious_links: string[];
  recommended_action: "report_to_security" | "delete" | "ignore" | "reply" | "forward_colleague";
  risk_level: "low" | "medium" | "high" | "critical";
  summary: string;
}

const RED_FLAG_CATALOG: { id: string; label: string }[] = [
  { id: "lookalike_domain", label: "Look-alike / typosquatted sender domain" },
  { id: "urgency", label: "Creates urgency or threats" },
  { id: "credential_request", label: "Asks for credentials / password / OTP" },
  { id: "ceo_impersonation", label: "Executive impersonation (BEC)" },
  { id: "secrecy_request", label: "Demands secrecy / bypass policy" },
  { id: "html_attachment", label: "Suspicious attachment (HTML, EXE, etc.)" },
  { id: "salary_bait", label: "Money / salary / bonus lure" },
  { id: "voicemail_lure", label: "Voicemail / missed-call lure" },
  { id: "scary_location", label: "Scary geo / login-from-unknown lure" },
  { id: "http_link", label: "Insecure http:// link" },
  { id: "generic_greeting", label: "Generic greeting (Dear User/Customer)" },
  { id: "grammar", label: "Spelling or grammar issues" },
];

function VirtualOffice() {
  const { sessionId } = Route.useParams();
  const emails = useMemo(() => getInboxClient(), []);
  const [appOpen, setAppOpen] = useState<"none" | "mail">("none");
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 1000 * 30);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#1f4170] text-white">
      {/* Wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(135deg, #1f4170 0%, #2c5fa0 50%, #1a3556 100%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col">
        {/* Desktop icons */}
        <div className="flex-1 p-6">
          <div className="absolute right-6 top-6 flex items-center gap-3 rounded-md bg-black/30 px-3 py-1.5 text-xs backdrop-blur">
            <NipunLogo className="h-6 w-auto" />
            <span className="opacity-80">Workstation · employee@nipun.com</span>
          </div>
          <div className="grid w-fit grid-cols-1 gap-6 sm:grid-cols-2">
            <DesktopIcon
              icon={Mail}
              label="Corporate Mail"
              onClick={() => setAppOpen("mail")}
              accent
            />
            <DesktopIcon icon={Globe} label="Browser" disabled />
            <DesktopIcon icon={FileText} label="Company Docs" disabled />
            <DesktopIcon icon={Trash2} label="Recycle Bin" disabled />
          </div>
        </div>

        {/* Taskbar */}
        <div className="flex h-12 items-center gap-2 border-t border-white/10 bg-black/40 px-3 backdrop-blur">
          <button
            onClick={() => setAppOpen("mail")}
            className="grid h-9 w-9 place-items-center rounded bg-white/10 hover:bg-white/20"
            title="Mail"
          >
            <Mail className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded text-white/60 hover:bg-white/10" title="Browser" disabled>
            <Globe className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded text-white/60 hover:bg-white/10" title="Docs" disabled>
            <FileText className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <Wifi className="h-4 w-4 text-emerald-300" />
            <span className="mono">
              {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="mono text-white/60">
              {clock.toLocaleDateString([], { day: "2-digit", month: "short" })}
            </span>
          </div>
        </div>
      </div>

      {appOpen === "mail" && (
        <MailClient
          sessionId={sessionId}
          emails={emails}
          onClose={() => setAppOpen("none")}
        />
      )}
    </div>
  );
}

function DesktopIcon({
  icon: Icon,
  label,
  onClick,
  accent,
  disabled,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-24 flex-col items-center gap-1.5 rounded-md p-2 transition ${
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"
      }`}
    >
      <div
        className={`grid h-14 w-14 place-items-center rounded-md shadow-lg ${
          accent ? "bg-[#f97316] text-white" : "bg-white/15 text-white"
        }`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-center text-xs leading-tight drop-shadow">{label}</span>
    </button>
  );
}

// ============================================================
// MAIL CLIENT
// ============================================================

function MailClient({
  sessionId,
  emails,
  onClose,
}: {
  sessionId: string;
  emails: InboxClientEmail[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const log = useServerFn(logInboxAction);
  const submit = useServerFn(submitInboxTraining);

  const [statuses, setStatuses] = useState<Record<string, EmailStatus>>({});
  const [reports, setReports] = useState<Record<string, IncidentReport>>({});
  const [openedAttachments, setOpenedAttachments] = useState<string[]>([]);
  const [clickedLinks, setClickedLinks] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);

  function record(action_type: string, target?: string, meta?: any) {
    log({ data: { session_id: sessionId, action_type, target, meta } }).catch(() => {});
  }

  function openEmail(id: string) {
    setSelectedId(id);
    setStatuses((s) => ({ ...s, [id]: s[id] === "reported" ? "reported" : "opened" }));
    record("open_email", id);
  }

  function onReportSubmitted(r: IncidentReport) {
    setReports((m) => ({ ...m, [r.email_id]: r }));
    setStatuses((s) => ({ ...s, [r.email_id]: "reported" }));
    setReportingId(null);
    toast.success("Reported to Security. You can continue investigating other emails.");
  }

  async function doSubmitTraining() {
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          session_id: sessionId,
          reports: Object.values(reports),
          opened_email_ids: Object.keys(statuses),
          clicked_link_urls: clickedLinks,
          opened_attachment_names: openedAttachments,
        },
      });
      navigate({ to: "/results/$sessionId", params: { sessionId: res.session_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }

  const filtered = emails.filter((e) =>
    folder !== "inbox"
      ? false
      : !search
        ? true
        : `${e.sender_name} ${e.sender_email} ${e.subject}`
            .toLowerCase()
            .includes(search.toLowerCase()),
  );

  const selected = emails.find((e) => e.id === selectedId);
  const reviewedCount = Object.keys(statuses).length;
  const reportedCount = Object.keys(reports).length;

  return (
    <div className="absolute inset-2 z-30 flex flex-col overflow-hidden rounded-lg border border-white/20 bg-surface text-foreground shadow-2xl sm:inset-6">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-2 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4" />
          Nipun Corporate Mail — Inbox
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmSubmit(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow hover:opacity-90"
            title="Submit your investigation"
          >
            <Send className="h-3.5 w-3.5" />
            Submit Training
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid flex-1 overflow-hidden md:grid-cols-[200px_320px_1fr]">
        {/* Folder nav */}
        <nav className="hidden border-r border-border bg-muted/50 p-3 text-sm md:block">
          <FolderItem icon={Inbox} active={folder === "inbox"} onClick={() => setFolder("inbox")}>
            Inbox <span className="ml-auto chip">{emails.length}</span>
          </FolderItem>
          <FolderItem icon={Star} active={false} onClick={() => toast("Starred is empty.")}>
            Starred
          </FolderItem>
          <FolderItem icon={Star} active={false} onClick={() => toast("Starred is empty.")}>
            Starred
          </FolderItem>
          <FolderItem icon={Send} active={folder === "sent"} onClick={() => setFolder("sent")}>
            Sent
          </FolderItem>
          <FolderItem icon={FileText} active={folder === "drafts"} onClick={() => setFolder("drafts")}>
            Drafts
          </FolderItem>
          <FolderItem icon={Archive} active={false} onClick={() => toast("Archive is empty.")}>
            Archive
          </FolderItem>
          <FolderItem icon={Trash2} active={folder === "trash"} onClick={() => setFolder("trash")}>
            Trash
          </FolderItem>
          <div className="mt-6 rounded-md border border-border bg-surface p-3 text-xs">
            <div className="font-medium">Progress</div>
            <div className="mt-1 text-muted-foreground">Reviewed: {reviewedCount}/{emails.length}</div>
            <div className="text-muted-foreground">Reported: {reportedCount}</div>
          </div>
        </nav>

        {/* Email list */}
        <div className="flex flex-col overflow-hidden border-r border-border">
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mail"
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {folder !== "inbox" || filtered.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                {folder === "inbox" ? "No matches." : `${folder} is empty.`}
              </li>
            ) : (
              filtered.map((e) => {
                const status: EmailStatus = statuses[e.id] ?? "unopened";
                const isSelected = selectedId === e.id;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => openEmail(e.id)}
                      className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left text-sm transition ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate ${
                            status === "unopened" ? "font-semibold" : "font-normal"
                          }`}
                        >
                          {e.sender_name}
                        </span>
                        <span className="mono shrink-0 text-[10px] text-muted-foreground">
                          {e.received_at}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate ${
                            status === "unopened" ? "font-medium" : ""
                          }`}
                        >
                          {e.subject}
                        </span>
                        <StatusBadge status={status} />
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Reading pane */}
        <div className="flex flex-col overflow-hidden bg-surface">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Select an email to read it.
            </div>
          ) : (
            <ReadingPane
              email={selected}
              status={statuses[selected.id] ?? "opened"}
              onRecord={record}
              onClickLink={(href) => {
                setClickedLinks((c) => (c.includes(href) ? c : [...c, href]));
                record("click_link", href);
                toast.warning(`Link click recorded — destination was ${href}. The link was not opened.`);
              }}
              onHoverLink={setHoverUrl}
              onOpenAttachment={(name) => {
                setOpenedAttachments((a) => (a.includes(name) ? a : [...a, name]));
                record("open_attachment", name);
                toast.warning("Attachment open recorded — file not executed in training.");
              }}
              onReport={() => {
                setReportingId(selected.id);
                record("open_report_form", selected.id);
              }}
            />
          )}
        </div>
      </div>

      {/* Browser-style hover URL status bar */}
      {hoverUrl && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 max-w-[70%] truncate rounded-tr-md border-r border-t border-border bg-surface px-3 py-1.5 mono text-[11px] text-foreground shadow">
          {hoverUrl}
        </div>
      )}

      {/* Floating Submit Training button (always visible) */}
      <button
        onClick={() => setConfirmSubmit(true)}
        className="absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-2xl ring-2 ring-white/30 hover:opacity-90"
        title="Submit your investigation"
      >
        <Send className="h-4 w-4" />
        Submit Training
      </button>

      {reportingId && (
        <ReportForm
          email={emails.find((x) => x.id === reportingId)!}
          existing={reports[reportingId]}
          onCancel={() => setReportingId(null)}
          onSubmit={onReportSubmitted}
        />
      )}

      {confirmSubmit && (
        <ConfirmDialog
          submitting={submitting}
          reportCount={reportedCount}
          reviewedCount={reviewedCount}
          total={emails.length}
          onCancel={() => setConfirmSubmit(false)}
          onConfirm={doSubmitTraining}
        />
      )}
    </div>
  );
}

function FolderItem({
  icon: Icon,
  active,
  onClick,
  children,
}: {
  icon: any;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
        active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground/80"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: EmailStatus }) {
  if (status === "reported")
    return <span className="chip chip-warn shrink-0">REPORTED</span>;
  if (status === "opened")
    return <span className="chip chip-muted shrink-0">OPENED</span>;
  return <span className="chip shrink-0">NEW</span>;
}

function ReadingPane({
  email,
  status,
  onRecord,
  onClickLink,
  onHoverLink,
  onOpenAttachment,
  onReport,
}: {
  email: InboxClientEmail;
  status: EmailStatus;
  onRecord: (action: string, target?: string) => void;
  onClickLink: (href: string) => void;
  onHoverLink: (href: string | null) => void;
  onOpenAttachment: (name: string) => void;
  onReport: () => void;
}) {
  function closestAnchor(el: HTMLElement | null): HTMLAnchorElement | null {
    while (el && el.tagName !== "A") el = el.parentElement;
    return el as HTMLAnchorElement | null;
  }
  return (
    <>
      <header className="border-b border-border p-5">
        <h2 className="text-xl font-semibold">{email.subject}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary mono text-xs">
            {email.sender_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{email.sender_name}</div>
            <div className="mono text-xs text-muted-foreground">&lt;{email.sender_email}&gt;</div>
          </div>
          <div className="ml-auto mono text-xs text-muted-foreground">{email.received_at}</div>
        </div>
        <div className="mt-2 mono text-xs text-muted-foreground">To: {email.to}</div>
      </header>
      <div
        className="prose prose-sm max-w-none flex-1 overflow-y-auto p-6 text-sm leading-relaxed"
        onClickCapture={(ev) => {
          const a = closestAnchor(ev.target as HTMLElement);
          if (a) {
            ev.preventDefault();
            onClickLink(a.getAttribute("href") || a.href);
          }
        }}
        onMouseOver={(ev) => {
          const a = closestAnchor(ev.target as HTMLElement);
          if (a) onHoverLink(a.getAttribute("href") || a.href);
        }}
        onMouseOut={(ev) => {
          const a = closestAnchor(ev.target as HTMLElement);
          if (a) onHoverLink(null);
        }}
        dangerouslySetInnerHTML={{ __html: email.body_html }}
      />
      {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
      {void status}
      {email.attachments.length > 0 && (
        <div className="border-t border-border p-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Attachments
          </div>
          <ul className="flex flex-wrap gap-2">
            {email.attachments.map((a) => (
              <li key={a.name}>
                <button
                  onClick={() => onOpenAttachment(a.name)}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs hover:bg-accent/10"
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
      <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 p-3">
        <Toolbar onClick={() => onRecord("reply_clicked", email.id)} icon={Reply}>Reply</Toolbar>
        <Toolbar onClick={() => onRecord("forward_clicked", email.id)} icon={Forward}>Forward</Toolbar>
        <Toolbar onClick={() => onRecord("delete_clicked", email.id)} icon={Trash2}>Delete</Toolbar>
        <button
          onClick={onReport}
          disabled={status === "reported"}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
        >
          <ShieldAlert className="h-4 w-4" />
          {status === "reported" ? "Reported" : "Report to Security"}
        </button>
      </footer>
    </>
  );
}

function Toolbar({ icon: Icon, onClick, children }: { icon: any; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:bg-muted"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

// ============================================================
// REPORT FORM
// ============================================================

function ReportForm({
  email,
  existing,
  onCancel,
  onSubmit,
}: {
  email: InboxClientEmail;
  existing?: IncidentReport;
  onCancel: () => void;
  onSubmit: (r: IncidentReport) => void;
}) {
  const [classification, setClassification] = useState<IncidentReport["classification"]>(
    existing?.classification ?? "phishing",
  );
  const [incidentType, setIncidentType] = useState(existing?.incident_type ?? "Phishing email");
  const [flags, setFlags] = useState<Record<string, boolean>>(
    Object.fromEntries((existing?.red_flags ?? []).map((f) => [f, true])),
  );
  const [urls, setUrls] = useState<Record<string, boolean>>(
    Object.fromEntries((existing?.suspicious_links ?? []).map((u) => [u, true])),
  );
  const [attachmentsBad, setAttachmentsBad] = useState<Record<string, boolean>>({});
  const [recommendedAction, setRecommendedAction] = useState<IncidentReport["recommended_action"]>(
    existing?.recommended_action ?? "report_to_security",
  );
  const [riskLevel, setRiskLevel] = useState<IncidentReport["risk_level"]>(existing?.risk_level ?? "high");
  const [summary, setSummary] = useState(existing?.summary ?? "");

  function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (summary.trim().length < 10) {
      toast.error("Please write a short summary of your findings.");
      return;
    }
    const report: IncidentReport = {
      email_id: email.id,
      classification,
      incident_type: incidentType,
      red_flags: Object.entries(flags).filter(([, v]) => v).map(([k]) => k),
      suspicious_links: Object.entries(urls).filter(([, v]) => v).map(([k]) => k),
      recommended_action: recommendedAction,
      risk_level: riskLevel,
      summary,
    };
    onSubmit(report);
    // Note attachment evidence in summary metadata if any
    void attachmentsBad;
  }

  return (
    <div className="absolute inset-0 z-40 flex bg-black/50 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface text-foreground">
        <div className="flex items-center justify-between border-b border-border bg-destructive px-5 py-3 text-destructive-foreground">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Incident report</div>
            <div className="text-sm font-semibold">Report to Security</div>
          </div>
          <button onClick={onCancel} className="rounded p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={save} className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
          <ReadOnly label="Sender">
            {email.sender_name} &lt;{email.sender_email}&gt;
          </ReadOnly>
          <ReadOnly label="Subject">{email.subject}</ReadOnly>

          <FormRow label="Incident type">
            <select className="soc-input" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
              <option>Phishing email</option>
              <option>Suspicious email</option>
              <option>Business Email Compromise (BEC)</option>
              <option>Spam</option>
              <option>Malware / malicious attachment</option>
              <option>Other</option>
            </select>
          </FormRow>

          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Classification">
              <select
                className="soc-input"
                value={classification}
                onChange={(e) => setClassification(e.target.value as any)}
              >
                <option value="phishing">Phishing</option>
                <option value="suspicious">Suspicious</option>
                <option value="spam">Spam</option>
                <option value="legitimate">Legitimate (false alarm)</option>
              </select>
            </FormRow>
            <FormRow label="Risk level">
              <select
                className="soc-input"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as any)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </FormRow>
          </div>

          <div>
            <Label>Red flags found</Label>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {RED_FLAG_CATALOG.map((f) => (
                <label key={f.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={!!flags[f.id]}
                    onChange={(e) => setFlags((m) => ({ ...m, [f.id]: e.target.checked }))}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {email.links.length > 0 && (
            <div>
              <Label>Suspicious links in this email</Label>
              <div className="mt-2 space-y-1.5">
                {email.links.map((l) => (
                  <label key={l.href} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={!!urls[l.href]}
                      onChange={(e) => setUrls((m) => ({ ...m, [l.href]: e.target.checked }))}
                    />
                    <span className="mono break-all">{l.href}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {email.attachments.length > 0 && (
            <div>
              <Label>Suspicious attachments</Label>
              <div className="mt-2 space-y-1.5">
                {email.attachments.map((a) => (
                  <label key={a.name} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={!!attachmentsBad[a.name]}
                      onChange={(e) => setAttachmentsBad((m) => ({ ...m, [a.name]: e.target.checked }))}
                    />
                    <span className="mono">{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <FormRow label="Recommended action">
            <select
              className="soc-input"
              value={recommendedAction}
              onChange={(e) => setRecommendedAction(e.target.value as any)}
            >
              <option value="report_to_security">Report to Security / IT</option>
              <option value="delete">Delete the email</option>
              <option value="ignore">Ignore</option>
              <option value="reply">Reply to the sender</option>
              <option value="forward_colleague">Forward to a colleague</option>
            </select>
          </FormRow>

          <FormRow label="Findings (short summary)">
            <textarea
              className="soc-input min-h-[80px]"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What's wrong with this email? Sender, indicators, what you recommend the security team do."
            />
          </FormRow>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 rounded-md border border-border bg-surface py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-md bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({
  submitting,
  reportCount,
  reviewedCount,
  total,
  onCancel,
  onConfirm,
}: {
  submitting: boolean;
  reportCount: number;
  reviewedCount: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 text-foreground shadow-xl">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Submit your investigation?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You are about to submit your investigation. After submission, your responses{" "}
          <b className="text-foreground">cannot be modified</b>.
        </p>
        <ul className="mt-4 space-y-1 rounded-md bg-muted p-3 text-sm">
          <li className="flex justify-between"><span>Emails reviewed</span><span className="mono">{reviewedCount}/{total}</span></li>
          <li className="flex justify-between"><span>Reports submitted</span><span className="mono">{reportCount}</span></li>
        </ul>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} disabled={submitting} className="flex-1 rounded-md border border-border bg-surface py-2 text-sm font-medium hover:bg-muted">
            Keep investigating
          </button>
          <button onClick={onConfirm} disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit Training"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}
function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 rounded-md bg-muted px-3 py-2 text-sm mono">{children}</div>
    </div>
  );
}
