import { api } from "@/lib/api-client";
import type { Employee, EmployeeInput } from "./types";

export function listEmployees() {
  return api<Employee[]>("/api/employees");
}

export function createEmployee(input: EmployeeInput) {
  return api<Employee>("/api/employees", { method: "POST", body: input });
}

export function updateEmployee(id: string, input: EmployeeInput) {
  return api<Employee>(`/api/employees/${id}`, { method: "PUT", body: input });
}

export function deleteEmployee(id: string) {
  return api<void>(`/api/employees/${id}`, { method: "DELETE" });
}
