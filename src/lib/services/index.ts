import { DemoDataService } from "./demo-service";
import type { IVetCoreDataService } from "./types";

export * from "./types";
export * from "./demo-service";
export * from "./supabase-schema";

/**
 * Singleton instance of VetCore Data Service.
 *
 * Current implementation: DemoDataService (backed by versioned local storage).
 * Future implementation: SupabaseDataService (backed by PostgreSQL + Realtime).
 *
 * All UI components, future workflow engines, and background tasks consume this contract,
 * ensuring seamless transition without rewriting dashboards or business logic.
 */
export const dataService: IVetCoreDataService = new DemoDataService();
