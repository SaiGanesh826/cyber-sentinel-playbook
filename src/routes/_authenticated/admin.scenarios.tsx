import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { setModuleEnabled } from "@/lib/soc.functions";
import {
  upsertScenario,
  deleteScenario,
  duplicateScenario,
  toggleScenarioEnabled,
  seedScenariosFromRepo,
} from "@/lib/scenario-admin.functions";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Plus, Pencil, Copy, Trash2, Eye, Power, RefreshCw, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/scenarios")({
  component: ScenariosPage,
});

type Scenario = any;

const LINK_BEHAVIORS = [
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
] as const;

const DEPARTMENTS = [
  "Common",
  "External",
  "HR",
  "CEO/Management",
  "Sales",
  "Pre-Sales",
  "Implementation",
  "Finance",
];

function emptyScenario(): Scenario {
  return {
    title: "",
    department: "Common",
    category: "",
    difficulty: "medium",
    classification: "suspicious",
    sender_name: "",
    sender_email: "",
    subject: "",
    body_html:
      '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;">\n  <p>Hi,</p>\n  <p>Write the email body here.</p>\n</div>',
    attachments: [],
    links: [],
    red_flags: [],
    correct_action: "report_to_security",
    explanation: "",
    is_mfa: false,
    status: "draft",
    is_enabled: false,
    tags: [],
  };
}

function ScenariosPage() {
  const qc = useQueryClient();
  const toggleMod = useServerFn(setModuleEnabled);
  const save = useServerFn(upsertScenario);
  const del = useServerFn(deleteScenario);
  const dup = useServerFn(duplicateScenario);
  const tog = useServerFn(toggleScenarioEnabled);
  const seed = useServerFn(seedScenariosFromRepo);

  const [editing, setEditing] = useState<Scenario | null>(null);
  const [previewing, setPreviewing] = useState<Scenario | null>(null);
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterMfa, setFilterMfa] = useState<boolean>(false);
  const [search, setSearch] = useState("");

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

  const { data: scenarios, refetch } = useQuery({
    queryKey: ["scenarios-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("phishing_scenarios")
        .select(
          "id, title, department, category, difficulty, classification, is_mfa, is_enabled, status, sender_name, sender_email, subject, body_html, attachments, links, red_flags, correct_action, explanation, tags, created_at",
        )
        .order("department", { ascending: true })
        .order("title", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (scenarios ?? []).filter((s: any) => {
      if (filterDept && s.department !== filterDept) return false;
      if (filterMfa && !s.is_mfa) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          ![s.title, s.subject, s.sender_email, s.category].some(
            (v: any) => v && String(v).toLowerCase().includes(q),
          )
        )
          return false;
      }
      return true;
    });
  }, [scenarios, filterDept, filterMfa, search]);

  async function moduleToggle(module_id: string, is_enabled: boolean) {
    try {
      await toggleMod({ data: { module_id, is_enabled } });
      qc.invalidateQueries({ queryKey: ["modules-admin"] });
      qc.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  async function doSave(s: Scenario) {
    try {
      await save({ data: s });
      toast.success("Scenario saved");
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  }
  async function doDelete(id: string) {
    if (!confirm("Delete this scenario? This cannot be undone.")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }
  async function doDup(id: string) {
    try {
      await dup({ data: { id } });
      toast.success("Duplicated as draft");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Duplicate failed");
    }
  }
  async function doToggle(id: string, is_enabled: boolean) {
    try {
      await tog({ data: { id, is_enabled } });
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }
  async function doSeed() {
    if (
      !confirm(
        "Re-seed the canonical scenario repository? Existing scenarios tagged 'seed' will be replaced.",
      )
    )
      return;
    try {
      const res = await seed();
      toast.success(`Seeded ${res.count} scenarios`);
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Seed failed");
    }
  }

  return (
    <div className="px-6 py-10 lg:px-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">CONTENT</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Modules & email scenarios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the email scenario repository. Only Active + Enabled scenarios are used in assessments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={doSeed}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Seed canonical repository
          </button>
          <button
            onClick={() => setEditing(emptyScenario())}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New scenario
          </button>
        </div>
      </header>

      {/* Modules */}
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
              {(modules ?? []).map((m: any) => (
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
                      onClick={() => moduleToggle(m.id, !m.is_enabled)}
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

      {/* Filters */}
      <section className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, subject, sender…"
          className="soc-input min-w-[260px]"
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="soc-input"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={filterMfa}
            onChange={(e) => setFilterMfa(e.target.checked)}
          />
          MFA only
        </label>
        <div className="ml-auto text-xs text-muted-foreground self-center">
          {filtered.length} / {scenarios?.length ?? 0} shown
        </div>
      </section>

      {/* Scenarios */}
      <section>
        <div className="soc-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Title</th>
                <th className="px-3 py-3 text-left">Dept</th>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-left">Class</th>
                <th className="px-3 py-3 text-left">Difficulty</th>
                <th className="px-3 py-3 text-left">MFA</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{s.title}</div>
                    <div className="mono text-[11px] text-muted-foreground truncate max-w-[280px]">
                      {s.sender_email}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{s.department || "—"}</td>
                  <td className="px-3 py-2.5 text-xs">{s.category || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`chip ${
                        s.classification === "legitimate" ? "chip-success" : "chip-danger"
                      }`}
                    >
                      {s.classification?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5"><span className="chip">{s.difficulty}</span></td>
                  <td className="px-3 py-2.5">
                    {s.is_mfa ? <span className="chip chip-warn">MFA</span> : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={s.is_enabled ? "chip chip-success" : "chip chip-muted"}>
                      {s.is_enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <IconBtn title="Preview" onClick={() => setPreviewing(s)}><Eye className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="Edit" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="Duplicate" onClick={() => doDup(s.id)}><Copy className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn
                        title={s.is_enabled ? "Disable" : "Enable"}
                        onClick={() => doToggle(s.id, !s.is_enabled)}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn title="Delete" tone="danger" onClick={() => doDelete(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No scenarios match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <EditorDrawer
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={doSave}
          onPreview={(s) => setPreviewing(s)}
        />
      )}
      {previewing && (
        <PreviewDrawer scenario={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 ${
        tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================
// EDITOR DRAWER
// ============================================================
function EditorDrawer({
  initial,
  onCancel,
  onSave,
  onPreview,
}: {
  initial: Scenario;
  onCancel: () => void;
  onSave: (s: Scenario) => void;
  onPreview: (s: Scenario) => void;
}) {
  const [s, setS] = useState<Scenario>({ ...initial });
  const set = (patch: Partial<Scenario>) => setS((x: Scenario) => ({ ...x, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-surface text-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {s.id ? "Edit scenario" : "New scenario"}
            </div>
            <div className="text-sm font-semibold">{s.title || "Untitled"}</div>
          </div>
          <button onClick={onCancel} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(s);
          }}
          className="flex-1 space-y-5 overflow-y-auto p-5 text-sm"
        >
          <Section title="Basic information">
            <Field label="Scenario name *">
              <input className="soc-input" required value={s.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department">
                <select className="soc-input" value={s.department ?? ""} onChange={(e) => set({ department: e.target.value })}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <input className="soc-input" value={s.category ?? ""} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Invoice, Tender, BEC" />
              </Field>
              <Field label="Difficulty">
                <select className="soc-input" value={s.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="soc-input" value={s.status} onChange={(e) => set({ status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!s.is_enabled} onChange={(e) => set({ is_enabled: e.target.checked })} />
                Enabled (use in assessments)
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!s.is_mfa} onChange={(e) => set({ is_mfa: e.target.checked })} />
                MFA-related scenario
              </label>
            </div>
          </Section>

          <Section title="Email details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sender name *">
                <input className="soc-input" required value={s.sender_name} onChange={(e) => set({ sender_name: e.target.value })} />
              </Field>
              <Field label="Sender email *">
                <input className="soc-input" required value={s.sender_email} onChange={(e) => set({ sender_email: e.target.value })} />
              </Field>
            </div>
            <Field label="Subject *">
              <input className="soc-input" required value={s.subject} onChange={(e) => set({ subject: e.target.value })} />
            </Field>
            <Field label="Body (HTML, rich) *">
              <textarea className="soc-input min-h-[180px] mono text-xs" required value={s.body_html} onChange={(e) => set({ body_html: e.target.value })} />
              <div className="text-[10px] text-muted-foreground mt-1">Inline-styled HTML so it renders consistently in the trainee's inbox.</div>
            </Field>
          </Section>

          <Section title="Attachments">
            <JsonListEditor
              value={s.attachments ?? []}
              onChange={(attachments) => set({ attachments })}
              fields={[
                { key: "name", label: "Name", placeholder: "Invoice.pdf" },
                { key: "size", label: "Size", placeholder: "120 KB" },
                { key: "suspicious", label: "Malicious?", type: "boolean" },
              ]}
              newItem={() => ({ name: "", size: "10 KB" })}
            />
          </Section>

          <Section title="Hyperlinks (behaviour controls what opens on click)">
            <JsonListEditor
              value={s.links ?? []}
              onChange={(links) => set({ links })}
              fields={[
                { key: "text", label: "Visible text", placeholder: "Open Portal" },
                { key: "href", label: "Destination URL", placeholder: "https://example.com/x" },
                { key: "suspicious", label: "Suspicious?", type: "boolean" },
                {
                  key: "behavior",
                  label: "On-click behaviour",
                  type: "select",
                  options: LINK_BEHAVIORS as unknown as string[],
                },
              ]}
              newItem={() => ({ text: "", href: "" })}
            />
          </Section>

          <Section title="Assessment configuration">
            <Field label="Classification">
              <select className="soc-input" value={s.classification} onChange={(e) => set({ classification: e.target.value })}>
                <option value="legitimate">Legitimate</option>
                <option value="suspicious">Suspicious / Phishing</option>
              </select>
            </Field>
            <Field label="Correct action">
              <select className="soc-input" value={s.correct_action} onChange={(e) => set({ correct_action: e.target.value })}>
                <option value="ignore">Ignore (legitimate — no action)</option>
                <option value="report_to_security">Report to Security</option>
                <option value="delete">Delete</option>
                <option value="reply">Reply</option>
              </select>
            </Field>
            <Field label="Red flags (one per row)">
              <JsonListEditor
                value={s.red_flags ?? []}
                onChange={(red_flags) => set({ red_flags })}
                fields={[
                  { key: "id", label: "ID", placeholder: "lookalike_domain" },
                  { key: "label", label: "Label", placeholder: "Look-alike sender domain" },
                  { key: "explanation", label: "Explanation", placeholder: "…" },
                ]}
                newItem={() => ({ id: "", label: "", explanation: "" })}
              />
            </Field>
            <Field label="Explanation (shown after submission)">
              <textarea className="soc-input min-h-[80px]" value={s.explanation ?? ""} onChange={(e) => set({ explanation: e.target.value })} />
            </Field>
          </Section>

          <Section title="Tags (free-text)">
            <input
              className="soc-input"
              value={(s.tags ?? []).join(", ")}
              onChange={(e) =>
                set({
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="phishing, m365, urgency"
            />
          </Section>

          <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-border bg-surface px-5 py-3">
            <button type="button" onClick={() => onPreview(s)} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
              Preview
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Save scenario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="soc-card p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: "boolean" | "select";
  options?: string[];
}
function JsonListEditor({
  value,
  onChange,
  fields,
  newItem,
}: {
  value: any[];
  onChange: (v: any[]) => void;
  fields: FieldDef[];
  newItem: () => any;
}) {
  function update(i: number, patch: any) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }
  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">None.</div>
      )}
      {value.map((row, i) => (
        <div key={i} className="rounded-md border border-border bg-muted/30 p-2">
          <div className="grid grid-cols-2 gap-2">
            {fields.map((f) => (
              <div key={f.key} className={f.type === "boolean" ? "col-span-1" : "col-span-2"}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</div>
                {f.type === "boolean" ? (
                  <label className="mt-1 inline-flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={!!row[f.key]}
                      onChange={(e) => update(i, { [f.key]: e.target.checked })}
                    />
                    Yes
                  </label>
                ) : f.type === "select" ? (
                  <select
                    className="soc-input mt-1 text-xs"
                    value={row[f.key] ?? ""}
                    onChange={(e) => update(i, { [f.key]: e.target.value || undefined })}
                  >
                    <option value="">— none —</option>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="soc-input mt-1 text-xs"
                    value={row[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => update(i, { [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => remove(i)} className="text-[11px] text-destructive hover:underline">
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, newItem()])}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        <Plus className="h-3 w-3" /> Add row
      </button>
    </div>
  );
}

// ============================================================
// PREVIEW DRAWER — renders the email exactly as the trainee will see it
// ============================================================
function PreviewDrawer({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex bg-black/50 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-surface text-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-3 text-primary-foreground">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Preview</div>
            <div className="text-sm font-semibold">{scenario.title}</div>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <header className="border-b border-border p-5">
            <h2 className="text-xl font-semibold">{scenario.subject}</h2>
            <div className="mt-2 text-sm">
              <span className="font-medium">{scenario.sender_name}</span>{" "}
              <span className="mono text-xs text-muted-foreground">&lt;{scenario.sender_email}&gt;</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`chip ${scenario.classification === "legitimate" ? "chip-success" : "chip-danger"}`}>
                {scenario.classification?.toUpperCase()}
              </span>
              <span className="chip">{scenario.difficulty}</span>
              {scenario.is_mfa && <span className="chip chip-warn">MFA</span>}
              <span className="chip chip-muted">{scenario.department}</span>
              {scenario.category && <span className="chip chip-muted">{scenario.category}</span>}
            </div>
          </header>
          <div
            className="bg-white p-6 text-sm text-[#202124]"
            dangerouslySetInnerHTML={{ __html: scenario.body_html }}
          />
          {(scenario.attachments ?? []).length > 0 && (
            <div className="border-t border-border p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Attachments</div>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                {(scenario.attachments ?? []).map((a: any, i: number) => (
                  <li key={i} className="rounded border border-border bg-muted px-2 py-1 mono">
                    {a.name} · {a.size} {a.suspicious && <span className="text-destructive">(malicious)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(scenario.links ?? []).length > 0 && (
            <div className="border-t border-border p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hyperlinks</div>
              <ul className="mt-2 space-y-1 text-xs">
                {(scenario.links ?? []).map((l: any, i: number) => (
                  <li key={i}>
                    <span className="font-medium">"{l.text}"</span> →{" "}
                    <span className="mono break-all">{l.href}</span>
                    {l.behavior && <span className="ml-2 chip">{l.behavior}</span>}
                    {l.suspicious && <span className="ml-1 chip chip-danger">malicious</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(scenario.red_flags ?? []).length > 0 && (
            <div className="border-t border-border p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected red flags</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {(scenario.red_flags ?? []).map((f: any, i: number) => (
                  <li key={i}>
                    <b>{f.label}</b> — <span className="text-muted-foreground">{f.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scenario.explanation && (
            <div className="border-t border-border p-4 text-xs text-muted-foreground">
              <b className="text-foreground">Explanation:</b> {scenario.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
