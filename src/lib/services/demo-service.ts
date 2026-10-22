import {
  getDB,
  invoiceTotal,
  resetDemoDB,
  setApptStatus,
  TODAY,
  uid,
  update,
  type Appointment,
  type ApptStatus,
  type AuditLog,
  type ClinicSettings,
  type DB,
  type InventoryItem,
  type Invoice,
  type MedicalRecord,
  type Notice,
  type Owner,
  type Pet,
  type Prescription,
  type Role,
  type Task,
  type TaskStatus,
  type User,
  type Vaccination,
} from "../data";
import type {
  IAppointmentService,
  IAuditLogService,
  IInventoryService,
  IInvoiceService,
  IMedicalRecordService,
  INoticeService,
  IOwnerService,
  IPetService,
  IPrescriptionService,
  ISettingsService,
  ITaskService,
  IUserService,
  IVaccinationService,
  IVetCoreDataService,
} from "./types";

class DemoAppointmentService implements IAppointmentService {
  async list(filter?: (a: Appointment) => boolean): Promise<Appointment[]> {
    const list = getDB().appointments;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Appointment | null> {
    return getDB().appointments.find((a) => a.id === id) ?? null;
  }

  async create(input: Omit<Appointment, "id">): Promise<Appointment> {
    const created: Appointment = {
      ...input,
      id: uid("a"),
    };
    update((d) => ({
      ...d,
      appointments: [created, ...d.appointments],
    }));
    return created;
  }

  async updateStatus(id: string, status: ApptStatus): Promise<Appointment> {
    setApptStatus(id, status);
    const updated = getDB().appointments.find((a) => a.id === id);
    if (!updated) throw new Error(`Appointment ${id} not found`);
    return updated;
  }

  async updateNotes(id: string, notes: string): Promise<Appointment> {
    let result: Appointment | null = null;
    update((d) => ({
      ...d,
      appointments: d.appointments.map((a) => {
        if (a.id === id) {
          result = { ...a, notes };
          return result;
        }
        return a;
      }),
    }));
    if (!result) throw new Error(`Appointment ${id} not found`);
    return result;
  }

  async cancel(id: string): Promise<Appointment> {
    return this.updateStatus(id, "Canceled");
  }
}

class DemoPetService implements IPetService {
  async list(filter?: (p: Pet) => boolean): Promise<Pet[]> {
    const list = getDB().pets;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Pet | null> {
    return getDB().pets.find((p) => p.id === id) ?? null;
  }

  async listByOwner(ownerId: string): Promise<Pet[]> {
    return getDB().pets.filter((p) => p.ownerId === ownerId);
  }

  async create(input: Omit<Pet, "id">): Promise<Pet> {
    const created: Pet = {
      ...input,
      id: uid("p"),
    };
    update((d) => ({
      ...d,
      pets: [...d.pets, created],
    }));
    return created;
  }

  async update(id: string, input: Partial<Omit<Pet, "id">>): Promise<Pet> {
    let result: Pet | null = null;
    update((d) => ({
      ...d,
      pets: d.pets.map((p) => {
        if (p.id === id) {
          result = { ...p, ...input };
          return result;
        }
        return p;
      }),
    }));
    if (!result) throw new Error(`Pet ${id} not found`);
    return result;
  }
}

class DemoOwnerService implements IOwnerService {
  async list(filter?: (o: Owner) => boolean): Promise<Owner[]> {
    const list = getDB().owners;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Owner | null> {
    return getDB().owners.find((o) => o.id === id) ?? null;
  }

  async create(input: Omit<Owner, "id">): Promise<Owner> {
    const created: Owner = {
      ...input,
      id: uid("o"),
    };
    update((d) => ({
      ...d,
      owners: [...d.owners, created],
    }));
    return created;
  }

  async update(id: string, input: Partial<Omit<Owner, "id">>): Promise<Owner> {
    let result: Owner | null = null;
    update((d) => ({
      ...d,
      owners: d.owners.map((o) => {
        if (o.id === id) {
          result = { ...o, ...input };
          return result;
        }
        return o;
      }),
    }));
    if (!result) throw new Error(`Owner ${id} not found`);
    return result;
  }
}

class DemoMedicalRecordService implements IMedicalRecordService {
  async list(filter?: (r: MedicalRecord) => boolean): Promise<MedicalRecord[]> {
    const list = getDB().records;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<MedicalRecord | null> {
    return getDB().records.find((r) => r.id === id) ?? null;
  }

  async listByPet(petId: string): Promise<MedicalRecord[]> {
    return getDB().records.filter((r) => r.petId === petId);
  }

  async create(input: Omit<MedicalRecord, "id">): Promise<MedicalRecord> {
    const created: MedicalRecord = {
      ...input,
      id: uid("m"),
    };
    update((d) => ({
      ...d,
      records: [created, ...d.records],
    }));
    return created;
  }
}

class DemoPrescriptionService implements IPrescriptionService {
  async list(filter?: (rx: Prescription) => boolean): Promise<Prescription[]> {
    const list = getDB().prescriptions;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Prescription | null> {
    return getDB().prescriptions.find((rx) => rx.id === id) ?? null;
  }

  async listByPet(petId: string): Promise<Prescription[]> {
    return getDB().prescriptions.filter((rx) => rx.petId === petId);
  }

  async create(input: Omit<Prescription, "id">): Promise<Prescription> {
    const created: Prescription = {
      ...input,
      id: uid("rx"),
    };
    update((d) => ({
      ...d,
      prescriptions: [created, ...d.prescriptions],
    }));
    return created;
  }
}

class DemoVaccinationService implements IVaccinationService {
  async list(filter?: (v: Vaccination) => boolean): Promise<Vaccination[]> {
    const list = getDB().vaccinations;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Vaccination | null> {
    return getDB().vaccinations.find((v) => v.id === id) ?? null;
  }

  async listByPet(petId: string): Promise<Vaccination[]> {
    return getDB().vaccinations.filter((v) => v.petId === petId);
  }

  async create(input: Omit<Vaccination, "id">): Promise<Vaccination> {
    const created: Vaccination = {
      ...input,
      id: uid("vx"),
    };
    update((d) => ({
      ...d,
      vaccinations: [...d.vaccinations, created],
    }));
    return created;
  }
}

class DemoInvoiceService implements IInvoiceService {
  async list(filter?: (inv: Invoice) => boolean): Promise<Invoice[]> {
    const list = getDB().invoices;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Invoice | null> {
    return getDB().invoices.find((i) => i.id === id) ?? null;
  }

  async listByOwner(ownerId: string): Promise<Invoice[]> {
    return getDB().invoices.filter((i) => i.ownerId === ownerId);
  }

  async create(input: Omit<Invoice, "id"> & { id?: string }): Promise<Invoice> {
    const created: Invoice = {
      ...input,
      id: input.id || `INV-${1043 + getDB().invoices.length}`,
    };
    update((d) => ({
      ...d,
      invoices: [created, ...d.invoices],
    }));
    return created;
  }

  async recordPayment(id: string, amount: number, method: string): Promise<Invoice> {
    let result: Invoice | null = null;
    update((d) => ({
      ...d,
      invoices: d.invoices.map((inv) => {
        if (inv.id === id) {
          const total = invoiceTotal(inv);
          const newPaid = inv.paid + amount;
          const status = newPaid >= total ? "Paid" : "Partially Paid";
          result = {
            ...inv,
            paid: newPaid,
            status,
            method,
          };
          return result;
        }
        return inv;
      }),
    }));
    if (!result) throw new Error(`Invoice ${id} not found`);
    return result;
  }
}

class DemoInventoryService implements IInventoryService {
  async list(filter?: (item: InventoryItem) => boolean): Promise<InventoryItem[]> {
    const list = getDB().inventory;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<InventoryItem | null> {
    return getDB().inventory.find((i) => i.id === id) ?? null;
  }

  async create(input: Omit<InventoryItem, "id">): Promise<InventoryItem> {
    const created: InventoryItem = {
      ...input,
      id: uid("i"),
    };
    update((d) => ({
      ...d,
      inventory: [...d.inventory, created],
    }));
    return created;
  }

  async receiveStock(id: string, quantity: number, batch?: string): Promise<InventoryItem> {
    let result: InventoryItem | null = null;
    update((d) => ({
      ...d,
      inventory: d.inventory.map((item) => {
        if (item.id === id) {
          result = {
            ...item,
            stock: item.stock + quantity,
            batch: batch || item.batch,
          };
          return result;
        }
        return item;
      }),
    }));
    if (!result) throw new Error(`Inventory item ${id} not found`);
    return result;
  }

  async deductStock(id: string, quantity: number): Promise<InventoryItem> {
    let result: InventoryItem | null = null;
    update((d) => ({
      ...d,
      inventory: d.inventory.map((item) => {
        if (item.id === id) {
          result = {
            ...item,
            stock: Math.max(0, item.stock - quantity),
          };
          return result;
        }
        return item;
      }),
    }));
    if (!result) throw new Error(`Inventory item ${id} not found`);
    return result;
  }
}

class DemoTaskService implements ITaskService {
  async list(filter?: (t: Task) => boolean): Promise<Task[]> {
    const list = getDB().tasks;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<Task | null> {
    return getDB().tasks.find((t) => t.id === id) ?? null;
  }

  async listByRole(role: Role): Promise<Task[]> {
    return getDB().tasks.filter((t) => t.assignedRole === role);
  }

  async create(input: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const created: Task = {
      ...input,
      id: uid("t"),
      createdAt: TODAY,
    };
    update((d) => ({
      ...d,
      tasks: [created, ...d.tasks],
    }));
    return created;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    let result: Task | null = null;
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => {
        if (t.id === id) {
          const updated: Task = {
            ...t,
            status,
            ...(status === "Completed" ? { completedAt: new Date().toISOString() } : {}),
          };
          result = updated;
          return updated;
        }
        return t;
      }),
    }));
    if (!result) throw new Error(`Task ${id} not found`);
    return result;
  }
}

class DemoNoticeService implements INoticeService {
  async list(filter?: (n: Notice) => boolean): Promise<Notice[]> {
    const list = getDB().notices;
    return filter ? list.filter(filter) : [...list];
  }

  async listForRole(role: Role): Promise<Notice[]> {
    return getDB().notices.filter((n) => n.roles.includes(role));
  }

  async create(input: Omit<Notice, "id">): Promise<Notice> {
    const created: Notice = {
      ...input,
      id: uid("n"),
    };
    update((d) => ({
      ...d,
      notices: [created, ...d.notices],
    }));
    return created;
  }

  async markRead(id: string): Promise<Notice> {
    let result: Notice | null = null;
    update((d) => ({
      ...d,
      notices: d.notices.map((n) => {
        if (n.id === id) {
          result = { ...n, read: true };
          return result;
        }
        return n;
      }),
    }));
    if (!result) throw new Error(`Notice ${id} not found`);
    return result;
  }

  async markAllReadForRole(role: Role): Promise<void> {
    update((d) => ({
      ...d,
      notices: d.notices.map((n) => (n.roles.includes(role) ? { ...n, read: true } : n)),
    }));
  }
}

class DemoAuditLogService implements IAuditLogService {
  async list(filter?: (log: AuditLog) => boolean): Promise<AuditLog[]> {
    const list = getDB().auditLogs;
    return filter ? list.filter(filter) : [...list];
  }

  async record(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const created: AuditLog = {
      ...log,
      id: uid("log"),
      timestamp: new Date().toISOString(),
    };
    update((d) => ({
      ...d,
      auditLogs: [created, ...d.auditLogs],
    }));
    return created;
  }
}

class DemoSettingsService implements ISettingsService {
  async get(): Promise<ClinicSettings> {
    return { ...getDB().settings };
  }

  async update(settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
    let result: ClinicSettings | null = null;
    update((d) => {
      result = { ...d.settings, ...settings };
      return {
        ...d,
        settings: result,
      };
    });
    return result!;
  }
}

class DemoUserService implements IUserService {
  async list(filter?: (u: User) => boolean): Promise<User[]> {
    const list = getDB().users;
    return filter ? list.filter(filter) : [...list];
  }

  async getById(id: string): Promise<User | null> {
    return getDB().users.find((u) => u.id === id) ?? null;
  }

  async create(input: Omit<User, "id">): Promise<User> {
    const created: User = {
      ...input,
      id: uid("u"),
    };
    update((d) => ({
      ...d,
      users: [...d.users, created],
    }));
    return created;
  }

  async update(id: string, input: Partial<Omit<User, "id">>): Promise<User> {
    let result: User | null = null;
    update((d) => ({
      ...d,
      users: d.users.map((u) => {
        if (u.id === id) {
          result = { ...u, ...input };
          return result;
        }
        return u;
      }),
    }));
    if (!result) throw new Error(`User ${id} not found`);
    return result;
  }

  async toggleStatus(id: string): Promise<User> {
    let result: User | null = null;
    update((d) => ({
      ...d,
      users: d.users.map((u) => {
        if (u.id === id) {
          result = { ...u, status: u.status === "Active" ? "Inactive" : "Active" };
          return result;
        }
        return u;
      }),
    }));
    if (!result) throw new Error(`User ${id} not found`);
    return result;
  }
}

export class DemoDataService implements IVetCoreDataService {
  readonly isDemo = true;
  readonly appointments = new DemoAppointmentService();
  readonly pets = new DemoPetService();
  readonly owners = new DemoOwnerService();
  readonly medicalRecords = new DemoMedicalRecordService();
  readonly prescriptions = new DemoPrescriptionService();
  readonly vaccinations = new DemoVaccinationService();
  readonly invoices = new DemoInvoiceService();
  readonly inventory = new DemoInventoryService();
  readonly tasks = new DemoTaskService();
  readonly notices = new DemoNoticeService();
  readonly auditLogs = new DemoAuditLogService();
  readonly settings = new DemoSettingsService();
  readonly users = new DemoUserService();

  getSnapshot(): DB {
    return getDB();
  }

  async resetDemo(): Promise<DB> {
    return resetDemoDB();
  }
}
