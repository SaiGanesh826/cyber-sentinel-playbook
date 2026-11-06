import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyRound, Smartphone, ShieldCheck, Siren, Clock, Lock, Flag, ArrowLeft, ArrowRight,
  AlertTriangle, Trophy, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { MissionReview } from "@/components/pw-mission-review";
import { pwGetState, pwStart, pwSave, pwSubmit } from "@/lib/pw.functions";

export const Route = createFileRoute("/_authenticated/training/password-security/workshop")({
  head: () => ({
    meta: [
      { title: "Password Security & MFA Workshop — Nipun" },
      { name: "description", content: "Four interactive missions on passwords and MFA with one shared 30-minute timer." },
    ],
  }),
  component: WorkshopPage,
});

const FONT = { fontFamily: "Cambria, Georgia, 'Times New Roman', serif" };
const MISSIONS = [
  { key: "m1", title: "Password Detective", sub: "Crack the Pattern", icon: KeyRound },
  { key: "m2", title: "MFA Panic Room", sub: "Approve or Deny?", icon: Smartphone },
  { key: "m3", title: "Secure Your Digital Life", sub: "Safe or Unsafe?", icon: ShieldCheck },
  { key: "m4", title: "Final Mission", sub: "Save the Employee Account", icon: Siren },
] as const;

function WorkshopPage() {
  const getState = useServerFn(pwGetState);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["pw-state"], queryFn: () => getState(), refetchOnWindowFocus: false });
  const refresh = () => qc.invalidateQueries({ queryKey: ["pw-state"] });

  if (isLoading) return <Center><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Center>;
  if (error || !data) return <Center><p className="text-sm text-destructive">Could not load the workshop. Please refresh.</p></Center>;

  return (
    <div style={FONT}>
      {data.state === "locked" && <Locked message={data.message} />}
      {data.state === "eligible" && <Intro campaign={data.campaign} onStarted={refresh} />}
      {data.state === "in_progress" && <Workshop attempt={data.attempt as any} onDone={refresh} />}
      {data.state === "finished" && <Report data={data as any} onStarted={refresh} />}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-[60vh] place-items-center px-6">{children}</div>;
}

function Locked({ message }: { message: string }) {
  return (
    <Center>
      <div className="soc-card max-w-md p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Workshop unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Back to dashboard</Link>
      </div>
    </Center>
  );
}

function StartButton({ label, onStarted }: { label: string; onStarted: () => void }) {
  const start = useServerFn(pwStart);
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try { await start(); onStarted(); } catch (e: any) { toast.error(e.message ?? "Could not start"); setBusy(false); }
      }}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} {label}
    </button>
  );
}

function Intro({ campaign, onStarted }: { campaign: string; onStarted: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/training/password-security" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Overview</Link>
      <span className="chip mt-4">{campaign}</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ready to begin?</h1>
      <div className="soc-card mt-6 space-y-3 p-6 text-sm text-muted-foreground">
        <p className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-accent" /> One 30-minute timer covers all four missions. It starts the moment you press Begin and keeps running if you leave or refresh.</p>
        <p className="flex gap-2"><Lock className="h-4 w-4 shrink-0 text-accent" /> You get one attempt. Your answers save automatically and you can move between missions freely.</p>
        <p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-accent" /> No hints or answers are shown until you finish. Everything is fictional — never type a real password or code.</p>
      </div>
      <div className="mt-6"><StartButton label="Begin Mission 1" onStarted={onStarted} /></div>
    </div>
  );
}

// ======================= Workshop =======================
type Responses = { m1?: { flags: string[]; done?: boolean }; m2?: Record<string, "approve" | "deny">; m3?: Record<string, "safe" | "unsafe">; m4?: Record<string, string>; done?: string[] };

function Workshop({ attempt, onDone }: { attempt: any; onDone: () => void }) {
  const save = useServerFn(pwSave);
  const submit = useServerFn(pwSubmit);
  const c = attempt.content;
  const [mission, setMission] = useState<string>("m1");
  const [r, setR] = useState<Responses>(() => ({ m1: { flags: [] }, m2: {}, m3: {}, m4: {}, done: [], ...(attempt.responses ?? {}) }));
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const offset = useMemo(() => new Date(attempt.server_now).getTime() - Date.now(), [attempt.server_now]);
  const expires = new Date(attempt.expires_at).getTime();
  const [now, setNow] = useState(() => Date.now() + offset);
  const remaining = Math.max(0, Math.floor((expires - now) / 1000));
  const warned = useRef(false);
  const finishing = useRef(false);
  const first = useRef(true);

  useEffect(() => { const t = setInterval(() => setNow(Date.now() + offset), 1000); return () => clearInterval(t); }, [offset]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      save({ data: { attemptId: attempt.id, responses: r } }).then((res) => { if (res.status !== "in_progress") onDone(); }).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [r]);

  async function doSubmit() {
    if (finishing.current) return;
    finishing.current = true;
    setSubmitting(true);
    try { await submit({ data: { attemptId: attempt.id, responses: r } }); } catch { /* server finalises on next load */ }
    onDone();
  }

  useEffect(() => {
    if (remaining <= 300 && remaining > 0 && !warned.current) { warned.current = true; toast.warning("5 minutes remaining in the workshop."); }
    if (remaining === 0) { toast.info("Time is up — your responses have been submitted."); doSubmit(); }
  }, [remaining]);

  const markDone = (k: string) => setR((p) => ({ ...p, done: Array.from(new Set([...(p.done ?? []), k])) }));
  const progress = {
    m1: r.done?.includes("m1"),
    m2: Object.keys(r.m2 ?? {}).length === c.m2.length,
    m3: Object.keys(r.m3 ?? {}).length === c.m3.length,
    m4: Object.keys(r.m4 ?? {}).length === c.m4.stages.length,
  } as Record<string, boolean>;
  const idx = MISSIONS.findIndex((m) => m.key === mission);
  const mm = Math.floor(remaining / 60), ss = remaining % 60;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Password Security &amp; MFA Workshop</div>
          <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm ${remaining <= 300 ? "border-accent text-accent" : "border-border"}`}>
            <Clock className="h-4 w-4" /> {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MISSIONS.map((m, i) => {
            const Icon = m.icon;
            return (
              <button key={m.key} onClick={() => setMission(m.key)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${mission === m.key ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate"><span className="text-muted-foreground">Mission {i + 1} · </span>{m.title}</span>
                {progress[m.key] && <span className="h-2 w-2 rounded-full bg-primary" title="Responses saved" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 animate-in fade-in duration-300" key={mission}>
        <div className="mb-4">
          <span className="chip">MISSION {idx + 1}</span>
          <h2 className="mt-2 text-2xl font-semibold">{MISSIONS[idx].title}: {MISSIONS[idx].sub}</h2>
        </div>
        {mission === "m1" && <Mission1 items={c.m1} r={r} setR={setR} onDone={() => markDone("m1")} done={!!r.done?.includes("m1")} />}
        {mission === "m2" && <Mission2 items={c.m2} r={r} setR={setR} />}
        {mission === "m3" && <Mission3 items={c.m3} r={r} setR={setR} />}
        {mission === "m4" && <Mission4 inc={c.m4} r={r} setR={setR} />}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button disabled={idx === 0} onClick={() => setMission(MISSIONS[idx - 1].key)} className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40">← Previous</button>
        {idx < 3 ? (
          <button onClick={() => { if (mission === "m1") markDone("m1"); setMission(MISSIONS[idx + 1].key); }} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Next mission →</button>
        ) : (
          <button onClick={() => setConfirm(true)} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Finish workshop</button>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="soc-card max-w-md p-6">
            <h3 className="text-lg font-semibold">Submit the workshop?</h3>
            <p className="mt-2 text-sm text-muted-foreground">After submission your responses are locked and your report is generated.
              {Object.values(progress).filter(Boolean).length < 4 && " Some missions still have unanswered items — they will be marked as unanswered."}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(false)} className="rounded-md border border-border px-4 py-2 text-sm">Keep working</button>
              <button disabled={submitting} onClick={doSubmit} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type MProps = { r: Responses; setR: React.Dispatch<React.SetStateAction<Responses>> };

function Mission1({ items, r, setR, onDone, done }: MProps & { items: { id: string; text: string }[]; onDone: () => void; done: boolean }) {
  const flags = r.m1?.flags ?? [];
  const toggle = (id: string) => setR((p) => {
    const f = p.m1?.flags ?? [];
    return { ...p, m1: { ...p.m1, flags: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] } };
  });
  return (
    <div>
      <p className="text-sm text-muted-foreground">Investigators recovered six passwords used by staff. Flag every password you think an attacker could crack or guess.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => {
          const on = flags.includes(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)}
              className={`soc-card group relative p-5 text-left transition hover:-translate-y-0.5 ${on ? "ring-2 ring-accent" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Evidence #{i + 1}</div>
              <div className="mono mt-2 break-all text-lg font-semibold">{p.text}</div>
              <div className={`mt-3 inline-flex items-center gap-1 text-xs ${on ? "text-accent" : "text-muted-foreground"}`}>
                <Flag className="h-3.5 w-3.5" /> {on ? "Flagged as unsafe" : "Tap to flag"}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{flags.length} flagged</span>
        <button onClick={onDone} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">{done ? "Investigation recorded ✓" : "I've finished reviewing"}</button>
      </div>
    </div>
  );
}

function Mission2({ items, r, setR }: MProps & { items: any[] }) {
  const [i, setI] = useState(0);
  const n = items[i];
  const sel = r.m2?.[n.id];
  const choose = (v: "approve" | "deny") => setR((p) => ({ ...p, m2: { ...p.m2, [n.id]: v } }));
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <p className="text-sm text-muted-foreground">Your phone keeps lighting up. Read the situation and decide what you would tap.</p>
        <div className="soc-card mt-4 p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Situation {i + 1} of {items.length}</div>
          <p className="mt-2 text-base">{n.context}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} className={`h-8 w-8 rounded-full border text-xs ${k === i ? "border-primary bg-primary text-primary-foreground" : r.m2?.[x.id] ? "border-primary/50 bg-primary/10" : "border-border"}`}>{k + 1}</button>
          ))}
        </div>
      </div>
      <div className="mx-auto w-[280px] rounded-[2.5rem] border-[10px] border-foreground/80 bg-gradient-to-b from-primary/80 to-primary p-3 shadow-xl">
        <div className="text-center font-mono text-xs text-primary-foreground/80">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        <div key={n.id} className="mt-6 animate-in slide-in-from-top-4 rounded-2xl bg-background p-4 shadow-lg">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {n.app} · now</div>
          <div className="mt-2 font-semibold">{n.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{n.detail}</div>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between"><dt className="text-muted-foreground">Location</dt><dd>{n.location}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Device</dt><dd>{n.device}</dd></div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => choose("deny")} className={`rounded-lg border py-2 text-sm font-semibold ${sel === "deny" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>DENY</button>
            <button onClick={() => choose("approve")} className={`rounded-lg border py-2 text-sm font-semibold ${sel === "approve" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>APPROVE</button>
          </div>
        </div>
        <div className="mt-4 flex justify-between px-2 pb-2">
          <button disabled={i === 0} onClick={() => setI(i - 1)} className="text-xs text-primary-foreground disabled:opacity-30">← Prev</button>
          <button disabled={i === items.length - 1} onClick={() => setI(i + 1)} className="text-xs text-primary-foreground disabled:opacity-30">Next →</button>
        </div>
      </div>
    </div>
  );
}

function Mission3({ items, r, setR }: MProps & { items: { id: string; text: string }[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const place = (id: string, cat: "safe" | "unsafe" | null) => setR((p) => {
    const m3 = { ...(p.m3 ?? {}) };
    if (cat) m3[id] = cat; else delete m3[id];
    return { ...p, m3 };
  });
  const pool = items.filter((h) => !r.m3?.[h.id]);
  const Card = ({ h }: { h: { id: string; text: string } }) => (
    <div draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", h.id)} onClick={() => setPicked(picked === h.id ? null : h.id)}
      className={`cursor-grab rounded-md border bg-card p-3 text-sm shadow-sm transition active:cursor-grabbing ${picked === h.id ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-primary/50"}`}>
      {h.text}
    </div>
  );
  const Zone = ({ cat, label }: { cat: "safe" | "unsafe"; label: string }) => (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { place(e.dataTransfer.getData("text/plain"), cat); setPicked(null); }}
      onClick={() => { if (picked) { place(picked, cat); setPicked(null); } }}
      className={`min-h-[200px] rounded-lg border-2 border-dashed p-3 transition ${picked ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest">{label}</div>
      <div className="space-y-2">{items.filter((h) => r.m3?.[h.id] === cat).map((h) => <Card key={h.id} h={h} />)}</div>
    </div>
  );
  return (
    <div>
      <p className="text-sm text-muted-foreground">Drag each habit into SAFE or UNSAFE — or tap a card, then tap a column. You can move cards any time.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => place(e.dataTransfer.getData("text/plain"), null)} className="rounded-lg bg-muted/50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Habits ({pool.length})</div>
          <div className="space-y-2">{pool.map((h) => <Card key={h.id} h={h} />)}</div>
        </div>
        <Zone cat="safe" label="Safe" />
        <Zone cat="unsafe" label="Unsafe" />
      </div>
    </div>
  );
}

function Mission4({ inc, r, setR }: MProps & { inc: any }) {
  const ans = r.m4 ?? {};
  const choose = (k: string, id: string) => setR((p) => ({ ...p, m4: { ...p.m4, [k]: id } }));
  const visible = inc.stages.findIndex((s: any) => !ans[s.key]);
  const upto = visible === -1 ? inc.stages.length : visible + 1;
  return (
    <div>
      <div className="soc-card border-l-4 border-l-accent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent"><AlertTriangle className="h-4 w-4" /> Incident · {inc.title}</div>
        <p className="mt-2">{inc.situation}</p>
        <div className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-xs">{inc.notification}</div>
      </div>
      <ol className="mt-5 space-y-4">
        {inc.stages.slice(0, upto).map((s: any, i: number) => (
          <li key={s.key} className="animate-in fade-in slide-in-from-bottom-2 soc-card p-5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Update {i + 1}</div>
            <p className="mt-1 text-sm italic text-muted-foreground">“{s.update}”</p>
            <div className="mt-3 font-semibold">{s.prompt}</div>
            <div className="mt-3 grid gap-2">
              {s.options.map((o: any) => (
                <button key={o.id} onClick={() => choose(s.key, o.id)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${ans[s.key] === o.id ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted"}`}>{o.text}</button>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ======================= Report =======================
function fmt(sec?: number) { if (!sec && sec !== 0) return "—"; return `${Math.floor(sec / 60)}m ${sec % 60}s`; }

function Report({ data, onStarted }: { data: any; onStarted: () => void }) {
  const a = data.attempt;
  const res = a.results;
  const [onlyWrong, setOnlyWrong] = useState(false);
  if (!res) return <Center><p>Your report is being prepared…</p></Center>;
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="soc-card bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
        <Trophy className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-3 text-2xl font-semibold">Congratulations! You have completed the Password Security &amp; MFA Awareness Workshop.</h1>
        <p className="mt-1 text-sm text-muted-foreground">{a.status === "timed_out" ? "Time ran out — your saved responses were evaluated." : "All responses submitted."}</p>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Score" value={`${res.score} / ${res.max}`} />
        <Stat label="Percentage" value={`${res.percentage}%`} />
        <Stat label="Performance" value={res.level} />
        <Stat label="Time taken" value={fmt(a.time_taken_seconds)} />
        <Stat label="Correct decisions" value={res.correct} />
        <Stat label="Incorrect decisions" value={res.incorrect} />
        <Stat label="Unanswered" value={res.unanswered} />
        <Stat label="Status" value={a.status === "timed_out" ? "Timed out" : "Completed"} />
      </section>
      <div className="mt-3 text-xs text-muted-foreground">
        {data.profile?.name} {data.profile?.employee_code && `· ${data.profile.employee_code}`} {data.profile?.department && `· ${data.profile.department}`} · {data.campaign} · Attempt {a.attempt_number}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Mission performance</h2>
      <div className="soc-card mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Mission</th><th>Score</th><th>Correct</th><th>Incorrect</th><th>Unanswered</th><th>Status</th></tr></thead>
          <tbody>{res.missions.map((m: any) => (
            <tr key={m.key} className="border-t border-border"><td className="p-3 font-medium">{m.title}</td><td>{m.score}/{m.max}</td><td>{m.correct}</td><td>{m.incorrect}</td><td>{m.unanswered}</td><td>{m.status}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Your improvement summary</h2>
      <ul className="soc-card mt-3 list-disc space-y-1 p-5 pl-9 text-sm">{res.feedback.map((f: string) => <li key={f}>{f}</li>)}</ul>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Detailed review</h2>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setOnlyWrong(false)} className={`rounded-md border px-3 py-1.5 ${!onlyWrong ? "border-primary bg-primary/10" : "border-border"}`}>All results</button>
          <button onClick={() => setOnlyWrong(true)} className={`rounded-md border px-3 py-1.5 ${onlyWrong ? "border-primary bg-primary/10" : "border-border"}`}>Incorrect decisions</button>
        </div>
      </div>
      <MissionReview missions={res.missions} onlyWrong={onlyWrong} />

      <h2 className="mt-8 text-lg font-semibold">Final takeaways</h2>
      <ol className="soc-card mt-3 list-decimal space-y-1 p-5 pl-9 text-sm">
        <li>Use strong and unique passwords.</li><li>Never share passwords or OTPs.</li><li>Enable MFA wherever required.</li>
        <li>Deny unexpected MFA requests.</li><li>Report suspicious login activity immediately.</li>
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/training/password-security" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Return to module overview</Link>
        {data.canRetake && <StartButton label="Start authorised retake" onStarted={onStarted} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="soc-card p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>;
}
