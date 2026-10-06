import type { ReactNode } from "react";
import { Search, Inbox, CheckCircle2, Clock, CircleDot, XCircle, AlertTriangle, LogIn, Loader, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApptStatus, Pet } from "@/lib/data";
import dog from "@/assets/pet-dog.jpg";
import cat from "@/assets/pet-cat.jpg";
import bird from "@/assets/pet-bird.jpg";
import rabbit from "@/assets/pet-rabbit.jpg";

const PHOTOS: Record<string, string> = { Dog: dog, Cat: cat, Bird: bird, Rabbit: rabbit };

export function PetPhoto({ pet, className }: { pet?: Pet; className?: string }) {
  const src = pet ? PHOTOS[pet.species] : undefined;
  if (!src)
    return (
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-semibold text-brand ring-1 ring-brand/25", className)}>
        {pet?.name[0] ?? "?"}
      </span>
    );
  return <img src={src} alt={pet?.name} loading="lazy" width={816} height={816} className={cn("size-9 shrink-0 rounded-lg object-cover ring-1 ring-brand/25", className)} />;
}

export function Panel({ title, meta, action, children, className, bodyClass }: {
  title?: ReactNode; meta?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {(title || meta || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-strong">{title}</h2>
          <div className="flex items-center gap-3">
            {meta && <span className="font-mono text-[11px] uppercase text-muted-foreground">{meta}</span>}
            {action}
          </div>
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const toneText = { brand: "text-brand", ok: "text-ok", warn: "text-warn", err: "text-err", amber: "text-amber", muted: "text-muted-foreground" } as const;
export type Tone = keyof typeof toneText;

export function Kpi({ label, value, hint, tone = "muted", glow }: { label: string; value: ReactNode; hint?: string; tone?: Tone; glow?: boolean }) {
  return (
    <div className="panel p-4">
      <p className="eyebrow">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold text-strong", glow && "glow-brand")}>{value}</p>
      {hint && <p className={cn("mt-1 text-xs", toneText[tone])}>{hint}</p>}
    </div>
  );
}

const pill = {
  brand: "ring-brand/30 bg-brand/10 text-brand",
  ok: "ring-ok/30 bg-ok/10 text-ok",
  warn: "ring-warn/30 bg-warn/10 text-warn",
  err: "ring-err/30 bg-err/10 text-err",
  amber: "ring-amber/30 bg-amber/10 text-amber",
  muted: "ring-muted-foreground/30 bg-muted text-foreground",
};

export function Pill({ tone = "muted", icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 [&_svg]:size-3", pill[tone])}>
      {icon}
      {children}
    </span>
  );
}

const STATUS: Record<ApptStatus, { tone: Tone; icon: ReactNode }> = {
  Requested: { tone: "amber", icon: <HelpCircle /> },
  Confirmed: { tone: "muted", icon: <CircleDot /> },
  "Checked In": { tone: "warn", icon: <LogIn /> },
  "In Progress": { tone: "brand", icon: <Loader /> },
  Completed: { tone: "ok", icon: <CheckCircle2 /> },
  Canceled: { tone: "err", icon: <XCircle /> },
  "No-show": { tone: "err", icon: <AlertTriangle /> },
};
export function StatusBadge({ status }: { status: ApptStatus }) {
  return <Pill tone={STATUS[status].tone} icon={STATUS[status].icon}>{status}</Pill>;
}
export const ClockIcon = Clock;

export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand glow-brand">{eyebrow}</p>
        <h1 className="mt-1 text-balance text-3xl font-semibold text-strong">{title}</h1>
        {sub && <p className="mt-1 max-w-[64ch] text-pretty text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex w-full max-w-xs items-center gap-2 rounded-lg bg-input px-3 py-2 text-sm ring-1 ring-border focus-within:ring-ring">
      <Search className="size-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="w-full bg-transparent text-foreground outline-none placeholder:text-faint" />
    </label>
  );
}

export function Empty({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/25"><Inbox className="size-5" /></span>
      <p className="mt-2 text-sm font-medium text-strong">{title}</p>
      {sub && <p className="max-w-sm text-xs text-muted-foreground">{sub}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-lg bg-input px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-ring placeholder:text-faint";

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-5 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3 text-muted-foreground", className)}>{children}</td>;
}
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr>{head}</tr></thead>
        <tbody className="divide-y divide-border [&>tr]:transition-colors [&>tr:hover]:bg-accent/40">{children}</tbody>
      </table>
    </div>
  );
}
