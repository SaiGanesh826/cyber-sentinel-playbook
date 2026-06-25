import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: rows } = useQuery({
    queryKey: ["reports-rows"],
    queryFn: async () => {
      const { data: scores } = await supabase
        .from("scores")
        .select("user_id, total, accuracy, time_taken_seconds, created_at, session_id")
        .order("created_at", { ascending: false })
        .limit(500);
      const ids = Array.from(new Set((scores ?? []).map((s) => s.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, department, email")
        .in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (scores ?? []).map((s) => ({ ...s, profile: map.get(s.user_id) }));
    },
  });

  function exportCSV() {
    if (!rows) return;
    const headers = [
      "name",
      "email",
      "department",
      "score",
      "accuracy",
      "time_seconds",
      "submitted_at",
    ];
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          [
            r.profile?.full_name ?? "",
            r.profile?.email ?? "",
            r.profile?.department ?? "",
            r.total,
            r.accuracy,
            r.time_taken_seconds,
            new Date(r.created_at).toISOString(),
          ]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(","),
        ),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soc-defender-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <span className="chip">REPORTS</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Performance reports</h1>
        </div>
        <button
          onClick={exportCSV}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Export CSV
        </button>
      </div>

      <div className="soc-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Analyst</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Accuracy</th>
              <th className="px-4 py-3 text-right">Time</th>
              <th className="px-4 py-3 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.session_id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{r.profile?.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.profile?.department ?? "—"}</td>
                <td className="px-4 py-3 text-right mono">{r.total}/100</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{r.accuracy}%</td>
                <td className="px-4 py-3 text-right text-muted-foreground mono">
                  {Math.floor(r.time_taken_seconds / 60)}m {r.time_taken_seconds % 60}s
                </td>
                <td className="px-4 py-3 mono text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No completed investigations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
