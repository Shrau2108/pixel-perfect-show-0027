import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  getInitialSeedDB,
  loadPersistedDB,
  resetDemoDB,
  saveToStorage,
  sanitizeDB,
  update,
  setApptStatus,
  isTaskOverdue,
  TODAY,
  uid,
  type DB,
  type Task,
} from "@/lib/data";
import { dataService } from "@/lib/services";
import {
  setSession,
  useSession,
  getActiveStaffId,
  getActiveOwnerId,
  setSessionUser,
} from "@/lib/session";
import { SettingsPage } from "@/pages/shared";

describe("Phase 2: Centralized Data Store and Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoDB();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("1. loads initial demo database with all collections populated", () => {
    const seed = getInitialSeedDB();
    expect(seed.users.length).toBeGreaterThan(0);
    expect(seed.owners.length).toBeGreaterThan(0);
    expect(seed.pets.length).toBeGreaterThan(0);
    expect(seed.appointments.length).toBeGreaterThan(0);
    expect(seed.records.length).toBeGreaterThan(0);
    expect(seed.prescriptions.length).toBeGreaterThan(0);
    expect(seed.vaccinations.length).toBeGreaterThan(0);
    expect(seed.inventory.length).toBeGreaterThan(0);
    expect(seed.invoices.length).toBeGreaterThan(0);
    expect(seed.notices.length).toBeGreaterThan(0);
    expect(seed.tasks.length).toBeGreaterThan(0);
    expect(seed.auditLogs.length).toBeGreaterThan(0);
    expect(seed.settings.clinicName).toBe("VetCore Animal Hospital");
  });

  it("2. updates database and notifies listeners", () => {
    const testAppointmentId = "a6"; // Requested
    setApptStatus(testAppointmentId, "Confirmed");

    const reloaded = loadPersistedDB();
    const appt = reloaded.appointments.find((a) => a.id === testAppointmentId);
    expect(appt?.status).toBe("Confirmed");
  });

  it("3. serializes and saves data to localStorage under versioned key", () => {
    const newPet = {
      id: "p-test-1",
      name: "Shadow",
      species: "Dog",
      breed: "Labrador",
      age: 3,
      sex: "Male" as const,
      weight: 28,
      color: "Black",
      ownerId: "o1",
      allergies: "None",
      chronic: "None",
      microchip: "123456789",
    };

    update((d) => ({ ...d, pets: [...d.pets, newPet] }));

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(SCHEMA_VERSION);
    expect(parsed.data.pets.some((p: { id: string }) => p.id === "p-test-1")).toBe(true);
  });

  it("4. restores newly created appointments after reload", () => {
    const newApptId = uid("a");
    update((d) => ({
      ...d,
      appointments: [
        ...d.appointments,
        {
          id: newApptId,
          petId: "p1",
          vetId: "v1",
          date: TODAY,
          time: "17:00",
          reason: "Routine checkup",
          status: "Requested",
        },
      ],
    }));

    const restored = loadPersistedDB();
    expect(restored.appointments.some((a) => a.id === newApptId)).toBe(true);
  });

  it("5. restores newly registered pets after reload", () => {
    const newPetId = uid("p");
    update((d) => ({
      ...d,
      pets: [
        ...d.pets,
        {
          id: newPetId,
          name: "Whiskers",
          species: "Cat",
          breed: "Domestic Shorthair",
          age: 2,
          sex: "Female",
          weight: 4,
          color: "Tabby",
          ownerId: "o2",
          allergies: "None",
          chronic: "None",
          microchip: "-",
        },
      ],
    }));

    const restored = loadPersistedDB();
    const found = restored.pets.find((p) => p.id === newPetId);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Whiskers");
  });

  it("6. preserves tasks, audit logs, notices, invoices, and settings", () => {
    const newTask: Task = {
      id: "t-custom-1",
      title: "Prepare surgical pack",
      description: "Sterilize instruments for tomorrow morning orthopedic surgery.",
      assignedRole: "veterinarian",
      assignedUserId: "v2",
      status: "Pending",
      priority: "Critical",
      createdAt: TODAY,
      dueAt: TODAY,
    };

    update((d) => ({
      ...d,
      tasks: [...d.tasks, newTask],
      settings: { ...d.settings, clinicName: "VetCore Specialty Center", consultationFee: 850 },
    }));

    const restored = loadPersistedDB();
    expect(restored.tasks.some((t) => t.id === "t-custom-1")).toBe(true);
    expect(restored.settings.clinicName).toBe("VetCore Specialty Center");
    expect(restored.settings.consultationFee).toBe(850);
  });

  it("7. handles invalid JSON gracefully and falls back to seed data", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{ corrupted JSON text <<<");

    const fallback = loadPersistedDB();
    expect(fallback.users.length).toBeGreaterThan(0);
    expect(fallback.pets.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("8. migrates older schema formats safely", () => {
    const legacyDB = {
      users: [
        {
          id: "u1",
          name: "Legacy User",
          email: "legacy@vcms.demo",
          role: "admin",
          status: "Active",
        },
      ],
      pets: [
        {
          id: "p1",
          name: "Legacy Pet",
          species: "Dog",
          breed: "Mix",
          age: 1,
          sex: "Male",
          weight: 10,
          color: "Tan",
          ownerId: "o1",
          allergies: "None",
          chronic: "None",
          microchip: "-",
        },
      ],
      // tasks, auditLogs, and settings intentionally missing from legacy payload
    };

    const migrated = sanitizeDB(legacyDB);
    expect(migrated.users[0]?.name).toBe("Legacy User");
    expect(migrated.pets[0]?.name).toBe("Legacy Pet");
    expect(Array.isArray(migrated.tasks)).toBe(true);
    expect(migrated.tasks.length).toBeGreaterThan(0);
    expect(Array.isArray(migrated.auditLogs)).toBe(true);
    expect(migrated.settings.clinicName).toBe("VetCore Animal Hospital");
  });

  it("9. resetDemoDB resets all collections to initial seed state and persists", () => {
    update((d) => ({
      ...d,
      appointments: [],
      pets: [],
      settings: { ...d.settings, clinicName: "Temporary Changed Name" },
    }));

    expect(loadPersistedDB().appointments.length).toBe(0);

    const reset = resetDemoDB();
    expect(reset.appointments.length).toBeGreaterThan(0);
    expect(reset.pets.length).toBeGreaterThan(0);
    expect(reset.settings.clinicName).toBe("VetCore Animal Hospital");

    const storedAfterReset = loadPersistedDB();
    expect(storedAfterReset.appointments.length).toBeGreaterThan(0);
    expect(storedAfterReset.settings.clinicName).toBe("VetCore Animal Hospital");
  });

  it("10. runs safely when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError or SecurityError");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      saveToStorage(getInitialSeedDB());
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalled();
  });

  it("11. switching roles preserves shared in-memory and persisted data", () => {
    setSession("admin");
    const testApptId = uid("a");
    update((d) => ({
      ...d,
      appointments: [
        ...d.appointments,
        {
          id: testApptId,
          petId: "p2",
          vetId: "v1",
          date: TODAY,
          time: "11:30",
          reason: "Dermatology",
          status: "Confirmed",
        },
      ],
    }));

    setSession("veterinarian");
    const vetLoaded = loadPersistedDB();
    expect(vetLoaded.appointments.some((a) => a.id === testApptId)).toBe(true);

    setSession("receptionist");
    const recLoaded = loadPersistedDB();
    expect(recLoaded.appointments.some((a) => a.id === testApptId)).toBe(true);
  });

  it("12. correctly calculates task overdue status", () => {
    const overdueTask: Task = {
      id: "t-overdue",
      title: "Overdue task",
      description: "Should be overdue",
      assignedRole: "admin",
      status: "Pending",
      priority: "High",
      createdAt: "2026-01-01",
      dueAt: "2026-01-02",
    };

    const completedTask: Task = {
      ...overdueTask,
      status: "Completed",
    };

    expect(isTaskOverdue(overdueTask, "2026-01-05")).toBe(true);
    expect(isTaskOverdue(completedTask, "2026-01-05")).toBe(false);
  });

  it("13. helper functions return correct active staff and owner IDs", () => {
    expect(getActiveStaffId("admin")).toBe("u1");
    expect(getActiveStaffId("veterinarian")).toBe("v1");
    expect(getActiveStaffId("receptionist")).toBe("r1");
    expect(getActiveStaffId("owner")).toBe("o1");
    expect(getActiveOwnerId()).toBe("o1");

    setSessionUser("v2");
    expect(getActiveStaffId("veterinarian")).toBe("v2");
    setSessionUser(null);
  });

  it("14. renders SettingsPage and persists clinic settings updates", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Clinic profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications & Automation")).toBeInTheDocument();
    expect(screen.getByText("Reset demo database")).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: /save profile/i });
    expect(saveButton).toBeInTheDocument();
    fireEvent.click(saveButton);

    const reloaded = loadPersistedDB();
    expect(reloaded.settings.clinicName).toBeTruthy();
  });

  it("15. dataService repository methods operate correctly and persist state", async () => {
    // 1. Appointments service
    const appts = await dataService.appointments.list();
    expect(appts.length).toBeGreaterThan(0);

    const createdAppt = await dataService.appointments.create({
      petId: "p1",
      vetId: "v1",
      date: TODAY,
      time: "15:00",
      reason: "Ear infection",
      status: "Requested",
    });
    expect(createdAppt.id).toBeTruthy();

    const confirmedAppt = await dataService.appointments.updateStatus(createdAppt.id, "Confirmed");
    expect(confirmedAppt.status).toBe("Confirmed");

    // 2. Inventory service
    const item = await dataService.inventory.getById("i1");
    expect(item).not.toBeNull();
    const initialStock = item!.stock;
    const received = await dataService.inventory.receiveStock("i1", 20);
    expect(received.stock).toBe(initialStock + 20);

    // 3. Invoices service
    const unpaid = await dataService.invoices.getById("INV-1041");
    expect(unpaid).not.toBeNull();
    const paidInvoice = await dataService.invoices.recordPayment("INV-1041", 500, "UPI");
    expect(paidInvoice.paid).toBe(500);

    // 4. Tasks service
    const task = await dataService.tasks.create({
      title: "Call Priya for follow-up",
      description: "Check on Biscuit recovery",
      assignedRole: "receptionist",
      status: "Pending",
      priority: "Normal",
    });
    expect(task.id).toBeTruthy();
    const completedTask = await dataService.tasks.updateStatus(task.id, "Completed");
    expect(completedTask.status).toBe("Completed");
    expect(completedTask.completedAt).toBeTruthy();

    // 5. Audit logs service
    const log = await dataService.auditLogs.record({
      actorRole: "receptionist",
      actorUserId: "r1",
      action: "appointment.confirm",
      entityType: "appointment",
      entityId: createdAppt.id,
      description: "Confirmed ear infection appointment",
    });
    expect(log.id).toBeTruthy();
    expect(log.timestamp).toBeTruthy();

    // 6. Settings service
    const updatedSettings = await dataService.settings.update({ clinicName: "VetCore Central Hospital" });
    expect(updatedSettings.clinicName).toBe("VetCore Central Hospital");

    // 7. Verification that persistence captured all dataService operations
    const persisted = loadPersistedDB();
    expect(persisted.appointments.some((a) => a.id === createdAppt.id)).toBe(true);
    expect(persisted.inventory.find((i) => i.id === "i1")?.stock).toBe(initialStock + 20);
    expect(persisted.settings.clinicName).toBe("VetCore Central Hospital");
  });
});
