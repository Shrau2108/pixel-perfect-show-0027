import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Search, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLES } from "@/lib/roles";
import { setSession } from "@/lib/session";
import { update, useDB, type Role } from "@/lib/data";
import { cn } from "@/lib/utils";

export function AppShell({ role, page, children }: { role: Role; page: string; children: ReactNode }) {
  const cfg = ROLES[role];
  const navigate = useNavigate();
  const db = useDB();
  const notes = db.notices.filter((n) => n.roles.includes(role));
  const unread = notes.filter((n) => !n.read).length;
  const date = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

  const switchTo = (r: Role) => {
    setSession(r);
    navigate({ to: "/$role/$page", params: { role: r, page: "dashboard" } });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <Link to="/demo" className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <span className="grid size-7 place-items-center rounded-[8px] bg-brand/15 text-xs font-semibold text-brand ring-1 ring-brand/40">VC</span>
          <span className="text-sm font-semibold tracking-tight text-strong">Vet<span className="text-brand glow-brand">Core</span></span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm" aria-label="Main">
          {cfg.nav.map((n) => {
            const active = n.page === page;
            return (
              <Link key={n.page} to="/$role/$page" params={{ role, page: n.page }}
                className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
                  active ? "bg-sidebar-accent font-medium text-brand ring-1 ring-brand/25" : "text-sidebar-foreground hover:bg-accent/50 hover:text-strong")}>
                <n.icon className="size-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <div className="rounded-lg bg-amber/5 p-3 ring-1 ring-amber/20">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-amber">Demo mode</p>
            <p className="mt-1 text-xs text-foreground">{cfg.console} · sample data</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <div className="hidden w-[300px] items-center gap-2 rounded-lg bg-input px-3 py-2 text-sm text-faint ring-1 ring-border md:flex">
            <Search className="size-4" /> Search patients, cases, owners…
          </div>
          <span className="text-sm font-semibold text-strong lg:hidden">Vet<span className="text-brand">Core</span></span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">{date}</span>
            <Popover>
              <PopoverTrigger aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg bg-input ring-1 ring-border hover:bg-accent">
                <Bell className="size-4 text-muted-foreground" />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-amber" />}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-strong">Notifications</p>
                  <button className="text-xs text-brand" onClick={() => update((d) => ({ ...d, notices: d.notices.map((n) => n.roles.includes(role) ? { ...n, read: true } : n) }))}>Mark all read</button>
                </div>
                <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                  {notes.map((n) => (
                    <li key={n.id} className="flex gap-3 px-4 py-3 text-sm">
                      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-faint" : "bg-brand")} />
                      <div><p className={n.read ? "text-muted-foreground" : "text-strong"}>{n.text}</p><p className="font-mono text-[10px] text-faint">{n.time}</p></div>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 border-l border-border pl-3 text-left outline-none">
                <span className="grid size-9 place-items-center rounded-full bg-amber/15 text-xs font-semibold text-amber ring-1 ring-amber/30">{cfg.initials}</span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-medium text-strong">{cfg.person}</span>
                  <span className="block font-mono text-[11px] uppercase text-brand">{cfg.label}</span>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="eyebrow">Switch role</DropdownMenuLabel>
                {(Object.keys(ROLES) as Role[]).map((r) => (
                  <DropdownMenuItem key={r} onClick={() => switchTo(r)}>
                    {ROLES[r].label}{r === role && <Check className="ml-auto size-4 text-brand" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSession(null); navigate({ to: "/demo", replace: true }); }}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden" aria-label="Mobile">
          {cfg.nav.map((n) => (
            <Link key={n.page} to="/$role/$page" params={{ role, page: n.page }}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs", n.page === page ? "bg-sidebar-accent text-brand" : "text-muted-foreground")}>
              <n.icon className="size-3.5" />{n.label}
            </Link>
          ))}
        </nav>
        <main className="bg-grid min-h-[calc(100vh-4rem)] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
