import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Download, AlertTriangle, PackagePlus, UserPlus, PawPrint, BarChart3, CalendarDays } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TODAY, fmtDate, inr, invoiceTotal, uid, update, type Role, type InventoryItem } from "@/lib/data";
import { ROLES } from "@/lib/roles";
import { Field, Kpi, PageHeader, Panel, Pill, SearchBox, StatusBadge, Table, Td, Th, inputCls, PetPhoto } from "@/components/vc/kit";
import { STATUSES, addDays, useLookup } from "./shared";

const C = { brand: "var(--brand)", amber: "var(--amber)", ok: "var(--ok)", err: "var(--err)", warn: "var(--warn)", muted: "var(--chart-5)" };
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }, labelStyle: { color: "var(--strong)" } };
const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const apptSeries = week.map((d, i) => ({ d, booked: [14, 18, 12, 20, 17, 22, 8][i], done: [12, 16, 11, 17, 15, 19, 7][i] }));
const revSeries = week.map((d, i) => ({ d, rev: [18400, 22100, 15800, 26300, 21900, 29800, 9800][i] }));

export function AdminDashboard() {
  const { db, pet } = useLookup();
  const nav = useNavigate();
  const go = (page: string) => nav({ to: "/$role/$page", params: { role: "admin", page } });
  const today = db.appointments.filter((a) => a.date === TODAY);
  const low = db.inventory.filter((i) => i.stock < i.threshold);
  const expiring = db.inventory.filter((i) => i.expiry <= addDays(45));
  const revenueToday = db.invoices.filter((i) => i.date === TODAY).reduce((s, i) => s + i.paid, 0);
  const pending = db.invoices.filter((i) => i.status !== "Paid");
  const breakdown = STATUSES.map((s) => ({ name: s, value: db.appointments.filter((a) => a.status === s).length })).filter((x) => x.value);
  const colors = [C.amber, C.muted, C.warn, C.brand, C.ok, C.err, C.err];
  return (
    <>
      <PageHeader eyebrow="Operations console" title="Clinic overview" sub={`${today.length} appointments today · ${low.length} items below reorder level · ${pending.length} invoices awaiting payment.`}
        actions={<>
          <Button variant="outline" onClick={() => go("pets")}><PawPrint />Register pet</Button>
          <Button variant="outline" onClick={() => go("users")}><UserPlus />Add user</Button>
          <Button variant="outline" onClick={() => go("inventory")}><PackagePlus />Add item</Button>
          <Button variant="outline" onClick={() => go("reports")}><BarChart3 />Reports</Button>
          <Button onClick={() => go("appointments")}><CalendarDays />Appointments</Button>
        </>} />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Today's appts" value={today.length} hint="+3 vs last week" tone="ok" glow />
        <Kpi label="Completed" value={today.filter((a) => a.status === "Completed").length} hint="visits closed" />
        <Kpi label="Revenue today" value={inr(revenueToday)} hint="collected" tone="ok" />
        <Kpi label="Active pets" value={db.pets.length} hint={`${db.owners.length} owners`} />
        <Kpi label="Low stock" value={low.length} hint="needs reorder" tone="err" />
        <Kpi label="Pending payments" value={pending.length} hint={inr(pending.reduce((s, i) => s + invoiceTotal(i) - i.paid, 0))} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Appointments · this week" meta="booked vs completed" className="xl:col-span-2" bodyClass="h-64 p-4">
          <ResponsiveContainer><BarChart data={apptSeries}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="d" stroke="var(--faint)" fontSize={11} /><YAxis stroke="var(--faint)" fontSize={11} /><Tooltip {...tip} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="booked" fill={C.brand} fillOpacity={0.35} radius={[3, 3, 0, 0]} /><Bar dataKey="done" fill={C.brand} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
        </Panel>
        <Panel title="Status breakdown" bodyClass="flex items-center gap-4 p-5">
          <div className="h-40 w-40"><ResponsiveContainer><PieChart><Pie data={breakdown} dataKey="value" innerRadius={45} outerRadius={70} stroke="none">{breakdown.map((b) => <Cell key={b.name} fill={colors[STATUSES.indexOf(b.name as never)]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div>
          <ul className="space-y-1.5 text-xs">{breakdown.map((b) => <li key={b.name} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: colors[STATUSES.indexOf(b.name as never)] }} />{b.name} · {b.value}</li>)}</ul>
        </Panel>
        <Panel title="Revenue · this week" meta={inr(revSeries.reduce((s, x) => s + (x.rev ?? 0), 0))} className="xl:col-span-2" bodyClass="h-56 p-4">
          <ResponsiveContainer><AreaChart data={revSeries}><defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.amber} stopOpacity={0.4} /><stop offset="1" stopColor={C.amber} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="d" stroke="var(--faint)" fontSize={11} /><YAxis stroke="var(--faint)" fontSize={11} /><Tooltip {...tip} formatter={(v: number) => inr(v)} /><Area dataKey="rev" stroke={C.amber} fill="url(#rv)" strokeWidth={2} /></AreaChart></ResponsiveContainer>
        </Panel>
        <Panel title="Inventory alerts" meta={`${low.length + expiring.length} alerts`}>
          <ul className="divide-y divide-border">
            {low.map((i) => <li key={i.id} className="flex items-center gap-3 px-5 py-3 text-sm"><AlertTriangle className="size-4 text-err" /><span className="flex-1 text-strong">{i.name}</span><Pill tone="err">{i.stock}/{i.threshold}</Pill></li>)}
            {expiring.map((i) => <li key={i.id + "e"} className="flex items-center gap-3 px-5 py-3 text-sm"><AlertTriangle className="size-4 text-warn" /><span className="flex-1 text-strong">{i.name} <span className="font-mono text-[10px] text-faint">{i.batch}</span></span><Pill tone="warn">exp {fmtDate(i.expiry)}</Pill></li>)}
          </ul>
        </Panel>
        <Panel title="Upcoming appointments" className="xl:col-span-2">
          <ul className="divide-y divide-border">
            {db.appointments.filter((a) => a.date >= TODAY && !["Completed", "Canceled", "No-show"].includes(a.status)).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)).slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3"><span className="w-20 font-mono text-xs text-brand">{a.date === TODAY ? a.time : fmtDate(a.date).slice(0, 6)}</span><PetPhoto pet={pet(a.petId)} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-strong">{pet(a.petId)?.name}</p><p className="truncate text-xs text-muted-foreground">{a.reason}</p></div><StatusBadge status={a.status} /></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3 p-5 text-sm">
            {["Emily Carter checked in Coco", "Dr. Wilson completed Biscuit's exam", "INV-1042 paid via UPI", "Stock received: Carprofen ×100", "New owner registered: Ana Reyes"].map((t, i) => (
              <li key={t} className="flex gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" /><div><p className="text-foreground">{t}</p><p className="font-mono text-[10px] text-faint">{[5, 22, 40, 75, 120][i]} min ago</p></div></li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

export function InventoryPage() {
  const { db } = useLookup();
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [open, setOpen] = useState(false);
  const [recv, setRecv] = useState<InventoryItem | null>(null);
  const list = db.inventory.filter((i) => (!onlyLow || i.stock < i.threshold) && `${i.name} ${i.category} ${i.supplier}`.toLowerCase().includes(q.toLowerCase()));
  const value = db.inventory.reduce((s, i) => s + i.stock * i.unitCost, 0);
  return (
    <>
      <PageHeader eyebrow="Pharmacy & supplies" title="Inventory" sub={`Stock valuation ${inr(value)} · ${db.inventory.filter((i) => i.stock < i.threshold).length} items below threshold.`}
        actions={<Button onClick={() => setOpen(true)}><Plus />Add item</Button>} />
      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search item, category, supplier" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="accent-[var(--brand)]" />Low stock only</label>
        </div>
        <Table head={<><Th>Item</Th><Th>Category</Th><Th>Stock</Th><Th>Threshold</Th><Th>Batch</Th><Th>Expiry</Th><Th>Supplier</Th><Th className="text-right">Actions</Th></>}>
          {list.map((i) => {
            const low = i.stock < i.threshold, exp = i.expiry <= addDays(45);
            return (
              <tr key={i.id}>
                <Td className="font-medium text-strong">{i.name}</Td><Td>{i.category}</Td>
                <Td><div className="flex items-center gap-2"><span className={low ? "text-err" : "text-strong"}>{i.stock} {i.unit}</span>{low && <Pill tone="err" icon={<AlertTriangle />}>Low</Pill>}</div>
                  <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted"><div className={low ? "h-full bg-err" : "h-full bg-ok"} style={{ width: `${Math.min(100, (i.stock / (i.threshold * 2)) * 100)}%` }} /></div></Td>
                <Td>{i.threshold}</Td><Td className="font-mono text-xs">{i.batch}</Td>
                <Td>{exp ? <Pill tone="warn">{fmtDate(i.expiry)}</Pill> : <span className="font-mono text-xs">{fmtDate(i.expiry)}</span>}</Td>
                <Td>{i.supplier}</Td>
                <Td className="text-right"><Button size="sm" variant="outline" onClick={() => setRecv(i)}>Receive stock</Button></Td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <ReceiveDialog item={recv} onClose={() => setRecv(null)} />
      <AddItemDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function ReceiveDialog({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const [qty, setQty] = useState("50");
  const [batch, setBatch] = useState("");
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive stock · {item?.name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity"><input type="number" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Field label="New batch no."><input className={inputCls} value={batch} onChange={(e) => setBatch(e.target.value)} placeholder={item?.batch} /></Field>
        </div>
        <DialogFooter><Button onClick={() => {
          if (!item || +qty <= 0) return toast.error("Enter a quantity.");
          update((d) => ({ ...d, inventory: d.inventory.map((i) => i.id === item.id ? { ...i, stock: i.stock + +qty, batch: batch || i.batch } : i) }));
          toast.success(`+${qty} ${item.unit} of ${item.name}`); onClose();
        }}>Add to stock</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [f, setF] = useState({ name: "", category: "Medicine", stock: "0", threshold: "10", unit: "units", supplier: "", batch: "", expiry: addDays(365), unitCost: "0" });
  const s = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add inventory item</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><Field label="Name *"><input className={inputCls} value={f.name} onChange={s("name")} /></Field></div>
          <Field label="Category"><input className={inputCls} value={f.category} onChange={s("category")} /></Field>
          <Field label="Stock"><input type="number" className={inputCls} value={f.stock} onChange={s("stock")} /></Field>
          <Field label="Threshold"><input type="number" className={inputCls} value={f.threshold} onChange={s("threshold")} /></Field>
          <Field label="Unit"><input className={inputCls} value={f.unit} onChange={s("unit")} /></Field>
          <Field label="Supplier"><input className={inputCls} value={f.supplier} onChange={s("supplier")} /></Field>
          <Field label="Batch"><input className={inputCls} value={f.batch} onChange={s("batch")} /></Field>
          <Field label="Expiry"><input type="date" className={inputCls} value={f.expiry} onChange={s("expiry")} /></Field>
        </div>
        <DialogFooter><Button onClick={() => {
          if (!f.name) return toast.error("Name is required.");
          update((d) => ({ ...d, inventory: [...d.inventory, { ...f, id: uid("i"), stock: +f.stock, threshold: +f.threshold, unitCost: +f.unitCost }] }));
          toast.success(`${f.name} added.`); onOpenChange(false);
        }}>Add item</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReportsPage() {
  const { db } = useLookup();
  const [range, setRange] = useState("7d");
  const total = db.appointments.length;
  const noShow = db.appointments.filter((a) => a.status === "No-show").length;
  const usage = db.inventory.map((i) => ({ name: i.name.split(" ")[0], used: Math.round(i.threshold * 1.4) }));
  const exp = (t: string) => toast.success(`Report exported as ${t} (demo)`);
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports"
        actions={<>
          <div className="flex rounded-lg ring-1 ring-border">{["7d", "30d", "90d", "1y"].map((r) => <button key={r} onClick={() => setRange(r)} className={`px-3 py-2 font-mono text-xs ${range === r ? "bg-brand/10 text-brand" : "text-muted-foreground"}`}>{r}</button>)}</div>
          <Button variant="outline" onClick={() => exp("CSV")}><Download />CSV</Button><Button onClick={() => exp("PDF")}><Download />PDF</Button>
        </>} />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Revenue" value={inr(db.invoices.reduce((s, i) => s + i.paid, 0) * (range === "7d" ? 1 : range === "30d" ? 4 : 12))} hint="+8.2% vs prior" tone="ok" glow />
        <Kpi label="Appointment volume" value={total * (range === "7d" ? 1 : 4)} />
        <Kpi label="No-show rate" value={`${Math.round((noShow / total) * 100)}%`} hint="target < 10%" tone="amber" />
        <Kpi label="Stock valuation" value={inr(db.inventory.reduce((s, i) => s + i.stock * i.unitCost, 0))} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue trend" bodyClass="h-64 p-4">
          <ResponsiveContainer><AreaChart data={revSeries}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="d" stroke="var(--faint)" fontSize={11} /><YAxis stroke="var(--faint)" fontSize={11} /><Tooltip {...tip} /><Area dataKey="rev" stroke={C.brand} fill={C.brand} fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer>
        </Panel>
        <Panel title="Inventory usage" bodyClass="h-64 p-4">
          <ResponsiveContainer><BarChart data={usage}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="name" stroke="var(--faint)" fontSize={11} /><YAxis stroke="var(--faint)" fontSize={11} /><Tooltip {...tip} cursor={{ fill: "var(--accent)" }} /><Bar dataKey="used" fill={C.amber} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
        </Panel>
      </div>
    </>
  );
}

export function UsersPage() {
  const { db } = useLookup();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ id?: string; name: string; email: string; role: Role } | null>(null);
  const list = db.users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="Access control" title="Users & roles" sub={`${db.users.filter((u) => u.status === "Active").length} active staff accounts.`}
        actions={<Button onClick={() => setEdit({ name: "", email: "", role: "receptionist" })}><Plus />Add user</Button>} />
      <Panel>
        <div className="border-b border-border p-4"><SearchBox value={q} onChange={setQ} placeholder="Search users" /></div>
        <Table head={<><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th className="text-right">Actions</Th></>}>
          {list.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium text-strong">{u.name}</Td><Td className="font-mono text-xs">{u.email}</Td>
              <Td><Pill tone="brand">{ROLES[u.role].label}</Pill></Td>
              <Td><Pill tone={u.status === "Active" ? "ok" : "muted"}>{u.status}</Pill></Td>
              <Td className="text-right"><div className="flex justify-end gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setEdit({ id: u.id, name: u.name, email: u.email, role: u.role })}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => { update((d) => ({ ...d, users: d.users.map((x) => x.id === u.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x) })); toast.success(`${u.name} ${u.status === "Active" ? "deactivated" : "reactivated"}`); }}>
                  {u.status === "Active" ? "Deactivate" : "Activate"}</Button>
              </div></Td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit user" : "Add user"}</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-3">
            <Field label="Full name"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email"><input className={inputCls} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Role"><select className={inputCls} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Role })}>
              {(["admin", "veterinarian", "receptionist"] as Role[]).map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}</select></Field>
          </div>}
          <DialogFooter><Button onClick={() => {
            if (!edit?.name || !edit.email) return toast.error("Name and email are required.");
            update((d) => ({ ...d, users: edit.id ? d.users.map((u) => u.id === edit.id ? { ...u, ...edit } : u) : [...d.users, { ...edit, id: uid("u"), status: "Active" }] }));
            toast.success("User saved."); setEdit(null);
          }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VetsPage() {
  const { db } = useLookup();
  return (
    <>
      <PageHeader eyebrow="Clinical staff" title="Veterinarians" />
      <div className="grid gap-4 md:grid-cols-3">
        {db.users.filter((u) => u.role === "veterinarian").map((v) => {
          const appts = db.appointments.filter((a) => a.vetId === v.id && a.date === TODAY);
          return (
            <div key={v.id} className="panel p-5">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-amber/15 text-sm font-semibold text-amber ring-1 ring-amber/30">{v.name.split(" ").slice(1).map((x) => x[0]).join("")}</span>
                <div><p className="font-medium text-strong">{v.name}</p><p className="text-xs text-muted-foreground">{v.title}</p></div></div>
              <div className="mt-4 flex items-center justify-between"><span className="eyebrow">Today</span><span className="font-mono text-sm text-brand">{appts.length} appts</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand shadow-glow" style={{ width: `${Math.min(100, appts.length * 14)}%` }} /></div>
            </div>
          );
        })}
      </div>
    </>
  );
}
