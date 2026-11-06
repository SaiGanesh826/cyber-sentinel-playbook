import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  pwAdminData, pwAdminAttempt, pwSetModuleAccess, pwSaveCampaign, pwGrantRetake, pwRevokeRetake,
} from "@/lib/pw.functions";
import { MissionReview } from "@/components/pw-mission-review";

export const Route = createFileRoute("/_authenticated/admin/workshop")({
  head: () => ({ meta: [{ title: "Password Workshop Admin — Nipun" }, { name: "description", content: "Module access, campaigns, attempts and retakes." }] }),
  component: WorkshopAdmin,
});

const TABS = ["Attempts", "Campaign report", "Campaigns", "Module access"] as const;

function WorkshopAdmin() {
  const { roles } = useAuth();
  const canEdit = roles.includes("super_admin") || roles.includes("admin");
  const load = useServerFn(pwAdminData);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pw-admin"], queryFn: () => load() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["pw-admin"] });
  const [tab, setTab] = useState<(typeof TABS)[number]>("Attempts");
  const [campaignId, setCampaignId] = useState<string>("");
  const cid = campaignId || data?.campaigns[0]?.id || "";

  if (isLoading || !data) return <div className="p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="px-6 py-10 lg:px-10">
      <span className="chip">ADMIN · PASSWORD SECURITY &amp; MFA</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Workshop management</h1>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md border px-3 py-1.5 text-sm ${tab === t ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}>{t}</button>
        ))}
        {(tab === "Attempts" || tab === "Campaign report") && (
          <select value={cid} onChange={(e) => setCampaignId(e.target.value)} className="ml-auto rounded-md border border-border bg-background px-3 py-1.5 text-sm">
            {data.campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      <div className="mt-6">
        {tab === "Attempts" && <Attempts data={data} cid={cid} canEdit={canEdit} refresh={refresh} />}
        {tab === "Campaign report" && <CampaignReport data={data} cid={cid} />}
        {tab === "Campaigns" && <Campaigns data={data} canEdit={canEdit} refresh={refresh} />}
        {tab === "Module access" && <ModuleAccess data={data} canEdit={canEdit} refresh={refresh} />}
      </div>
    </div>
  );
}

const statusLabel: Record<string, string> = { in_progress: "In Progress", completed: "Completed", timed_out: "Timed Out" };

function useRows(data: any, cid: string) {
  return useMemo(() => {
    const camp = data.campaigns.find((c: any) => c.id === cid);
    const eligible = data.profiles.filter((p: any) => !camp?.departments?.length || camp.departments.includes(p.department));
    const pmap = new Map(data.profiles.map((p: any) => [p.id, p]));
    const attempts = data.attempts.filter((a: any) => a.campaign_id === cid);
    const grants = data.grants.filter((g: any) => g.campaign_id === cid);
    const rows = attempts.map((a: any) => {
      const p: any = pmap.get(a.user_id) ?? {};
      const g = grants.filter((x: any) => x.user_id === a.user_id);
      const openGrant = g.find((x: any) => !x.used_attempt_id && !x.revoked_at);
      return { ...a, p, grantsGranted: g.length, grantsUsed: g.filter((x: any) => x.used_attempt_id).length, openGrant };
    });
    const startedIds = new Set(attempts.map((a: any) => a.user_id));
    const notStarted = eligible.filter((p: any) => !startedIds.has(p.id));
    return { camp, eligible, rows, notStarted, grants };
  }, [data, cid]);
}

function csv(name: string, headers: string[], rows: any[][]) {
  const body = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name;
  a.click();
}

function Attempts({ data, cid, canEdit, refresh }: any) {
  const { rows, notStarted } = useRows(data, cid);
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [dept, setDept] = useState(""); const [level, setLevel] = useState("");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [view, setView] = useState<string | null>(null);
  const grant = useServerFn(pwGrantRetake); const revoke = useServerFn(pwRevokeRetake);
  const depts = Array.from(new Set(data.profiles.map((p: any) => p.department).filter(Boolean))) as string[];

  const all = [
    ...rows,
    ...notStarted.map((p: any) => ({ id: `ns-${p.id}`, user_id: p.id, p, status: "not_started", attempt_number: 0 })),
  ];
  const filtered = all.filter((r: any) => {
    const s = `${r.p.full_name} ${r.p.employee_code ?? ""} ${r.p.email}`.toLowerCase();
    if (q && !s.includes(q.toLowerCase())) return false;
    if (status === "retake" ? !r.openGrant : status && r.status !== status) return false;
    if (dept && r.p.department !== dept) return false;
    if (level && r.performance_level !== level) return false;
    if (from && (!r.started_at || r.started_at < from)) return false;
    if (to && (!r.started_at || r.started_at > to + "T23:59:59")) return false;
    return true;
  });

  async function act(fn: () => Promise<any>, ok: string) {
    try { await fn(); toast.success(ok); refresh(); } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm">
        <input placeholder="Search name, ID, email" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5">
          <option value="">All statuses</option><option value="not_started">Not Started</option><option value="in_progress">In Progress</option>
          <option value="completed">Completed</option><option value="timed_out">Timed Out</option><option value="retake">Retake Authorized</option>
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5">
          <option value="">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5">
          <option value="">All levels</option>{["Excellent Security Awareness", "Good Security Awareness", "Needs Improvement", "Additional Awareness Required"].map((l) => <option key={l}>{l}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5" />
        <button onClick={() => csv(`password-workshop-attempts-${Date.now()}.csv`,
          ["Name", "Employee ID", "Department", "Email", "Attempt", "Question set", "Status", "Started", "Completed", "Time (s)", "Score", "Max", "Percentage", "Level", "Retakes granted", "Retakes used"],
          filtered.map((r: any) => [r.p.full_name, r.p.employee_code, r.p.department, r.p.email, r.attempt_number || "", r.set_hash ? r.set_hash.slice(0, 40) : "", statusLabel[r.status] ?? "Not Started", r.started_at, r.submitted_at, r.time_taken_seconds, r.score, r.max_score, r.percentage, r.performance_level, r.grantsGranted, r.grantsUsed]))}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 hover:bg-muted"><Download className="h-4 w-4" /> Export CSV</button>
      </div>

      <div className="soc-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Employee</th><th>Dept</th><th>#</th><th>Status</th><th>Started</th><th>Time</th><th>Score</th><th>Level</th><th>Retake</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => {
              const remaining = r.status === "in_progress" ? Math.max(0, Math.round((new Date(r.expires_at).getTime() - Date.now()) / 1000)) : null;
              return (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-3"><div className="font-medium">{r.p.full_name || "—"}</div><div className="text-xs text-muted-foreground">{r.p.employee_code ?? ""} {r.p.email}</div></td>
                  <td>{r.p.department ?? "—"}</td>
                  <td>{r.attempt_number || "—"}</td>
                  <td><span className="chip">{r.openGrant ? "Retake Authorized" : statusLabel[r.status] ?? "Not Started"}</span>{remaining !== null && <div className="text-xs text-muted-foreground">{Math.floor(remaining / 60)}m left</div>}</td>
                  <td className="text-xs">{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                  <td className="text-xs">{r.time_taken_seconds != null ? `${Math.floor(r.time_taken_seconds / 60)}m ${r.time_taken_seconds % 60}s` : "—"}</td>
                  <td>{r.score != null ? `${r.score}/${r.max_score} (${r.percentage}%)` : "—"}</td>
                  <td className="text-xs">{r.performance_level ?? "—"}</td>
                  <td className="text-xs">{r.grantsGranted ? `${r.grantsUsed}/${r.grantsGranted} used` : "—"}</td>
                  <td className="space-x-2 whitespace-nowrap pr-3 text-xs">
                    {r.set_hash && <button onClick={() => setView(r.id)} className="text-primary hover:underline">View</button>}
                    {canEdit && r.status && ["completed", "timed_out"].includes(r.status) && !r.openGrant && r.attempt_number === Math.max(...rows.filter((x: any) => x.user_id === r.user_id).map((x: any) => x.attempt_number)) && (
                      <button onClick={() => act(() => grant({ data: { userId: r.user_id, campaignId: cid } }), "Retake authorised")} className="text-accent hover:underline">Grant retake</button>
                    )}
                    {canEdit && r.openGrant && <button onClick={() => act(() => revoke({ data: { grantId: r.openGrant.id } }), "Retake revoked")} className="text-destructive hover:underline">Revoke</button>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No matching employees.</td></tr>}
          </tbody>
        </table>
      </div>
      {view && <AttemptDialog id={view} onClose={() => setView(null)} grants={data.grants} />}
    </div>
  );
}

function AttemptDialog({ id, onClose, grants }: { id: string; onClose: () => void; grants: any[] }) {
  const get = useServerFn(pwAdminAttempt);
  const { data } = useQuery({ queryKey: ["pw-attempt", id], queryFn: () => get({ data: { id } }) });
  const g = data ? grants.filter((x) => x.used_attempt_id === data.id) : [];
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4">
      <div className="soc-card mx-auto max-w-4xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Attempt review</h2>
            {data && <p className="text-xs text-muted-foreground">Attempt {data.attempt_number} · {statusLabel[data.status]} · Question set <span className="mono">{data.set_hash.slice(0, 48)}…</span>
              {g[0] && ` · Retake authorised ${new Date(g[0].granted_at).toLocaleString()}`}</p>}
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {!data ? <Loader2 className="mt-6 h-5 w-5 animate-spin" /> : (
          <>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
              <div>Score: <b>{data.results.score}/{data.results.max}</b></div>
              <div>Percentage: <b>{data.results.percentage}%</b></div>
              <div>Level: <b>{data.results.level}</b></div>
              <div>Correct/Incorrect/Unanswered: <b>{data.results.correct}/{data.results.incorrect}/{data.results.unanswered}</b></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Items are listed in the exact order they were shown to the employee.</p>
            <MissionReview missions={data.results.missions} />
          </>
        )}
      </div>
    </div>
  );
}

function CampaignReport({ data, cid }: any) {
  const { camp, eligible, rows, notStarted, grants } = useRows(data, cid);
  const latest = new Map<string, any>();
  for (const r of rows) if (!latest.has(r.user_id) || latest.get(r.user_id).attempt_number < r.attempt_number) latest.set(r.user_id, r);
  const L = [...latest.values()];
  const done = L.filter((r) => r.status !== "in_progress" && r.percentage != null);
  const pcts = done.map((r) => Number(r.percentage));
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  const depts = new Map<string, { n: number; done: number; sum: number }>();
  for (const p of eligible) { const d = p.department || "Unassigned"; const e = depts.get(d) ?? { n: 0, done: 0, sum: 0 }; e.n++; const r = latest.get(p.id); if (r?.percentage != null) { e.done++; e.sum += Number(r.percentage); } depts.set(d, e); }
  const stat = (l: string, v: any) => <div className="soc-card p-4"><div className="text-xs uppercase text-muted-foreground">{l}</div><div className="mt-1 text-xl font-semibold">{v}</div></div>;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stat("Eligible", eligible.length)}{stat("Not started", notStarted.length)}{stat("In progress", L.filter((r) => r.status === "in_progress").length)}
        {stat("Completed", L.filter((r) => r.status === "completed").length)}{stat("Timed out", L.filter((r) => r.status === "timed_out").length)}
        {stat("Retakes authorised", grants.filter((g: any) => !g.revoked_at).length)}{stat("Average", `${avg}%`)}{stat("Highest", pcts.length ? `${Math.max(...pcts)}%` : "—")}{stat("Lowest", pcts.length ? `${Math.min(...pcts)}%` : "—")}
        {stat("Campaign", camp?.is_active ? "Active" : "Locked")}
      </div>
      <h3 className="mt-8 font-semibold">Department performance</h3>
      <div className="soc-card mt-3 overflow-x-auto">
        <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Department</th><th>Eligible</th><th>Finished</th><th>Participation</th><th>Average</th></tr></thead>
          <tbody>{[...depts.entries()].map(([d, e]) => <tr key={d} className="border-t border-border"><td className="p-3">{d}</td><td>{e.n}</td><td>{e.done}</td><td>{Math.round((e.done / e.n) * 100)}%</td><td>{e.done ? `${Math.round(e.sum / e.done)}%` : "—"}</td></tr>)}</tbody>
        </table>
      </div>
      <button onClick={() => csv(`campaign-${Date.now()}.csv`, ["Department", "Eligible", "Finished", "Average %"], [...depts.entries()].map(([d, e]) => [d, e.n, e.done, e.done ? Math.round(e.sum / e.done) : ""]))}
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"><Download className="h-4 w-4" /> Export department report</button>
      <p className="mt-4 text-xs text-muted-foreground">Mission-wise results for each employee are available in the attempt review.</p>
    </div>
  );
}

const toLocal = (s?: string | null) => (s ? new Date(s).toISOString().slice(0, 16) : "");
const fromLocal = (s: string) => (s ? new Date(s).toISOString() : null);

function Campaigns({ data, canEdit, refresh }: any) {
  const save = useServerFn(pwSaveCampaign);
  const [form, setForm] = useState<any>({ name: "", departments: "", is_active: true, starts_at: "", ends_at: "" });
  async function submit(c: any) {
    try {
      await save({ data: { id: c.id, name: c.name, departments: c.departments ? String(c.departments).split(",").map((s: string) => s.trim()).filter(Boolean) : null, is_active: c.is_active, starts_at: fromLocal(c.starts_at), ends_at: fromLocal(c.ends_at) } });
      toast.success("Campaign saved"); refresh(); setForm({ name: "", departments: "", is_active: true, starts_at: "", ends_at: "" });
    } catch (e: any) { toast.error(e.message); }
  }
  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="soc-card grid gap-2 p-4 text-sm sm:grid-cols-6">
          <input className="rounded-md border border-border bg-background px-2 py-1.5 sm:col-span-2" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-md border border-border bg-background px-2 py-1.5" placeholder="Departments (comma, blank=all)" value={form.departments} onChange={(e) => setForm({ ...form, departments: e.target.value })} />
          <input type="datetime-local" className="rounded-md border border-border bg-background px-2 py-1.5" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <input type="datetime-local" className="rounded-md border border-border bg-background px-2 py-1.5" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          <button onClick={() => submit(form)} className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground">Create campaign</button>
        </div>
      )}
      {data.campaigns.map((c: any) => (
        <div key={c.id} className="soc-card flex flex-wrap items-center gap-3 p-4 text-sm">
          <div className="flex-1"><div className="font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.departments?.length ? c.departments.join(", ") : "All departments"} · {c.starts_at ? new Date(c.starts_at).toLocaleString() : "no start"} → {c.ends_at ? new Date(c.ends_at).toLocaleString() : "no end"} · {data.attempts.filter((a: any) => a.campaign_id === c.id).length} attempts</div></div>
          <span className="chip">{c.is_active ? "ACTIVE" : "LOCKED"}</span>
          {canEdit && <button onClick={() => submit({ ...c, departments: c.departments?.join(","), starts_at: toLocal(c.starts_at), ends_at: toLocal(c.ends_at), is_active: !c.is_active })} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">{c.is_active ? "Lock" : "Activate"}</button>}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Employees use the newest active campaign within its dates. Each campaign has its own unique question-set pool.</p>
    </div>
  );
}

function ModuleAccess({ data, canEdit, refresh }: any) {
  const set = useServerFn(pwSetModuleAccess);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.modules.map((m: any) => <ModuleCard key={m.id} m={m} canEdit={canEdit} onSave={async (v: any) => { try { await set({ data: { slug: m.slug, ...v } }); toast.success("Module access updated"); refresh(); } catch (e: any) { toast.error(e.message); } }} />)}
    </div>
  );
}

function ModuleCard({ m, canEdit, onSave }: any) {
  const [s, setS] = useState({ is_enabled: m.is_enabled, is_available: m.is_available, access_start: toLocal(m.access_start), access_end: toLocal(m.access_end) });
  const open = m.is_enabled && m.is_available;
  return (
    <div className="soc-card p-5 text-sm">
      <div className="flex items-center justify-between"><h3 className="font-semibold">{m.title}</h3><span className="chip">{open ? "OPEN" : "LOCKED"}</span></div>
      <label className="mt-4 flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={s.is_enabled} onChange={(e) => setS({ ...s, is_enabled: e.target.checked })} /> Module activated</label>
      <label className="mt-2 flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={s.is_available} onChange={(e) => setS({ ...s, is_available: e.target.checked })} /> Employee access enabled (unlocked)</label>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <label>Available from<input type="datetime-local" disabled={!canEdit} value={s.access_start} onChange={(e) => setS({ ...s, access_start: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1" /></label>
        <label>Available until<input type="datetime-local" disabled={!canEdit} value={s.access_end} onChange={(e) => setS({ ...s, access_end: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1" /></label>
      </div>
      {canEdit && <button onClick={() => onSave({ is_enabled: s.is_enabled, is_available: s.is_available, access_start: fromLocal(s.access_start), access_end: fromLocal(s.access_end) })} className="mt-4 rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground">Save</button>}
    </div>
  );
}
