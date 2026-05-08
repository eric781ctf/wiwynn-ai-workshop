export interface Employee {
  id: string;
  name: string;
  department: string;
  title: string;
  email: string;
  hiredAt: string;
}

export type EmployeeInput = Omit<Employee, "id">;
