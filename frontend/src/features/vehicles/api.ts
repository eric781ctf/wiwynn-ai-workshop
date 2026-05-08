import { api } from "@/lib/api-client";
import type { Vehicle, VehicleInput } from "./types";

export function listVehicles() {
  return api<Vehicle[]>("/api/vehicles");
}

export function createVehicle(input: VehicleInput) {
  return api<Vehicle>("/api/vehicles", { method: "POST", body: input });
}

export function updateVehicle(id: string, input: VehicleInput) {
  return api<Vehicle>(`/api/vehicles/${id}`, { method: "PUT", body: input });
}

export function deleteVehicle(id: string) {
  return api<void>(`/api/vehicles/${id}`, { method: "DELETE" });
}
