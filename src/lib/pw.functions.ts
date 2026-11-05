import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SLUG = "password-security";
const UNAVAILABLE = "This workshop is currently unavailable. Please contact the administrator.";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

function moduleOpen(m: any) {
  if (!m || !m.is_enabled || !m.is_available) return false;
  const now = Date.now();
  if (m.access_start && new Date(m.access_start).getTime() > now) return false;
  if (m.access_end && new Date(m.access_end).getTime() < now) return false;
  return true;
}

async function activeCampaign(sb: any) {
  const nowIso = new Date().toISOString();
  const { data } = await sb
    .from("pw_campaigns")
    .select("*")
    .eq("is_active", true)
    .eq("module_slug", SLUG)
    .order("created_at", { ascending: false });
  return (data ?? []).find(
    (c: any) => (!c.starts_at || c.starts_at <= nowIso) && (!c.ends_at || c.ends_at >= nowIso),
  );
}

async function finalize(sb: any, attempt: any, timedOut: boolean) {
  const { scoreAttempt } = await import("@/lib/pw-engine.server");
  const results = scoreAttempt(attempt.answer_key, attempt.responses);
  const end = timedOut ? new Date(attempt.expires_at) : new Date();
  const taken = Math.round((end.getTime() - new Date(attempt.started_at).getTime()) / 1000);
  const { data } = await sb
    .from("pw_attempts")
    .update({
      status: timedOut ? "timed_out" : "completed",
      submitted_at: end.toISOString(),
      results,
      score: results.score,
      max_score: results.max,
      percentage: results.percentage,
      performance_level: results.level,
      time_taken_seconds: taken,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .select("*")
    .maybeSingle();
  return data ?? attempt;
}

function publicAttempt(a: any) {
  const base = {
    id: a.id, status: a.status, attempt_number: a.attempt_number, started_at: a.started_at,
    expires_at: a.expires_at, server_now: new Date().toISOString(),
  };
  if (a.status === "in_progress") return { ...base, content: a.content, responses: a.responses };
  return { ...base, results: a.results, time_taken_seconds: a.time_taken_seconds };
}

async function loadContext(userId: string) {
  const sb = await admin();
  const [{ data: profile }, { data: mod }] = await Promise.all([
    sb.from("profiles").select("full_name, employee_code, department, status").eq("id", userId).maybeSingle(),
    sb.from("training_modules").select("*").eq("slug", SLUG).maybeSingle(),
  ]);
  const campaign = await activeCampaign(sb);
  return { sb, profile, mod, campaign };
}

// ================= Employee =================
export const pwGetState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sb, profile, mod, campaign } = await loadContext(context.userId);
    if (!profile || profile.status !== "active") return { state: "locked" as const, message: "Your account is not active." };
    if (!moduleOpen(mod) || !campaign) return { state: "locked" as const, message: UNAVAILABLE };

    const { data: attempts } = await sb
      .from("pw_attempts").select("*").eq("user_id", context.userId).eq("campaign_id", campaign.id)
      .order("attempt_number", { ascending: false });
    let latest = attempts?.[0];
    if (latest?.status === "in_progress" && new Date(latest.expires_at).getTime() <= Date.now()) {
      latest = await finalize(sb, latest, true);
    }
    const { data: grants } = await sb
      .from("pw_retake_grants").select("id").eq("user_id", context.userId).eq("campaign_id", campaign.id)
      .is("used_attempt_id", null).is("revoked_at", null);
    const canRetake = (grants?.length ?? 0) > 0;

    const meta = { campaign: campaign.name, profile: { name: profile.full_name, employee_code: profile.employee_code, department: profile.department } };
    if (!latest) return { state: "eligible" as const, ...meta, duration: campaign.duration_seconds };
    if (latest.status === "in_progress") return { state: "in_progress" as const, ...meta, attempt: publicAttempt(latest) };
    return { state: "finished" as const, ...meta, canRetake, attempt: publicAttempt(latest) };
  });

export const pwStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sb, profile, mod, campaign } = await loadContext(context.userId);
    if (!profile || profile.status !== "active") throw new Error("Your account is not active.");
    if (!moduleOpen(mod) || !campaign) throw new Error(UNAVAILABLE);

    const { data: attempts } = await sb
      .from("pw_attempts").select("id, status, attempt_number").eq("user_id", context.userId).eq("campaign_id", campaign.id)
      .order("attempt_number", { ascending: false });
    const open = attempts?.find((a: any) => a.status === "in_progress");
    if (open) return { attemptId: open.id };

    let grantId: string | null = null;
    if (attempts && attempts.length > 0) {
      const { data: grant } = await sb
        .from("pw_retake_grants").select("id").eq("user_id", context.userId).eq("campaign_id", campaign.id)
        .is("used_attempt_id", null).is("revoked_at", null).limit(1).maybeSingle();
      if (!grant) throw new Error("You have already completed this workshop. Only an administrator can authorise another attempt.");
      grantId = grant.id;
    }

    const { buildAttempt } = await import("@/lib/pw-engine.server");
    const attemptNumber = (attempts?.[0]?.attempt_number ?? 0) + 1;
    const now = Date.now();
    for (let i = 0; i < 25; i++) {
      const built = buildAttempt();
      const { data, error } = await sb.from("pw_attempts").insert({
        user_id: context.userId, campaign_id: campaign.id, attempt_number: attemptNumber,
        set_hash: built.set_hash, content: built.content, answer_key: built.answer_key,
        started_at: new Date(now).toISOString(),
        expires_at: new Date(now + campaign.duration_seconds * 1000).toISOString(),
      }).select("id").single();
      if (!error && data) {
        if (grantId) {
          const { data: used } = await sb.from("pw_retake_grants")
            .update({ used_attempt_id: data.id, used_at: new Date().toISOString() })
            .eq("id", grantId).is("used_attempt_id", null).select("id").maybeSingle();
          if (!used) {
            await sb.from("pw_attempts").delete().eq("id", data.id);
            throw new Error("Retake authorisation already used.");
          }
        }
        return { attemptId: data.id };
      }
      if (error?.code === "23505") {
        // Either duplicate question set (retry) or a parallel start created an open attempt
        const { data: existing } = await sb.from("pw_attempts").select("id").eq("user_id", context.userId)
          .eq("campaign_id", campaign.id).eq("status", "in_progress").maybeSingle();
        if (existing) return { attemptId: existing.id };
        continue;
      }
      throw new Error("Could not start the workshop. Please try again.");
    }
    await sb.from("audit_logs").insert({ actor_id: context.userId, action: "pw.question_pool_exhausted", target_type: "pw_campaign", target_id: campaign.id });
    throw new Error("The question bank could not generate a unique set. The administrator has been notified.");
  });

const ResponsesSchema = z.object({
  m1: z.object({ flags: z.array(z.string().max(10)).max(10), done: z.boolean().optional() }).optional(),
  m2: z.record(z.string().max(10), z.enum(["approve", "deny"])).optional(),
  m3: z.record(z.string().max(10), z.enum(["safe", "unsafe"])).optional(),
  m4: z.record(z.string().max(20), z.string().max(20)).optional(),
  done: z.array(z.string().max(4)).max(4).optional(),
});

async function ownOpenAttempt(sb: any, userId: string, attemptId: string) {
  const { data: a } = await sb.from("pw_attempts").select("*").eq("id", attemptId).eq("user_id", userId).maybeSingle();
  if (!a) throw new Error("Attempt not found");
  return a;
}

export const pwSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ attemptId: z.string().uuid(), responses: ResponsesSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const a = await ownOpenAttempt(sb, context.userId, data.attemptId);
    if (a.status !== "in_progress") return { status: a.status };
    if (new Date(a.expires_at).getTime() <= Date.now()) {
      await finalize(sb, a, true);
      return { status: "timed_out" };
    }
    await sb.from("pw_attempts").update({ responses: data.responses }).eq("id", a.id).eq("status", "in_progress");
    return { status: "in_progress" };
  });

export const pwSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ attemptId: z.string().uuid(), responses: ResponsesSchema.optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    let a = await ownOpenAttempt(sb, context.userId, data.attemptId);
    if (a.status !== "in_progress") return { ok: true };
    const expired = new Date(a.expires_at).getTime() <= Date.now();
    if (data.responses && !expired) {
      a = { ...a, responses: data.responses };
      await sb.from("pw_attempts").update({ responses: data.responses }).eq("id", a.id);
    }
    await finalize(sb, a, expired);
    return { ok: true };
  });

// ================= Admin =================
async function requireAdmin(context: any, staffOk = false) {
  const fn = staffOk ? "is_staff" : "is_admin";
  const { data } = await context.supabase.rpc(fn, { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}
async function audit(action: string, actor: string, target_type: string, target_id: string, meta?: any) {
  const sb = await admin();
  await sb.from("audit_logs").insert({ actor_id: actor, action, target_type, target_id, meta });
}

export const pwAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context, true);
    const sb = context.supabase;
    const [{ data: campaigns }, { data: attempts }, { data: grants }, { data: modules }, { data: profiles }] = await Promise.all([
      sb.from("pw_campaigns").select("*").order("created_at", { ascending: false }),
      sb.from("pw_attempts").select("id,user_id,campaign_id,attempt_number,set_hash,status,started_at,expires_at,submitted_at,score,max_score,percentage,performance_level,time_taken_seconds").order("started_at", { ascending: false }).limit(2000),
      sb.from("pw_retake_grants").select("*").order("granted_at", { ascending: false }),
      sb.from("training_modules").select("id,slug,title,is_enabled,is_available,access_start,access_end").in("slug", ["phishing-awareness", SLUG]),
      sb.from("profiles").select("id,full_name,employee_code,department,email,status").eq("status", "active"),
    ]);
    return { campaigns: campaigns ?? [], attempts: attempts ?? [], grants: grants ?? [], modules: modules ?? [], profiles: profiles ?? [], now: new Date().toISOString() };
  });

export const pwAdminAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context, true);
    const { data: a } = await context.supabase.from("pw_attempts").select("*").eq("id", data.id).maybeSingle();
    if (!a) throw new Error("Not found");
    const { scoreAttempt } = await import("@/lib/pw-engine.server");
    // In-progress attempts get a live preview evaluated against their own snapshot.
    return { ...a, results: a.results ?? scoreAttempt(a.answer_key, a.responses) };
  });

export const pwSetModuleAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      slug: z.enum(["phishing-awareness", SLUG]),
      is_enabled: z.boolean(), is_available: z.boolean(),
      access_start: z.string().datetime().nullable(), access_end: z.string().datetime().nullable(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await admin();
    const { slug, ...rest } = data;
    const { error } = await sb.from("training_modules").update(rest).eq("slug", slug);
    if (error) throw new Error(error.message);
    await audit("module.access_updated", context.userId, "training_module", slug, rest);
    return { ok: true };
  });

export const pwSaveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().trim().min(3).max(150),
      departments: z.array(z.string().max(80)).max(50).nullable(),
      is_active: z.boolean(),
      starts_at: z.string().datetime().nullable(), ends_at: z.string().datetime().nullable(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await admin();
    const { id, ...rest } = data;
    const q = id
      ? sb.from("pw_campaigns").update(rest).eq("id", id).select("id").single()
      : sb.from("pw_campaigns").insert({ ...rest, created_by: context.userId }).select("id").single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    await audit(id ? "pw.campaign_updated" : "pw.campaign_created", context.userId, "pw_campaign", row.id, rest);
    return { id: row.id };
  });

export const pwGrantRetake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), campaignId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await admin();
    const { data: open } = await sb.from("pw_retake_grants").select("id").eq("user_id", data.userId)
      .eq("campaign_id", data.campaignId).is("used_attempt_id", null).is("revoked_at", null);
    if (open && open.length) throw new Error("This employee already has an unused retake.");
    const { data: att } = await sb.from("pw_attempts").select("status").eq("user_id", data.userId).eq("campaign_id", data.campaignId);
    if (!att?.length) throw new Error("Employee has not attempted this workshop yet.");
    if (att.some((a: any) => a.status === "in_progress")) throw new Error("Employee has an attempt in progress.");
    const { data: g, error } = await sb.from("pw_retake_grants")
      .insert({ user_id: data.userId, campaign_id: data.campaignId, granted_by: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    await audit("pw.retake_granted", context.userId, "profile", data.userId, { campaign_id: data.campaignId, grant_id: g.id });
    return { ok: true };
  });

export const pwRevokeRetake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ grantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await admin();
    const { data: g } = await sb.from("pw_retake_grants")
      .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
      .eq("id", data.grantId).is("used_attempt_id", null).is("revoked_at", null).select("user_id").maybeSingle();
    if (!g) throw new Error("Grant already used or revoked.");
    await audit("pw.retake_revoked", context.userId, "profile", g.user_id, { grant_id: data.grantId });
    return { ok: true };
  });
