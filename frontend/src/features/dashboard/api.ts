import { api } from "@/lib/api-client";
import type { VehicleStatus } from "@/features/vehicles/types";

export interface DashboardSummary {
  totalVehicles: number;
  availableVehicles: number;
  totalEmployees: number;
  monthlyUsageRate: number;
  vehicleStatusBreakdown: Array<{ status: VehicleStatus; count: number }>;
}

export function getSummary() {
  return api<DashboardSummary>("/api/dashboard/summary");
}
