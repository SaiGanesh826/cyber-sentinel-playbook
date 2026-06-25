import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/scenario/$sessionId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
          return new Response("Unauthorized", { status: 401 });
        const token = authHeader.slice(7);

        const userClient = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          },
        );
        const { data: who } = await userClient.auth.getUser(token);
        if (!who?.user) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: session } = await supabaseAdmin
          .from("game_sessions")
          .select("scenario_id, user_id, status")
          .eq("id", params.sessionId)
          .single();
        if (!session || session.user_id !== who.user.id)
          return new Response("Forbidden", { status: 403 });

        const { data: scenario } = await supabaseAdmin
          .from("phishing_scenarios")
          .select("id, title, difficulty, payload")
          .eq("id", session.scenario_id)
          .single();
        if (!scenario) return new Response("Not found", { status: 404 });

        const e: any = (scenario.payload as any)?.email ?? {};
        return Response.json({
          id: scenario.id,
          title: scenario.title,
          difficulty: scenario.difficulty,
          email: {
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
            links: (e.links ?? []).map((l: any) => ({
              text: l.text,
              href: l.href,
            })),
          },
        });
      },
    },
  },
});
