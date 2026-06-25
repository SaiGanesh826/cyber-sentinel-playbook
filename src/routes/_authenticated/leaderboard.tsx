import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: Leaderboard,
});

function Leaderboard() {
  const { data } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data: scores } = await supabase
        .from("scores")
        .select("user_id, total, accuracy, created_at")
        .order("total", { ascending: false })
        .limit(100);
      const userIds = Array.from(new Set((scores ?? []).map((s) => s.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, department")
        .in("id", userIds);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      // top score per user
      const best = new Map<string, any>();
      for (const s of scores ?? []) {
        if (!best.has(s.user_id) || best.get(s.user_id).total < s.total)
          best.set(s.user_id, s);
      }
      return Array.from(best.values())
        .sort((a, b) => b.total - a.total)
        .map((s) => ({ ...s, profile: map.get(s.user_id) }));
    },
  });

  return (
    <div className="px-6 py-10">
      <span className="chip">LEADERBOARD</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight flex items-center gap-2">
        <Trophy className="h-7 w-7 text-warning" /> Top analysts
      </h1>
      <div className="soc-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Analyst</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-right">Best score</th>
              <th className="px-4 py-3 text-right">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s, i) => (
              <tr key={s.user_id} className="border-t border-border">
                <td className="px-4 py-3 mono">{i + 1}</td>
                <td className="px-4 py-3 font-medium">
                  {s.profile?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.profile?.department ?? "—"}
                </td>
                <td className="px-4 py-3 text-right mono">{s.total}/100</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {s.accuracy}%
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No scores yet. Be the first to complete a training exercise.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
