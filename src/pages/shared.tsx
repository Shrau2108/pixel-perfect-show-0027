import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, ArrowUpDown, Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  ALLOWED, TODAY, fmtDate, inr, invoiceTotal, resetDemoDB, setApptStatus, uid, update, useDB,
  type ApptStatus, type Appointment, type ClinicSettings, type Pet, type Role,
} from "@/lib/data";
import { Empty, Field, PageHeader, Panel, PetPhoto, Pill, SearchBox, StatusBadge, Table, Td, Th, inputCls, Kpi } from "@/components/vc/kit";

export const STATUSES: ApptStatus[] = ["Requested", "Confirmed", "Checked In", "In Progress", "Completed", "Canceled", "No-show"];

export function useLookup() {
  const db = useDB();
  return {
    db,
    pet: (id: string) => db.pets.find((p) => p.id === id),
    owner: (id?: string) => db.owners.find((o) => o.id === id),
    vet: (id: string) => db.users.find((u) => u.id === id),
    vets: db.users.filter((u) => u.role === "veterinarian" && u.status === "Active"),
  };
}

/* ---------------- Appointments ---------------- */

const ROLE_TRANSITIONS: Record<Role, ApptStatus[]> = {
  admin: ["Confirmed", "Canceled", "No-show"],
  receptionist: ["Confirmed", "Checked In", "Canceled", "No-show"],
  veterinarian: ["In Progress", "Completed"],
  owner: ["Canceled"],
};

export function AppointmentsTable({ role, rows, compact }: { role: Role; rows: Appointment[]; compact?: boolean }) {
  const { pet, owner, vet } = useLookup();
  const allowed = ROLE_TRANSITIONS[role];
  if (!rows.length) return <Empty title="No appointments found" sub="Try changing the filters or book a new appointment." />;
  return (
    <Table head={<><Th>When</Th><Th>Patient</Th>{!compact && <Th>Owner</Th>}<Th>Vet</Th><Th>Reason</Th><Th>Status</Th><Th className="text-right">Actions</Th></>}>
      {rows.map((a) => {
        const p = pet(a.petId);
        const next = ALLOWED[a.status].filter((s) => allowed.includes(s) && !(role === "owner" && a.status !== "Requested" && a.status !== "Confirmed"));
        return (
          <tr key={a.id}>
            <Td><span className="font-mono text-xs text-brand">{a.time}</span><span className="block font-mono text-[10px] text-faint">{fmtDate(a.date)}</span></Td>
            <Td><div className="flex items-center gap-3"><PetPhoto pet={p} /><div><p className="font-medium text-strong">{p?.name}</p><p className="text-xs">{p?.species} · {p?.breed}</p></div></div></Td>
            {!compact && <Td>{owner(p?.ownerId)?.name}</Td>}
            <Td>{vet(a.vetId)?.name}</Td>
            <Td>{a.reason}</Td>
            <Td><StatusBadge status={a.status} /></Td>
            <Td className="text-right">
              <div className="flex justify-end gap-1.5">
                {next.map((s) => (
                  <Button key={s} size="sm" variant={s === "Canceled" || s === "No-show" ? "ghost" : "outline"}
                    onClick={() => { setApptStatus(a.id, s); toast.success(`${p?.name}: ${a.status} → ${s}`); }}>
                    {s === "Canceled" ? "Cancel" : s === "Checked In" ? "Check in" : s === "In Progress" ? "Start" : s === "Completed" ? "Complete" : s === "Confirmed" ? "Confirm" : s}
                  </Button>
                ))}
                {!next.length && <span className="text-xs text-faint">—</span>}
              </div>
            </Td>
          </tr>
        );
      })}
    </Table>
  );
}

export function AppointmentsPage({ role, filter = () => true, title = "Appointments", eyebrow = "Schedule" }: {
  role: Role; filter?: (a: Appointment) => boolean; title?: string; eyebrow?: string;
}) {
  const { db, pet } = useLookup();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [when, setWhen] = useState<"all" | "today" | "upcoming" | "past">("all");
  const [asc, setAsc] = useState(true);
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => db.appointments
    .filter(filter)
    .filter((a) => status === "All" || a.status === status)
    .filter((a) => when === "all" || (when === "today" ? a.date === TODAY : when === "upcoming" ? a.date > TODAY : a.date < TODAY))
    .filter((a) => { const p = pet(a.petId); return !q || `${p?.name} ${p?.breed} ${a.reason}`.toLowerCase().includes(q.toLowerCase()); })
    .sort((x, y) => ((x.date + x.time) < (y.date + y.time) ? -1 : 1) * (asc ? 1 : -1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, q, status, when, asc]);
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} sub={`${rows.length} appointments match your filters.`}
        actions={role !== "veterinarian" && <Button onClick={() => setOpen(true)}><Plus />{role === "owner" ? "Request appointment" : "New appointment"}</Button>} />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search pet, breed or reason" />
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + " w-auto"}>
            <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex rounded-lg ring-1 ring-border">
            {(["all", "today", "upcoming", "past"] as const).map((w) => (
              <button key={w} onClick={() => setWhen(w)} className={`px-3 py-2 text-xs capitalize ${when === w ? "bg-brand/10 text-brand" : "text-muted-foreground"}`}>{w}</button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAsc(!asc)}><ArrowUpDown />{asc ? "Oldest first" : "Newest first"}</Button>
        </div>
        <AppointmentsTable role={role} rows={rows} compact={role === "owner"} />
      </Panel>
      <BookDialog open={open} onOpenChange={setOpen} role={role} />
    </>
  );
}

export function BookDialog({ open, onOpenChange, role, ownerId }: { open: boolean; onOpenChange: (o: boolean) => void; role: Role; ownerId?: string }) {
  const { db, vets } = useLookup();
  const pets = ownerId ? db.pets.filter((p) => p.ownerId === ownerId) : db.pets;
  const [f, setF] = useState({ petId: "", vetId: vets[0]?.id ?? "", date: TODAY, time: "10:00", reason: "" });
  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00"];
  const taken = new Set(db.appointments.filter((a) => a.vetId === f.vetId && a.date === f.date && !["Canceled", "No-show"].includes(a.status)).map((a) => a.time));
  const submit = () => {
    if (!f.petId || !f.reason) return toast.error("Choose a pet and enter a reason.");
    if (taken.has(f.time)) return toast.error("That slot is already booked for this vet.");
    update((d) => ({ ...d, appointments: [...d.appointments, { id: uid("a"), ...f, status: role === "owner" ? "Requested" : "Confirmed" }] }));
    toast.success(role === "owner" ? "Request sent — the clinic will confirm shortly." : "Appointment booked.");
    onOpenChange(false);
    setF({ ...f, petId: "", reason: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{role === "owner" ? "Request an appointment" : "Book appointment"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <Field label="Pet"><select className={inputCls} value={f.petId} onChange={(e) => setF({ ...f, petId: e.target.value })}>
            <option value="">Select a pet…</option>{pets.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.species}</option>)}
          </select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Veterinarian"><select className={inputCls} value={f.vetId} onChange={(e) => setF({ ...f, vetId: e.target.value })}>
              {vets.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select></Field>
            <Field label="Date"><input type="date" min={TODAY} className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          </div>
          <Field label="Available slots">
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button key={s} type="button" disabled={taken.has(s)} onClick={() => setF({ ...f, time: s })}
                  className={`rounded-lg py-2 font-mono text-xs ring-1 disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${f.time === s ? "bg-brand/15 text-brand ring-brand/40" : "ring-border text-foreground"}`}>{s}</button>
              ))}
            </div>
          </Field>
          <Field label="Reason for visit"><input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Vaccination, limping, check-up" /></Field>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>{role === "owner" ? "Send request" : "Book"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Pets & Owners ---------------- */

export function PetDetail({ pet, onClose, children }: { pet: Pet | null; onClose: () => void; children?: ReactNode }) {
  const { db, owner, vet } = useLookup();
  const o = owner(pet?.ownerId);
  return (
    <Sheet open={!!pet} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {pet && (
          <>
            <SheetHeader><SheetTitle>Pet profile</SheetTitle></SheetHeader>
            <div className="mt-4 flex items-center gap-4 px-4">
              <PetPhoto pet={pet} className="size-20 rounded-xl" />
              <div><p className="text-xl font-semibold text-strong">{pet.name}</p><p className="text-sm text-muted-foreground">{pet.species} · {pet.breed} · {pet.age} yrs · {pet.sex}</p></div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 px-4 text-sm">
              {[["Weight", `${pet.weight} kg`], ["Color", pet.color], ["Microchip", pet.microchip], ["Owner", o?.name], ["Phone", o?.phone], ["Email", o?.email]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted p-3"><dt className="eyebrow">{k}</dt><dd className="mt-1 text-strong">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-3 grid gap-2 px-4">
              {pet.allergies !== "None" && <Pill tone="err">Allergy: {pet.allergies}</Pill>}
              {pet.chronic !== "None" && <Pill tone="warn">Chronic: {pet.chronic}</Pill>}
            </div>
            {children}
            <div className="mt-6 px-4 pb-6">
              <p className="eyebrow mb-2">Medical history</p>
              <ol className="space-y-3 border-l border-border pl-4">
                {db.records.filter((r) => r.petId === pet.id).sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-brand" />
                    <p className="font-mono text-[11px] text-brand">{fmtDate(r.date)} · {vet(r.vetId)?.name}</p>
                    <p className="text-sm font-medium text-strong">{r.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">{r.symptoms} → {r.treatment}</p>
                  </li>
                ))}
                {!db.records.some((r) => r.petId === pet.id) && <li className="text-xs text-muted-foreground">No visits recorded yet.</li>}
              </ol>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function PetsPage({ canRegister = true, eyebrow = "Registry", title = "Pets & Owners" }: { canRegister?: boolean; eyebrow?: string; title?: string }) {
  const { db, owner } = useLookup();
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState("All");
  const [sel, setSel] = useState<Pet | null>(null);
  const [open, setOpen] = useState(false);
  const rows = db.pets.filter((p) => (species === "All" || p.species === species) &&
    `${p.name} ${p.breed} ${owner(p.ownerId)?.name} ${owner(p.ownerId)?.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} sub={`${db.pets.length} pets · ${db.owners.length} owners on record.`}
        actions={canRegister && <Button onClick={() => setOpen(true)}><Plus />Register pet</Button>} />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search pet, breed, owner or phone" />
          <select aria-label="Species" value={species} onChange={(e) => setSpecies(e.target.value)} className={inputCls + " w-auto"}>
            {["All", "Dog", "Cat", "Bird", "Rabbit"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {rows.length ? (
          <Table head={<><Th>Pet</Th><Th>Species</Th><Th>Age</Th><Th>Owner</Th><Th>Phone</Th><Th>Alerts</Th></>}>
            {rows.map((p) => (
              <tr key={p.id} className="cursor-pointer" onClick={() => setSel(p)}>
                <Td><div className="flex items-center gap-3"><PetPhoto pet={p} /><span className="font-medium text-strong">{p.name}</span></div></Td>
                <Td>{p.species} · {p.breed}</Td><Td>{p.age} yrs</Td><Td>{owner(p.ownerId)?.name}</Td>
                <Td className="font-mono text-xs">{owner(p.ownerId)?.phone}</Td>
                <Td>{p.allergies !== "None" ? <Pill tone="err">Allergy</Pill> : <span className="text-xs text-faint">—</span>}</Td>
              </tr>
            ))}
          </Table>
        ) : <Empty title="No pets match" sub="Try a different search." />}
      </Panel>
      <PetDetail pet={sel} onClose={() => setSel(null)} />
      <RegisterDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function RegisterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { db } = useLookup();
  const blank = { ownerId: "new", oname: "", phone: "", email: "", name: "", species: "Dog", breed: "", age: "1", sex: "Male", weight: "", allergies: "" };
  const [f, setF] = useState(blank);
  const s = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = () => {
    if (!f.name || (f.ownerId === "new" && (!f.oname || !f.phone))) return toast.error("Fill in the required fields.");
    if (f.ownerId === "new" && db.owners.some((o) => o.phone === f.phone)) return toast.error("An owner with this phone already exists — select them instead.");
    const ownerId = f.ownerId === "new" ? uid("o") : f.ownerId;
    update((d) => ({
      ...d,
      owners: f.ownerId === "new" ? [...d.owners, { id: ownerId, name: f.oname, phone: f.phone, email: f.email, address: "" }] : d.owners,
      pets: [...d.pets, { id: uid("p"), name: f.name, species: f.species, breed: f.breed || "Mixed", age: +f.age, sex: f.sex as "Male", weight: +f.weight || 0, color: "-", ownerId, allergies: f.allergies || "None", chronic: "None", microchip: "-" }],
    }));
    toast.success(`${f.name} registered.`);
    setF(blank);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Register pet & owner</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <Field label="Owner"><select className={inputCls} value={f.ownerId} onChange={s("ownerId")}>
            <option value="new">+ New owner</option>{db.owners.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.phone}</option>)}
          </select></Field>
          {f.ownerId === "new" && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Owner name *"><input className={inputCls} value={f.oname} onChange={s("oname")} /></Field>
              <Field label="Phone *"><input className={inputCls} value={f.phone} onChange={s("phone")} /></Field>
              <Field label="Email"><input className={inputCls} value={f.email} onChange={s("email")} /></Field>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Pet name *"><input className={inputCls} value={f.name} onChange={s("name")} /></Field>
            <Field label="Species"><select className={inputCls} value={f.species} onChange={s("species")}>{["Dog", "Cat", "Bird", "Rabbit", "Other"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Breed"><input className={inputCls} value={f.breed} onChange={s("breed")} /></Field>
            <Field label="Age (yrs)"><input type="number" className={inputCls} value={f.age} onChange={s("age")} /></Field>
            <Field label="Sex"><select className={inputCls} value={f.sex} onChange={s("sex")}><option>Male</option><option>Female</option></select></Field>
            <Field label="Weight (kg)"><input type="number" className={inputCls} value={f.weight} onChange={s("weight")} /></Field>
          </div>
          <Field label="Known allergies"><input className={inputCls} value={f.allergies} onChange={s("allergies")} placeholder="None" /></Field>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Register</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Billing ---------------- */

export function BillingPage({ ownerId, eyebrow = "Finance" }: { ownerId?: string; eyebrow?: string }) {
  const { db, pet, owner } = useLookup();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pay, setPay] = useState<string | null>(null);
  const list = db.invoices.filter((i) => (!ownerId || pet(i.petId)?.ownerId === ownerId) && `${i.id} ${pet(i.petId)?.name}`.toLowerCase().includes(q.toLowerCase()));
  const outstanding = list.reduce((s, i) => s + invoiceTotal(i) - i.paid, 0);
  const tone = { Paid: "ok", Pending: "err", "Partially Paid": "warn" } as const;
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={ownerId ? "Invoices" : "Billing"} sub={`${inr(outstanding)} outstanding across ${list.filter((i) => i.status !== "Paid").length} invoices.`}
        actions={!ownerId && <Button onClick={() => setOpen(true)}><Plus />Create invoice</Button>} />
      <Panel>
        <div className="border-b border-border p-4"><SearchBox value={q} onChange={setQ} placeholder="Search invoice or pet" /></div>
        <Table head={<><Th>Invoice</Th><Th>Date</Th><Th>Pet</Th>{!ownerId && <Th>Owner</Th>}<Th>Total</Th><Th>Paid</Th><Th>Status</Th><Th className="text-right">Actions</Th></>}>
          {list.map((i) => (
            <tr key={i.id}>
              <Td className="font-mono text-xs text-brand">{i.id}</Td><Td className="font-mono text-xs">{fmtDate(i.date)}</Td>
              <Td className="text-strong">{pet(i.petId)?.name}</Td>{!ownerId && <Td>{owner(pet(i.petId)?.ownerId)?.name}</Td>}
              <Td className="text-strong">{inr(invoiceTotal(i))}</Td><Td>{inr(i.paid)}</Td>
              <Td><Pill tone={tone[i.status]}>{i.status}</Pill></Td>
              <Td className="text-right">
                {i.status !== "Paid" ? <Button size="sm" variant="outline" onClick={() => setPay(i.id)}>{ownerId ? "Pay now" : "Record payment"}</Button>
                  : <Button size="sm" variant="ghost" onClick={() => toast.success(`${i.id}.pdf downloaded (demo)`)}><Download />PDF</Button>}
              </Td>
            </tr>
          ))}
        </Table>
        {!list.length && <Empty title="No invoices yet" />}
      </Panel>
      <PaymentDialog id={pay} onClose={() => setPay(null)} />
      {!ownerId && <InvoiceDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}

function PaymentDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { db } = useLookup();
  const inv = db.invoices.find((i) => i.id === id);
  const due = inv ? invoiceTotal(inv) - inv.paid : 0;
  const [amt, setAmt] = useState("");
  const [method, setMethod] = useState("UPI");
  const submit = () => {
    const n = +amt || due;
    if (n <= 0 || n > due) return toast.error(`Enter an amount up to ${inr(due)}.`);
    update((d) => ({ ...d, invoices: d.invoices.map((i) => i.id === id ? { ...i, paid: i.paid + n, method, status: i.paid + n >= invoiceTotal(i) ? "Paid" : "Partially Paid" } : i) }));
    toast.success(`Payment of ${inr(n)} recorded.`);
    setAmt(""); onClose();
  };
  return (
    <Dialog open={!!inv} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Payment · {inv?.id}</DialogTitle></DialogHeader>
        {inv && <div className="grid gap-4">
          <ul className="divide-y divide-border rounded-lg ring-1 ring-border text-sm">
            {inv.items.map((x) => <li key={x.label} className="flex justify-between px-3 py-2"><span>{x.label}</span><span className="text-strong">{inr(x.amount)}</span></li>)}
            <li className="flex justify-between px-3 py-2 font-semibold text-brand"><span>Balance due</span><span>{inr(due)}</span></li>
          </ul>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><input type="number" className={inputCls} placeholder={String(due)} value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
            <Field label="Method"><select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{["UPI", "Card", "Cash"].map((m) => <option key={m}>{m}</option>)}</select></Field>
          </div>
        </div>}
        <DialogFooter><Button onClick={submit}>Confirm payment</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { db } = useLookup();
  const [petId, setPetId] = useState("");
  const [items, setItems] = useState([{ label: "Consultation", amount: 700 }]);
  const total = items.reduce((s, i) => s + (+i.amount || 0), 0);
  const submit = () => {
    if (!petId) return toast.error("Select a pet.");
    const id = `INV-${1043 + db.invoices.length - 4}`;
    update((d) => ({ ...d, invoices: [{ id, petId, date: TODAY, items: items.map((i) => ({ ...i, amount: +i.amount })), status: "Pending", paid: 0 }, ...d.invoices] }));
    toast.success(`${id} created.`);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create invoice</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Pet"><select className={inputCls} value={petId} onChange={(e) => setPetId(e.target.value)}><option value="">Select…</option>{db.pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          {items.map((it, k) => (
            <div key={k} className="grid grid-cols-[1fr_120px] gap-2">
              <input className={inputCls} value={it.label} onChange={(e) => setItems(items.map((x, j) => j === k ? { ...x, label: e.target.value } : x))} />
              <input type="number" className={inputCls} value={it.amount} onChange={(e) => setItems(items.map((x, j) => j === k ? { ...x, amount: +e.target.value } : x))} />
            </div>
          ))}
          <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setItems([...items, { label: "", amount: 0 }])}><Plus />Add line</Button>
          <p className="text-right text-sm">Total <span className="ml-2 text-lg font-semibold text-brand">{inr(total)}</span></p>
        </div>
        <DialogFooter><Button onClick={submit}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Vaccinations / Prescriptions ---------------- */

export function VaccinationsPage({ ownerId, canRecord }: { ownerId?: string; canRecord?: boolean }) {
  const { db, pet } = useLookup();
  const [open, setOpen] = useState(false);
  const list = db.vaccinations.filter((v) => !ownerId || pet(v.petId)?.ownerId === ownerId).sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1));
  const dueTone = (d: string) => (d < TODAY ? "err" : d <= addDays(30) ? "warn" : "ok");
  const dueLabel = (d: string) => (d < TODAY ? "Overdue" : d <= addDays(30) ? "Due soon" : "Up to date");
  return (
    <>
      <PageHeader eyebrow="Preventive care" title="Vaccinations" sub={`${list.filter((v) => v.nextDue <= addDays(30)).length} vaccinations due within 30 days.`}
        actions={canRecord && <Button onClick={() => setOpen(true)}><Plus />Record vaccination</Button>} />
      <Panel>
        <Table head={<><Th>Pet</Th><Th>Vaccine</Th><Th>Given</Th><Th>Next due</Th><Th>Status</Th></>}>
          {list.map((v) => (
            <tr key={v.id}>
              <Td><div className="flex items-center gap-3"><PetPhoto pet={pet(v.petId)} /><span className="text-strong">{pet(v.petId)?.name}</span></div></Td>
              <Td className="text-strong">{v.vaccine}</Td><Td className="font-mono text-xs">{fmtDate(v.date)}</Td><Td className="font-mono text-xs">{fmtDate(v.nextDue)}</Td>
              <Td><Pill tone={dueTone(v.nextDue)}>{dueLabel(v.nextDue)}</Pill></Td>
            </tr>
          ))}
        </Table>
      </Panel>
      {canRecord && <RecordVaccine open={open} onOpenChange={setOpen} />}
    </>
  );
}
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export function RecordVaccine({ open, onOpenChange, petId: fixed }: { open: boolean; onOpenChange: (o: boolean) => void; petId?: string }) {
  const { db } = useLookup();
  const [f, setF] = useState({ petId: fixed ?? "", vaccine: "Rabies", nextDue: addDays(365) });
  const submit = () => {
    const pid = fixed ?? f.petId;
    if (!pid) return toast.error("Select a pet.");
    update((d) => ({ ...d, vaccinations: [...d.vaccinations, { id: uid("vx"), petId: pid, vaccine: f.vaccine, date: TODAY, nextDue: f.nextDue, vetId: "v1" }] }));
    toast.success(`${f.vaccine} recorded.`); onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record vaccination</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {!fixed && <Field label="Pet"><select className={inputCls} value={f.petId} onChange={(e) => setF({ ...f, petId: e.target.value })}><option value="">Select…</option>{db.pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
          <Field label="Vaccine"><select className={inputCls} value={f.vaccine} onChange={(e) => setF({ ...f, vaccine: e.target.value })}>{["Rabies", "DHPP", "FVRCP", "FeLV", "Leptospirosis", "Bordetella"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Next due"><input type="date" className={inputCls} value={f.nextDue} onChange={(e) => setF({ ...f, nextDue: e.target.value })} /></Field>
        </div>
        <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrescriptionsPage({ ownerId }: { ownerId?: string }) {
  const { db, pet, vet } = useLookup();
  const list = db.prescriptions.filter((r) => !ownerId || pet(r.petId)?.ownerId === ownerId);
  return (
    <>
      <PageHeader eyebrow="Pharmacy" title="Prescriptions" sub={`${list.length} prescriptions on record.`} />
      <Panel>
        {list.length ? (
          <Table head={<><Th>Date</Th><Th>Pet</Th><Th>Medicine</Th><Th>Dosage</Th><Th>Frequency</Th><Th>Duration</Th><Th>Prescribed by</Th></>}>
            {list.map((r) => (
              <tr key={r.id}>
                <Td className="font-mono text-xs">{fmtDate(r.date)}</Td><Td className="text-strong">{pet(r.petId)?.name}</Td>
                <Td className="text-strong">{r.medicine}</Td><Td>{r.dosage}</Td><Td>{r.frequency}</Td><Td>{r.duration}</Td><Td>{vet(r.vetId)?.name}</Td>
              </tr>
            ))}
          </Table>
        ) : <Empty title="No prescriptions" />}
      </Panel>
    </>
  );
}

/* ---------------- Help & Settings ---------------- */

const FAQ: Record<Role, [string, string][]> = {
  admin: [["How do I add a staff account?", "Go to Users & Roles → Add user, pick a role and save."], ["When do low-stock alerts appear?", "When an item's stock falls below its reorder threshold."], ["Can I export reports?", "Yes — use the PDF/CSV buttons on the Reports page."]],
  veterinarian: [["How do I start an exam?", "Open Today's Queue and press Start examination on a checked-in patient."], ["Where is a pet's history?", "Click any patient to open their profile with the full medical timeline."], ["How do I finish a visit?", "Save the exam form and press Complete visit."]],
  receptionist: [["How do I check a pet in?", "Open Check-in and press Check in next to a confirmed appointment."], ["How are double-bookings avoided?", "Booked slots are disabled when you pick a vet and date."], ["How do I take payment?", "Billing → Record payment on any pending invoice."]],
  owner: [["How do I book a visit?", "Appointments → Request appointment. The clinic confirms it."], ["Can I cancel?", "Yes, while it is still Requested or Confirmed."], ["Where are my bills?", "Invoices shows every bill and lets you pay online (demo)."]],
};
export function HelpPage({ role }: { role: Role }) {
  return (
    <>
      <PageHeader eyebrow="Support" title="Help center" sub="Answers for the tasks you do most." />
      <Panel className="max-w-3xl" bodyClass="px-5">
        <Accordion type="single" collapsible>
          {FAQ[role].map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-strong"><span className="flex items-center gap-2"><BookOpen className="size-4 text-brand" />{q}</span></AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </Panel>
    </>
  );
}

export function SettingsPage() {
  const db = useDB();
  const [profile, setProfile] = useState({
    clinicName: db.settings.clinicName,
    openingHours: db.settings.openingHours,
    slotDurationMinutes: db.settings.slotDurationMinutes,
    consultationFee: db.settings.consultationFee,
  });
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setProfile({
      clinicName: db.settings.clinicName,
      openingHours: db.settings.openingHours,
      slotDurationMinutes: db.settings.slotDurationMinutes,
      consultationFee: db.settings.consultationFee,
    });
  }, [db.settings.clinicName, db.settings.openingHours, db.settings.slotDurationMinutes, db.settings.consultationFee]);

  const saveProfile = () => {
    update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        clinicName: profile.clinicName.trim() || "VetCore Animal Hospital",
        openingHours: profile.openingHours.trim() || "Mon–Sat · 09:00–18:00",
        slotDurationMinutes: Number(profile.slotDurationMinutes) || 30,
        consultationFee: Number(profile.consultationFee) || 700,
      },
    }));
    toast.success("Clinic settings saved.");
  };

  const toggleSetting = (key: keyof ClinicSettings) => {
    update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        [key]: !d.settings[key],
      },
    }));
    toast.success("Preference updated.");
  };

  const handleReset = () => {
    resetDemoDB();
    setResetOpen(false);
    toast.success("Demo database reset to initial seeds.");
  };

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Clinic settings" sub="Configure operational parameters, notification rules, and demo persistence." />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Panel title="Clinic profile" bodyClass="grid gap-3 p-5">
          <Field label="Clinic name">
            <input
              className={inputCls}
              value={profile.clinicName}
              onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })}
            />
          </Field>
          <Field label="Opening hours">
            <input
              className={inputCls}
              value={profile.openingHours}
              onChange={(e) => setProfile({ ...profile, openingHours: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slot length">
              <select
                className={inputCls}
                value={String(profile.slotDurationMinutes)}
                onChange={(e) => setProfile({ ...profile, slotDurationMinutes: Number(e.target.value) })}
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </Field>
            <Field label="Consultation fee (₹)">
              <input
                type="number"
                className={inputCls}
                value={profile.consultationFee}
                onChange={(e) => setProfile({ ...profile, consultationFee: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Button className="justify-self-start" onClick={saveProfile}>Save profile</Button>
        </Panel>

        <Panel title="Notifications & Automation" bodyClass="divide-y divide-border">
          {([
            ["smsReminders", "SMS reminders", "Send automated SMS reminders for appointments"],
            ["emailReceipts", "Email receipts", "Dispatch PDF payment receipts to pet owners"],
            ["vaxReminders", "Vaccination reminders", "Trigger notifications when vaccinations are due"],
            ["autoConfirmBookings", "Auto-confirm owner requests", "Automatically confirm owner booking requests"],
          ] as const).map(([k, l, hint]) => (
            <label key={k} className="flex items-center justify-between px-5 py-4 text-sm">
              <div>
                <p className="font-medium text-strong">{l}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={Boolean(db.settings[k as keyof ClinicSettings])}
                onCheckedChange={() => toggleSetting(k as keyof ClinicSettings)}
              />
            </label>
          ))}
        </Panel>
      </div>

      <div className="mt-6 max-w-4xl">
        <Panel title="Demo Environment" bodyClass="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-strong">Reset demo database</p>
            <p className="text-xs text-muted-foreground">Restore all initial sample appointments, patients, records, stock levels, and settings.</p>
          </div>
          <Button variant="outline" className="border-err/30 text-err hover:bg-err/10" onClick={() => setResetOpen(true)}>
            Reset to demo seeds
          </Button>
        </Panel>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will clear your current in-memory and persisted demo changes and restore the original seed dataset.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset}>Yes, reset demo data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { Kpi };
