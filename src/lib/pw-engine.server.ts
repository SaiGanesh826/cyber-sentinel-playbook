import { PASSWORDS, MFA, HABITS, INCIDENTS, GENERIC_STAGES } from "./pw-bank.server";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = <T,>(arr: T[], n: number) => shuffle(arr).slice(0, n);

export const MISSIONS = [
  { key: "m1", title: "Password Detective" },
  { key: "m2", title: "MFA Panic Room" },
  { key: "m3", title: "Secure Your Digital Life" },
  { key: "m4", title: "Final Mission: Save the Employee Account" },
] as const;

/** Builds a randomized snapshot: employee-facing content + full answer key. */
export function buildAttempt() {
  const unsafe = PASSWORDS.filter((p) => p.unsafe);
  const safe = PASSWORDS.filter((p) => !p.unsafe);
  const m1 = shuffle([...pick(unsafe, 4), ...pick(safe, 2)]);
  const m2 = shuffle([...pick(MFA.filter((m) => m.correct === "approve"), 1), ...pick(MFA.filter((m) => m.correct === "deny"), 4)]);
  const m3 = shuffle([...pick(HABITS.filter((h) => h.safe), 5), ...pick(HABITS.filter((h) => !h.safe), 5)]);
  const inc = pick(INCIDENTS, 1)[0];
  const stages = [
    { key: "identify", prompt: "What is happening here?", update: inc.clues[0], options: shuffle(inc.identify) },
    ...GENERIC_STAGES.map((s, i) => ({
      ...s,
      update: [inc.clues[1], inc.clues[2], "IT Security confirms the attacker reused the same stolen password elsewhere.", "Containment is in progress. Security asks for your report."][i],
      options: shuffle(s.options),
    })),
  ];

  const content = {
    m1: m1.map((p) => ({ id: p.id, text: p.text })),
    m2: m2.map(({ correct, why, tip, tag, ...rest }) => rest),
    m3: m3.map((h) => ({ id: h.id, text: h.text })),
    m4: {
      id: inc.id, title: inc.title, situation: inc.situation, notification: inc.notification,
      stages: stages.map((s) => ({ key: s.key, prompt: s.prompt, update: s.update, options: s.options.map((o) => ({ id: o.id, text: o.text })) })),
    },
  };
  const answer_key = { m1, m2, m3, m4: { ...inc, stages } };
  const set_hash = [
    m1.map((x) => x.id).join("."), m2.map((x) => x.id).join("."), m3.map((x) => x.id).join("."),
    inc.id + ":" + stages.map((s) => s.options.map((o) => o.id).join("")).join("|"),
  ].join("/");
  return { content, answer_key, set_hash };
}

type Row = { item: string; selection: string; correct: string; result: "correct" | "incorrect" | "unanswered"; points: number; explanation: string; tip?: string; tag?: string };

export function scoreAttempt(key: any, responses: any) {
  const r = responses ?? {};
  const missions: any[] = [];

  // M1
  {
    const flags: string[] = r.m1?.flags ?? [];
    const touched = !!r.m1?.done || flags.length > 0;
    const rows: Row[] = key.m1.map((p: any) => {
      const flagged = flags.includes(p.id);
      if (!touched) return { item: p.text, selection: "—", correct: p.unsafe ? "Unsafe" : "Safe", result: "unanswered", points: 0, explanation: p.why, tip: p.tip, tag: p.tag };
      const ok = flagged === p.unsafe;
      const pts = flagged && p.unsafe ? 2 : flagged && !p.unsafe ? -1 : 0;
      return { item: p.text, selection: flagged ? "Flagged unsafe" : "Not flagged", correct: p.unsafe ? "Unsafe" : "Safe", result: ok ? "correct" : "incorrect", points: pts, explanation: p.why, tip: p.tip, tag: p.tag };
    });
    missions.push(finish("m1", "Password Detective", rows, key.m1.filter((p: any) => p.unsafe).length * 2));
  }
  // M2
  {
    const rows: Row[] = key.m2.map((m: any) => {
      const sel = r.m2?.[m.id];
      if (!sel) return { item: `${m.title} — ${m.context}`, selection: "—", correct: cap(m.correct), result: "unanswered", points: 0, explanation: m.why, tip: m.tip, tag: m.tag };
      const ok = sel === m.correct;
      return { item: `${m.title} — ${m.context}`, selection: cap(sel), correct: cap(m.correct), result: ok ? "correct" : "incorrect", points: ok ? 2 : 0, explanation: m.why, tip: m.tip, tag: m.tag };
    });
    missions.push(finish("m2", "MFA Panic Room", rows, key.m2.length * 2));
  }
  // M3
  {
    const rows: Row[] = key.m3.map((h: any) => {
      const sel = r.m3?.[h.id];
      const correct = h.safe ? "safe" : "unsafe";
      if (!sel) return { item: h.text, selection: "—", correct: cap(correct), result: "unanswered", points: 0, explanation: h.why, tag: h.tag };
      const ok = sel === correct;
      return { item: h.text, selection: cap(sel), correct: cap(correct), result: ok ? "correct" : "incorrect", points: ok ? 2 : -1, explanation: h.why, tag: h.tag };
    });
    missions.push(finish("m3", "Secure Your Digital Life", rows, key.m3.length * 2));
  }
  // M4
  {
    const rows: Row[] = key.m4.stages.map((s: any) => {
      const best = s.options.reduce((a: any, b: any) => (b.points > a.points ? b : a));
      const selId = r.m4?.[s.key];
      const sel = s.options.find((o: any) => o.id === selId);
      if (!sel) return { item: `${s.prompt} (${s.update})`, selection: "—", correct: best.text, result: "unanswered", points: 0, explanation: best.why, tag: key.m4.tag };
      return { item: `${s.prompt} (${s.update})`, selection: sel.text, correct: best.text, result: sel.points === best.points ? "correct" : "incorrect", points: sel.points, explanation: sel.points === best.points ? best.why : `${sel.why} Recommended: ${best.why}`, tag: key.m4.tag };
    });
    const m = finish("m4", "Final Mission: Save the Employee Account", rows, key.m4.stages.length * 4);
    m.incident = { title: key.m4.title, situation: key.m4.situation, notification: key.m4.notification, clues: key.m4.clues };
    missions.push(m);
  }

  const score = missions.reduce((a, m) => a + m.score, 0);
  const max = missions.reduce((a, m) => a + m.max, 0);
  const percentage = max ? Math.round((score / max) * 100) : 0;
  const level = percentage >= 90 ? "Excellent Security Awareness" : percentage >= 75 ? "Good Security Awareness" : percentage >= 50 ? "Needs Improvement" : "Additional Awareness Required";
  return {
    missions, score, max, percentage, level,
    correct: missions.reduce((a, m) => a + m.correct, 0),
    incorrect: missions.reduce((a, m) => a + m.incorrect, 0),
    unanswered: missions.reduce((a, m) => a + m.unanswered, 0),
    feedback: buildFeedback(missions),
  };
}

function finish(key: string, title: string, rows: Row[], max: number): any {
  const raw = rows.reduce((a, x) => a + x.points, 0);
  const correct = rows.filter((x) => x.result === "correct").length;
  const incorrect = rows.filter((x) => x.result === "incorrect").length;
  const unanswered = rows.filter((x) => x.result === "unanswered").length;
  return {
    key, title, rows, max, score: Math.max(0, Math.min(max, raw)), correct, incorrect, unanswered,
    status: unanswered === rows.length ? "Not attempted" : unanswered > 0 ? "Incomplete" : "Completed",
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TAG_ADVICE: Record<string, string> = {
  common: "avoid common and default passwords",
  keyboard: "avoid keyboard patterns",
  personal: "avoid names, birthdays and other personal details in passwords",
  company: "never base passwords on the company name",
  substitution: "remember that symbol swaps like @ for a don't make a word strong",
  short: "use long passwords (14+ characters)",
  reuse: "use a different password for every account",
  passphrase: "trust long random passphrases — they are strong",
  generated: "trust password-manager generated passwords",
  unexpected: "deny MFA requests you didn't start",
  fatigue: "never approve repeated MFA prompts just to stop them",
  device: "watch for unknown devices and secure shared computers",
  location: "deny sign-ins from places you aren't",
  sharing: "never share passwords, OTPs or approvals with anyone — including 'IT'",
  reset: "treat unrequested password resets as an attack",
  public: "avoid logging in on public computers",
  hours: "be suspicious of prompts at odd hours",
  legit: "approve requests you genuinely started — MFA should still be usable",
  storage: "store credentials only in an approved password manager",
  mfa: "keep MFA on and deny unexpected approvals",
  report: "report suspicious login activity immediately",
  phishing: "only sign in through the official company login page",
  email: "respond fast to signs of mailbox takeover",
  login: "act quickly on repeated or failed login alerts",
  recovery: "protect account recovery details and codes",
  access: "sign out of shared devices and report unusual access",
};

function buildFeedback(missions: any[]): string[] {
  const out: string[] = [];
  const strong = missions.filter((m) => m.max && m.score / m.max >= 0.8).map((m) => m.title);
  const weak = missions.filter((m) => m.max && m.score / m.max < 0.6).map((m) => m.title);
  if (strong.length) out.push(`You performed well in ${strong.join(", ")}.`);
  if (weak.length) out.push(`Focus on improving ${weak.join(", ")}.`);
  const tags = new Map<string, number>();
  for (const m of missions) for (const r of m.rows) if (r.result !== "correct" && r.tag) tags.set(r.tag, (tags.get(r.tag) ?? 0) + 1);
  const top = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  for (const [t] of top) if (TAG_ADVICE[t]) out.push(`Pay more attention: ${TAG_ADVICE[t]}.`);
  const un = missions.reduce((a, m) => a + m.unanswered, 0);
  if (un) out.push(`${un} decision(s) were left unanswered — pace yourself to finish all four missions within 30 minutes.`);
  if (!out.length) out.push("Solid, consistent security decisions across all missions.");
  return out;
}
