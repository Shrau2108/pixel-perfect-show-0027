import type {
  Appointment,
  ApptStatus,
  AuditLog,
  ClinicSettings,
  DB,
  InventoryItem,
  Invoice,
  MedicalRecord,
  Notice,
  Owner,
  Pet,
  Prescription,
  Role,
  Task,
  TaskStatus,
  User,
  Vaccination,
} from "../data";

export interface IAppointmentService {
  list(filter?: (a: Appointment) => boolean): Promise<Appointment[]>;
  getById(id: string): Promise<Appointment | null>;
  create(input: Omit<Appointment, "id">): Promise<Appointment>;
  updateStatus(id: string, status: ApptStatus): Promise<Appointment>;
  updateNotes(id: string, notes: string): Promise<Appointment>;
  cancel(id: string, reason?: string): Promise<Appointment>;
}

export interface IPetService {
  list(filter?: (p: Pet) => boolean): Promise<Pet[]>;
  getById(id: string): Promise<Pet | null>;
  listByOwner(ownerId: string): Promise<Pet[]>;
  create(input: Omit<Pet, "id">): Promise<Pet>;
  update(id: string, input: Partial<Omit<Pet, "id">>): Promise<Pet>;
}

export interface IOwnerService {
  list(filter?: (o: Owner) => boolean): Promise<Owner[]>;
  getById(id: string): Promise<Owner | null>;
  create(input: Omit<Owner, "id">): Promise<Owner>;
  update(id: string, input: Partial<Omit<Owner, "id">>): Promise<Owner>;
}

export interface IMedicalRecordService {
  list(filter?: (r: MedicalRecord) => boolean): Promise<MedicalRecord[]>;
  getById(id: string): Promise<MedicalRecord | null>;
  listByPet(petId: string): Promise<MedicalRecord[]>;
  create(input: Omit<MedicalRecord, "id">): Promise<MedicalRecord>;
}

export interface IPrescriptionService {
  list(filter?: (rx: Prescription) => boolean): Promise<Prescription[]>;
  getById(id: string): Promise<Prescription | null>;
  listByPet(petId: string): Promise<Prescription[]>;
  create(input: Omit<Prescription, "id">): Promise<Prescription>;
}

export interface IVaccinationService {
  list(filter?: (v: Vaccination) => boolean): Promise<Vaccination[]>;
  getById(id: string): Promise<Vaccination | null>;
  listByPet(petId: string): Promise<Vaccination[]>;
  create(input: Omit<Vaccination, "id">): Promise<Vaccination>;
}

export interface IInvoiceService {
  list(filter?: (inv: Invoice) => boolean): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  listByOwner(ownerId: string): Promise<Invoice[]>;
  create(input: Omit<Invoice, "id"> & { id?: string }): Promise<Invoice>;
  recordPayment(id: string, amount: number, method: string): Promise<Invoice>;
}

export interface IInventoryService {
  list(filter?: (item: InventoryItem) => boolean): Promise<InventoryItem[]>;
  getById(id: string): Promise<InventoryItem | null>;
  create(input: Omit<InventoryItem, "id">): Promise<InventoryItem>;
  receiveStock(id: string, quantity: number, batch?: string): Promise<InventoryItem>;
  deductStock(id: string, quantity: number): Promise<InventoryItem>;
}

export interface ITaskService {
  list(filter?: (t: Task) => boolean): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  listByRole(role: Role): Promise<Task[]>;
  create(input: Omit<Task, "id" | "createdAt">): Promise<Task>;
  updateStatus(id: string, status: TaskStatus): Promise<Task>;
}

export interface INoticeService {
  list(filter?: (n: Notice) => boolean): Promise<Notice[]>;
  listForRole(role: Role): Promise<Notice[]>;
  create(input: Omit<Notice, "id">): Promise<Notice>;
  markRead(id: string): Promise<Notice>;
  markAllReadForRole(role: Role): Promise<void>;
}

export interface IAuditLogService {
  list(filter?: (log: AuditLog) => boolean): Promise<AuditLog[]>;
  record(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog>;
}

export interface ISettingsService {
  get(): Promise<ClinicSettings>;
  update(settings: Partial<ClinicSettings>): Promise<ClinicSettings>;
}

export interface IUserService {
  list(filter?: (u: User) => boolean): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  create(input: Omit<User, "id">): Promise<User>;
  update(id: string, input: Partial<Omit<User, "id">>): Promise<User>;
  toggleStatus(id: string): Promise<User>;
}

/**
 * Unified data-service interface.
 * UI components and workflow handlers interact with this contract,
 * allowing DemoDataService to be seamlessly swapped with SupabaseDataService.
 */
export interface IVetCoreDataService {
  readonly isDemo: boolean;
  appointments: IAppointmentService;
  pets: IPetService;
  owners: IOwnerService;
  medicalRecords: IMedicalRecordService;
  prescriptions: IPrescriptionService;
  vaccinations: IVaccinationService;
  invoices: IInvoiceService;
  inventory: IInventoryService;
  tasks: ITaskService;
  notices: INoticeService;
  auditLogs: IAuditLogService;
  settings: ISettingsService;
  users: IUserService;

  /** Snapshot of current state for synchronous UI rendering (e.g. useDB) */
  getSnapshot(): DB;
  /** Reset database to initial seed state */
  resetDemo(): Promise<DB>;
}
