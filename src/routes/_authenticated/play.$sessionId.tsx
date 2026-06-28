import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  logInboxAction,
  submitInboxTraining,
  getSessionEmails,
  type ClientEmail,
} from "@/lib/inbox.functions";
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
  ShieldCheck,
  Smartphone,
  Clock,
  Lock,
  Building2,
  CreditCard,
  FileSignature,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/play/$sessionId")({
  component: VirtualOffice,
});

// Backwards-compat alias used throughout this file
type InboxClientEmail = ClientEmail;

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

// 1 hour training duration
const TRAINING_DURATION_MS = 60 * 60 * 1000;

interface PersistedState {
  statuses: Record<string, EmailStatus>;
  reports: Record<string, IncidentReport>;
  openedAttachments: string[];
  clickedLinks: string[];
  visitedMaliciousLinks: string[];
  selectedId: string | null;
  mfaCompleted: boolean;
  endsAt: number; // epoch ms
}

function storageKey(sessionId: string) {
  return `nipun-training:${sessionId}`;
}

function loadState(sessionId: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function VirtualOffice() {
  const { sessionId } = Route.useParams();
  const fetchEmails = useServerFn(getSessionEmails);
  const { data: emailData, isLoading } = useQuery({
    queryKey: ["session-emails", sessionId],
    queryFn: () => fetchEmails({ data: { session_id: sessionId } }),
    staleTime: Infinity,
  });
  const emails = emailData?.emails ?? [];
  const [appOpen, setAppOpen] = useState<"none" | "mail">("mail");
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 1000 * 30);
    return () => clearInterval(i);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#1f4170] text-white">
        <div className="text-sm opacity-80">Booting your virtual workstation…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#1f4170] text-white">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(135deg, #1f4170 0%, #2c5fa0 50%, #1a3556 100%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex-1 p-6">
          <div className="absolute right-6 top-6 flex items-center gap-3 rounded-md bg-white/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur">
            <NipunLogo className="h-10 w-auto" />
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

  // Initialize from localStorage (resume) or fresh state
  const initial = useMemo<PersistedState>(() => {
    if (typeof window === "undefined") {
      return {
        statuses: {}, reports: {}, openedAttachments: [], clickedLinks: [],
        visitedMaliciousLinks: [], selectedId: null, mfaCompleted: false,
        endsAt: Date.now() + TRAINING_DURATION_MS,
      };
    }
    const saved = loadState(sessionId);
    if (saved) {
      return saved;
    }
    return {
      statuses: {}, reports: {}, openedAttachments: [], clickedLinks: [],
      visitedMaliciousLinks: [], selectedId: null, mfaCompleted: false,
      endsAt: Date.now() + TRAINING_DURATION_MS,
    };
  }, [sessionId]);

  const [statuses, setStatuses] = useState<Record<string, EmailStatus>>(initial.statuses);
  const [reports, setReports] = useState<Record<string, IncidentReport>>(initial.reports);
  const [openedAttachments, setOpenedAttachments] = useState<string[]>(initial.openedAttachments);
  const [clickedLinks, setClickedLinks] = useState<string[]>(initial.clickedLinks);
  const [visitedMaliciousLinks, setVisitedMaliciousLinks] = useState<string[]>(initial.visitedMaliciousLinks);
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId);
  const [mfaCompleted, setMfaCompleted] = useState<boolean>(initial.mfaCompleted);
  const [endsAt] = useState<number>(initial.endsAt);

  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [phishWarning, setPhishWarning] = useState<{ href: string } | null>(null);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  // Toast resume notice once
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const saved = typeof window !== "undefined" ? loadState(sessionId) : null;
    if (saved && (Object.keys(saved.statuses).length > 0 || saved.mfaCompleted)) {
      toast.success("Training session restored successfully. You have resumed from your last saved progress.");
    }
  }, [sessionId]);

  // Persist on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PersistedState = {
      statuses, reports, openedAttachments, clickedLinks, visitedMaliciousLinks,
      selectedId, mfaCompleted, endsAt,
    };
    try {
      localStorage.setItem(storageKey(sessionId), JSON.stringify(payload));
    } catch {/* ignore */}
  }, [sessionId, statuses, reports, openedAttachments, clickedLinks, visitedMaliciousLinks, selectedId, mfaCompleted, endsAt]);

  // Timer tick
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const timeRemainingMs = Math.max(0, endsAt - now);
  const expired = timeRemainingMs <= 0;

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

  function handleLinkClick(href: string) {
    // Internal app action — MFA setup
    if (href === "app:enable-mfa") {
      record("open_mfa_wizard");
      setMfaOpen(true);
      return;
    }
    // Already recorded as click
    if (!clickedLinks.includes(href)) {
      setClickedLinks((c) => [...c, href]);
    }
    record("click_link", href);

    // Is this a known malicious link?
    const isMalicious = emails.some((e) => e.links.some((l) => l.suspicious && l.href === href));
    if (isMalicious) {
      if (!visitedMaliciousLinks.includes(href)) {
        setVisitedMaliciousLinks((v) => [...v, href]);
      }
      record("phishing_simulation_triggered", href);
      setPhishWarning({ href });
    } else {
      toast.warning(`Link click recorded — destination was ${href}. The link was not opened.`);
    }
  }

  async function doSubmitTraining(auto = false) {
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          session_id: sessionId,
          reports: Object.values(reports),
          opened_email_ids: Object.keys(statuses),
          clicked_link_urls: clickedLinks,
          opened_attachment_names: openedAttachments,
          mfa_completed: mfaCompleted,
          auto_submitted: auto,
        },
      });
      try { localStorage.removeItem(storageKey(sessionId)); } catch {/* ignore */}
      navigate({ to: "/results/$sessionId", params: { sessionId: res.session_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }

  // Auto-submit on timer expiry
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (!expired || autoSubmittedRef.current || submitting) return;
    autoSubmittedRef.current = true;
    toast.warning("Time is up. Auto-submitting your investigation.");
    doSubmitTraining(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

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
  const totalTasks = emails.length + 1; // emails + MFA task
  const completedTasks =
    Object.keys(statuses).length + (mfaCompleted ? 1 : 0);
  const remainingTasks = Math.max(0, totalTasks - completedTasks);
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
            Submit Investigation
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

      {/* Training Progress + Timer bar (fixed at top of training interface) */}
      <TrainingProgressBar
        completed={completedTasks}
        total={totalTasks}
        remaining={remainingTasks}
        timeRemainingMs={timeRemainingMs}
      />

      <div className="grid flex-1 overflow-hidden md:grid-cols-[200px_320px_1fr]">
        {/* Folder nav */}
        <nav className="hidden border-r border-border bg-muted/50 p-3 text-sm md:block">
          <FolderItem icon={Inbox} active={folder === "inbox"} onClick={() => setFolder("inbox")}>
            Inbox <span className="ml-auto chip">{emails.length}</span>
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
            <div className="font-medium">Activity</div>
            <div className="mt-1 text-muted-foreground">Reviewed: {reviewedCount}/{emails.length}</div>
            <div className="text-muted-foreground">Reported: {reportedCount}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs">
              <ShieldCheck className={`h-3 w-3 ${mfaCompleted ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={mfaCompleted ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
                MFA {mfaCompleted ? "enabled" : "pending"}
              </span>
            </div>
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
              visitedLinks={visitedMaliciousLinks}
              onRecord={record}
              onClickLink={handleLinkClick}
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

      {hoverUrl && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 max-w-[70%] truncate rounded-tr-md border-r border-t border-border bg-surface px-3 py-1.5 mono text-[11px] text-foreground shadow">
          {hoverUrl}
        </div>
      )}

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
          onConfirm={() => doSubmitTraining(false)}
        />
      )}

      {phishWarning && (
        <FakePortalSimulation
          href={phishWarning.href}
          behavior={
            emails
              .flatMap((e) => e.links)
              .find((l) => l.href === phishWarning.href)?.behavior
          }
          onAcknowledge={() => setPhishWarning(null)}
        />
      )}

      {mfaOpen && (
        <MfaWizard
          alreadyCompleted={mfaCompleted}
          onClose={() => setMfaOpen(false)}
          onComplete={() => {
            setMfaCompleted(true);
            record("mfa_completed");
            setMfaOpen(false);
            toast.success("Multi-Factor Authentication enabled. Good security practice — bonus points awarded.");
          }}
        />
      )}
    </div>
  );
}

function TrainingProgressBar({
  completed, total, remaining, timeRemainingMs,
}: {
  completed: number; total: number; remaining: number; timeRemainingMs: number;
}) {
  const totalSec = Math.floor(timeRemainingMs / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const lowTime = timeRemainingMs < 5 * 60 * 1000; // last 5 minutes
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/60 px-4 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Training Progress
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Completed:</span>
        <span className="font-semibold">{completed} / {total}</span>
        <span className="text-muted-foreground">tasks</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Remaining:</span>
        <span className="font-semibold">{remaining}</span>
      </div>
      <div className="hidden h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-border sm:block">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 mono text-xs font-semibold ${
        lowTime ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-surface border border-border text-foreground"
      }`}>
        <Clock className="h-3.5 w-3.5" />
        {hh}:{mm}:{ss}
      </div>
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
  visitedLinks,
  onRecord,
  onClickLink,
  onHoverLink,
  onOpenAttachment,
  onReport,
}: {
  email: InboxClientEmail;
  status: EmailStatus;
  visitedLinks: string[];
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
  const visitedBanner = email.links.some((l) => visitedLinks.includes(l.href));
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
        {visitedBanner && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            You clicked a malicious link in this email during the simulation.
          </div>
        )}
      </header>
      <div
        className="not-prose max-w-none flex-1 overflow-y-auto bg-white p-6 text-sm leading-relaxed text-[#202124]"
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
        onMouseOut={() => onHoverLink(null)}
        dangerouslySetInnerHTML={{ __html: email.body_html }}
      />
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
// FAKE-PORTAL SIMULATION — renders a realistic-looking phishing
// landing page based on the link's `behavior`, then reveals the
// training reveal screen on submit/close. No real credentials are
// ever submitted anywhere — inputs are captured and discarded.
// ============================================================
function FakePortalSimulation({
  href,
  behavior,
  onAcknowledge,
}: {
  href: string;
  behavior?: string;
  onAcknowledge: () => void;
}) {
  const [stage, setStage] = useState<"portal" | "reveal">("portal");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const portal = getPortalSpec(behavior);

  function submitFakeForm(e: React.FormEvent) {
    e.preventDefault();
    setStage("reveal");
  }

  if (stage === "portal") {
    return (
      <div className="absolute inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-lg bg-white text-[#202124] shadow-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <div className="ml-2 flex flex-1 items-center gap-1.5 rounded bg-white px-2 py-1 mono text-[11px] text-gray-600">
              <Lock className="h-3 w-3 text-gray-500" />
              <span className="truncate">{href}</span>
            </div>
          </div>
          {/* Portal */}
          <div className="px-7 py-8">
            <div
              className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md text-white"
              style={{ background: portal.color }}
            >
              <portal.icon className="h-6 w-6" />
            </div>
            <h2 className="text-center text-lg font-semibold">{portal.title}</h2>
            <p className="mt-1 text-center text-xs text-gray-500">{portal.subtitle}</p>
            <form onSubmit={submitFakeForm} className="mt-6 space-y-3">
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  {portal.userLabel}
                </span>
                <input
                  autoFocus
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder={portal.userPlaceholder}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  Password
                </span>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <button
                type="submit"
                disabled={!user || !pass}
                className="w-full rounded py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: portal.color }}
              >
                {portal.cta}
              </button>
              <button
                type="button"
                onClick={() => setStage("reveal")}
                className="block w-full text-center text-[11px] text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Reveal screen
  return (
    <div className="absolute inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border-2 border-destructive bg-surface text-foreground shadow-2xl">
        <div className="flex items-center gap-3 rounded-t-lg bg-destructive px-5 py-4 text-destructive-foreground">
          <AlertTriangle className="h-7 w-7" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Training Simulation
            </div>
            <h3 className="text-lg font-bold">⚠️ Phishing Attack Simulated</h3>
          </div>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <p className="font-semibold text-destructive">
            You interacted with a fake {portal.title.toLowerCase()}.
          </p>
          <div className="mono break-all rounded-md bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground">
            {href}
          </div>
          <p>In a real attack, the credentials you typed would now belong to the attacker.</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Always inspect the URL bar — look-alike domains are the #1 tell.</li>
            <li>Real sign-in pages live on your organisation's domain or the official provider domain.</li>
            <li>If a link arrived by email, navigate to the service directly in your browser instead.</li>
          </ul>
          <div className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">
            <span>Score Penalty</span>
            <span>−50 Points</span>
          </div>
        </div>
        <div className="border-t border-border p-4">
          <button
            autoFocus
            onClick={onAcknowledge}
            className="w-full rounded-md bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

interface PortalSpec {
  title: string;
  subtitle: string;
  color: string;
  icon: any;
  userLabel: string;
  userPlaceholder: string;
  cta: string;
}
function getPortalSpec(behavior?: string): PortalSpec {
  switch (behavior) {
    case "fake_hr":
      return {
        title: "Nipun HR Portal",
        subtitle: "Sign in with your corporate credentials",
        color: "#0a8a45",
        icon: Building2,
        userLabel: "Employee ID",
        userPlaceholder: "EMP000123",
        cta: "Sign in to HR Portal",
      };
    case "fake_vpn":
      return {
        title: "Nipun VPN Gateway",
        subtitle: "Authenticate to access internal network",
        color: "#1f4170",
        icon: Lock,
        userLabel: "Username",
        userPlaceholder: "username@nipun.com",
        cta: "Connect to VPN",
      };
    case "fake_payment":
      return {
        title: "Payment Authorisation",
        subtitle: "Verify the receiving account to release funds",
        color: "#d83b01",
        icon: CreditCard,
        userLabel: "Beneficiary email",
        userPlaceholder: "you@nipun.com",
        cta: "Verify & Authorise",
      };
    case "fake_document":
      return {
        title: "Document Portal",
        subtitle: "Sign in to view the shared document",
        color: "#f7b500",
        icon: FileSignature,
        userLabel: "Email",
        userPlaceholder: "you@nipun.com",
        cta: "Open Document",
      };
    case "fake_m365":
    default:
      return {
        title: "Microsoft 365",
        subtitle: "Sign in to your account",
        color: "#0078d4",
        icon: Mail,
        userLabel: "Email, phone, or Skype",
        userPlaceholder: "you@nipun.com",
        cta: "Sign in",
      };
  }
}

// ============================================================
// MFA SETUP WIZARD
// ============================================================
function MfaWizard({
  alreadyCompleted, onClose, onComplete,
}: { alreadyCompleted: boolean; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(alreadyCompleted ? 4 : 1);
  const [method, setMethod] = useState<"authenticator" | "sms" | "email">("authenticator");
  const [code, setCode] = useState("");
  // Generated reference code shown next to the simulated QR
  const verificationCode = useMemo(
    () => String(Math.floor(100000 + Math.random() * 900000)),
    [],
  );
  const [error, setError] = useState<string | null>(null);

  function verify() {
    if (code.trim() === verificationCode) {
      setStep(4);
      setError(null);
      // brief delay so user sees success screen
      setTimeout(() => onComplete(), 1200);
    } else {
      setError("Incorrect code. Open your authenticator app and enter the 6-digit code displayed for this account.");
    }
  }

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-surface text-foreground shadow-2xl">
        <div className="flex items-center justify-between bg-[#0078d4] px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <div className="text-sm font-semibold">Microsoft 365 · Security Setup</div>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 text-sm">
          {step === 1 && (
            <>
              <h3 className="text-lg font-semibold">Set up Multi-Factor Authentication</h3>
              <p className="mt-1 text-muted-foreground">Choose how you want to receive your verification codes.</p>
              <div className="mt-5 space-y-2">
                {[
                  { v: "authenticator", title: "Authenticator app", desc: "Microsoft Authenticator or Google Authenticator (recommended).", icon: Smartphone },
                  { v: "sms", title: "Text message (SMS)", desc: "Receive a code via SMS to your mobile number.", icon: Smartphone },
                  { v: "email", title: "Backup email", desc: "Receive a code at a backup email address.", icon: Mail },
                ].map(({ v, title, desc, icon: Icon }) => (
                  <label
                    key={v}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                      method === v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mfa-method"
                      className="mt-1"
                      checked={method === v}
                      onChange={() => setMethod(v as any)}
                    />
                    <Icon className="mt-0.5 h-5 w-5 text-primary" />
                    <span>
                      <span className="block font-medium text-foreground">{title}</span>
                      <span className="block text-xs text-muted-foreground">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
                <button onClick={() => setStep(2)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold">Scan the QR code</h3>
              <p className="mt-1 text-muted-foreground">Open your authenticator app and scan this QR code to add your Nipun corporate account.</p>
              <div className="mt-5 grid place-items-center rounded-md border border-border bg-white p-6">
                <SimulatedQR />
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  Can't scan? Use this setup key:
                  <div className="mono mt-1 select-all text-foreground">NPUN-MFA-{verificationCode}-CORP</div>
                </div>
              </div>
              <div className="mt-5 flex justify-between gap-2">
                <button onClick={() => setStep(1)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Back</button>
                <button onClick={() => setStep(3)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">I've scanned it</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold">Enter verification code</h3>
              <p className="mt-1 text-muted-foreground">
                Open your authenticator app and enter the 6-digit code shown for the Nipun corporate account.
              </p>
              <div className="mt-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <b className="text-foreground">Simulation tip:</b> for this training, the authenticator app is showing
                <span className="mono mx-1 rounded bg-foreground px-1.5 py-0.5 text-background">{verificationCode}</span>
              </div>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(null); }}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                className="mt-4 w-full rounded-md border border-border bg-surface px-3 py-2 mono text-center text-lg tracking-[0.4em] outline-none focus:border-primary"
              />
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              <div className="mt-5 flex justify-between gap-2">
                <button onClick={() => setStep(2)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Back</button>
                <button
                  onClick={verify}
                  disabled={code.length !== 6}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Verify & Enable
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">MFA enabled</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your account is now protected with Multi-Factor Authentication.
                {alreadyCompleted ? "" : " Bonus points awarded for following security best practice."}
              </p>
              {alreadyCompleted && (
                <button onClick={onClose} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimulatedQR() {
  // Deterministic 11x11 pattern for a believable QR look
  const cells = [];
  const size = 11;
  const seed = (x: number, y: number) => ((x * 31 + y * 17 + x * y) ^ ((x + 1) * (y + 2))) % 2 === 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const corner = (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
      const on = corner ? !(x === 1 && y === 1) && !(x === size - 2 && y === 1) && !(x === 1 && y === size - 2)
        ? (x === 0 || y === 0 || x === 2 || y === 2 || (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4))
        : true
        : seed(x, y);
      cells.push(<rect key={`${x}-${y}`} x={x * 10} y={y * 10} width={10} height={10} fill={on ? "#111" : "transparent"} />);
    }
  }
  return (
    <svg viewBox={`0 0 ${size * 10} ${size * 10}`} width="160" height="160" className="rounded-sm">
      <rect width="100%" height="100%" fill="#fff" />
      {cells}
    </svg>
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
                    <span className="min-w-0 flex-1">
                      <span className="block text-foreground">"{l.text}"</span>
                      <span className="mono mt-0.5 block break-all text-muted-foreground">→ {l.href}</span>
                    </span>
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
          You are about to submit your investigation. After submission, your responses
          will be <b className="text-foreground">locked and cannot be modified</b>. Are
          you sure you want to continue?
        </p>
        <ul className="mt-4 space-y-1 rounded-md bg-muted p-3 text-sm">
          <li className="flex justify-between"><span>Emails reviewed</span><span className="mono">{reviewedCount}/{total}</span></li>
          <li className="flex justify-between"><span>Reports submitted</span><span className="mono">{reportCount}</span></li>
        </ul>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} disabled={submitting} className="flex-1 rounded-md border border-border bg-surface py-2 text-sm font-medium hover:bg-muted">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit"}
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
