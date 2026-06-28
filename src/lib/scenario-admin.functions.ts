import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { SEED_SCENARIOS } from "./scenario-seed";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden: admin only");
}

const linkSchema = z.object({
  text: z.string().min(1).max(200),
  href: z.string().min(1).max(500),
  suspicious: z.boolean().optional(),
  behavior: z
    .enum([
      "fake_m365",
      "fake_hr",
      "fake_vpn",
      "fake_payment",
      "fake_document",
      "internal_form",
      "survey",
      "meeting_invite",
      "internal_action",
      "external",
    ])
    .optional(),
});
const attachmentSchema = z.object({
  name: z.string().min(1).max(200),
  size: z.string().max(40),
  suspicious: z.boolean().optional(),
});
const redFlagSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(200),
  explanation: z.string().min(1).max(500),
});

const scenarioInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  department: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  classification: z.enum(["legitimate", "suspicious"]),
  sender_name: z.string().min(1).max(120),
  sender_email: z.string().min(1).max(200),
  subject: z.string().min(1).max(240),
  body_html: z.string().min(1).max(60000),
  attachments: z.array(attachmentSchema).max(10).default([]),
  links: z.array(linkSchema).max(20).default([]),
  red_flags: z.array(redFlagSchema).max(20).default([]),
  correct_action: z.string().max(80).default("ignore"),
  explanation: z.string().max(2000).default(""),
  is_mfa: z.boolean().default(false),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
  is_enabled: z.boolean().default(true),
  tags: z.array(z.string().max(40)).max(20).default([]),
});

export const upsertScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => scenarioInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: mod } = await supabaseAdmin
      .from("training_modules")
      .select("id")
      .eq("slug", "phishing-awareness")
      .single();
    if (!mod) throw new Error("Phishing module missing");

    const row = {
      module_id: mod.id,
      title: data.title,
      department: data.department ?? null,
      category: data.category ?? null,
      difficulty: data.difficulty,
      classification: data.classification,
      sender_name: data.sender_name,
      sender_email: data.sender_email,
      subject: data.subject,
      body_html: data.body_html,
      attachments: data.attachments,
      links: data.links,
      red_flags: data.red_flags,
      correct_action: data.correct_action,
      explanation: data.explanation,
      is_mfa: data.is_mfa,
      status: data.status,
      is_enabled: data.is_enabled,
      tags: data.tags,
      payload: {},
      created_by: context.userId,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("phishing_scenarios")
        .update(row)
        .eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("phishing_scenarios")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return { id: created.id };
  });

export const deleteScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("phishing_scenarios")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const duplicateScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: original, error: fErr } = await supabaseAdmin
      .from("phishing_scenarios")
      .select("*")
      .eq("id", data.id)
      .single();
    if (fErr || !original) throw fErr || new Error("Scenario missing");
    const copy: any = { ...original };
    delete copy.id;
    delete copy.created_at;
    delete copy.updated_at;
    copy.title = `${original.title} (copy)`;
    copy.is_enabled = false;
    copy.status = "draft";
    copy.created_by = context.userId;
    const { data: created, error } = await supabaseAdmin
      .from("phishing_scenarios")
      .insert(copy)
      .select("id")
      .single();
    if (error) throw error;
    return { id: created.id };
  });

export const toggleScenarioEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), is_enabled: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("phishing_scenarios")
      .update({ is_enabled: data.is_enabled })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const seedScenariosFromRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: mod } = await supabaseAdmin
      .from("training_modules")
      .select("id")
      .eq("slug", "phishing-awareness")
      .single();
    if (!mod) throw new Error("Phishing module missing");

    // Idempotent: remove old seeded rows first
    await supabaseAdmin
      .from("phishing_scenarios")
      .delete()
      .contains("tags", ["seed"]);

    const rows = SEED_SCENARIOS.map((s) => ({
      module_id: mod.id,
      title: s.title,
      department: s.department,
      category: s.category,
      difficulty: s.difficulty,
      classification: s.classification,
      sender_name: s.sender_name,
      sender_email: s.sender_email,
      subject: s.subject,
      body_html: s.body_html,
      attachments: s.attachments,
      links: s.links,
      red_flags: s.red_flags,
      correct_action: s.correct_action,
      explanation: s.explanation,
      is_mfa: s.is_mfa,
      status: "active",
      is_enabled: true,
      tags: Array.from(new Set([...(s.tags ?? []), "seed"])),
      payload: {},
      created_by: context.userId,
    }));

    // Insert in chunks of 30 to keep payload reasonable
    for (let i = 0; i < rows.length; i += 30) {
      const chunk = rows.slice(i, i + 30);
      const { error } = await supabaseAdmin
        .from("phishing_scenarios")
        .insert(chunk);
      if (error) throw error;
    }
    return { ok: true, count: rows.length };
  });
