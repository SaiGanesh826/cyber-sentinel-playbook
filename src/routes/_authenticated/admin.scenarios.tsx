import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { setModuleEnabled } from "@/lib/soc.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/scenarios")({
  component: ScenariosPage,
});

function ScenariosPage() {
  const qc = useQueryClient();
  const toggleModule = useServerFn(setModuleEnabled);

  const { data: modules } = useQuery({
    queryKey: ["modules-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_modules")
        .select("*")
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: scenarios } = useQuery({
    queryKey: ["scenarios-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("phishing_scenarios")
        .select("id, title, difficulty, is_enabled, module_id, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function toggle(module_id: string, is_enabled: boolean) {
    try {
      await toggleModule({ data: { module_id, is_enabled } });
      qc.invalidateQueries({ queryKey: ["modules-admin"] });
      qc.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  return (
    <div className="px-6 py-10 lg:px-10 space-y-8">
      <header>
        <span className="chip">CONTENT</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Modules & scenarios
        </h1>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Training modules</h2>
        <div className="soc-card mt-3 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Available</th>
                <th className="px-4 py-3 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {(modules ?? []).map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3 mono text-xs text-muted-foreground">{m.slug}</td>
                  <td className="px-4 py-3">
                    <span className={m.is_available ? "chip chip-success" : "chip chip-muted"}>
                      {m.is_available ? "READY" : "COMING SOON"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(m.id, !m.is_enabled)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        m.is_enabled
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.is_enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Phishing scenarios</h2>
        <div className="soc-card mt-3 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Difficulty</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(scenarios ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3">
                    <span className="chip">{s.difficulty}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={s.is_enabled ? "chip chip-success" : "chip chip-muted"}>
                      {s.is_enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </td>
                </tr>
              ))}
              {!scenarios?.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                    No scenarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
