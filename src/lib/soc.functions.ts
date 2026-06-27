import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------------- Public scenario shape (no answers) ----------------
function redactScenario(payload: any) {
  const e = payload?.email ?? {};
  return {
    sender_name: e.sender_name,
    sender_email: e.sender_email,
    reply_to: e.reply_to,
    to: e.to,
    subject: e.subject,
    received_at: e.received_at,
    body_html: e.body_html,
    attachments: (e.attachments ?? []).map((a: any) => ({
      name: a.name,
      size: a.size,
    })),
    links: (e.links ?? []).map((l: any) => ({ text: l.text, href: l.href })),
  };
}

// ============================================================
// BOOTSTRAP — first user can claim super_admin if none exists
// ============================================================
export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .limit(1);
    if (existing && existing.length > 0) {
      throw new Error("Super admin already exists");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        [
          { user_id: userId, role: "super_admin" },
          { user_id: userId, role: "admin" },
        ],
        { onConflict: "user_id,role" },
      );
    await supabaseAdmin
      .from("profiles")
      .update({ status: "active" })
      .eq("id", userId);
    await supabaseAdmin
      .from("audit_logs")
      .insert({ actor_id: userId, action: "claim_super_admin" });
    return { ok: true };
  });

// ============================================================
// Approve / reject employees
// ============================================================
const idInput = (i: unknown) => z.object({ profile_id: z.string().uuid() }).parse(i);

export const approveEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      _user_id: userId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    await supabaseAdmin
      .from("profiles")
      .update({ status: "active" })
      .eq("id", data.profile_id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "approve_employee",
      target_type: "profile",
      target_id: data.profile_id,
    });
    return { ok: true };
  });

export const rejectEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      _user_id: userId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    await supabaseAdmin
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", data.profile_id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "reject_employee",
      target_type: "profile",
      target_id: data.profile_id,
    });
    return { ok: true };
  });

// ============================================================
// Campaigns + registration links
// ============================================================
export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        name: z.string().min(2).max(120),
        description: z.string().max(500).optional(),
        registration_start: z.string().optional(),
        registration_end: z.string().optional(),
        game_start: z.string().optional(),
        game_end: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      _user_id: userId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({ ...data, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return campaign;
  });

export const createRegistrationLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        expires_at: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      _user_id: userId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data: link, error } = await supabase
      .from("registration_links")
      .insert({
        campaign_id: data.campaign_id,
        token,
        expires_at: data.expires_at,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return link;
  });

export const registerEmployee = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        token: z.string().min(12).max(120),
        full_name: z.string().min(1).max(120),
        employee_code: z.string().min(1).max(80),
        department: z.string().min(1).max(80),
        email: z.string().email().max(180),
        password: z.string().min(8).max(128),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: link, error: linkError } = await supabaseAdmin
      .from("registration_links")
      .select("id, campaign_id, expires_at, is_active")
      .eq("token", data.token)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link || !link.is_active) throw new Error("Registration link is invalid");
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new Error("Registration link has expired");
    }

    const { data: campaign } = await supabaseAdmin
      .from("campaigns")
      .select("id, registration_end, is_disabled")
      .eq("id", link.campaign_id)
      .maybeSingle();

    if (!campaign || campaign.is_disabled) throw new Error("Campaign is not available");
    if (campaign.registration_end && new Date(campaign.registration_end) < new Date()) {
      throw new Error("Registration for this campaign has closed");
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, status")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingProfile?.status === "pending") {
      return { ok: true, status: "pending" as const };
    }
    if (existingProfile?.status === "active") {
      throw new Error("An active account already exists for this email");
    }
    if (existingProfile?.status === "rejected") {
      throw new Error("This registration request was rejected");
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name.trim(),
        department: data.department.trim(),
        employee_code: data.employee_code.trim(),
        campaign_id: link.campaign_id,
      },
    });

    if (createError || !created.user) {
      throw new Error(createError?.message || "Registration could not be submitted");
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name.trim(),
        department: data.department.trim(),
        employee_code: data.employee_code.trim(),
        email: normalizedEmail,
        campaign_id: link.campaign_id,
        status: "pending",
      })
      .eq("id", created.user.id);

    if (profileError) throw profileError;

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: null,
      action: "employee_registration_submitted",
      target_type: "profile",
      target_id: created.user.id,
      meta: { campaign_id: link.campaign_id, email: normalizedEmail },
    });

    return { ok: true, status: "pending" as const };
  });

// ============================================================
// SCENARIO + SESSION
// ============================================================
export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ module_slug: z.string() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // ensure employee profile is active
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (!profile || profile.status !== "active")
      throw new Error("Account is not active");

    const { data: mod } = await supabaseAdmin
      .from("training_modules")
      .select("id, is_enabled, is_available")
      .eq("slug", data.module_slug)
      .single();
    if (!mod || !mod.is_enabled || !mod.is_available)
      throw new Error("Module unavailable");

    const { data: scenarios } = await supabaseAdmin
      .from("phishing_scenarios")
      .select("id, title, difficulty, payload")
      .eq("module_id", mod.id)
      .eq("is_enabled", true)
      .limit(1);
    const scenario = scenarios?.[0];
    if (!scenario) throw new Error("No scenario available");

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

    return {
      session_id: session.id,
      scenario: {
        id: scenario.id,
        title: scenario.title,
        difficulty: scenario.difficulty,
        email: redactScenario(scenario.payload),
      },
    };
  });

export const logAction = createServerFn({ method: "POST" })
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
    // verify ownership via RLS by querying first
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
// SCORING ENGINE (hidden)
// ============================================================
function scoreSubmission(
  payload: any,
  report: {
    classification: string;
    red_flags: string[];
    suspicious_urls: string[];
    recommended_action: string;
    summary: string;
  },
  actions: any[],
) {
  // 1. Email Classification — 20
  const classCorrect = report.classification === payload.correct_classification;
  const classification_pts = classCorrect ? 20 : 0;

  // 2. Red Flag Identification — 20
  const expected = payload.expected_red_flags as { id: string; label: string; explanation: string; best_practice: string }[];
  const distractors = (payload.distractors ?? []) as { id: string; label: string; explanation: string }[];
  const expectedIds = new Set(expected.map((f) => f.id));
  const distractorIds = new Set(distractors.map((f) => f.id));
  const selected = new Set(report.red_flags);

  const correctlyIdentified = expected.filter((f) => selected.has(f.id));
  const missed = expected.filter((f) => !selected.has(f.id));
  const incorrect = [...selected]
    .filter((id) => !expectedIds.has(id))
    .map(
      (id) =>
        distractors.find((d) => d.id === id) ?? {
          id,
          label: id,
          explanation: "This item was not a phishing indicator.",
        },
    );
  const redflag_pts = Math.max(
    0,
    Math.round(
      (correctlyIdentified.length / Math.max(1, expected.length)) * 20 -
        incorrect.length * 3,
    ),
  );

  // 3. URL Investigation — 15 (hovered or marked any expected url)
  const expectedUrls: string[] = payload.expected_urls ?? [];
  const inspectedUrls = new Set<string>([
    ...report.suspicious_urls.map((u) => u.toLowerCase()),
    ...actions
      .filter((a) => a.action_type === "hover_link" || a.action_type === "inspect_link")
      .map((a) => String(a.target || "").toLowerCase()),
  ]);
  const urlMatches = expectedUrls.filter((u) =>
    inspectedUrls.has(u.toLowerCase()),
  ).length;
  const url_pts = Math.round((urlMatches / Math.max(1, expectedUrls.length)) * 15);

  // 4. SOC Incident Report Quality — 25
  let report_pts = 0;
  if (classCorrect) report_pts += 6;
  if (report.summary && report.summary.trim().length >= 60) report_pts += 8;
  else if (report.summary && report.summary.trim().length >= 20) report_pts += 4;
  if (report.red_flags.length >= 2) report_pts += 5;
  if (report.suspicious_urls.length >= 1) report_pts += 3;
  if (report.recommended_action === payload.expected_action) report_pts += 3;
  report_pts = Math.min(25, report_pts);

  // 5. Incident Response Decision — 10
  const action_pts = report.recommended_action === payload.expected_action ? 10 : 0;

  // 6. Security Awareness & Best Practices — 10
  // proxy: inspected sender header AND did not click any suspicious link
  const inspectedSender = actions.some(
    (a) => a.action_type === "inspect_sender" || a.action_type === "expand_headers",
  );
  const clickedSuspicious = actions.some(
    (a) =>
      a.action_type === "click_link" &&
      expectedUrls.some(
        (u) => String(a.target || "").toLowerCase() === u.toLowerCase(),
      ),
  );
  const opened_attachment = actions.some(
    (a) => a.action_type === "open_attachment",
  );
  let awareness_pts = 0;
  if (inspectedSender) awareness_pts += 4;
  if (!clickedSuspicious) awareness_pts += 4;
  if (!opened_attachment) awareness_pts += 2;

  const total =
    classification_pts +
    redflag_pts +
    url_pts +
    report_pts +
    action_pts +
    awareness_pts;

  const breakdown = {
    email_classification: { score: classification_pts, max: 20, correct: classCorrect },
    red_flag_identification: { score: redflag_pts, max: 20 },
    url_investigation: { score: url_pts, max: 15 },
    incident_report_quality: { score: report_pts, max: 25 },
    incident_response_decision: { score: action_pts, max: 10 },
    security_awareness: { score: awareness_pts, max: 10 },
  };

  const feedback = {
    correctly_identified: correctlyIdentified,
    missed,
    incorrect,
    report_review: {
      classification: {
        submitted: report.classification,
        expected: payload.correct_classification,
        correct: classCorrect,
      },
      recommended_action: {
        submitted: report.recommended_action,
        expected: payload.expected_action,
        correct: report.recommended_action === payload.expected_action,
      },
      summary_quality:
        report.summary.length >= 60
          ? "Thorough — good context for the SOC."
          : report.summary.length >= 20
            ? "Acceptable, but add who/what/why and the indicators you saw."
            : "Too short. Include sender, suspicious indicators, and your recommended action.",
    },
    learning_summary: buildLearningSummary({
      total,
      classCorrect,
      missedCount: missed.length,
      incorrectCount: incorrect.length,
      clickedSuspicious,
      opened_attachment,
    }),
  };

  return { total, breakdown, feedback };
}

function buildLearningSummary(s: {
  total: number;
  classCorrect: boolean;
  missedCount: number;
  incorrectCount: number;
  clickedSuspicious: boolean;
  opened_attachment: boolean;
}) {
  const strengths: string[] = [];
  const improvements: string[] = [];
  if (s.classCorrect) strengths.push("Correctly classified the email.");
  else improvements.push("Re-read the classification options and the indicators you spotted before committing.");
  if (s.missedCount === 0) strengths.push("Caught every phishing indicator.");
  else improvements.push(`You missed ${s.missedCount} indicator(s) — review the highlights below.`);
  if (s.incorrectCount === 0) strengths.push("No false positives.");
  else improvements.push("Some items you flagged are normal email features — focus on sender, links, and urgency.");
  if (!s.clickedSuspicious) strengths.push("Did not click the malicious link.");
  else improvements.push("Never click a suspicious link to investigate — hover and inspect instead.");
  if (s.opened_attachment) improvements.push("Avoid opening unsolicited attachments, especially HTML files.");
  return { strengths, improvements };
}

export const submitInvestigation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        session_id: z.string().uuid(),
        classification: z.enum(["phishing", "spam", "legitimate", "unsure"]),
        red_flags: z.array(z.string()).max(40),
        suspicious_urls: z.array(z.string()).max(20),
        recommended_action: z.enum([
          "report_to_soc",
          "delete",
          "reply",
          "click_link",
          "forward_colleague",
        ]),
        summary: z.string().max(2000),
        notes: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: session } = await supabaseAdmin
      .from("game_sessions")
      .select("id, user_id, started_at, status, scenario_id")
      .eq("id", data.session_id)
      .single();
    if (!session || session.user_id !== userId) throw new Error("Forbidden");
    if (session.status !== "in_progress")
      throw new Error("Session already submitted");

    const { data: scenario } = await supabaseAdmin
      .from("phishing_scenarios")
      .select("payload")
      .eq("id", session.scenario_id)
      .single();
    if (!scenario) throw new Error("Scenario missing");

    const { data: actions } = await supabaseAdmin
      .from("session_actions")
      .select("action_type, target, meta")
      .eq("session_id", session.id);

    const { total, breakdown, feedback } = scoreSubmission(
      scenario.payload as any,
      {
        classification: data.classification,
        red_flags: data.red_flags,
        suspicious_urls: data.suspicious_urls,
        recommended_action: data.recommended_action,
        summary: data.summary,
      },
      (actions ?? []) as any[],
    );

    const submitted_at = new Date();
    const time_taken_seconds = Math.max(
      1,
      Math.round(
        (submitted_at.getTime() - new Date(session.started_at).getTime()) / 1000,
      ),
    );
    const expected = ((scenario.payload as any)?.expected_red_flags ?? []) as unknown[];
    const accuracy = Number(
      (
        (feedback.correctly_identified.length / Math.max(1, expected.length)) *
        100
      ).toFixed(2),
    );

    await supabaseAdmin
      .from("game_sessions")
      .update({ submitted_at: submitted_at.toISOString(), status: "submitted" })
      .eq("id", session.id);

    await supabaseAdmin.from("incident_reports").insert({
      session_id: session.id,
      classification: data.classification,
      red_flags: data.red_flags,
      suspicious_urls: data.suspicious_urls,
      recommended_action: data.recommended_action,
      summary: data.summary,
      notes: data.notes,
    });

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

// Results lookup
export const getResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ session_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: score } = await supabase
      .from("scores")
      .select("*")
      .eq("session_id", data.session_id)
      .single();
    if (!score) throw new Error("Not found");
    if (score.user_id !== userId) {
      const { data: isStaff } = await supabase.rpc("is_staff", {
        _user_id: userId,
      });
      if (!isStaff) throw new Error("Forbidden");
    }
    return score;
  });

// ============================================================
// Module / scenario admin
// ============================================================
export const setModuleEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({ module_id: z.string().uuid(), is_enabled: z.boolean() })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      _user_id: userId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    await supabase
      .from("training_modules")
      .update({ is_enabled: data.is_enabled })
      .eq("id", data.module_id);
    return { ok: true };
  });
