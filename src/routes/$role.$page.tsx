import { useEffect } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/vc/AppShell";
import { ROLES, isRole } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { PAGES } from "@/pages/registry";

export const Route = createFileRoute("/$role/$page")({
  beforeLoad: ({ params }) => {
    if (!isRole(params.role) || !ROLES[params.role].nav.some((n) => n.page === params.page)) throw notFound();
  },
  head: ({ params }) => {
    const cfg = isRole(params.role) ? ROLES[params.role] : null;
    const label = cfg?.nav.find((n) => n.page === params.page)?.label ?? "Page";
    const title = `${label} · ${cfg?.label ?? ""} — VetCore`;
    const desc = `${label} for the ${cfg?.label ?? ""} in the VetCore veterinary clinic management demo.`;
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }] };
  },
  component: RolePage,
});

function RolePage() {
  const { role, page } = Route.useParams();
  const session = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (session === null) navigate({ to: "/demo", replace: true });
  }, [session, navigate]);

  if (!isRole(role) || !session) return <div className="bg-grid min-h-screen" />;
  if (session !== role)
    return (
      <div className="bg-grid flex min-h-screen items-center justify-center p-6">
        <div className="panel max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto size-8 text-err" />
          <h1 className="mt-3 text-xl font-semibold text-strong">Access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in as {ROLES[session].label}. This area belongs to the {ROLES[role].label} role.
          </p>
          <Link to="/$role/$page" params={{ role: session, page: "dashboard" }} className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back to my dashboard
          </Link>
        </div>
      </div>
    );
  const Page = PAGES[role][page];
  return <AppShell role={role} page={page}>{Page ? <Page /> : null}</AppShell>;
}
