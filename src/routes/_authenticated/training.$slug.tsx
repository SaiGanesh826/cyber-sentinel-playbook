import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { startSession } from "@/lib/soc.functions";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/$slug")({
  component: ModuleIntro,
});

function ModuleIntro() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const start = useServerFn(startSession);
  const [launching, setLaunching] = useState(false);

  const { data: mod, isLoading } = useQuery({
    queryKey: ["module", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_modules")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  async function launch() {
    setLaunching(true);
    try {
      const res = await start({ data: { module_slug: slug } });
      navigate({
        to: "/play/$sessionId",
        params: { sessionId: res.session_id },
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to start session");
      setLaunching(false);
    }
  }

  if (isLoading || !mod)
    return <div className="px-6 py-10 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="chip">TRAINING MODULE</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{mod.title}</h1>
      <p className="mt-3 text-muted-foreground">{mod.description}</p>

      <div className="soc-card mt-8 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <h3 className="font-semibold">Before you begin</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll be dropped into a corporate inbox with one new email. Treat it
              like any message you'd receive at work. Read carefully, inspect what
              you need to inspect, and submit your investigation when you're done.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              There are no levels, no hints, and no on-screen objectives. Your
              actions are recorded for analysis after submission.
            </p>
          </div>
        </div>
      </div>

      <button
        disabled={launching}
        onClick={launch}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {launching ? "Preparing inbox…" : "Launch training"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
