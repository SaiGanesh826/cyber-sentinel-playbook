import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const search = z.object({ tab: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [{ title: "Sign in · SOC Defender" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { tab } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(tab ?? "signin");
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 soc-grid opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SOC Defender</span>
        </Link>

        <div className="soc-card p-6">
          <div className="mb-5 inline-flex rounded-md border border-border p-1">
            <TabBtn active={mode === "signin"} onClick={() => setMode("signin")}>
              Sign in
            </TabBtn>
            <TabBtn active={mode === "signup"} onClick={() => setMode("signup")}>
              Register
            </TabBtn>
          </div>
          {mode === "signin" ? <SignInForm /> : <SignUpForm />}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Have a campaign link? Open it directly to register against the right
          campaign.
        </p>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    // Check profile status
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile) {
      toast.error("Profile not found. Contact your administrator.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    if (profile.status !== "active") {
      const reason: Record<string, string> = {
        pending: "Your account is pending administrator approval.",
        rejected: "Your registration was rejected.",
        suspended: "Your account has been suspended.",
        disabled: "Your account has been disabled.",
      };
      toast.error(reason[profile.status] ?? "Account is not active.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    await refresh();
    toast.success("Welcome back, analyst.");
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Organization email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="soc-input"
          autoComplete="email"
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="soc-input"
          autoComplete="current-password"
        />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Authenticating…" : "Sign in"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [full_name, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name, department, username },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="chip chip-warn">PENDING APPROVAL</span>
        <h3 className="mt-3 text-lg font-semibold">Registration submitted</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your registration request has been submitted successfully. Please wait
          for administrator approval before logging in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Full name">
        <input required value={full_name} onChange={(e) => setFullName(e.target.value)} className="soc-input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Department">
          <input required value={department} onChange={(e) => setDepartment(e.target.value)} className="soc-input" />
        </Field>
        <Field label="Username">
          <input required value={username} onChange={(e) => setUsername(e.target.value)} className="soc-input" />
        </Field>
      </div>
      <Field label="Organization email">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="soc-input" autoComplete="email" />
      </Field>
      <Field label="Password (min 8 chars)">
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="soc-input" autoComplete="new-password" />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Request access"}
      </button>
    </form>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
