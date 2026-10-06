import { useEffect, useState } from "react";
import type { Role } from "./data";

const KEY = "vcms-demo-role";
const listeners = new Set<(r: Role | null) => void>();

export function setSession(r: Role | null) {
  if (r) localStorage.setItem(KEY, r);
  else localStorage.removeItem(KEY);
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
