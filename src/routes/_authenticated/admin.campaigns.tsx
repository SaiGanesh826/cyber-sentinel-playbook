import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createCampaign, createRegistrationLink } from "@/lib/soc.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const qc = useQueryClient();
  const newCampaign = useServerFn(createCampaign);
  const newLink = useServerFn(createRegistrationLink);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: links } = useQuery({
    queryKey: ["reg-links"],
    queryFn: async () => {
      const { data } = await supabase
        .from("registration_links")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function submitCampaign(e: React.FormEvent) {
    e.preventDefault();
    try {
      await newCampaign({ data: { name, description: desc } });
      setName("");
      setDesc("");
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  async function generateLink(campaign_id: string) {
    try {
      await newLink({ data: { campaign_id } });
      qc.invalidateQueries({ queryKey: ["reg-links"] });
      toast.success("Registration link generated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/register/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <div className="px-6 py-10 lg:px-10 space-y-8">
      <header>
        <span className="chip">CAMPAIGNS</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Awareness campaigns
        </h1>
      </header>

      <form onSubmit={submitCampaign} className="soc-card grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto]">
        <input
          required
          placeholder="Campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="soc-input"
        />
        <input
          placeholder="Description (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="soc-input"
        />
        <button className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Create
        </button>
      </form>

      <div className="soc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Links</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(campaigns ?? []).map((c) => {
              const cLinks = (links ?? []).filter((l) => l.campaign_id === c.id);
              return (
                <tr key={c.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.description ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="chip chip-success">{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {cLinks.map((l) => (
                        <li key={l.id} className="flex items-center justify-end gap-2">
                          <span className="mono text-xs text-muted-foreground">
                            /register/{l.token.slice(0, 10)}…
                          </span>
                          <button
                            onClick={() => copyLink(l.token)}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                      {!cLinks.length && (
                        <li className="text-right text-xs text-muted-foreground">No links yet</li>
                      )}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => generateLink(c.id)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Generate link
                    </button>
                  </td>
                </tr>
              );
            })}
            {!campaigns?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
