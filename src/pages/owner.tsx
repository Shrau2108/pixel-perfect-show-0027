import { useState } from "react";
import { Plus, Syringe, Receipt, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_OWNER_ID, TODAY, fmtDate, inr, invoiceTotal, type Pet } from "@/lib/data";
import { Kpi, PageHeader, Panel, PetPhoto, Pill, StatusBadge } from "@/components/vc/kit";
import { AppointmentsPage, BookDialog, PetDetail, addDays, useLookup } from "./shared";

function useMine() {
  const { db, pet } = useLookup();
  const pets = db.pets.filter((p) => p.ownerId === DEMO_OWNER_ID);
  const ids = new Set(pets.map((p) => p.id));
  return {
    pets, pet,
    appts: db.appointments.filter((a) => ids.has(a.petId)),
    vax: db.vaccinations.filter((v) => ids.has(v.petId)),
    invoices: db.invoices.filter((i) => ids.has(i.petId)),
  };
}

export function OwnerDashboard() {
  const { pets, appts, vax, invoices, pet } = useMine();
  const [book, setBook] = useState(false);
  const upcoming = appts.filter((a) => a.date >= TODAY && !["Completed", "Canceled", "No-show"].includes(a.status)).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
  const due = vax.filter((v) => v.nextDue <= addDays(30));
  const owed = invoices.reduce((s, i) => s + invoiceTotal(i) - i.paid, 0);
  return (
    <>
      <PageHeader eyebrow="Pet owner portal" title="Hi Rahul 👋" sub={`${pets.length} pets in your family · ${upcoming.length} upcoming visits.`}
        actions={<Button onClick={() => setBook(true)}><Plus />Request appointment</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="My pets" value={pets.length} glow />
        <Kpi label="Upcoming visits" value={upcoming.length} tone="brand" hint={upcoming[0] ? `next ${fmtDate(upcoming[0].date)}` : "none booked"} />
        <Kpi label="Vaccines due" value={due.length} tone={due.length ? "warn" : "ok"} hint="next 30 days" />
        <Kpi label="Balance due" value={inr(owed)} tone={owed ? "err" : "ok"} />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {pets.map((p) => <PetCard key={p.id} p={p} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming appointments">
          <ul className="divide-y divide-border">
            {upcoming.map((a) => <li key={a.id} className="flex items-center gap-3 px-5 py-3"><CalendarDays className="size-4 text-brand" /><div className="flex-1"><p className="text-sm text-strong">{pet(a.petId)?.name} · {a.reason}</p><p className="font-mono text-[11px] text-muted-foreground">{fmtDate(a.date)} · {a.time}</p></div><StatusBadge status={a.status} /></li>)}
            {!upcoming.length && <li className="px-5 py-6 text-sm text-muted-foreground">No upcoming visits.</li>}
          </ul>
        </Panel>
        <Panel title="Reminders">
          <ul className="divide-y divide-border">
            {due.map((v) => <li key={v.id} className="flex items-center gap-3 px-5 py-3 text-sm"><Syringe className="size-4 text-warn" /><span className="flex-1 text-strong">{pet(v.petId)?.name} · {v.vaccine}</span><Pill tone={v.nextDue < TODAY ? "err" : "warn"}>{v.nextDue < TODAY ? "Overdue" : `Due ${fmtDate(v.nextDue)}`}</Pill></li>)}
            {invoices.filter((i) => i.status !== "Paid").map((i) => <li key={i.id} className="flex items-center gap-3 px-5 py-3 text-sm"><Receipt className="size-4 text-err" /><span className="flex-1 text-strong">{i.id} · {pet(i.petId)?.name}</span><Pill tone="err">{inr(invoiceTotal(i) - i.paid)}</Pill></li>)}
          </ul>
        </Panel>
      </div>
      <BookDialog open={book} onOpenChange={setBook} role="owner" ownerId={DEMO_OWNER_ID} />
    </>
  );
}

function PetCard({ p, onOpen }: { p: Pet; onOpen?: () => void }) {
  return (
    <button onClick={onOpen} className="panel flex items-center gap-4 p-4 text-left transition hover:shadow-glow" disabled={!onOpen}>
      <PetPhoto pet={p} className="size-20 rounded-xl" />
      <div className="flex-1">
        <p className="text-lg font-semibold text-strong">{p.name}</p>
        <p className="text-sm text-muted-foreground">{p.species} · {p.breed}</p>
        <p className="mt-1 font-mono text-[11px] text-faint">{p.age} yrs · {p.sex} · {p.weight} kg</p>
        {p.allergies !== "None" && <div className="mt-2"><Pill tone="err">Allergy: {p.allergies}</Pill></div>}
      </div>
    </button>
  );
}

export function OwnerPetsPage() {
  const { pets } = useMine();
  const [sel, setSel] = useState<Pet | null>(null);
  return (
    <>
      <PageHeader eyebrow="My family" title="My pets" sub="Tap a pet to see its profile and medical history." />
      <div className="grid gap-4 sm:grid-cols-2">{pets.map((p) => <PetCard key={p.id} p={p} onOpen={() => setSel(p)} />)}</div>
      <PetDetail pet={sel} onClose={() => setSel(null)} />
    </>
  );
}

export function OwnerAppointmentsPage() {
  const { pets } = useMine();
  const ids = new Set(pets.map((p) => p.id));
  return <AppointmentsPageOwner ids={ids} />;
}
function AppointmentsPageOwner({ ids }: { ids: Set<string> }) {
  return <AppointmentsPage role="owner" filter={(a) => ids.has(a.petId)} title="My appointments" eyebrow="Visits" />;
}
