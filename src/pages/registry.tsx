import type { ComponentType } from "react";
import { DEMO_OWNER_ID, type Role } from "@/lib/data";
import { AdminDashboard, InventoryPage, ReportsPage, UsersPage, VetsPage } from "./admin";
import {
  AppointmentsPage,
  BillingPage,
  HelpPage,
  PetsPage,
  PrescriptionsPage,
  SettingsPage,
  VaccinationsPage,
} from "./shared";
import { OwnerAppointmentsPage, OwnerDashboard, OwnerPetsPage } from "./owner";
import { CheckInPage, ReceptionDashboard } from "./reception";
import { MedicalRecordsPage, VetDashboard, VetQueuePage } from "./vet";

export const PAGES: Record<Role, Record<string, ComponentType>> = {
  admin: {
    dashboard: AdminDashboard,
    appointments: () => <AppointmentsPage role="admin" />,
    pets: PetsPage,
    veterinarians: VetsPage,
    inventory: InventoryPage,
    billing: BillingPage,
    reports: ReportsPage,
    users: UsersPage,
    settings: SettingsPage,
    help: () => <HelpPage role="admin" />,
  },
  veterinarian: {
    dashboard: VetDashboard,
    queue: VetQueuePage,
    appointments: () => <AppointmentsPage role="veterinarian" />,
    patients: () => <PetsPage canRegister={false} title="Patients" eyebrow="Clinical registry" />,
    "medical-records": MedicalRecordsPage,
    prescriptions: PrescriptionsPage,
    treatments: () => <MedicalRecordsPage mode="treatments" />,
    vaccinations: () => <VaccinationsPage canRecord />,
    help: () => <HelpPage role="veterinarian" />,
  },
  receptionist: {
    dashboard: ReceptionDashboard,
    appointments: () => <AppointmentsPage role="receptionist" />,
    "check-in": CheckInPage,
    pets: PetsPage,
    billing: BillingPage,
    help: () => <HelpPage role="receptionist" />,
  },
  owner: {
    dashboard: OwnerDashboard,
    pets: OwnerPetsPage,
    appointments: OwnerAppointmentsPage,
    vaccinations: () => <VaccinationsPage ownerId={DEMO_OWNER_ID} />,
    prescriptions: () => <PrescriptionsPage ownerId={DEMO_OWNER_ID} />,
    invoices: () => <BillingPage ownerId={DEMO_OWNER_ID} />,
    help: () => <HelpPage role="owner" />,
  },
};
