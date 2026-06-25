import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const { data } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, status, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="px-6 py-10 lg:px-10">
      <span className="chip">EMPLOYEES</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">All employees</h1>
      <div className="soc-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                <td className="px-4 py-3 mono text-xs text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.department || "—"}</td>
                <td className="px-4 py-3">
                  <StatusChip status={p.status} />
                </td>
                <td className="px-4 py-3 mono text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "chip chip-success"
      : status === "pending"
        ? "chip chip-warn"
        : status === "rejected" || status === "suspended" || status === "disabled"
          ? "chip chip-danger"
          : "chip chip-muted";
  return <span className={cls}>{status.toUpperCase()}</span>;
}
