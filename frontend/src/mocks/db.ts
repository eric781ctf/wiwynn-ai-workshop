export type Role = "admin" | "user";
export type VehicleStatus = "available" | "in_use" | "maintenance";

export type ActivityAction =
  | "auth.login"
  | "auth.logout"
  | "vehicle.created"
  | "vehicle.updated"
  | "vehicle.deleted"
  | "vehicle.unassigned"
  | "employee.created"
  | "employee.updated"
  | "employee.deleted";

export type ActivityResource = "auth" | "vehicle" | "employee";

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  resource: ActivityResource;
  targetId: string | null;
  targetLabel: string;
  summary: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
}

export interface Vehicle {
  id: string;
  plateNo: string;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
  assignedTo: string | null;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  title: string;
  email: string;
  hiredAt: string;
}

export interface MockDB {
  users: User[];
  vehicles: Vehicle[];
  employees: Employee[];
  activityLogs: ActivityLog[];
}

const STORAGE_KEY = "vms.mock-db.v1";

const seedUsers: User[] = [
  { id: "u-admin", username: "admin", password: "admin123", name: "管理員", role: "admin" },
  { id: "u-user", username: "user", password: "user123", name: "一般使用者", role: "user" },
];

const seedEmployees: Employee[] = [
  { id: "e-1", name: "王小明", department: "業務部", title: "業務經理", email: "ming.wang@example.com", hiredAt: "2022-03-15" },
  { id: "e-2", name: "李美麗", department: "工程部", title: "資深工程師", email: "mei.li@example.com", hiredAt: "2021-07-01" },
  { id: "e-3", name: "張大華", department: "行銷部", title: "行銷專員", email: "dahua.zhang@example.com", hiredAt: "2024-01-10" },
  { id: "e-4", name: "陳怡君", department: "人資部", title: "HRBP", email: "yijun.chen@example.com", hiredAt: "2023-09-20" },
  { id: "e-5", name: "林俊傑", department: "工程部", title: "工程師", email: "junjie.lin@example.com", hiredAt: "2025-02-01" },
];

const seedVehicles: Vehicle[] = [
  { id: "v-1", plateNo: "ABC-1234", brand: "Toyota", model: "Camry", year: 2022, status: "available", assignedTo: null },
  { id: "v-2", plateNo: "DEF-5678", brand: "Honda", model: "CR-V", year: 2023, status: "in_use", assignedTo: "e-1" },
  { id: "v-3", plateNo: "GHI-9012", brand: "Tesla", model: "Model 3", year: 2024, status: "in_use", assignedTo: "e-2" },
  { id: "v-4", plateNo: "JKL-3456", brand: "Ford", model: "Focus", year: 2021, status: "maintenance", assignedTo: null },
  { id: "v-5", plateNo: "MNO-7890", brand: "Nissan", model: "Sentra", year: 2020, status: "available", assignedTo: null },
  { id: "v-6", plateNo: "PQR-2468", brand: "Mazda", model: "CX-5", year: 2023, status: "in_use", assignedTo: "e-3" },
];

function loadFromStorage(): MockDB | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MockDB>;
    if (!parsed.users || !parsed.vehicles || !parsed.employees) return null;
    let migrated = false;
    if (!Array.isArray(parsed.activityLogs)) {
      parsed.activityLogs = [];
      migrated = true;
    }
    const result = parsed as MockDB;
    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    }
    return result;
  } catch {
    return null;
  }
}

function createSeed(): MockDB {
  return {
    users: structuredClone(seedUsers),
    vehicles: structuredClone(seedVehicles),
    employees: structuredClone(seedEmployees),
    activityLogs: [],
  };
}

export const db: MockDB = loadFromStorage() ?? (() => {
  const seeded = createSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
})();

export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDb() {
  const fresh = createSeed();
  db.users = fresh.users;
  db.vehicles = fresh.vehicles;
  db.employees = fresh.employees;
  db.activityLogs = fresh.activityLogs;
  persist();
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
