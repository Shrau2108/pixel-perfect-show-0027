import { useSyncExternalStore } from "react";

export type Role = "admin" | "veterinarian" | "receptionist" | "owner";
export type ApptStatus =
  | "Requested"
  | "Confirmed"
  | "Checked In"
  | "In Progress"
  | "Completed"
  | "Canceled"
  | "No-show";

export interface Owner { id: string; name: string; phone: string; email: string; address: string }
export interface Pet {
  id: string; name: string; species: string; breed: string; age: number; sex: "Male" | "Female";
  weight: number; color: string; ownerId: string; allergies: string; chronic: string; microchip: string;
}
export interface Appointment {
  id: string; petId: string; vetId: string; date: string; time: string; reason: string;
  status: ApptStatus; notes?: string;
}
export interface MedicalRecord {
  id: string; petId: string; vetId: string; date: string; symptoms: string; diagnosis: string;
  treatment: string; notes: string; weight: number; temp: number;
}
export interface Prescription { id: string; petId: string; vetId: string; date: string; medicine: string; dosage: string; frequency: string; duration: string }
export interface Vaccination { id: string; petId: string; vaccine: string; date: string; nextDue: string; vetId: string }
export interface InventoryItem {
  id: string; name: string; category: string; stock: number; threshold: number; unit: string;
  supplier: string; batch: string; expiry: string; unitCost: number;
}
export interface Invoice {
  id: string; petId: string; date: string; items: { label: string; amount: number }[];
  status: "Paid" | "Pending" | "Partially Paid"; paid: number; method?: string;
}
export interface User { id: string; name: string; email: string; role: Role; status: "Active" | "Inactive"; title?: string }
export interface Notice { id: string; text: string; time: string; roles: Role[]; read: boolean }

const today = new Date();
const iso = (offset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
export const TODAY = iso(0);
export const isoOffset = iso;

const users: User[] = [
  { id: "u1", name: "Michael Grant", email: "m.grant@vcms.demo", role: "admin", status: "Active", title: "Clinic Administrator" },
  { id: "v1", name: "Dr. Sarah Wilson", email: "s.wilson@vcms.demo", role: "veterinarian", status: "Active", title: "Small Animal Medicine" },
  { id: "v2", name: "Dr. Arjun Mehta", email: "a.mehta@vcms.demo", role: "veterinarian", status: "Active", title: "Surgery" },
  { id: "v3", name: "Dr. Lena Fischer", email: "l.fischer@vcms.demo", role: "veterinarian", status: "Active", title: "Exotics & Avian" },
  { id: "r1", name: "Emily Carter", email: "e.carter@vcms.demo", role: "receptionist", status: "Active", title: "Front Desk" },
  { id: "r2", name: "Rohan Das", email: "r.das@vcms.demo", role: "receptionist", status: "Inactive", title: "Front Desk" },
];

const owners: Owner[] = [
  { id: "o1", name: "Rahul Sharma", phone: "+91 98200 11223", email: "rahul.s@mail.demo", address: "12 Park Lane, Pune" },
  { id: "o2", name: "Priya Nair", phone: "+91 98450 33421", email: "priya.n@mail.demo", address: "4 Lake View, Bengaluru" },
  { id: "o3", name: "Dev Patel", phone: "+91 99870 55410", email: "dev.p@mail.demo", address: "88 Hill Rd, Mumbai" },
  { id: "o4", name: "Ana Reyes", phone: "+91 90040 77812", email: "ana.r@mail.demo", address: "21 MG Road, Pune" },
  { id: "o5", name: "Tom Brooks", phone: "+91 98111 20987", email: "tom.b@mail.demo", address: "7 Elm Street, Delhi" },
];

const pets: Pet[] = [
  { id: "p1", name: "Max", species: "Dog", breed: "Golden Retriever", age: 4, sex: "Male", weight: 31, color: "Golden", ownerId: "o1", allergies: "Chicken protein", chronic: "None", microchip: "985112004561" },
  { id: "p2", name: "Luna", species: "Cat", breed: "Persian", age: 2, sex: "Female", weight: 4.2, color: "White", ownerId: "o1", allergies: "None", chronic: "None", microchip: "985112004562" },
  { id: "p3", name: "Biscuit", species: "Dog", breed: "Beagle", age: 6, sex: "Male", weight: 12, color: "Tricolor", ownerId: "o2", allergies: "None", chronic: "Hip dysplasia", microchip: "985112004563" },
  { id: "p4", name: "Mochi", species: "Cat", breed: "Siamese", age: 3, sex: "Female", weight: 3.8, color: "Seal point", ownerId: "o3", allergies: "Penicillin", chronic: "None", microchip: "985112004564" },
  { id: "p5", name: "Coco", species: "Bird", breed: "Cockatiel", age: 5, sex: "Female", weight: 0.09, color: "Grey", ownerId: "o4", allergies: "None", chronic: "None", microchip: "-" },
  { id: "p6", name: "Rex", species: "Dog", breed: "German Shepherd", age: 8, sex: "Male", weight: 36, color: "Black/Tan", ownerId: "o5", allergies: "None", chronic: "Arthritis", microchip: "985112004566" },
  { id: "p7", name: "Pip", species: "Rabbit", breed: "Holland Lop", age: 1, sex: "Male", weight: 1.6, color: "Brown", ownerId: "o4", allergies: "None", chronic: "None", microchip: "-" },
];

const appointments: Appointment[] = [
  { id: "a1", petId: "p3", vetId: "v1", date: iso(0), time: "09:00", reason: "Annual wellness exam", status: "Completed" },
  { id: "a2", petId: "p4", vetId: "v1", date: iso(0), time: "09:30", reason: "Dental check", status: "In Progress" },
  { id: "a3", petId: "p5", vetId: "v3", date: iso(0), time: "10:15", reason: "Wing injury", status: "Checked In" },
  { id: "a4", petId: "p1", vetId: "v1", date: iso(0), time: "11:00", reason: "Vaccination booster", status: "Confirmed" },
  { id: "a5", petId: "p6", vetId: "v2", date: iso(0), time: "12:00", reason: "Arthritis follow-up", status: "Confirmed" },
  { id: "a6", petId: "p7", vetId: "v1", date: iso(0), time: "14:30", reason: "Nail trim & check", status: "Requested" },
  { id: "a7", petId: "p2", vetId: "v1", date: iso(0), time: "16:00", reason: "Skin irritation", status: "Checked In" },
  { id: "a8", petId: "p1", vetId: "v2", date: iso(-2), time: "10:00", reason: "Limping", status: "Completed" },
  { id: "a9", petId: "p6", vetId: "v2", date: iso(-1), time: "15:00", reason: "Bloodwork", status: "No-show" },
  { id: "a10", petId: "p2", vetId: "v1", date: iso(3), time: "11:30", reason: "Spay consultation", status: "Confirmed" },
  { id: "a11", petId: "p3", vetId: "v1", date: iso(5), time: "09:30", reason: "Hip x-ray review", status: "Requested" },
  { id: "a12", petId: "p4", vetId: "v3", date: iso(-4), time: "13:00", reason: "Vomiting", status: "Canceled" },
];

const records: MedicalRecord[] = [
  { id: "m1", petId: "p1", vetId: "v2", date: iso(-2), symptoms: "Limping on right foreleg", diagnosis: "Soft tissue sprain", treatment: "Rest, NSAID for 5 days", notes: "Re-check if no improvement", weight: 31, temp: 38.6 },
  { id: "m2", petId: "p3", vetId: "v1", date: iso(0), symptoms: "Routine exam", diagnosis: "Healthy; mild tartar", treatment: "Dental chews recommended", notes: "", weight: 12, temp: 38.4 },
  { id: "m3", petId: "p1", vetId: "v1", date: iso(-120), symptoms: "Itchy skin", diagnosis: "Food allergy (chicken)", treatment: "Hypoallergenic diet", notes: "Avoid chicken-based food", weight: 30, temp: 38.7 },
  { id: "m4", petId: "p6", vetId: "v2", date: iso(-30), symptoms: "Stiff gait", diagnosis: "Osteoarthritis", treatment: "Joint supplements, Carprofen", notes: "Monitor kidney values", weight: 36, temp: 38.5 },
];
const prescriptions: Prescription[] = [
  { id: "rx1", petId: "p1", vetId: "v2", date: iso(-2), medicine: "Meloxicam 1.5mg/ml", dosage: "0.1 mg/kg", frequency: "Once daily", duration: "5 days" },
  { id: "rx2", petId: "p6", vetId: "v2", date: iso(-30), medicine: "Carprofen 75mg", dosage: "1 tablet", frequency: "Twice daily", duration: "30 days" },
  { id: "rx3", petId: "p4", vetId: "v1", date: iso(-10), medicine: "Amoxicillin 50mg", dosage: "1 tablet", frequency: "Twice daily", duration: "7 days" },
];
const vaccinations: Vaccination[] = [
  { id: "vx1", petId: "p1", vaccine: "Rabies", date: iso(-350), nextDue: iso(15), vetId: "v1" },
  { id: "vx2", petId: "p1", vaccine: "DHPP", date: iso(-200), nextDue: iso(165), vetId: "v1" },
  { id: "vx3", petId: "p2", vaccine: "FVRCP", date: iso(-370), nextDue: iso(-5), vetId: "v1" },
  { id: "vx4", petId: "p3", vaccine: "Rabies", date: iso(-100), nextDue: iso(265), vetId: "v1" },
  { id: "vx5", petId: "p6", vaccine: "Leptospirosis", date: iso(-340), nextDue: iso(25), vetId: "v2" },
  { id: "vx6", petId: "p4", vaccine: "FeLV", date: iso(-360), nextDue: iso(5), vetId: "v3" },
];
const inventory: InventoryItem[] = [
  { id: "i1", name: "Amoxicillin 50mg", category: "Antibiotic", stock: 18, threshold: 40, unit: "tablets", supplier: "MediVet Supplies", batch: "AMX-2291", expiry: iso(40), unitCost: 6 },
  { id: "i2", name: "Rabies Vaccine", category: "Vaccine", stock: 6, threshold: 10, unit: "vials", supplier: "BioPharm Animal", batch: "RBV-118", expiry: iso(20), unitCost: 450 },
  { id: "i3", name: "Meloxicam 1.5mg/ml", category: "NSAID", stock: 24, threshold: 10, unit: "bottles", supplier: "MediVet Supplies", batch: "MLX-552", expiry: iso(200), unitCost: 320 },
  { id: "i4", name: "Carprofen 75mg", category: "NSAID", stock: 120, threshold: 50, unit: "tablets", supplier: "PetCare Pharma", batch: "CRP-801", expiry: iso(310), unitCost: 22 },
  { id: "i5", name: "Surgical Gloves (M)", category: "Supply", stock: 9, threshold: 20, unit: "boxes", supplier: "ClinicPro", batch: "GLV-40", expiry: iso(700), unitCost: 280 },
  { id: "i6", name: "FVRCP Vaccine", category: "Vaccine", stock: 14, threshold: 8, unit: "vials", supplier: "BioPharm Animal", batch: "FVR-71", expiry: iso(12), unitCost: 520 },
  { id: "i7", name: "IV Fluid (LRS 500ml)", category: "Fluid", stock: 42, threshold: 15, unit: "bags", supplier: "ClinicPro", batch: "LRS-903", expiry: iso(400), unitCost: 95 },
];
const invoices: Invoice[] = [
  { id: "INV-1042", petId: "p3", date: iso(0), items: [{ label: "Wellness exam", amount: 800 }, { label: "Dental chews", amount: 350 }], status: "Paid", paid: 1150, method: "UPI" },
  { id: "INV-1041", petId: "p1", date: iso(-2), items: [{ label: "Consultation", amount: 700 }, { label: "Meloxicam", amount: 320 }, { label: "X-ray", amount: 1500 }], status: "Pending", paid: 0 },
  { id: "INV-1040", petId: "p6", date: iso(-30), items: [{ label: "Consultation", amount: 700 }, { label: "Carprofen (30d)", amount: 1320 }], status: "Partially Paid", paid: 1000, method: "Cash" },
  { id: "INV-1039", petId: "p2", date: iso(-60), items: [{ label: "FVRCP vaccine", amount: 900 }], status: "Paid", paid: 900, method: "Card" },
];
const notices: Notice[] = [
  { id: "n1", text: "Rabies Vaccine stock below threshold (6 vials)", time: "10m ago", roles: ["admin"], read: false },
  { id: "n2", text: "Coco (Cockatiel) checked in for 10:15", time: "25m ago", roles: ["veterinarian", "receptionist"], read: false },
  { id: "n3", text: "FVRCP batch FVR-71 expires in 12 days", time: "1h ago", roles: ["admin"], read: false },
  { id: "n4", text: "New appointment request: Pip, 14:30", time: "2h ago", roles: ["receptionist", "veterinarian"], read: true },
  { id: "n5", text: "Max's Rabies vaccination is due in 15 days", time: "Today", roles: ["owner"], read: false },
  { id: "n6", text: "Invoice INV-1041 is awaiting payment", time: "2d ago", roles: ["owner", "receptionist"], read: false },
];

export interface DB {
  users: User[]; owners: Owner[]; pets: Pet[]; appointments: Appointment[]; records: MedicalRecord[];
  prescriptions: Prescription[]; vaccinations: Vaccination[]; inventory: InventoryItem[]; invoices: Invoice[]; notices: Notice[];
}

let db: DB = { users, owners, pets, appointments, records, prescriptions, vaccinations, inventory, invoices, notices };
const listeners = new Set<() => void>();

export function update(fn: (d: DB) => DB) {
  db = fn(db);
  listeners.forEach((l) => l());
}
export function useDB() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => db,
    () => db,
  );
}
export const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export function setApptStatus(id: string, status: ApptStatus) {
  update((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }));
}

export const ALLOWED: Record<ApptStatus, ApptStatus[]> = {
  Requested: ["Confirmed", "Canceled"],
  Confirmed: ["Checked In", "Canceled", "No-show"],
  "Checked In": ["In Progress", "Canceled"],
  "In Progress": ["Completed"],
  Completed: [],
  Canceled: [],
  "No-show": [],
};

export const DEMO_OWNER_ID = "o1";
export const DEMO_VET_ID = "v1";

export const invoiceTotal = (i: Invoice) => i.items.reduce((s, x) => s + x.amount, 0);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const fmtDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
