import {
  LayoutGrid, CalendarDays, PawPrint, Stethoscope, Package, Receipt, BarChart3, Users, Settings,
  HelpCircle, ListOrdered, FileText, Pill, Syringe, ClipboardCheck, Activity, type LucideIcon,
} from "lucide-react";
import type { Role } from "./data";

export interface NavItem { page: string; label: string; icon: LucideIcon }
export interface RoleConfig {
  key: Role; label: string; person: string; initials: string; console: string; blurb: string; nav: NavItem[];
}

export const ROLES: Record<Role, RoleConfig> = {
  admin: {
    key: "admin", label: "Administrator", person: "Michael Grant", initials: "MG", console: "Operations console",
    blurb: "Clinic operations, inventory, users and reports.",
    nav: [
      { page: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { page: "appointments", label: "Appointments", icon: CalendarDays },
      { page: "pets", label: "Pets & Owners", icon: PawPrint },
      { page: "veterinarians", label: "Veterinarians", icon: Stethoscope },
      { page: "inventory", label: "Inventory", icon: Package },
      { page: "billing", label: "Billing", icon: Receipt },
      { page: "reports", label: "Reports", icon: BarChart3 },
      { page: "users", label: "Users & Roles", icon: Users },
      { page: "settings", label: "Settings", icon: Settings },
      { page: "help", label: "Help", icon: HelpCircle },
    ],
  },
  veterinarian: {
    key: "veterinarian", label: "Veterinarian", person: "Dr. Sarah Wilson", initials: "SW", console: "Veterinarian console",
    blurb: "Today's patient queue, examinations and clinical records.",
    nav: [
      { page: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { page: "queue", label: "Today's Queue", icon: ListOrdered },
      { page: "appointments", label: "Appointments", icon: CalendarDays },
      { page: "patients", label: "Patients", icon: PawPrint },
      { page: "medical-records", label: "Medical Records", icon: FileText },
      { page: "prescriptions", label: "Prescriptions", icon: Pill },
      { page: "treatments", label: "Treatments", icon: Activity },
      { page: "vaccinations", label: "Vaccinations", icon: Syringe },
      { page: "help", label: "Help", icon: HelpCircle },
    ],
  },
  receptionist: {
    key: "receptionist", label: "Receptionist", person: "Emily Carter", initials: "EC", console: "Front desk",
    blurb: "Bookings, check-in, registrations and billing.",
    nav: [
      { page: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { page: "appointments", label: "Appointments", icon: CalendarDays },
      { page: "check-in", label: "Check-in", icon: ClipboardCheck },
      { page: "pets", label: "Pets & Owners", icon: PawPrint },
      { page: "billing", label: "Billing", icon: Receipt },
      { page: "help", label: "Help", icon: HelpCircle },
    ],
  },
  owner: {
    key: "owner", label: "Pet Owner", person: "Rahul Sharma", initials: "RS", console: "Pet owner portal",
    blurb: "Your pets, bookings, vaccinations and invoices.",
    nav: [
      { page: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { page: "pets", label: "My Pets", icon: PawPrint },
      { page: "appointments", label: "Appointments", icon: CalendarDays },
      { page: "vaccinations", label: "Vaccinations", icon: Syringe },
      { page: "prescriptions", label: "Prescriptions", icon: Pill },
      { page: "invoices", label: "Invoices", icon: Receipt },
      { page: "help", label: "Help", icon: HelpCircle },
    ],
  },
};

export const isRole = (r: string): r is Role => r in ROLES;
