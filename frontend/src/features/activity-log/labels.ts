import type { ActivityAction, ActivityResource } from "./types";

export const ACTION_LABELS: Record<ActivityAction, string> = {
  "auth.login": "登入",
  "auth.logout": "登出",
  "vehicle.created": "新增車輛",
  "vehicle.updated": "更新車輛",
  "vehicle.deleted": "刪除車輛",
  "vehicle.unassigned": "解除車輛指派",
  "employee.created": "新增員工",
  "employee.updated": "更新員工",
  "employee.deleted": "刪除員工",
};

export const RESOURCE_LABELS: Record<ActivityResource, string> = {
  auth: "身份驗證",
  vehicle: "車輛",
  employee: "員工",
};

export const ACTION_OPTIONS: ActivityAction[] = [
  "auth.login",
  "auth.logout",
  "vehicle.created",
  "vehicle.updated",
  "vehicle.deleted",
  "vehicle.unassigned",
  "employee.created",
  "employee.updated",
  "employee.deleted",
];

export const RESOURCE_OPTIONS: ActivityResource[] = ["auth", "vehicle", "employee"];

export interface ActorOption {
  id: string;
  name: string;
}

export const ACTOR_OPTIONS: ActorOption[] = [
  { id: "u-admin", name: "管理員" },
  { id: "u-user", name: "一般使用者" },
];
