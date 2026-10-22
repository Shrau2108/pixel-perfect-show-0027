import { useEffect, useState } from "react";
import { DEMO_OWNER_ID, DEMO_VET_ID, type Role } from "./data";

const KEY = "vcms-demo-role";
const USER_KEY = "vcms-demo-user";
const listeners = new Set<(r: Role | null) => void>();

export function setSession(r: Role | null) {
  if (r) {
    localStorage.setItem(KEY, r);
  } else {
    localStorage.removeItem(KEY);
    localStorage.removeItem(USER_KEY);
  }
  listeners.forEach((l) => l(r));
}

/** Returns undefined until hydrated, then the role or null. */
export function useSession(): Role | null | undefined {
  const [role, setRole] = useState<Role | null | undefined>(undefined);
  useEffect(() => {
    setRole((localStorage.getItem(KEY) as Role) || null);
    const l = (r: Role | null) => setRole(r);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return role;
}

/** Set specific active user ID for advanced multi-user testing within a role. */
export function setSessionUser(userId: string | null) {
  if (userId) {
    localStorage.setItem(USER_KEY, userId);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

/** Get the currently designated staff user ID for the given role. */
export function getActiveStaffId(role: Role): string {
  if (typeof window !== "undefined") {
    const customUser = localStorage.getItem(USER_KEY);
    if (customUser) return customUser;
  }
  switch (role) {
    case "admin":
      return "u1"; // Michael Grant
    case "veterinarian":
      return DEMO_VET_ID; // Dr. Sarah Wilson ("v1")
    case "receptionist":
      return "r1"; // Emily Carter
    case "owner":
      return DEMO_OWNER_ID; // Rahul Sharma ("o1")
  }
}

/** Get the currently designated pet owner ID for client workflows. */
export function getActiveOwnerId(): string {
  if (typeof window !== "undefined") {
    const customUser = localStorage.getItem(USER_KEY);
    if (customUser) return customUser;
  }
  return DEMO_OWNER_ID;
}
