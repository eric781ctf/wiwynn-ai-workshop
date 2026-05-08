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

export interface ListActivityLogsParams {
  actorId?: string;
  action?: ActivityAction;
  resource?: ActivityResource;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ListActivityLogsResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}
