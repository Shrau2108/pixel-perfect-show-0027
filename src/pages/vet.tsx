import { useState } from "react";
import { toast } from "sonner";
import { Play, History, CheckCircle2, Syringe, Pill as PillIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DEMO_VET_ID, TODAY, fmtDate, setApptStatus, uid, update, type Appointment, type Pet } from "@/lib/data";
import { Empty, Field, Kpi, PageHeader, Panel, PetPhoto, Pill, SearchBox, StatusBadge, Table, Td, Th, inputCls } from "@/components/vc/kit";
import { PetDetail, RecordVaccine, addDays, useLookup } from "./shared";

function useQueue() {
  const { db } = useLookup();
  return db.appointments.filter((a) => a.date === TODAY && a.vetId === DEMO_VET_ID).sort((a, b) => (a.time < b.time ? -1 : 1));
}

function QueueCard({ a, onExam, onHistory }: { a: Appointment; onExam: (a: Appointment) => void; onHistory: (p: Pet) => void }) {
  const { pet, owner } = useLookup();
  const p = pet(a.petId)!;
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <span className="w-12 shrink-0 font-mono text-xs text-brand">{a.time}</span>
      <PetPhoto pet={p} className="size-12 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-strong">{p.name} <span className="font-normal text-muted-foreground">· {p.species} · {p.breed}</span></p>
        <p className="truncate text-xs text-muted-foreground">Owner: {owner(p.ownerId)?.name} · {a.reason}</p>
        {p.allergies !== "None" && <p className="mt-1 text-[11px] text-err">⚠ Allergy: {p.allergies}</p>}
      </div>
      <StatusBadge status={a.status} />
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => onHistory(p)}><History />History</Button>
        {a.status === "Checked In" && <Button size="sm" onClick={() => { setApptStatus(a.id, "In Progress"); onExam(a); }}><Play />Start examination</Button>}
        {a.status === "In Progress" && <Button size="sm" variant="outline" onClick={() => onExam(a)}>Continue exam</Button>}
      </div>
    </li>
  );
}

function Queue({ limit }: { limit?: number }) {
  const q = useQueue();
  const [exam, setExam] = useState<Appointment | null>(null);
  const [hist, setHist] = useState<Pet | null>(null);
  const active = q.filter((a) => !["Canceled", "No-show"].includes(a.status));
  return (
    <>
      <Panel title="Today's patient queue" meta={`${active.length} slots`}>
        {active.length ? <ul className="divide-y divide-border">{active.slice(0, limit).map((a) => <QueueCard key={a.id} a={a} onExam={setExam} onHistory={setHist} />)}</ul>
          : <Empty title="Queue is clear" sub="No patients scheduled for you today." />}
      </Panel>
      <ExamSheet appt={exam} onClose={() => setExam(null)} />
      <PetDetail pet={hist} onClose={() => setHist(null)} />
    </>
  );
}

function ExamSheet({ appt, onClose }: { appt: Appointment | null; onClose: () => void }) {
  const { pet, owner, db } = useLookup();
  const p = appt ? pet(appt.petId) : undefined;
  const blank = { weight: "", temp: "", hr: "", symptoms: "", diagnosis: "", treatment: "", notes: "", medicine: "", dosage: "", frequency: "Twice daily", duration: "7 days" };
  const [f, setF] = useState(blank);
  const [vax, setVax] = useState(false);
  const s = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = (complete: boolean) => {
    if (!appt || !p) return;
    if (!f.diagnosis) return toast.error("Add a diagnosis before saving.");
    if (f.medicine && p.allergies !== "None" && f.medicine.toLowerCase().includes(p.allergies.toLowerCase().split(" ")[0])) return toast.error(`${p.name} is allergic to ${p.allergies}.`);
    update((d) => ({
      ...d,
      records: [...d.records, { id: uid("m"), petId: p.id, vetId: DEMO_VET_ID, date: TODAY, symptoms: f.symptoms, diagnosis: f.diagnosis, treatment: f.treatment, notes: f.notes, weight: +f.weight || p.weight, temp: +f.temp || 38.5 }],
      prescriptions: f.medicine ? [...d.prescriptions, { id: uid("rx"), petId: p.id, vetId: DEMO_VET_ID, date: TODAY, medicine: f.medicine, dosage: f.dosage, frequency: f.frequency, duration: f.duration }] : d.prescriptions,
      inventory: f.medicine ? d.inventory.map((i) => i.name.toLowerCase().startsWith(f.medicine.toLowerCase().split(" ")[0]) ? { ...i, stock: Math.max(0, i.stock - 1) } : i) : d.inventory,
    }));
    if (complete) setApptStatus(appt.id, "Completed");
    toast.success(complete ? `Visit completed for ${p.name}.` : "Exam notes saved.");
    setF(blank); onClose();
  };
  return (
    <Sheet open={!!appt} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {p && appt && (
          <>
            <SheetHeader><SheetTitle>Examination · {appt.reason}</SheetTitle></SheetHeader>
            <div className="grid gap-5 px-4 pb-8">
              <div className="panel flex items-center gap-4 p-4">
                <PetPhoto pet={p} className="size-16 rounded-xl" />
                <div className="flex-1"><p className="text-lg font-semibold text-strong">{p.name}</p><p className="text-sm text-muted-foreground">{p.species} · {p.breed} · {p.age} yrs · {p.sex} · {p.weight} kg</p><p className="text-xs text-muted-foreground">Owner: {owner(p.ownerId)?.name}</p></div>
                <div className="grid gap-1">{p.allergies !== "None" && <Pill tone="err">Allergy: {p.allergies}</Pill>}{p.chronic !== "None" && <Pill tone="warn">{p.chronic}</Pill>}</div>
              </div>
              <div>
                <p className="eyebrow mb-2">Vitals</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Weight (kg)"><input className={inputCls} value={f.weight} onChange={s("weight")} placeholder={String(p.weight)} /></Field>
                  <Field label="Temp (°C)"><input className={inputCls} value={f.temp} onChange={s("temp")} placeholder="38.5" /></Field>
                  <Field label="Heart rate"><input className={inputCls} value={f.hr} onChange={s("hr")} placeholder="bpm" /></Field>
                </div>
              </div>
              <Field label="Symptoms / observations"><textarea rows={2} className={inputCls} value={f.symptoms} onChange={s("symptoms")} /></Field>
              <Field label="Diagnosis *"><input className={inputCls} value={f.diagnosis} onChange={s("diagnosis")} /></Field>
              <Field label="Treatment"><textarea rows={2} className={inputCls} value={f.treatment} onChange={s("treatment")} /></Field>
              <div className="panel grid gap-3 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-strong"><PillIcon className="size-4 text-brand" />Prescription</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Medicine"><input list="meds" className={inputCls} value={f.medicine} onChange={s("medicine")} /><datalist id="meds">{db.inventory.map((i) => <option key={i.id} value={i.name} />)}</datalist></Field>
                  <Field label="Dosage"><input className={inputCls} value={f.dosage} onChange={s("dosage")} /></Field>
                  <Field label="Frequency"><input className={inputCls} value={f.frequency} onChange={s("frequency")} /></Field>
                  <Field label="Duration"><input className={inputCls} value={f.duration} onChange={s("duration")} /></Field>
                </div>
              </div>
              <Field label="Clinical notes"><textarea rows={2} className={inputCls} value={f.notes} onChange={s("notes")} /></Field>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setVax(true)}><Syringe />Record vaccination</Button>
                <Button variant="outline" onClick={() => save(false)}><Save />Save notes</Button>
                <Button className="ml-auto" onClick={() => save(true)}><CheckCircle2 />Complete visit</Button>
              </div>
            </div>
            <RecordVaccine open={vax} onOpenChange={setVax} petId={p.id} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function VetDashboard() {
  const q = useQueue();
  const { db } = useLookup();
  const c = (s: string) => q.filter((a) => a.status === s).length;
  const due = db.vaccinations.filter((v) => v.nextDue <= addDays(30)).length;
  const h = new Date().getHours();
  return (
    <>
      <PageHeader eyebrow="Veterinarian console" title={`Good ${h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"}, Dr. Sarah`}
        sub={`${q.length} appointments today · ${c("Checked In")} waiting · ${c("In Progress")} in progress.`} />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi label="Today's appts" value={q.length} hint="on your schedule" glow />
        <Kpi label="Waiting" value={c("Checked In")} hint="checked in" tone="warn" />
        <Kpi label="In progress" value={c("In Progress")} hint="exam open" tone="brand" />
        <Kpi label="Completed" value={c("Completed")} hint="visits closed" tone="ok" />
        <Kpi label="Vaccines due" value={due} hint="next 30 days" tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><Queue /></div>
        <div className="space-y-6">
          <Panel title="Visits · last 7 days" meta="total 42" bodyClass="p-5">
            <div className="flex h-32 items-end gap-2.5">
              {[45, 62, 38, 72, 55, 80, 66].map((v, i) => <div key={i} className={`flex-1 rounded-t-[3px] ${i === 6 ? "bg-amber" : i === 4 ? "bg-brand shadow-glow" : "bg-brand/30"}`} style={{ height: `${v}%` }} />)}
            </div>
          </Panel>
          <Panel title="Species mix" bodyClass="p-5">
            <div className="flex h-2.5 overflow-hidden rounded-full"><span className="w-[52%] bg-brand" /><span className="w-[33%] bg-amber" /><span className="w-[9%] bg-ok" /><span className="w-[6%] bg-faint" /></div>
            <ul className="mt-3 space-y-1.5 text-xs">{[["bg-brand", "Canine · 52%"], ["bg-amber", "Feline · 33%"], ["bg-ok", "Avian · 9%"], ["bg-faint", "Other · 6%"]].map(([c, l]) => <li key={l} className="flex items-center gap-2"><span className={`size-2 rounded-full ${c}`} />{l}</li>)}</ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

export function VetQueuePage() {
  return (<><PageHeader eyebrow="Clinical workflow" title="Today's queue" sub="Start an examination on any checked-in patient." /><Queue /></>);
}

export function MedicalRecordsPage({ mode = "records" }: { mode?: "records" | "treatments" }) {
  const { db, pet, vet } = useLookup();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Pet | null>(null);
  const list = db.records.filter((r) => `${pet(r.petId)?.name} ${r.diagnosis} ${r.treatment}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <>
      <PageHeader eyebrow="Clinical records" title={mode === "records" ? "Medical records" : "Treatments"} sub={`${list.length} entries.`} />
      <Panel>
        <div className="border-b border-border p-4"><SearchBox value={q} onChange={setQ} placeholder="Search pet, diagnosis, treatment" /></div>
        <Table head={<><Th>Date</Th><Th>Pet</Th>{mode === "records" && <Th>Symptoms</Th>}<Th>Diagnosis</Th><Th>Treatment</Th>{mode === "records" && <Th>Vitals</Th>}<Th>Vet</Th></>}>
          {list.map((r) => (
            <tr key={r.id} className="cursor-pointer" onClick={() => setSel(pet(r.petId) ?? null)}>
              <Td className="font-mono text-xs">{fmtDate(r.date)}</Td>
              <Td><div className="flex items-center gap-3"><PetPhoto pet={pet(r.petId)} /><span className="text-strong">{pet(r.petId)?.name}</span></div></Td>
              {mode === "records" && <Td>{r.symptoms}</Td>}
              <Td className="text-strong">{r.diagnosis}</Td><Td>{r.treatment}</Td>
              {mode === "records" && <Td className="font-mono text-xs">{r.weight}kg · {r.temp}°C</Td>}
              <Td>{vet(r.vetId)?.name}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
      <PetDetail pet={sel} onClose={() => setSel(null)} />
    </>
  );
}
