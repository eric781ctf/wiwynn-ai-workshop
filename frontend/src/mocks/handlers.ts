import { http, HttpResponse, delay } from "msw";
import {
  db,
  persist,
  newId,
  type Vehicle,
  type Employee,
  type ActivityLog,
  type ActivityAction,
  type ActivityResource,
} from "./db";

const SIMULATED_LATENCY_MS = 250;
const ACTIVITY_LOG_MAX = 1000;
const TOKEN_RE = /^fake-jwt-(admin|user)-(.+)$/;

async function withLatency() {
  await delay(SIMULATED_LATENCY_MS);
}

interface Actor {
  id: string;
  name: string;
}

function getActor(request: Request): Actor {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length);
    const match = TOKEN_RE.exec(token);
    if (match) {
      const userId = match[2];
      const user = db.users.find((u) => u.id === userId);
      if (user) return { id: user.id, name: user.name };
    }
  }
  return { id: "system", name: "system" };
}

interface AppendLogInput {
  actor?: Actor;
  action: ActivityAction;
  resource: ActivityResource;
  targetId: string | null;
  targetLabel: string;
  summary: string;
}

function appendLog(request: Request, input: AppendLogInput): void {
  const actor = input.actor ?? getActor(request);
  const log: ActivityLog = {
    id: newId("log"),
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    action: input.action,
    resource: input.resource,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    summary: input.summary,
  };
  db.activityLogs.push(log);
  while (db.activityLogs.length > ACTIVITY_LOG_MAX) {
    db.activityLogs.shift();
  }
  persist();
}

function diffVehicleSummary(before: Vehicle, after: Vehicle): string {
  const changes: string[] = [];
  if (before.plateNo !== after.plateNo) changes.push(`車牌 ${before.plateNo} → ${after.plateNo}`);
  if (before.brand !== after.brand) changes.push(`廠牌 ${before.brand} → ${after.brand}`);
  if (before.model !== after.model) changes.push(`車型 ${before.model} → ${after.model}`);
  if (before.year !== after.year) changes.push(`年份 ${before.year} → ${after.year}`);
  if (before.status !== after.status) changes.push(`狀態 ${before.status} → ${after.status}`);
  if (before.assignedTo !== after.assignedTo) {
    changes.push(`指派 ${before.assignedTo ?? "無"} → ${after.assignedTo ?? "無"}`);
  }
  const detail = changes.length === 0 ? "無欄位變更" : changes.join("、");
  return `更新車輛 ${after.plateNo}（${detail}）`;
}

function diffEmployeeSummary(before: Employee, after: Employee): string {
  const changes: string[] = [];
  if (before.name !== after.name) changes.push(`姓名 ${before.name} → ${after.name}`);
  if (before.department !== after.department) changes.push(`部門 ${before.department} → ${after.department}`);
  if (before.title !== after.title) changes.push(`職稱 ${before.title} → ${after.title}`);
  if (before.email !== after.email) changes.push(`Email ${before.email} → ${after.email}`);
  if (before.hiredAt !== after.hiredAt) changes.push(`到職日 ${before.hiredAt} → ${after.hiredAt}`);
  const detail = changes.length === 0 ? "無欄位變更" : changes.join("、");
  return `更新員工 ${after.name}（${detail}）`;
}

export const handlers = [
  // ===== Auth =====
  http.post("/api/auth/login", async ({ request }) => {
    await withLatency();
    const body = (await request.json()) as { username?: string; password?: string };
    const user = db.users.find(
      (u) => u.username === body.username && u.password === body.password
    );
    if (!user) {
      return HttpResponse.json({ message: "帳號或密碼錯誤" }, { status: 401 });
    }
    appendLog(request, {
      actor: { id: user.id, name: user.name },
      action: "auth.login",
      resource: "auth",
      targetId: user.id,
      targetLabel: user.name,
      summary: `${user.name} 登入系統`,
    });
    return HttpResponse.json({
      token: `fake-jwt-${user.role}-${user.id}`,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  }),

  http.post("/api/auth/logout", async ({ request }) => {
    await withLatency();
    const actor = getActor(request);
    appendLog(request, {
      actor,
      action: "auth.logout",
      resource: "auth",
      targetId: actor.id === "system" ? null : actor.id,
      targetLabel: actor.name,
      summary: `${actor.name} 登出系統`,
    });
    return new HttpResponse(null, { status: 204 });
  }),

  // ===== Vehicles =====
  http.get("/api/vehicles", async () => {
    await withLatency();
    return HttpResponse.json(db.vehicles);
  }),

  http.post("/api/vehicles", async ({ request }) => {
    await withLatency();
    const body = (await request.json()) as Omit<Vehicle, "id">;
    if (db.vehicles.some((v) => v.plateNo === body.plateNo)) {
      return HttpResponse.json({ message: "車牌號碼已存在" }, { status: 400 });
    }
    const created: Vehicle = {
      id: newId("v"),
      plateNo: body.plateNo,
      brand: body.brand,
      model: body.model,
      year: body.year,
      status: body.status,
      assignedTo: body.assignedTo ?? null,
    };
    db.vehicles.push(created);
    persist();
    appendLog(request, {
      action: "vehicle.created",
      resource: "vehicle",
      targetId: created.id,
      targetLabel: created.plateNo,
      summary: `新增車輛 ${created.plateNo}`,
    });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put("/api/vehicles/:id", async ({ params, request }) => {
    await withLatency();
    const id = params.id as string;
    const body = (await request.json()) as Partial<Vehicle>;
    const idx = db.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "車輛不存在" }, { status: 404 });
    }
    if (
      body.plateNo &&
      db.vehicles.some((v) => v.plateNo === body.plateNo && v.id !== id)
    ) {
      return HttpResponse.json({ message: "車牌號碼已存在" }, { status: 400 });
    }
    const before = { ...db.vehicles[idx] };
    db.vehicles[idx] = { ...db.vehicles[idx], ...body, id };
    persist();
    const after = db.vehicles[idx];
    appendLog(request, {
      action: "vehicle.updated",
      resource: "vehicle",
      targetId: after.id,
      targetLabel: after.plateNo,
      summary: diffVehicleSummary(before, after),
    });
    return HttpResponse.json(after);
  }),

  http.delete("/api/vehicles/:id", async ({ params, request }) => {
    await withLatency();
    const id = params.id as string;
    const idx = db.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "車輛不存在" }, { status: 404 });
    }
    const removed = db.vehicles[idx];
    db.vehicles.splice(idx, 1);
    persist();
    appendLog(request, {
      action: "vehicle.deleted",
      resource: "vehicle",
      targetId: removed.id,
      targetLabel: removed.plateNo,
      summary: `刪除車輛 ${removed.plateNo}`,
    });
    return new HttpResponse(null, { status: 204 });
  }),

  // ===== Employees =====
  http.get("/api/employees", async () => {
    await withLatency();
    return HttpResponse.json(db.employees);
  }),

  http.post("/api/employees", async ({ request }) => {
    await withLatency();
    const body = (await request.json()) as Omit<Employee, "id">;
    const created: Employee = {
      id: newId("e"),
      name: body.name,
      department: body.department,
      title: body.title,
      email: body.email,
      hiredAt: body.hiredAt,
    };
    db.employees.push(created);
    persist();
    appendLog(request, {
      action: "employee.created",
      resource: "employee",
      targetId: created.id,
      targetLabel: created.name,
      summary: `新增員工 ${created.name}`,
    });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put("/api/employees/:id", async ({ params, request }) => {
    await withLatency();
    const id = params.id as string;
    const body = (await request.json()) as Partial<Employee>;
    const idx = db.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "員工不存在" }, { status: 404 });
    }
    const before = { ...db.employees[idx] };
    db.employees[idx] = { ...db.employees[idx], ...body, id };
    persist();
    const after = db.employees[idx];
    appendLog(request, {
      action: "employee.updated",
      resource: "employee",
      targetId: after.id,
      targetLabel: after.name,
      summary: diffEmployeeSummary(before, after),
    });
    return HttpResponse.json(after);
  }),

  http.delete("/api/employees/:id", async ({ params, request }) => {
    await withLatency();
    const id = params.id as string;
    const idx = db.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "員工不存在" }, { status: 404 });
    }
    const removed = db.employees[idx];
    db.employees.splice(idx, 1);
    const actor = getActor(request);
    const unassigned: Vehicle[] = [];
    db.vehicles.forEach((v) => {
      if (v.assignedTo === id) {
        v.assignedTo = null;
        unassigned.push(v);
      }
    });
    persist();
    appendLog(request, {
      actor,
      action: "employee.deleted",
      resource: "employee",
      targetId: removed.id,
      targetLabel: removed.name,
      summary: `刪除員工 ${removed.name}`,
    });
    unassigned.forEach((v) => {
      appendLog(request, {
        actor,
        action: "vehicle.unassigned",
        resource: "vehicle",
        targetId: v.id,
        targetLabel: v.plateNo,
        summary: `因員工 ${removed.name} 刪除而解除指派車輛 ${v.plateNo}`,
      });
    });
    return new HttpResponse(null, { status: 204 });
  }),

  // ===== Dashboard summary =====
  http.get("/api/dashboard/summary", async () => {
    await withLatency();
    const total = db.vehicles.length;
    const available = db.vehicles.filter((v) => v.status === "available").length;
    const inUse = db.vehicles.filter((v) => v.status === "in_use").length;
    const maintenance = db.vehicles.filter((v) => v.status === "maintenance").length;
    const monthlyUsageRate = total === 0 ? 0 : Math.round((inUse / total) * 100);

    return HttpResponse.json({
      totalVehicles: total,
      availableVehicles: available,
      totalEmployees: db.employees.length,
      monthlyUsageRate,
      vehicleStatusBreakdown: [
        { status: "available", count: available },
        { status: "in_use", count: inUse },
        { status: "maintenance", count: maintenance },
      ],
    });
  }),

  // ===== Activity logs =====
  http.get("/api/activity-logs", async ({ request }) => {
    await withLatency();
    const url = new URL(request.url);
    const actorId = url.searchParams.get("actorId") ?? undefined;
    const action = url.searchParams.get("action") ?? undefined;
    const resource = url.searchParams.get("resource") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;

    const rawPage = parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const rawPageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);
    const pageSize = Number.isFinite(rawPageSize)
      ? Math.min(100, Math.max(1, rawPageSize))
      : 20;

    const fromISO = from ? `${from}T00:00:00.000Z` : null;
    const toISO = to ? `${to}T23:59:59.999Z` : null;

    const filtered = db.activityLogs.filter((log) => {
      if (actorId && log.actorId !== actorId) return false;
      if (action && log.action !== action) return false;
      if (resource && log.resource !== resource) return false;
      if (fromISO && log.timestamp < fromISO) return false;
      if (toISO && log.timestamp > toISO) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) =>
      a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0
    );
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    return HttpResponse.json({ items, total, page, pageSize });
  }),
];
