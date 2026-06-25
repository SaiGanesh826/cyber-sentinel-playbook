import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { approveEmployee, rejectEmployee } from "@/lib/soc.functions";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  component: PendingPage,
});

function PendingPage() {
  const qc = useQueryClient();
  const approve = useServerFn(approveEmployee);
  const reject = useServerFn(rejectEmployee);

  const { data, isLoading } = useQuery({
    queryKey: ["pending-registrations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, employee_code, username, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function act(id: string, kind: "approve" | "reject") {
    try {
      if (kind === "approve") await approve({ data: { profile_id: id } });
      else await reject({ data: { profile_id: id } });
      toast.success(`Registration ${kind}d`);
      qc.invalidateQueries({ queryKey: ["pending-registrations"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  return (
    <div className="px-6 py-10 lg:px-10">
      <span className="chip chip-warn">PENDING REGISTRATIONS</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Approve new employees</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        New sign-ups land here until an administrator approves them.
      </p>

      <div className="soc-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Submitted</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : data?.length ? (
              data.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground mono text-xs">{p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.department || "—"}</td>
                  <td className="px-4 py-3 mono text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => act(p.id, "approve")}
                        className="inline-flex items-center gap-1 rounded-md bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => act(p.id, "reject")}
                        className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/25"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No pending registrations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
