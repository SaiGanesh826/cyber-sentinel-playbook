import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Zap,
  Smartphone,
  PhoneCall,
  LayoutGrid,
  Siren,
  Play,
  Pause,
  RotateCcw,
  Eye,
  MessageSquare,
  Trophy,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lock,
  MapPin,
  Clock,
  Award,
  Monitor,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/password-security/workshop")({
  head: () => ({
    meta: [
      { title: "Live Workshop — Password Security & MFA | Nipun" },
      { name: "description", content: "Facilitator-led live workshop on passwords, MFA and account safety." },
    ],
  }),
  component: Workshop,
});

/* ------------------------------ mission list ------------------------------ */

const MISSIONS = [
  { id: "detective", name: "Password Detective", tag: "Crack the Pattern", icon: Search, minutes: 8 },
  { id: "domino", name: "The Domino Effect", tag: "One Password, Many Accounts", icon: Zap, minutes: 8 },
  { id: "panic", name: "MFA Panic Room", tag: "Approve or Deny?", icon: Smartphone, minutes: 8 },
  { id: "impostor", name: "IT Support Impersonation", tag: "Role-Play Game", icon: PhoneCall, minutes: 10 },
  { id: "digital", name: "Secure Your Digital Life", tag: "Team Planning Board", icon: LayoutGrid, minutes: 8 },
  { id: "final", name: "Save the Employee Account", tag: "Final Mission", icon: Siren, minutes: 12 },
] as const;

const TEAMS_DEFAULT = [
  { name: "Team Alpha", points: 0 },
  { name: "Team Bravo", points: 0 },
  { name: "Team Charlie", points: 0 },
  { name: "Team Delta", points: 0 },
];

const TAKEAWAYS = [
  "Use strong and unique passwords.",
  "Never share passwords or OTPs.",
  "Enable MFA wherever required.",
  "Deny unexpected MFA requests.",
  "Report suspicious account activity immediately.",
];

/* -------------------------------- workshop -------------------------------- */

function Workshop() {
  const { profile } = useAuth() as any;
  const [stage, setStage] = useState<number>(-1); // -1 lobby, 0-5 missions, 6 finish
  const [done, setDone] = useState<string[]>([]);
  const [teams, setTeams] = useState(TEAMS_DEFAULT);
  const [showNotes, setShowNotes] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => (s <= 1 ? (setRunning(false), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const goto = (i: number) => {
    setStage(i);
    setShowNotes(false);
    setRunning(false);
    if (i >= 0 && i < 6) setSeconds(MISSIONS[i].minutes * 60);
  };
  const complete = () => {
    const id = MISSIONS[stage].id;
    setDone((d) => (d.includes(id) ? d : [...d, id]));
    toast.success(`Mission complete: ${MISSIONS[stage].name}`);
    goto(stage + 1);
  };
  const addPts = (i: number, n: number) =>
    setTeams((t) => t.map((x, j) => (j === i ? { ...x, points: Math.max(0, x.points + n) } : x)));

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Cambria, Georgia, serif" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/training/password-security" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Module overview
          </Link>
          <span className="chip inline-flex items-center gap-1"><Monitor className="h-3 w-3" /> FACILITATOR MODE · LIVE WORKSHOP</span>
        </div>

        {/* Mission rail */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {MISSIONS.map((m, i) => {
            const Icon = m.icon;
            const active = stage === i;
            const isDone = done.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => goto(i)}
                className={`rounded-lg border p-2 text-left transition-all ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="mt-1 text-[11px] font-semibold leading-tight">{m.name}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_260px]">
          <main key={`${stage}-${resetKey}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {stage === -1 && <Lobby onStart={() => goto(0)} />}
            {stage === 0 && <Detective notes={showNotes} />}
            {stage === 1 && <Domino notes={showNotes} />}
            {stage === 2 && <PanicRoom notes={showNotes} />}
            {stage === 3 && <Impostor notes={showNotes} />}
            {stage === 4 && <DigitalLife notes={showNotes} />}
            {stage === 5 && <FinalMission notes={showNotes} />}
            {stage === 6 && (
              <Finish teams={teams} done={done} profileId={profile?.id} onRestart={() => { setDone([]); setTeams(TEAMS_DEFAULT); goto(-1); }} />
            )}
            {stage >= 0 && stage < 6 && (
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button onClick={() => goto(stage - 1)} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button onClick={complete} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Mission complete <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>

          {/* Facilitator panel */}
          <aside className="space-y-4">
            {stage >= 0 && stage < 6 && (
              <div className="soc-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mission timer</div>
                <div className={`mono mt-1 text-4xl font-bold ${seconds < 60 && seconds > 0 ? "text-destructive" : ""}`}>
                  {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <CtlBtn onClick={() => setRunning(true)} icon={Play} label="Start" />
                  <CtlBtn onClick={() => setRunning(false)} icon={Pause} label="Pause" />
                  <CtlBtn onClick={() => { setRunning(false); setSeconds(MISSIONS[stage].minutes * 60); setResetKey((k) => k + 1); }} icon={RotateCcw} label="Reset" />
                </div>
                <button onClick={() => setShowNotes((s) => !s)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                  <MessageSquare className="h-3.5 w-3.5" /> {showNotes ? "Hide" : "Show"} discussion points
                </button>
              </div>
            )}
            <div className="soc-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-accent" /> Team leaderboard (optional)
              </div>
              <div className="mt-3 space-y-2">
                {[...teams].map((t, i) => ({ ...t, i })).sort((a, b) => b.points - a.points).map((t, rank) => (
                  <div key={t.i} className="flex items-center gap-2 rounded-md border border-border p-2">
                    <span className="mono w-4 text-xs text-muted-foreground">{rank + 1}</span>
                    <input
                      value={t.name}
                      onChange={(e) => setTeams((all) => all.map((x, j) => (j === t.i ? { ...x, name: e.target.value } : x)))}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                      aria-label="Team name"
                    />
                    <button onClick={() => addPts(t.i, -1)} className="rounded p-1 hover:bg-muted" aria-label="Remove point"><Minus className="h-3 w-3" /></button>
                    <span className="mono w-7 text-center text-sm font-bold text-primary">{t.points}</span>
                    <button onClick={() => addPts(t.i, 1)} className="rounded p-1 hover:bg-muted" aria-label="Add point"><Plus className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Award points for good reasoning, not just right answers.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CtlBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex flex-col items-center gap-0.5 rounded-md border border-border py-1.5 text-[11px] hover:bg-muted">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function MissionHeader({ i, brief }: { i: number; brief: string }) {
  const m = MISSIONS[i];
  const Icon = m.icon;
  return (
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">Mission {i + 1} · {m.tag}</div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{m.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{brief}</p>
      </div>
    </div>
  );
}

function Notes({ show, items }: { show: boolean; items: string[] }) {
  if (!show) return null;
  return (
    <div className="mt-5 rounded-lg border border-accent/40 bg-accent/10 p-4 animate-in fade-in">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><MessageSquare className="h-3.5 w-3.5" /> Ask the room</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

function RevealBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
      <Eye className="h-4 w-4" /> {children}
    </button>
  );
}

/* ---------------------------------- lobby --------------------------------- */

function Lobby({ onStart }: { onStart: () => void }) {
  return (
    <div className="soc-card overflow-hidden">
      <div className="bg-primary p-8 text-primary-foreground">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Live team workshop</div>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Operation: Lock It Down</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">Six missions. Real workplace situations. Your teams will investigate, role-play and decide — together.</p>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-3">
        {[
          ["1. Form teams", "Split the room into 2–4 teams. Rename them on the leaderboard."],
          ["2. Discuss & vote", "Teams talk, then vote with a show of hands or by calling out."],
          ["3. Reveal & learn", "The facilitator reveals what really happens next."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-lg border border-border p-4">
            <div className="text-sm font-semibold">{t}</div>
            <p className="mt-1 text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-6">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> All examples are fictional. Never say or type a real password or OTP.</p>
        <button onClick={onStart} className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground hover:opacity-90">
          <Play className="h-4 w-4" /> Begin Mission 1
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- mission 1 -------------------------------- */

const EVIDENCE = [
  { pw: "Priya1992", pattern: "Name + birth year", risk: "high", how: "Your name and birthday are on social media. Attackers build guesses from your profile in seconds." },
  { pw: "Nipun@2026", pattern: "Company + year", risk: "high", how: "The very first pattern an attacker tries against a known company." },
  { pw: "qwerty123", pattern: "Keyboard sequence", risk: "high", how: "Every cracking list starts with keyboard walks like qwerty, asdf and 1234." },
  { pw: "sunshine", pattern: "Dictionary word", risk: "high", how: "Single words are cracked instantly by trying every word in the dictionary." },
  { pw: "P@ssw0rd!", pattern: "Predictable swaps", risk: "high", how: "a→@, o→0, s→$ — attackers' tools apply these swaps automatically." },
  { pw: "Mango-Bicycle-Rain-47", pattern: "Long passphrase", risk: "low", how: "Four random words are long and memorable. Length beats complexity." },
  { pw: "x7#Lq9!vR2&mZp", pattern: "Random (manager)", risk: "low", how: "Generated by a password manager. Impossible to guess — you don't need to remember it." },
];

function Detective({ notes }: { notes: boolean }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [flagged, setFlagged] = useState<number[]>([]);
  const toggle = (arr: number[], set: (v: number[]) => void, i: number) => set(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
  return (
    <div>
      <MissionHeader i={0} brief="These passwords were recovered from a fictional breach. Teams: find the pattern an attacker would exploit on each card." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EVIDENCE.map((e, i) => {
          const r = revealed.includes(i);
          const f = flagged.includes(i);
          return (
            <div key={e.pw} className={`relative rounded-lg border-2 bg-card p-4 shadow-sm transition-all ${f ? "border-accent" : "border-dashed border-border"}`} style={{ transform: `rotate(${(i % 3) - 1}deg)` }}>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <span>Evidence #{String(i + 1).padStart(3, "0")}</span>
                <button onClick={() => toggle(flagged, setFlagged, i)} className={`rounded px-1.5 py-0.5 ${f ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>{f ? "Flagged" : "Flag"}</button>
              </div>
              <div className="mono mt-3 rounded bg-muted px-3 py-3 text-center text-lg font-bold">{e.pw}</div>
              {r ? (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                  <span className={e.risk === "high" ? "chip chip-danger" : "chip chip-success"}>{e.pattern}</span>
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted">
                    <div className={`h-full ${e.risk === "high" ? "w-[92%] bg-destructive" : "w-[8%] bg-primary"}`} />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{e.risk === "high" ? "Cracked in seconds" : "Would take centuries"}</div>
                  <p className="mt-2 text-xs">{e.how}</p>
                </div>
              ) : (
                <button onClick={() => toggle(revealed, setRevealed, i)} className="mt-3 w-full rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted">Reveal analysis</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex gap-2">
        <RevealBtn onClick={() => setRevealed(EVIDENCE.map((_, i) => i))}>Reveal all findings</RevealBtn>
      </div>
      <Notes show={notes} items={["Which card would you crack first if you were the attacker? Why?", "What personal details do you share online that could end up in a password?", "Team with the most correctly flagged weak cards wins 3 points."]} />
    </div>
  );
}

/* ------------------------------- mission 2 -------------------------------- */

const DOMINO = [
  { t: "Day 1 · 02:14", title: "ShopKart.example is breached", body: "Hackers steal 4 million customer records from an online shopping site.", ask: "Ravi from Finance shops there. What did the attackers just get?" },
  { t: "Day 3 · 11:00", title: "Credentials leak online", body: "ravi.k@nipun.example : Summer@2025 appears in a public leaked-password dump.", ask: "Ravi uses the same password at work. What will attackers try next?" },
  { t: "Day 3 · 11:06", title: "Credential-stuffing bot strikes", body: "An automated bot tries the leaked email + password on the company's email login.", ask: "Does the password work? What's the only thing that can still stop them?" },
  { t: "Day 3 · 11:07", title: "Unexpected login attempt", body: "Login from an unknown device in another country. Ravi has no MFA enabled.", ask: "What could the attacker do inside Ravi's mailbox?" },
  { t: "Day 3 · 11:30", title: "Confidential data exposed", body: "Vendor bank details and invoices are forwarded out. A fake payment request is sent to a client.", ask: "Which two habits would have stopped this entire chain?" },
];

function Domino({ notes }: { notes: boolean }) {
  const [shown, setShown] = useState(1);
  return (
    <div>
      <MissionHeader i={1} brief="Watch the incident unfold. Pause after each event — teams predict what happens next before you reveal it." />
      <div className="relative mt-8 pl-8">
        <div className="absolute bottom-0 left-3 top-0 w-0.5 bg-border" />
        <div className="absolute left-3 top-0 w-0.5 bg-destructive transition-all duration-700" style={{ height: `${(shown / DOMINO.length) * 100}%` }} />
        {DOMINO.slice(0, shown).map((d, i) => (
          <div key={i} className="relative mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="absolute -left-[26px] top-3 grid h-5 w-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{i + 1}</div>
            <div className="soc-card p-4">
              <div className="mono text-[11px] text-muted-foreground">{d.t}</div>
              <div className="mt-1 text-lg font-semibold">{d.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>
              {i === shown - 1 && shown < DOMINO.length && (
                <div className="mt-3 rounded-md bg-accent/15 p-3 text-sm font-medium">🤔 Team prediction: {d.ask}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {shown < DOMINO.length ? (
        <RevealBtn onClick={() => setShown((s) => s + 1)}>Reveal next event ({shown}/{DOMINO.length})</RevealBtn>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in">
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Unique password</div>
            <p className="mt-1 text-sm">The leaked password would have been useless at work. The chain breaks at event 3.</p>
          </div>
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
            <div className="flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4 text-primary" /> MFA enabled</div>
            <p className="mt-1 text-sm">Even with the right password, the attacker is blocked at event 4 without Ravi's phone.</p>
          </div>
        </div>
      )}
      <Notes show={notes} items={["Have you ever reused a work password anywhere else? (No need to answer aloud.)", "How fast did this happen? Attackers automate everything.", "Award a point to each team that predicted the next event correctly."]} />
    </div>
  );
}

/* ------------------------------- mission 3 -------------------------------- */

const PROMPTS = [
  { app: "Authenticator", title: "Approve sign-in?", sub: "Nipun Mail · Mumbai, IN · just now", ctx: "You just typed your password into Outlook on your laptop.", safe: "approve", why: "You started this login yourself, from your usual place. Approving is correct." },
  { app: "Authenticator", title: "Approve sign-in?", sub: "Nipun Mail · Mumbai, IN · 02:47 AM", ctx: "You are asleep. Your phone buzzes on the nightstand.", safe: "deny", why: "You didn't log in — someone else has your password. Deny, then change your password and report it." },
  { app: "Authenticator", title: "Approve sign-in? (12 requests)", sub: "Nipun Mail · repeated every 20 seconds", ctx: "Notifications keep coming while you're in a meeting.", safe: "deny", why: "This is MFA fatigue — attackers spam you hoping you'll tap Approve to make it stop. Deny all and call IT Security." },
  { app: "Authenticator", title: "Approve sign-in?", sub: "Nipun VPN · Lagos, NG · new device", ctx: "You are working from the office in Pune.", safe: "deny", why: "Unknown location and device. Never approve a login you can't explain." },
  { app: "Phone", title: "Incoming call: \"IT Helpdesk\"", sub: "+91 98xxx · \"Please read me the 6-digit code we just sent.\"", ctx: "An SMS code arrives at the same moment.", safe: "deny", why: "Real IT never asks for your OTP. Whoever has the code has your account. Hang up and call IT via the official number." },
];

function PanicRoom({ notes }: { notes: boolean }) {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<"approve" | "deny" | null>(null);
  const p = PROMPTS[idx];
  const correct = choice === p.safe;
  return (
    <div>
      <MissionHeader i={2} brief="Your phone lights up. Read the situation, let the room vote with a show of hands, then tap the team's decision." />
      <div className="mt-6 grid items-center gap-6 md:grid-cols-[300px_1fr]">
        <div className="mx-auto w-[280px] rounded-[2.5rem] border-[10px] border-foreground bg-foreground p-1 shadow-2xl">
          <div className="relative h-[520px] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-primary to-secondary p-4">
            <div className="mx-auto mb-6 h-5 w-24 rounded-full bg-foreground" />
            <div className="text-center text-primary-foreground">
              <div className="text-5xl font-light">{idx === 1 ? "02:47" : "10:42"}</div>
              <div className="text-xs opacity-80">Tuesday</div>
            </div>
            <div key={idx} className="mt-8 animate-in slide-in-from-top-8 fade-in duration-500 rounded-2xl bg-card/95 p-3 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                {p.app === "Phone" ? <PhoneCall className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {p.app} · now
              </div>
              <div className="mt-1 text-sm font-semibold">{p.title}</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {p.sub}</div>
              {idx === 2 && <div className="mt-2 space-y-1">{[0, 1].map((k) => <div key={k} className="h-2 rounded bg-muted" />)}</div>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button disabled={!!choice} onClick={() => setChoice("deny")} className="rounded-lg bg-destructive py-2 text-xs font-bold text-destructive-foreground disabled:opacity-60">DENY</button>
                <button disabled={!!choice} onClick={() => setChoice("approve")} className="rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">APPROVE</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Situation {idx + 1} of {PROMPTS.length}</div>
          <p className="mt-1 text-xl font-semibold">{p.ctx}</p>
          {choice && (
            <div className={`mt-4 rounded-lg border-2 p-4 animate-in zoom-in-95 ${correct ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
              <div className="flex items-center gap-2 font-semibold">
                {correct ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                {correct ? "Account protected" : choice === "approve" ? "Attacker is now inside the mailbox" : "You blocked your own login — just try again"}
              </div>
              <p className="mt-2 text-sm">{p.why}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            {idx < PROMPTS.length - 1 && choice && (
              <RevealBtn onClick={() => { setIdx(idx + 1); setChoice(null); }}>Next notification</RevealBtn>
            )}
          </div>
        </div>
      </div>
      <Notes show={notes} items={["Why did you decide that? What detail gave it away?", "MFA fatigue: attackers rely on annoyance. What should you do instead of tapping Approve?", "This is a simulation — it never connects to real accounts or codes."]} />
    </div>
  );
}

/* ------------------------------- mission 4 -------------------------------- */

const CALLS = [
  { who: "Caller: \"IT Support\"", line: "Your email account has an issue. I've sent an OTP to your phone. Please share it so I can fix it.", risk: "The OTP is the key to your account. Sharing it hands over access.", reply: "\"I can't share codes. I'll raise a ticket through the IT portal myself.\"" },
  { who: "Caller: \"IT Manager, Arjun\"", line: "This is Arjun, the IT Manager. I'm authorising this personally — just read me the code.", risk: "Attackers use senior names and authority to rush you.", reply: "\"Thanks Arjun — I'll call you back on the number in the company directory.\"" },
  { who: "Caller: \"Security Team\"", line: "Your account will be blocked in 10 minutes unless you verify now.", risk: "Fake urgency stops you from thinking. Real teams give you time.", reply: "\"If it's blocked, I'll contact the helpdesk directly. Goodbye.\"" },
  { who: "Caller: \"Helpdesk\"", line: "I need your password to troubleshoot the sync issue.", risk: "IT can reset accounts — they never need your password.", reply: "\"IT never needs my password. Please reset it through the official process.\"" },
  { who: "Caller: \"IT Support\"", line: "You'll get an approval pop-up on your phone. Just tap Approve so I can finish.", risk: "Approving gives the caller a live login session.", reply: "\"I only approve logins I start myself. I'll deny it and report this call.\"" },
];

function Impostor({ notes }: { notes: boolean }) {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const c = CALLS[idx];
  return (
    <div>
      <MissionHeader i={3} brief="Pick two volunteers: one plays the caller, one plays the employee. The caller reads the script — the employee responds naturally." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="soc-card border-l-4 border-l-destructive p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-destructive"><PhoneCall className="h-4 w-4 animate-pulse" /> Volunteer A · The Caller</div>
          <div className="mt-2 text-sm text-muted-foreground">{c.who}</div>
          <p key={idx} className="mt-2 text-xl font-semibold leading-snug animate-in fade-in">"{c.line}"</p>
        </div>
        <div className="soc-card border-l-4 border-l-primary p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">Volunteer B · The Employee</div>
          <p className="mt-2 text-sm text-muted-foreground">Respond in your own words. The room watches: did you stay polite but firm?</p>
          {show && (
            <div className="mt-3 space-y-3 animate-in fade-in">
              <div className="rounded-md bg-destructive/10 p-3 text-sm"><b>The risk:</b> {c.risk}</div>
              <div className="rounded-md bg-primary/10 p-3 text-sm"><b>A strong reply:</b> {c.reply}</div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!show ? <RevealBtn onClick={() => setShow(true)}>Reveal risk & safe reply</RevealBtn> : idx < CALLS.length - 1 && (
          <RevealBtn onClick={() => { setIdx(idx + 1); setShow(false); }}>Next caller tactic ({idx + 2}/{CALLS.length})</RevealBtn>
        )}
      </div>
      {idx === CALLS.length - 1 && show && (
        <div className="mt-5 rounded-lg border-2 border-primary p-4 animate-in fade-in">
          <div className="font-semibold">How to verify any "IT" request</div>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            <div>1. Hang up politely.</div><div>2. Call IT on the official directory number.</div><div>3. Report the call to IT Security.</div>
          </div>
        </div>
      )}
      <Notes show={notes} items={["Volunteer B: how did that pressure feel?", "What words did the caller use to make you hurry?", "Room vote: did the employee handle it safely? Award a point."]} />
    </div>
  );
}

/* ------------------------------- mission 5 -------------------------------- */

const PRACTICES = [
  { t: "Password manager with one strong master passphrase", safe: true },
  { t: "MFA on work email, VPN and banking", safe: true },
  { t: "A different password for every account", safe: true },
  { t: "Locking the screen when leaving the desk", safe: true },
  { t: "Same password for work email and shopping sites", safe: false },
  { t: "Passwords in an unprotected Excel file", safe: false },
  { t: "Sticky note under the keyboard", safe: false },
  { t: "Sharing the team login over WhatsApp", safe: false },
  { t: "Saving passwords on a shared office computer", safe: false },
];

function DigitalLife({ notes }: { notes: boolean }) {
  const [placed, setPlaced] = useState<Record<number, "safe" | "unsafe">>({});
  const [checked, setChecked] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const put = (i: number | null, b: "safe" | "unsafe") => { if (i === null) return; setPlaced((p) => ({ ...p, [i]: b })); setPicked(null); };
  const pool = PRACTICES.map((p, i) => ({ ...p, i })).filter((p) => !placed[p.i]);
  const card = (p: { t: string; safe: boolean; i: number }) => {
    const ok = checked && placed[p.i] ? (placed[p.i] === "safe") === p.safe : null;
    return (
      <div key={p.i} draggable onDragStart={() => setDrag(p.i)} onClick={() => setPicked(p.i)}
        className={`cursor-grab rounded-md border bg-card p-2.5 text-sm shadow-sm transition-all active:cursor-grabbing ${picked === p.i ? "ring-2 ring-primary" : ""} ${ok === true ? "border-primary" : ok === false ? "border-destructive bg-destructive/5" : "border-border"}`}>
        <div className="flex items-center gap-2">{ok === true && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}{ok === false && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}{p.t}</div>
      </div>
    );
  };
  const Bin = ({ b, label }: { b: "safe" | "unsafe"; label: string }) => (
    <div onDragOver={(e) => e.preventDefault()} onDrop={() => put(drag, b)} onClick={() => put(picked, b)}
      className={`min-h-[220px] rounded-lg border-2 border-dashed p-3 ${b === "safe" ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}>
      <div className={`mb-2 text-sm font-bold ${b === "safe" ? "text-primary" : "text-destructive"}`}>{label}</div>
      <div className="space-y-2">{PRACTICES.map((p, i) => ({ ...p, i })).filter((p) => placed[p.i] === b).map(card)}</div>
    </div>
  );
  const score = Object.entries(placed).filter(([i, b]) => (b === "safe") === PRACTICES[+i].safe).length;
  return (
    <div>
      <MissionHeader i={4} brief="Meet Meera, a fictional Sales Executive with work email, VPN, CRM, banking and shopping accounts. Build her protection plan: drag each habit to SAFE or UNSAFE." />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 text-sm font-bold text-muted-foreground">Meera's habits</div>
          <div className="space-y-2">{pool.map(card)}{pool.length === 0 && <p className="text-xs text-muted-foreground">All sorted!</p>}</div>
          <p className="mt-2 text-[11px] text-muted-foreground">Tip: drag, or tap a card then tap a column.</p>
        </div>
        <Bin b="safe" label="✓ SAFE" />
        <Bin b="unsafe" label="✗ UNSAFE" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <RevealBtn onClick={() => setChecked(true)}>Check the team's plan</RevealBtn>
        <button onClick={() => { setPlaced({}); setChecked(false); }} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Clear board</button>
        {checked && <span className="chip chip-success">{score} / {PRACTICES.length} correctly placed</span>}
      </div>
      <Notes show={notes} items={["Which of Meera's accounts matter most to protect first? (Email — it resets everything else.)", "Is a browser-saved password ever OK? On your own locked device it's better than reuse.", "Where in your job do teams share logins? What could you use instead?"]} />
    </div>
  );
}

/* ------------------------------- mission 6 -------------------------------- */

const CLUES = [
  { icon: MessageSquare, t: "09:12 — Ticket from Neha (HR)", d: "\"I keep getting approval pop-ups I didn't ask for. I may have tapped one by mistake.\"" },
  { icon: MapPin, t: "09:14 — Sign-in log", d: "Successful login to Neha's mailbox from an unknown device in another country." },
  { icon: Clock, t: "09:20 — Mailbox change", d: "A new rule forwards all emails containing \"salary\" to an outside address." },
  { icon: Search, t: "09:25 — Neha admits", d: "\"I use the same password for my personal email and a food delivery app.\"" },
];
const STEPS = [
  { t: "Identify: account compromise via MFA fatigue + reused password", order: 1 },
  { t: "Deny any pending MFA prompts and sign out all sessions", order: 2 },
  { t: "Reset the password to a new, unique passphrase", order: 3 },
  { t: "Remove the malicious forwarding rule and review MFA devices", order: 4 },
  { t: "Change the reused password on every other account", order: 5 },
  { t: "Report through the IT Security incident channel", order: 6 },
];

function FinalMission({ notes }: { notes: boolean }) {
  const [clues, setClues] = useState(1);
  const [plan, setPlan] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);
  const shuffled = [3, 0, 5, 1, 4, 2];
  return (
    <div>
      <MissionHeader i={5} brief="An employee reports strange activity. Reveal clues one at a time, then teams agree on the response plan — in order." />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Siren className="h-4 w-4 animate-pulse text-destructive" /> Incident feed</div>
          <div className="space-y-2">
            {CLUES.slice(0, clues).map((c, i) => { const I = c.icon; return (
              <div key={i} className="soc-card flex gap-3 p-3 animate-in fade-in slide-in-from-right-4">
                <I className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div><div className="mono text-xs font-semibold">{c.t}</div><p className="text-sm text-muted-foreground">{c.d}</p></div>
              </div>
            ); })}
          </div>
          {clues < CLUES.length && <div className="mt-3"><RevealBtn onClick={() => setClues(clues + 1)}>Reveal next clue</RevealBtn></div>}
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">Team response plan — tap actions in the order you'd do them</div>
          <div className="space-y-2">
            {shuffled.map((si) => { const s = STEPS[si]; const pos = plan.indexOf(si); const ok = reveal && pos + 1 === s.order; return (
              <button key={si} onClick={() => !reveal && setPlan((p) => (p.includes(si) ? p.filter((x) => x !== si) : [...p, si]))}
                className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left text-sm transition-all ${pos >= 0 ? "border-primary bg-primary/5" : "border-border hover:bg-muted"} ${reveal && pos >= 0 && !ok ? "border-destructive" : ""}`}>
                <span className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${pos >= 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{pos >= 0 ? pos + 1 : "–"}</span>
                {s.t}
                {reveal && <span className="ml-auto text-xs text-muted-foreground">#{s.order}</span>}
              </button>
            ); })}
          </div>
          <div className="mt-3 flex gap-2">
            <RevealBtn onClick={() => setReveal(true)}>Submit team plan & reveal</RevealBtn>
            <button onClick={() => { setPlan([]); setReveal(false); }} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">Clear</button>
          </div>
        </div>
      </div>
      {reveal && (
        <div className="mt-5 rounded-lg border-2 border-primary bg-primary/5 p-5 animate-in zoom-in-95">
          <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Recommended handling</div>
          <p className="mt-2 text-sm">Contain first (stop the attacker), then secure (new password, remove rules), then clean up (other reused accounts) — and report early so IT Security can check for wider damage. Neha did the right thing by raising a ticket quickly.</p>
        </div>
      )}
      <Notes show={notes} items={["Which clue changed your mind the most?", "Why does reporting early matter, even if you're embarrassed?", "Best plan wins 5 points — closest order and best reasoning."]} />
    </div>
  );
}

/* --------------------------------- finish --------------------------------- */

function Finish({ teams, done, profileId, onRestart }: { teams: typeof TEAMS_DEFAULT; done: string[]; profileId?: string; onRestart: () => void }) {
  const [pledged, setPledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const winner = [...teams].sort((a, b) => b.points - a.points)[0];
  const pledge = async () => {
    setSaving(true);
    try {
      if (profileId) {
        const { error } = await supabase.from("password_mfa_results").insert({
          user_id: profileId,
          completed_activities: done,
          quiz_answers: { mode: "live-workshop", teams, pledge: true } as any,
          score: done.length,
          total: MISSIONS.length,
        });
        if (error) throw error;
      }
      setPledged(true);
      toast.success("Workshop completion recorded");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save completion — please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="soc-card overflow-hidden text-center">
        <div className="bg-primary p-8 text-primary-foreground">
          <Award className="mx-auto h-14 w-14 animate-in zoom-in duration-700" />
          <h1 className="mt-3 text-3xl font-bold">Mission Accomplished</h1>
          <p className="mt-1 text-sm opacity-90">{done.length} of {MISSIONS.length} missions completed{winner.points > 0 ? ` · Top team: ${winner.name} (${winner.points} pts)` : ""}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {TAKEAWAYS.map((t, i) => (
          <div key={t} className="soc-card p-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}>
            <div className="mono grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{i + 1}</div>
            <p className="mt-2 text-sm font-semibold">{t}</p>
          </div>
        ))}
      </div>
      <div className="soc-card p-6">
        <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> My security commitment</div>
        <p className="mt-2 text-sm leading-relaxed">I commit to using strong, unique passwords, never sharing passwords or OTPs with anyone, keeping MFA switched on, denying any MFA request I didn't start, and reporting suspicious account activity to IT Security straight away.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {pledged ? (
            <span className="chip chip-success inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Commitment signed</span>
          ) : (
            <button disabled={saving} onClick={pledge} className="rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving…" : "I commit — complete workshop"}
            </button>
          )}
          <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm hover:bg-muted"><RotateCcw className="h-4 w-4" /> Restart workshop</button>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm hover:bg-muted">Back to training <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
