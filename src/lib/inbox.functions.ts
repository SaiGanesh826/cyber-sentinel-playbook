import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============================================================
// TYPES
// ============================================================

export interface ClientLink {
  text: string;
  href: string;
  suspicious?: boolean;
  behavior?: string; // 'fake_m365' | 'fake_hr' | 'fake_vpn' | 'fake_payment' | 'fake_document' | 'internal_form' | 'survey' | 'meeting_invite' | 'internal_action' | 'external'
}
export interface ClientAttachment {
  name: string;
  size: string;
  suspicious?: boolean;
}
export interface ClientEmail {
  id: string;
  sender_name: string;
  sender_email: string;
  to: string;
  subject: string;
  received_at: string;
  body_html: string;
  attachments: ClientAttachment[];
  links: ClientLink[];
}

// Helpers ----------------------------------------------------

function syntheticReceivedAt(position: number): string {
  // Stable, plausible-looking timestamps spaced through "today"
  const minutes = (9 * 60 + position * 17) % (10 * 60); // 9:00 → 19:00
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `Today, ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function redactScenarioRow(row: any, position: number): ClientEmail {
  const links = (row.links ?? []).map((l: any) => ({
    text: l.text,
    href: l.href,
    suspicious: l.suspicious,
    behavior: l.behavior,
  }));
  const attachments = (row.attachments ?? []).map((a: any) => ({
    name: a.name,
    size: a.size,
    suspicious: a.suspicious,
  }));
  return {
    id: row.id,
    sender_name: row.sender_name ?? "Unknown sender",
    sender_email: row.sender_email ?? "unknown@example.com",
    to: "you@nipun.com",
    subject: row.subject ?? "(no subject)",
    received_at: syntheticReceivedAt(position),
    body_html: row.body_html ?? "",
    attachments,
    links,
  };
}

// ============================================================
// RANDOMIZED ASSIGNMENT — every attempt gets a different mix
// ============================================================

const TARGET_TOTAL = 10;
const TARGET_LEGIT = 5;
const TARGET_SUSPICIOUS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T extends { id: string }>(pool: T[], n: number, seen: Set<string>): T[] {
  if (n <= 0 || pool.length === 0) return [];
  const unseen = shuffle(pool.filter((s) => !seen.has(s.id)));
  const repeat = shuffle(pool.filter((s) => seen.has(s.id)));
  return unseen.concat(repeat).slice(0, n);
}

interface ScenarioRow {
  id: string;
  classification: string;
  difficulty: string;
  is_mfa: boolean;
}

function selectAssignment(
  active: ScenarioRow[],
  seen: Set<string>,
): ScenarioRow[] {
  const legit = active.filter((s) => s.classification === "legitimate");
  const susp = active.filter((s) => s.classification === "suspicious");
  const mfa = active.filter((s) => s.is_mfa);

  const picked: ScenarioRow[] = [];
  const pickedIds = new Set<string>();
  const push = (s: ScenarioRow) => {
    if (!pickedIds.has(s.id)) {
      picked.push(s);
      pickedIds.add(s.id);
    }
  };

  // 1. Guarantee at least one MFA scenario (prefer unseen)
  const mfaPick = pickN(mfa, 1, seen)[0];
  if (mfaPick) push(mfaPick);

  // 2. Fill legitimate quota
  const legitNeed =
    TARGET_LEGIT - picked.filter((s) => s.classification === "legitimate").length;
  const legitPool = legit.filter((s) => !pickedIds.has(s.id));
  pickN(legitPool, legitNeed, seen).forEach(push);

  // 3. Fill suspicious quota
  const suspNeed =
    TARGET_SUSPICIOUS -
    picked.filter((s) => s.classification === "suspicious").length;
  const suspPool = susp.filter((s) => !pickedIds.has(s.id));
  pickN(suspPool, suspNeed, seen).forEach(push);

  // 4. Top-up if pools were short
  if (picked.length < TARGET_TOTAL) {
    const rest = active.filter((s) => !pickedIds.has(s.id));
    pickN(rest, TARGET_TOTAL - picked.length, seen).forEach(push);
  }

  return shuffle(picked).slice(0, TARGET_TOTAL);
}

// ============================================================
// START ASSESSMENT
// ============================================================

export const startInboxSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (!profile || profile.status !== "active")
      throw new Error("Account is not active");

    // Resume in-progress session if any
    const { data: existing } = await supabaseAdmin
      .from("game_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) return { session_id: existing.id, resumed: true };

    const { data: mod } = await supabaseAdmin
      .from("training_modules")
      .select("id")
      .eq("slug", "phishing-awareness")
      .maybeSingle();
    if (!mod?.id)
      throw new Error("Training module not configured. Ask an administrator.");

    // Load active scenarios
    const { data: scenarios } = await supabaseAdmin
      .from("phishing_scenarios")
      .select("id, classification, difficulty, is_mfa")
      .eq("module_id", mod.id)
      .eq("is_enabled", true)
      .eq("status", "active");
    if (!scenarios || scenarios.length === 0)
      throw new Error("No scenarios available. Ask an administrator to seed scenarios.");

    // Load previously-seen scenario IDs for this user (across all attempts)
    const { data: priorAttempts } = await supabaseAdmin
      .from("assessment_attempts")
      .select("scenario_ids, attempt_number")
      .eq("user_id", userId)
      .order("attempt_number", { ascending: false });
    const seen = new Set<string>();
    (priorAttempts ?? []).forEach((a) =>
      (a.scenario_ids ?? []).forEach((id: string) => seen.add(id)),
    );
    const nextAttemptNumber =
      ((priorAttempts ?? [])[0]?.attempt_number ?? 0) + 1;

    const assigned = selectAssignment(scenarios as ScenarioRow[], seen);
    if (assigned.length === 0) throw new Error("Could not assemble an assessment.");

    // Use the first assigned scenario as the session's anchor scenario_id
    // (game_sessions.scenario_id is NOT NULL legacy column).
    const { data: session, error } = await supabaseAdmin
      .from("game_sessions")
      .insert({
        user_id: userId,
        scenario_id: assigned[0].id,
        module_id: mod.id,
        status: "in_progress",
      })
      .select()
      .single();
    if (error || !session) throw error || new Error("Could not start session");

    // Insert session_scenarios rows
    const rows = assigned.map((s, idx) => ({
      session_id: session.id,
      scenario_id: s.id,
      position: idx,
    }));
    const { error: ssErr } = await supabaseAdmin
      .from("session_scenarios")
      .insert(rows);
    if (ssErr) throw ssErr;

    // Insert assessment_attempts row
    await supabaseAdmin.from("assessment_attempts").insert({
      user_id: userId,
      module_id: mod.id,
      session_id: session.id,
      attempt_number: nextAttemptNumber,
      scenario_ids: assigned.map((s) => s.id),
    });

    return { session_id: session.id, resumed: false, attempt_number: nextAttemptNumber };
  });

// ============================================================
// GET ASSIGNED EMAILS for a session (redacted — no answers)
// ============================================================

export const getSessionEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ session_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: session } = await supabaseAdmin
      .from("game_sessions")
      .select("id, user_id")
      .eq("id", data.session_id)
      .single();
    if (!session || session.user_id !== userId) throw new Error("Forbidden");

    const { data: rows } = await supabaseAdmin
      .from("session_scenarios")
      .select(
        "position, phishing_scenarios(id, sender_name, sender_email, subject, body_html, attachments, links)",
      )
      .eq("session_id", data.session_id)
      .order("position");

    const emails: ClientEmail[] = (rows ?? []).map((r: any) =>
      redactScenarioRow(r.phishing_scenarios, r.position),
    );
    return { emails };
  });

// ============================================================
// LOG ACTION
// ============================================================

export const logInboxAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        session_id: z.string().uuid(),
        action_type: z.string().max(60),
        target: z.string().max(500).optional(),
        meta: z.record(z.any()).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: s } = await supabase
      .from("game_sessions")
      .select("id, user_id, status")
      .eq("id", data.session_id)
      .single();
    if (!s || s.user_id !== userId || s.status !== "in_progress") return { ok: false };
    await supabase.from("session_actions").insert({
      session_id: data.session_id,
      action_type: data.action_type,
      target: data.target,
      meta: data.meta,
    });
    return { ok: true };
  });

// ============================================================
// SUBMIT — scores against scenarios assigned to this session
// ============================================================

const reportSchema = z.object({
  email_id: z.string(),
  classification: z.enum(["phishing", "suspicious", "spam", "legitimate"]),
  red_flags: z.array(z.string()).max(40).default([]),
  suspicious_links: z.array(z.string()).max(20).default([]),
  recommended_action: z.enum([
    "report_to_security",
    "delete",
    "ignore",
    "reply",
    "forward_colleague",
  ]),
  summary: z.string().max(2000),
  risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  incident_type: z.string().max(80).optional(),
});

const submitInputSchema = z.object({
  session_id: z.string().uuid(),
  reports: z.array(reportSchema).max(40),
  opened_email_ids: z.array(z.string()).max(60).default([]),
  clicked_link_urls: z.array(z.string()).max(120).default([]),
  opened_attachment_names: z.array(z.string()).max(60).default([]),
  mfa_completed: z.boolean().default(false),
  auto_submitted: z.boolean().default(false),
});

export const submitInboxTraining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => submitInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: session } = await supabaseAdmin
      .from("game_sessions")
      .select("id, user_id, started_at, status")
      .eq("id", data.session_id)
      .single();
    if (!session || session.user_id !== userId) throw new Error("Forbidden");
    if (session.status !== "in_progress")
      throw new Error("Session already submitted");

    // Load the scenarios actually assigned to this session (with full answers)
    const { data: assignedRows } = await supabaseAdmin
      .from("session_scenarios")
      .select(
        "position, phishing_scenarios(id, classification, sender_name, sender_email, subject, attachments, links, red_flags, explanation, correct_action, is_mfa)",
      )
      .eq("session_id", data.session_id)
      .order("position");
    const emails = (assignedRows ?? [])
      .map((r: any) => r.phishing_scenarios)
      .filter(Boolean);

    if (emails.length === 0) throw new Error("Session has no scenarios.");

    const reportedById = new Map(data.reports.map((r) => [r.email_id, r]));
    const reportedSuspicious = (cls: string, classification: string) => {
      if (cls === "legitimate") return false;
      return ["phishing", "suspicious", "spam"].includes(classification);
    };

    let totalPoints = 0;
    const maxPoints = emails.length * 10;
    const correctReported: any[] = [];
    const incorrectReported: any[] = [];
    const missedEmails: any[] = [];
    const correctlyIgnored: any[] = [];
    const reportReviews: any[] = [];

    for (const e of emails) {
      const report = reportedById.get(e.id);
      const isBad = e.classification !== "legitimate";
      const expectedFlags = Array.isArray(e.red_flags) ? e.red_flags : [];
      const sender = `${e.sender_name} <${e.sender_email}>`;

      if (isBad && report && reportedSuspicious(e.classification, report.classification)) {
        totalPoints += 8;
        const expectedIds = new Set(expectedFlags.map((f: any) => f.id));
        const flagged = report.red_flags.filter((f) => expectedIds.has(f));
        if (flagged.length > 0) totalPoints += 2;
        correctReported.push({
          email_id: e.id,
          subject: e.subject,
          sender,
          verdict: e.classification,
          rationale: e.explanation || "Suspicious indicators present in this email.",
          red_flags: expectedFlags,
        });
      } else if (!isBad && report && reportedSuspicious(e.classification, report.classification)) {
        totalPoints -= 3;
        incorrectReported.push({
          email_id: e.id,
          subject: e.subject,
          sender,
          rationale: e.explanation || "This email was legitimate.",
        });
      } else if (isBad && !report) {
        totalPoints -= 5;
        missedEmails.push({
          email_id: e.id,
          subject: e.subject,
          sender,
          verdict: e.classification,
          rationale: e.explanation || "",
          missed_indicators: expectedFlags,
        });
      } else if (!isBad && !report) {
        totalPoints += 5;
        correctlyIgnored.push({ email_id: e.id, subject: e.subject, sender });
      }

      if (report) {
        const expectedIds = new Set(expectedFlags.map((f: any) => f.id));
        const correctFlags = report.red_flags.filter((f) => expectedIds.has(f));
        const missingFlags = [...expectedIds].filter(
          (id: any) => !report.red_flags.includes(id),
        );
        const incorrectFlags = report.red_flags.filter((f) => !expectedIds.has(f));
        const suggestions: string[] = [];
        if (report.summary.trim().length < 30)
          suggestions.push(
            "Make your summary more descriptive — name the sender, the suspicious indicator, and your recommendation.",
          );
        if (isBad && report.recommended_action !== "report_to_security")
          suggestions.push(
            "For phishing/suspicious emails, the recommended action is always Report to Security.",
          );
        if (missingFlags.length > 0)
          suggestions.push("Review the missed indicators below — these are the strongest tells.");
        reportReviews.push({
          email_id: e.id,
          subject: e.subject,
          classification_submitted: report.classification,
          classification_expected: isBad ? e.classification : "legitimate",
          recommended_action: report.recommended_action,
          summary: report.summary,
          correct_findings: correctFlags
            .map((id) => expectedFlags.find((f: any) => f.id === id))
            .filter(Boolean),
          missing_findings: expectedFlags.filter((f: any) => missingFlags.includes(f.id)),
          incorrect_findings: incorrectFlags,
          suggestions,
        });
      }
    }

    // Behavioral penalties
    const clickedSuspicious = data.clicked_link_urls.filter((u) =>
      emails.some((e: any) =>
        (e.links ?? []).some((l: any) => l.suspicious && l.href === u),
      ),
    );
    const openedMalicious = data.opened_attachment_names.filter((n) =>
      emails.some((e: any) =>
        (e.attachments ?? []).some((a: any) => a.suspicious && a.name === n),
      ),
    );
    totalPoints -= clickedSuspicious.length * 50;
    totalPoints -= openedMalicious.length * 50;
    if (data.mfa_completed) totalPoints += 10;

    const rawMax = maxPoints;
    const rawMin = -emails.length * 5;
    const normalized = Math.round(((totalPoints - rawMin) / (rawMax - rawMin)) * 100);
    const total = Math.max(0, Math.min(100, normalized));

    const totalBad = emails.filter((e: any) => e.classification !== "legitimate").length;
    const totalGood = emails.length - totalBad;
    const accuracy = Number(
      (
        ((correctReported.length + correctlyIgnored.length) / emails.length) *
        100
      ).toFixed(2),
    );

    const submitted_at = new Date();
    const time_taken_seconds = Math.max(
      1,
      Math.round(
        (submitted_at.getTime() - new Date(session.started_at).getTime()) / 1000,
      ),
    );

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    if (correctReported.length === totalBad && totalBad > 0)
      strengths.push(
        `Reported every phishing / suspicious email (${totalBad}/${totalBad}).`,
      );
    if (correctlyIgnored.length === totalGood && totalGood > 0)
      strengths.push(
        `Did not raise any false alarms on legitimate mail (${totalGood}/${totalGood}).`,
      );
    if (clickedSuspicious.length === 0) strengths.push("Did not click any malicious link.");
    if (openedMalicious.length === 0) strengths.push("Did not open any malicious attachment.");
    if (data.mfa_completed)
      strengths.push("Enabled Multi-Factor Authentication — strong security hygiene.");
    if (data.auto_submitted)
      weaknesses.push(
        "Training was auto-submitted when the timer expired — try to pace yourself within the hour.",
      );
    if (!data.mfa_completed)
      weaknesses.push("Did not enable Multi-Factor Authentication when IT requested it.");
    if (missedEmails.length > 0)
      weaknesses.push(
        `Missed ${missedEmails.length} phishing / suspicious email${missedEmails.length === 1 ? "" : "s"} — review the missed indicators.`,
      );
    if (incorrectReported.length > 0)
      weaknesses.push(
        `Flagged ${incorrectReported.length} legitimate email${incorrectReported.length === 1 ? "" : "s"} as malicious — over-reporting wastes SOC time.`,
      );
    if (clickedSuspicious.length > 0)
      weaknesses.push(
        `Clicked ${clickedSuspicious.length} suspicious link${clickedSuspicious.length === 1 ? "" : "s"} — hover instead of clicking.`,
      );
    if (openedMalicious.length > 0)
      weaknesses.push(
        `Opened ${openedMalicious.length} malicious attachment${openedMalicious.length === 1 ? "" : "s"} — never open .htm/.exe from unknown senders.`,
      );

    const bestPractices = [
      "Always verify the sender's full email address — domain look-alikes are the #1 phishing tell.",
      "Hover over a link to preview the URL before clicking. Mismatched or shortened URLs are red flags.",
      "Never act on email-based requests for credentials, wire transfers, or password resets without out-of-band confirmation.",
      "Treat urgency, secrecy, and threats of account loss as social-engineering signals.",
      "Report suspicious mail using the Report to Security button — do not delete it silently.",
    ];

    const recommendations: string[] = [];
    if (missedEmails.length > 0)
      recommendations.push(
        "Spend extra time on sender-domain inspection — most missed emails had look-alike domains.",
      );
    if (incorrectReported.length > 0)
      recommendations.push(
        "Before reporting, ask: does the email actually ask me to do something risky?",
      );
    if (clickedSuspicious.length + openedMalicious.length > 0)
      recommendations.push(
        "Treat the inbox as a sandbox even in real life — do not click to 'check' a link.",
      );
    if (total >= 85)
      recommendations.push(
        "Excellent — consider mentoring teammates on your investigation process.",
      );

    const feedback = {
      kind: "inbox" as const,
      overall: {
        legit_total: totalGood,
        bad_total: totalBad,
        correct_reported_count: correctReported.length,
        correctly_ignored_count: correctlyIgnored.length,
        incorrect_reported_count: incorrectReported.length,
        missed_count: missedEmails.length,
        clicked_suspicious_links: clickedSuspicious,
        opened_malicious_attachments: openedMalicious,
        mfa_completed: data.mfa_completed,
        auto_submitted: data.auto_submitted,
      },
      correct_reported: correctReported,
      incorrect_reported: incorrectReported,
      missed: missedEmails,
      correctly_ignored: correctlyIgnored,
      report_reviews: reportReviews,
      learning_summary: { strengths, weaknesses, best_practices: bestPractices, recommendations },
    };

    const breakdown = {
      reported_phishing: { score: correctReported.length, max: totalBad },
      ignored_legitimate: { score: correctlyIgnored.length, max: totalGood },
      false_positives: { score: incorrectReported.length, max: totalGood },
      missed_phishing: { score: missedEmails.length, max: totalBad },
      clicked_links: { score: clickedSuspicious.length, max: 0 },
      opened_attachments: { score: openedMalicious.length, max: 0 },
    };

    await supabaseAdmin
      .from("game_sessions")
      .update({ submitted_at: submitted_at.toISOString(), status: "submitted" })
      .eq("id", session.id);

    // Update assessment_attempts row for this session
    await supabaseAdmin
      .from("assessment_attempts")
      .update({
        submitted_at: submitted_at.toISOString(),
        score: total,
        time_taken_seconds,
      })
      .eq("session_id", session.id);

    // Persist per-scenario response on session_scenarios
    for (const r of data.reports) {
      await supabaseAdmin
        .from("session_scenarios")
        .update({ response: r })
        .eq("session_id", session.id)
        .eq("scenario_id", r.email_id);
    }

    if (data.reports.length > 0) {
      const allRedFlags = Array.from(new Set(data.reports.flatMap((r) => r.red_flags)));
      const allUrls = Array.from(new Set(data.reports.flatMap((r) => r.suspicious_links)));
      const order: any = { phishing: 4, suspicious: 3, spam: 2, legitimate: 1 };
      const worst = data.reports.reduce(
        (acc, r) => (order[r.classification] > order[acc] ? r.classification : acc),
        "legitimate" as string,
      );
      await supabaseAdmin.from("incident_reports").insert({
        session_id: session.id,
        classification: worst === "suspicious" ? "phishing" : worst,
        red_flags: allRedFlags,
        suspicious_urls: allUrls,
        recommended_action: "report_to_soc",
        summary: `${data.reports.length} email(s) reported`,
        notes: JSON.stringify({ reports: data.reports }),
      });
    }

    const { data: score, error: scoreErr } = await supabaseAdmin
      .from("scores")
      .insert({
        session_id: session.id,
        user_id: userId,
        total,
        accuracy,
        time_taken_seconds,
        breakdown,
        feedback,
      })
      .select()
      .single();
    if (scoreErr) throw scoreErr;

    return { session_id: session.id, score_id: score.id, total };
  });

// ============================================================
// ADMIN MANAGEMENT — super_admin only
// ============================================================
async function requireSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  if (!data) throw new Error("Forbidden: super admin only");
}

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        email: z.string().email(),
        full_name: z.string().min(1).max(120),
        password: z.string().min(8).max(128),
        department: z.string().max(80).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, department: data.department },
    });
    if (error || !created.user) throw new Error(error?.message || "Create failed");
    await supabaseAdmin.from("profiles").update({ status: "active" }).eq("id", created.user.id);
    await supabaseAdmin
      .from("user_roles")
      .upsert([{ user_id: created.user.id, role: "admin" }], { onConflict: "user_id,role" });
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", created.user.id)
      .eq("role", "employee");
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "create_admin",
      target_type: "user",
      target_id: created.user.id,
    });
    return { ok: true, user_id: created.user.id };
  });

export const promoteToSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        [
          { user_id: data.user_id, role: "super_admin" },
          { user_id: data.user_id, role: "admin" },
        ],
        { onConflict: "user_id,role" },
      );
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "promote_super_admin",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true };
  });

export const demoteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot demote yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .in("role", ["super_admin", "admin", "manager"]);
    await supabaseAdmin
      .from("user_roles")
      .upsert([{ user_id: data.user_id, role: "employee" }], { onConflict: "user_id,role" });
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "demote_admin",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "delete_admin",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true };
  });

export const setAdminRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        user_id: z.string().uuid(),
        roles: z.array(z.enum(["admin", "manager"])),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .in("role", ["admin", "manager", "employee"]);
    const rows = data.roles.map((role) => ({ user_id: data.user_id, role }));
    if (rows.length === 0) {
      rows.push({ user_id: data.user_id, role: "employee" as any });
    }
    await supabaseAdmin
      .from("user_roles")
      .upsert(rows, { onConflict: "user_id,role" });
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "set_admin_roles",
      target_type: "user",
      target_id: data.user_id,
      meta: { roles: data.roles },
    });
    return { ok: true };
  });
