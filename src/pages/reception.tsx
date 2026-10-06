import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LogIn, Plus, PawPrint, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TODAY, inr, invoiceTotal, setApptStatus } from "@/lib/data";
import { Empty, Kpi, PageHeader, Panel, PetPhoto, SearchBox, StatusBadge } from "@/components/vc/kit";
import { AppointmentsTable, BookDialog, useLookup } from "./shared";

export function ReceptionDashboard() {
  const { db } = useLookup();
  const nav = useNavigate();
  const [book, setBook] = useState(false);
  const today = db.appointments.filter((a) => a.date === TODAY).sort((a, b) => (a.time < b.time ? -1 : 1));
  const requests = db.appointments.filter((a) => a.status === "Requested");
  const unpaid = db.invoices.filter((i) => i.status !== "Paid");
  return (
    <>
      <PageHeader eyebrow="Front desk" title="Good day, Emily" sub={`${today.filter((a) => a.status === "Confirmed").length} arrivals expected · ${requests.length} booking requests to review.`}
        actions={<>
          <Button variant="outline" onClick={() => nav({ to: "/$role/$page", params: { role: "receptionist", page: "pets" } })}><PawPrint />Register pet</Button>
          <Button variant="outline" onClick={() => nav({ to: "/$role/$page", params: { role: "receptionist", page: "billing" } })}><Receipt />Billing</Button>
          <Button onClick={() => setBook(true)}><Plus />New appointment</Button>
        </>} />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Today's bookings" value={today.length} glow />
        <Kpi label="Expected arrivals" value={today.filter((a) => a.status === "Confirmed").length} tone="muted" hint="awaiting check-in" />
        <Kpi label="Requests" value={requests.length} tone="amber" hint="need confirmation" />
        <Kpi label="Unpaid invoices" value={unpaid.length} tone="err" hint={inr(unpaid.reduce((s, i) => s + invoiceTotal(i) - i.paid, 0))} />
      </div>
      <div className="grid gap-6">
        <Panel title="Booking requests" meta={`${requests.length} pending`}>
          <AppointmentsTable role="receptionist" rows={requests} />
        </Panel>
        <Panel title="Today's schedule" meta={`${today.length} slots`}>
          <AppointmentsTable role="receptionist" rows={today} />
        </Panel>
      </div>
      <BookDialog open={book} onOpenChange={setBook} role="receptionist" />
    </>
  );
}

export function CheckInPage() {
  const { db, pet, owner, vet } = useLookup();
  const [q, setQ] = useState("");
  const list = db.appointments.filter((a) => a.date === TODAY && ["Confirmed", "Checked In"].includes(a.status))
    .filter((a) => `${pet(a.petId)?.name} ${owner(pet(a.petId)?.ownerId)?.name} ${owner(pet(a.petId)?.ownerId)?.phone}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.time < b.time ? -1 : 1));
  return (
    <>
      <PageHeader eyebrow="Arrivals" title="Check-in" sub="Find the pet or owner, then check them in to notify the veterinarian." />
      <Panel>
        <div className="border-b border-border p-4"><SearchBox value={q} onChange={setQ} placeholder="Pet name, owner or phone" /></div>
        {list.length ? (
          <ul className="divide-y divide-border">
            {list.map((a) => { const p = pet(a.petId); return (
              <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="w-12 font-mono text-xs text-brand">{a.time}</span>
                <PetPhoto pet={p} className="size-11 rounded-xl" />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-strong">{p?.name} <span className="font-normal text-muted-foreground">· {p?.breed}</span></p>
                  <p className="text-xs text-muted-foreground">{owner(p?.ownerId)?.name} · {owner(p?.ownerId)?.phone} · {vet(a.vetId)?.name}</p></div>
                <StatusBadge status={a.status} />
                {a.status === "Confirmed" ? <Button size="sm" onClick={() => { setApptStatus(a.id, "Checked In"); toast.success(`${p?.name} checked in — ${vet(a.vetId)?.name} notified.`); }}><LogIn />Check in</Button>
                  : <span className="w-[92px] text-right text-xs text-faint">Waiting</span>}
              </li>); })}
          </ul>
        ) : <Empty title="No arrivals pending" sub="Everyone booked for today has been checked in." />}
      </Panel>
    </>
  );
}
