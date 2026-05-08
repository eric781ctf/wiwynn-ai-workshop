export type VehicleStatus = "available" | "in_use" | "maintenance";

export interface Vehicle {
  id: string;
  plateNo: string;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
  assignedTo: string | null;
}

export type VehicleInput = Omit<Vehicle, "id">;
