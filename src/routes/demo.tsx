import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { setSession } from "@/lib/session";
import type { Role } from "@/lib/data";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "VetCore — Veterinary Clinic Management Demo" },
      { name: "description", content: "Explore VetCore's veterinary clinic platform as an administrator, veterinarian, receptionist or pet owner." },
      { property: "og:title", content: "VetCore — Veterinary Clinic Management Demo" },
      { property: "og:description", content: "Role-based dashboards for running a modern veterinary clinic." },
    ],
  }),
  component: Demo,
});

function Demo() {
  const navigate = useNavigate();
  const enter = (r: Role) => {
    setSession(r);
    navigate({ to: "/$role/$page", params: { role: r, page: "dashboard" } });
  };
  return (
    <main className="bg-grid flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <div className="mb-10 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[10px] bg-brand/15 text-sm font-semibold text-brand ring-1 ring-brand/40">VC</span>
          <span className="text-lg font-semibold text-strong">Vet<span className="text-brand glow-brand">Core</span></span>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand glow-brand">Veterinary clinic management system</p>
        <h1 className="mt-2 max-w-[18ch] text-balance text-4xl font-semibold text-strong md:text-5xl">Choose a role to explore the clinic.</h1>
        <p className="mt-3 max-w-[56ch] text-muted-foreground">This is a demo with sample data — no account needed. You can switch roles anytime from the profile menu.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {(Object.keys(ROLES) as Role[]).map((r) => {
            const c = ROLES[r];
            return (
              <button key={r} onClick={() => enter(r)}
                className="panel group flex items-start gap-4 p-5 text-left transition hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber/15 text-sm font-semibold text-amber ring-1 ring-amber/30">{c.initials}</span>
                <span className="flex-1">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.15em] text-brand">{c.label}</span>
                  <span className="mt-0.5 block font-medium text-strong">{c.person}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{c.blurb}</span>
                </span>
                <ArrowRight className="mt-1 size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand" />
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
