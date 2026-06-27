import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Field } from "@/routes/auth";
import { registerEmployee } from "@/lib/soc.functions";

export const Route = createFileRoute("/register/$token")({
  head: () => ({ meta: [{ title: "Register · SOC Defender" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { token } = Route.useParams();
  const submitRegistration = useServerFn(registerEmployee);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [full_name, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: link } = await supabase
        .from("registration_links")
        .select("id, campaign_id, expires_at, is_active")
        .eq("token", token)
        .maybeSingle();
      if (!link || !link.is_active || (link.expires_at && new Date(link.expires_at) < new Date())) {
        setInvalid(true);
        setLoading(false);
        return;
      }
      const { data: c } = await supabase
        .from("campaigns")
        .select("id, name, description, registration_end, game_start, game_end")
        .eq("id", link.campaign_id)
        .maybeSingle();
      setCampaign(c);
      setLoading(false);
    })();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitRegistration({
        data: {
          token,
          full_name,
          department,
          email,
          employee_code: employeeCode,
          password,
        },
      });
      setDone(true);
      toast.success("Registration request submitted");
    } catch (error: any) {
      toast.error(error?.message ?? "Registration could not be submitted");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  if (loading)
    return <div className="px-6 py-12 text-sm text-muted-foreground">Loading…</div>;

  if (invalid)
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="soc-card max-w-md p-6 text-center">
          <span className="chip chip-danger">LINK INVALID</span>
          <h1 className="mt-4 text-xl font-semibold">Registration link expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask your administrator for an updated link.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Return home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 soc-grid opacity-30" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">SOC Defender</span>
        </div>

        <div className="soc-card p-6">
          <span className="chip">CAMPAIGN REGISTRATION</span>
          <h1 className="mt-3 text-2xl font-semibold">{campaign?.name}</h1>
          {campaign?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
          )}

          {done ? (
            <div className="mt-6 text-center">
              <span className="chip chip-warn">PENDING APPROVAL</span>
              <h3 className="mt-3 text-lg font-semibold">Registration submitted</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your registration request has been submitted successfully. Please
                wait for administrator approval before logging in.
              </p>
              <Link
                to="/auth"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <Field label="Full name">
                <input required value={full_name} onChange={(e) => setFullName(e.target.value)} className="soc-input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <input required value={department} onChange={(e) => setDepartment(e.target.value)} className="soc-input" />
                </Field>
                <Field label="Employee ID">
                  <input required value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} className="soc-input" />
                </Field>
              </div>
              <Field label="Organization email">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="soc-input" />
              </Field>
              <Field label="Password (min 8 chars)">
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="soc-input" />
              </Field>
              <button
                disabled={submitting}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit registration"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
