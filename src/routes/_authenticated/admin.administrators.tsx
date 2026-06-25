import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  createAdmin,
  promoteToSuperAdmin,
  demoteAdmin,
  deleteAdmin,
  setAdminRoles,
} from "@/lib/inbox.functions";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/administrators")({
  beforeLoad: async () => {
    const { data: who } = await supabase.auth.getUser();
    if (!who.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", who.user.id)
      .eq("role", "super_admin");
    if (!roles || roles.length === 0) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdministratorsPage,
});

interface AdminRow {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  roles: string[];
}

function AdministratorsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["administrators"],
    queryFn: async () => {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["super_admin", "admin", "manager"]);
      const ids = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, department")
        .in("id", ids);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      const merged: AdminRow[] = ids.map((id) => {
        const p = byId.get(id);
        const roles = (roleRows ?? []).filter((r) => r.user_id === id).map((r) => r.role);
        return {
          id,
          email: p?.email ?? "(no profile)",
          full_name: p?.full_name ?? null,
          department: p?.department ?? null,
          roles,
        };
      });
      return merged.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
    },
  });

  const create = useServerFn(createAdmin);
  const promote = useServerFn(promoteToSuperAdmin);
  const demote = useServerFn(demoteAdmin);
  const del = useServerFn(deleteAdmin);
  const setRoles = useServerFn(setAdminRoles);

  async function run(label: string, fn: () => Promise<any>) {
    try {
      await fn();
      toast.success(label);
      qc.invalidateQueries({ queryKey: ["administrators"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="chip">ADMIN · ADMINISTRATORS</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Administrator management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Super Admin only. Create administrators, manage their permissions, and grant or revoke
            super-admin access.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Create administrator
        </button>
      </div>

      <div className="soc-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Roles / permissions</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
            {(admins ?? []).map((a) => {
              const isSuper = a.roles.includes("super_admin");
              const isSelf = a.id === user?.id;
              return (
                <tr key={a.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{a.department || "—"}</div>
                  </td>
                  <td className="px-4 py-3 mono text-xs text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {isSuper && <span className="chip chip-warn">SUPER ADMIN</span>}
                      <PermToggle
                        active={a.roles.includes("admin")}
                        disabled={isSuper}
                        onClick={() => {
                          const next = a.roles.includes("admin")
                            ? a.roles.filter((r) => r !== "admin" && r !== "super_admin")
                            : Array.from(new Set([...a.roles.filter((r) => r !== "super_admin"), "admin"]));
                          run("Permissions updated", () =>
                            setRoles({ data: { user_id: a.id, roles: next.filter((r) => r === "admin" || r === "manager") as any } }),
                          );
                        }}
                      >
                        admin
                      </PermToggle>
                      <PermToggle
                        active={a.roles.includes("manager")}
                        disabled={isSuper}
                        onClick={() => {
                          const next = a.roles.includes("manager")
                            ? a.roles.filter((r) => r !== "manager")
                            : Array.from(new Set([...a.roles, "manager"]));
                          run("Permissions updated", () =>
                            setRoles({ data: { user_id: a.id, roles: next.filter((r) => r === "admin" || r === "manager") as any } }),
                          );
                        }}
                      >
                        manager
                      </PermToggle>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {!isSuper && (
                        <IconBtn icon={ArrowUp} title="Promote to Super Admin"
                          onClick={() => run("Promoted to Super Admin", () => promote({ data: { user_id: a.id } }))} />
                      )}
                      {!isSelf && (
                        <IconBtn icon={ArrowDown} title="Demote to Employee"
                          onClick={() => {
                            if (confirm("Demote this user to Employee?")) {
                              run("Demoted", () => demote({ data: { user_id: a.id } }));
                            }
                          }} />
                      )}
                      {!isSelf && (
                        <IconBtn icon={Trash2} title="Delete user" danger
                          onClick={() => {
                            if (confirm(`Permanently delete ${a.email}? This cannot be undone.`)) {
                              run("Administrator deleted", () => del({ data: { user_id: a.id } }));
                            }
                          }} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && (admins ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No administrators yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <CreateAdminDialog
          onClose={() => setCreating(false)}
          onCreate={async (input) => {
            await run("Administrator created", () => create({ data: input }));
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function PermToggle({ children, active, onClick, disabled }: { children: React.ReactNode; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`chip ${active ? "chip-success" : "chip-muted"} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}`}
    >
      {children}
    </button>
  );
}

function IconBtn({ icon: Icon, title, onClick, danger }: { icon: any; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function CreateAdminDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { email: string; full_name: string; password: string; department?: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [full_name, setFull] = useState("");
  const [department, setDept] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Create administrator</h3>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (password.length < 8) return toast.error("Password must be at least 8 characters.");
            setBusy(true);
            try {
              await onCreate({ email, full_name, password, department: department || undefined });
            } finally {
              setBusy(false);
            }
          }}
          className="mt-4 space-y-3"
        >
          <Field label="Full name">
            <input className="soc-input" required value={full_name} onChange={(e) => setFull(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="soc-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Department (optional)">
            <input className="soc-input" value={department} onChange={(e) => setDept(e.target.value)} />
          </Field>
          <Field label="Initial password (min 8 chars)">
            <input className="soc-input" type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border bg-surface py-2 text-sm hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? "Creating…" : "Create administrator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
