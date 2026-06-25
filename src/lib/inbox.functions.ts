import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { INBOX_EMAILS, type EmailVerdict } from "./inbox-data";

// ============================================================
// Start an inbox training session
// ============================================================
export const startInboxSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (!profile || profile.status !== "active")
      throw new Error("Account is not active");

    // pick the phishing-inbox module (or any enabled phishing module)
    const { data: mod } = await supabaseAdmin
      .from("training_modules")
      .select("id")
      .eq("is_enabled", true)
      .eq("is_available", true)
      .limit(1)
      .maybeSingle();

    const { data: scenario } = await supabaseAdmin
      .from("phishing_scenarios")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (!mod?.id || !scenario?.id)
      throw new Error("Training module not configured. Ask an administrator.");

    const { data: session, error } = await supabaseAdmin
      .from("game_sessions")
      .insert({
        user_id: userId,
        scenario_id: scenario.id,
        module_id: mod.id,
        status: "in_progress",
      })
      .select()
      .single();
    if (error) throw error;
    return { session_id: session.id };
  });


// ============================================================
// Log a behavioral action (open email, click link, open attachment, etc.)
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
// Submit the entire training session
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
  reports: z.array(reportSchema).max(20),
  opened_email_ids: z.array(z.string()).max(40).default([]),
  clicked_link_urls: z.array(z.string()).max(80).default([]),
  opened_attachment_names: z.array(z.string()).max(40).default([]),
});

export const submitInboxTraining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => submitInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: session } = await supabaseAdmin
      .from("game_sessions")
      .select("id, user_id, started_at, status")
      .eq("id", data.session_id)
      .single();
    if (!session || session.user_id !== userId) throw new Error("Forbidden");
    if (session.status !== "in_progress") throw new Error("Session already submitted");

    const reportedById = new Map(data.reports.map((r) => [r.email_id, r]));
    const reportedSuspicious = (verdict: EmailVerdict, classification: string) => {
      if (verdict === "legitimate") return false;
      return ["phishing", "suspicious", "spam"].includes(classification);
    };

    let totalPoints = 0;
    const maxPoints = INBOX_EMAILS.length * 10; // 10 pts per email max
    const correctReported: any[] = [];
    const incorrectReported: any[] = [];
    const missedEmails: any[] = [];
    const correctlyIgnored: any[] = [];
    const reportReviews: any[] = [];

    for (const e of INBOX_EMAILS) {
      const report = reportedById.get(e.id);
      const isBad = e.verdict !== "legitimate";

      // ---- per-email correctness ----
      if (isBad && report && reportedSuspicious(e.verdict, report.classification)) {
        totalPoints += 8;
        // Bonus for identifying at least one expected red flag
        const expectedIds = new Set((e.expected_red_flags ?? []).map((f) => f.id));
        const flagged = report.red_flags.filter((f) => expectedIds.has(f));
        if (flagged.length > 0) totalPoints += 2;
        correctReported.push({
          email_id: e.id,
          subject: e.subject,
          sender: `${e.sender_name} <${e.sender_email}>`,
          verdict: e.verdict,
          rationale: e.rationale,
          red_flags: e.expected_red_flags ?? [],
        });
      } else if (!isBad && report && reportedSuspicious(e.verdict, report.classification)) {
        totalPoints -= 3; // minor penalty for false positive
        incorrectReported.push({
          email_id: e.id,
          subject: e.subject,
          sender: `${e.sender_name} <${e.sender_email}>`,
          rationale: e.rationale,
        });
      } else if (isBad && !report) {
        totalPoints -= 5; // missed a phishing/suspicious email
        missedEmails.push({
          email_id: e.id,
          subject: e.subject,
          sender: `${e.sender_name} <${e.sender_email}>`,
          verdict: e.verdict,
          rationale: e.rationale,
          missed_indicators: e.expected_red_flags ?? [],
        });
      } else if (!isBad && !report) {
        totalPoints += 5; // correctly ignored
        correctlyIgnored.push({
          email_id: e.id,
          subject: e.subject,
          sender: `${e.sender_name} <${e.sender_email}>`,
        });
      }

      // ---- incident-report quality review ----
      if (report) {
        const expectedIds = new Set((e.expected_red_flags ?? []).map((f) => f.id));
        const correctFlags = report.red_flags.filter((f) => expectedIds.has(f));
        const missingFlags = [...expectedIds].filter((id) => !report.red_flags.includes(id));
        const incorrectFlags = report.red_flags.filter((f) => !expectedIds.has(f));
        const suggestions: string[] = [];
        if (report.summary.trim().length < 30)
          suggestions.push("Make your summary more descriptive — name the sender, the suspicious indicator, and your recommendation.");
        if (isBad && report.recommended_action !== "report_to_security")
          suggestions.push("For phishing/suspicious emails, the recommended action is always Report to Security.");
        if (missingFlags.length > 0)
          suggestions.push("Review the missed indicators below — these are the strongest tells.");
        reportReviews.push({
          email_id: e.id,
          subject: e.subject,
          classification_submitted: report.classification,
          classification_expected: isBad ? e.verdict : "legitimate",
          recommended_action: report.recommended_action,
          summary: report.summary,
          correct_findings: correctFlags.map(
            (id) => (e.expected_red_flags ?? []).find((f) => f.id === id),
          ).filter(Boolean),
          missing_findings: (e.expected_red_flags ?? []).filter((f) => missingFlags.includes(f.id)),
          incorrect_findings: incorrectFlags,
          suggestions,
        });
      }
    }

    // ---- behavioral penalties ----
    const clickedSuspicious = data.clicked_link_urls.filter((u) =>
      INBOX_EMAILS.some((e) => e.links.some((l) => l.suspicious && l.href === u)),
    );
    const openedMalicious = data.opened_attachment_names.filter((n) =>
      INBOX_EMAILS.some((e) => e.attachments.some((a) => a.suspicious && a.name === n)),
    );
    totalPoints -= clickedSuspicious.length * 4;
    totalPoints -= openedMalicious.length * 4;

    // normalize to /100
    const rawMax = maxPoints;
    const rawMin = -INBOX_EMAILS.length * 5;
    const normalized = Math.round(
      ((totalPoints - rawMin) / (rawMax - rawMin)) * 100,
    );
    const total = Math.max(0, Math.min(100, normalized));

    const totalBad = INBOX_EMAILS.filter((e) => e.verdict !== "legitimate").length;
    const totalGood = INBOX_EMAILS.length - totalBad;
    const accuracy = Number(
      (
        ((correctReported.length + correctlyIgnored.length) / INBOX_EMAILS.length) *
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
      strengths.push(`Reported every phishing / suspicious email (${totalBad}/${totalBad}).`);
    if (correctlyIgnored.length === totalGood && totalGood > 0)
      strengths.push(`Did not raise any false alarms on legitimate mail (${totalGood}/${totalGood}).`);
    if (clickedSuspicious.length === 0) strengths.push("Did not click any malicious link.");
    if (openedMalicious.length === 0) strengths.push("Did not open any malicious attachment.");

    if (missedEmails.length > 0)
      weaknesses.push(`Missed ${missedEmails.length} phishing / suspicious email${missedEmails.length === 1 ? "" : "s"} — review the missed indicators.`);
    if (incorrectReported.length > 0)
      weaknesses.push(`Flagged ${incorrectReported.length} legitimate email${incorrectReported.length === 1 ? "" : "s"} as malicious — over-reporting wastes SOC time.`);
    if (clickedSuspicious.length > 0)
      weaknesses.push(`Clicked ${clickedSuspicious.length} suspicious link${clickedSuspicious.length === 1 ? "" : "s"} during investigation — hover instead of clicking.`);
    if (openedMalicious.length > 0)
      weaknesses.push(`Opened ${openedMalicious.length} malicious attachment${openedMalicious.length === 1 ? "" : "s"} — never open .htm/.exe from unknown senders.`);

    const bestPractices = [
      "Always verify the sender's full email address — domain look-alikes are the #1 phishing tell.",
      "Hover over a link to preview the URL before clicking. Mismatched or shortened URLs are red flags.",
      "Never act on email-based requests for credentials, wire transfers, or password resets without out-of-band confirmation.",
      "Treat urgency, secrecy, and threats of account loss as social-engineering signals.",
      "Report suspicious mail using the Report to Security button — do not delete it silently.",
    ];

    const recommendations: string[] = [];
    if (missedEmails.some((m) => m.verdict === "phishing"))
      recommendations.push("Spend extra time on sender-domain inspection — most missed emails had look-alike domains.");
    if (incorrectReported.length > 0)
      recommendations.push("Before reporting, ask: does the email actually ask me to do something risky?");
    if (clickedSuspicious.length + openedMalicious.length > 0)
      recommendations.push("Treat the inbox as a sandbox even in real life — do not click to 'check' a link.");
    if (total >= 85) recommendations.push("Excellent — consider mentoring teammates on your investigation process.");

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

    // Aggregate all per-email reports into one incident_reports row
    // (session_id is UNIQUE on incident_reports).
    if (data.reports.length > 0) {
      const allRedFlags = Array.from(new Set(data.reports.flatMap((r) => r.red_flags)));
      const allUrls = Array.from(new Set(data.reports.flatMap((r) => r.suspicious_links)));
      // Pick the most severe classification we received
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
    // Profile is created by trigger as 'pending' (since super_admin already exists)
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
    // Don't touch super_admin in this fn
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
