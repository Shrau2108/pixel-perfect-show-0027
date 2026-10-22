/**
 * SUPABASE & POSTGRESQL ARCHITECTURAL SCHEMA SPECIFICATION
 *
 * This file specifies the target PostgreSQL relational schema and Row Level
 * Security (RLS) policies for VetCore's future Supabase integration.
 *
 * It serves as:
 * 1. The official design contract mapping TypeScript camelCase models to Postgres snake_case tables.
 * 2. Type definitions for future Supabase client generation.
 * 3. Migration blueprints without installing live clients or hardcoding secrets.
 */

export interface SupabaseSchemaMapping {
  table: string;
  primaryKey: string;
  foreignKeys: Record<string, string>;
  rlsPolicies: string[];
}

export const SUPABASE_TABLE_MAPPINGS: Record<string, SupabaseSchemaMapping> = {
  users: {
    table: "users",
    primaryKey: "id",
    foreignKeys: {},
    rlsPolicies: [
      "Admins can read/write all user records",
      "Authenticated staff can view active staff directory",
      "Pet owners can view active veterinarians",
    ],
  },
  owners: {
    table: "owners",
    primaryKey: "id",
    foreignKeys: {},
    rlsPolicies: [
      "Staff (admin, vet, receptionist) can view/manage all owners",
      "Owners can only read/update their own profile (auth.uid() = user_id)",
    ],
  },
  pets: {
    table: "pets",
    primaryKey: "id",
    foreignKeys: { owner_id: "owners(id)" },
    rlsPolicies: [
      "Staff can view/manage all pets",
      "Owners can only view their registered pets",
    ],
  },
  appointments: {
    table: "appointments",
    primaryKey: "id",
    foreignKeys: { pet_id: "pets(id)", vet_id: "users(id)" },
    rlsPolicies: [
      "Staff can view all appointments and update status according to role transitions",
      "Owners can view their pets' appointments and create booking requests",
    ],
  },
  medical_records: {
    table: "medical_records",
    primaryKey: "id",
    foreignKeys: { pet_id: "pets(id)", vet_id: "users(id)", appointment_id: "appointments(id)" },
    rlsPolicies: [
      "Veterinarians and Admins can create and view clinical records",
      "Owners can view medical records for their pets (excluding sensitive internal notes)",
    ],
  },
  prescriptions: {
    table: "prescriptions",
    primaryKey: "id",
    foreignKeys: { pet_id: "pets(id)", vet_id: "users(id)", appointment_id: "appointments(id)" },
    rlsPolicies: [
      "Veterinarians can prescribe medication",
      "Staff and Owners can view prescribed medication",
    ],
  },
  vaccinations: {
    table: "vaccinations",
    primaryKey: "id",
    foreignKeys: { pet_id: "pets(id)", vet_id: "users(id)", appointment_id: "appointments(id)" },
    rlsPolicies: [
      "Veterinarians can record vaccinations",
      "All roles can view vaccination histories and due dates",
    ],
  },
  inventory: {
    table: "inventory_items",
    primaryKey: "id",
    foreignKeys: {},
    rlsPolicies: [
      "Admins can manage stock, batches, and reorder levels",
      "Veterinarians and Receptionists can view available stock",
      "No public/owner access",
    ],
  },
  invoices: {
    table: "invoices",
    primaryKey: "id",
    foreignKeys: { pet_id: "pets(id)", owner_id: "owners(id)", appointment_id: "appointments(id)" },
    rlsPolicies: [
      "Admins and Receptionists can create and record payments for all invoices",
      "Owners can view and settle invoices billed to them",
    ],
  },
  tasks: {
    table: "tasks",
    primaryKey: "id",
    foreignKeys: { assigned_user_id: "users(id)" },
    rlsPolicies: [
      "Staff can view tasks assigned to their role or user ID",
      "Staff can mark their assigned tasks completed",
    ],
  },
  notices: {
    table: "notices",
    primaryKey: "id",
    foreignKeys: { recipient_user_id: "users(id)" },
    rlsPolicies: [
      "Users can view notices targeted to their role or user ID",
      "Users can update read status for their notices",
    ],
  },
  audit_logs: {
    table: "audit_logs",
    primaryKey: "id",
    foreignKeys: { actor_user_id: "users(id)" },
    rlsPolicies: [
      "Admins can view complete audit logs",
      "Insert-only for all automated system triggers; no updates or deletes permitted",
    ],
  },
  clinic_settings: {
    table: "clinic_settings",
    primaryKey: "id",
    foreignKeys: {},
    rlsPolicies: [
      "Admins can update clinic profile and configuration",
      "All users can read clinic operational parameters",
    ],
  },
};

/**
 * SQL Blueprint for Supabase Migration Generator.
 */
export const SUPABASE_SQL_MIGRATION_BLUEPRINT = `
-- 1. USERS & STAFF
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'veterinarian', 'receptionist', 'owner')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. OWNERS & PETS
CREATE TABLE IF NOT EXISTS public.owners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT NOT NULL,
  age NUMERIC NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('Male', 'Female')),
  weight NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '-',
  owner_id TEXT NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  allergies TEXT NOT NULL DEFAULT 'None',
  chronic TEXT NOT NULL DEFAULT 'None',
  microchip TEXT NOT NULL DEFAULT '-',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id TEXT NOT NULL REFERENCES public.users(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Requested', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Canceled', 'No-show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CLINICAL CARE
CREATE TABLE IF NOT EXISTS public.medical_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id TEXT NOT NULL REFERENCES public.users(id),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  symptoms TEXT NOT NULL DEFAULT '',
  diagnosis TEXT NOT NULL,
  treatment TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  weight NUMERIC NOT NULL,
  temp NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id TEXT NOT NULL REFERENCES public.users(id),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  medicine TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaccinations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id TEXT NOT NULL REFERENCES public.users(id),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  vaccine TEXT NOT NULL,
  date DATE NOT NULL,
  next_due DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL,
  supplier TEXT NOT NULL,
  batch TEXT NOT NULL,
  expiry DATE NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INVOICING & PAYMENTS
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Partially Paid')),
  paid NUMERIC NOT NULL DEFAULT 0,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TASKS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_role TEXT NOT NULL CHECK (assigned_role IN ('admin', 'veterinarian', 'receptionist', 'owner')),
  assigned_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
  related_entity_type TEXT,
  related_entity_id TEXT,
  source_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at DATE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  category TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AUDIT LOGS & SETTINGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  clinic_name TEXT NOT NULL DEFAULT 'VetCore Animal Hospital',
  opening_hours TEXT NOT NULL DEFAULT 'Mon–Sat · 09:00–18:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  sms_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  email_receipts BOOLEAN NOT NULL DEFAULT TRUE,
  vax_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  auto_confirm_bookings BOOLEAN NOT NULL DEFAULT FALSE,
  consultation_fee NUMERIC NOT NULL DEFAULT 700,
  emergency_fee NUMERIC NOT NULL DEFAULT 1500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
