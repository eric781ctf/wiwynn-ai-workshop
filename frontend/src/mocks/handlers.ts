import { http, HttpResponse, delay } from "msw";
import { db, persist, newId, type Vehicle, type Employee } from "./db";

const SIMULATED_LATENCY_MS = 250;

async function withLatency() {
  await delay(SIMULATED_LATENCY_MS);
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
    return HttpResponse.json({
      token: `fake-jwt-${user.role}-${user.id}`,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  }),

  http.post("/api/auth/logout", async () => {
    await withLatency();
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
    db.vehicles[idx] = { ...db.vehicles[idx], ...body, id };
    persist();
    return HttpResponse.json(db.vehicles[idx]);
  }),

  http.delete("/api/vehicles/:id", async ({ params }) => {
    await withLatency();
    const id = params.id as string;
    const idx = db.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "車輛不存在" }, { status: 404 });
    }
    db.vehicles.splice(idx, 1);
    persist();
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
    db.employees[idx] = { ...db.employees[idx], ...body, id };
    persist();
    return HttpResponse.json(db.employees[idx]);
  }),

  http.delete("/api/employees/:id", async ({ params }) => {
    await withLatency();
    const id = params.id as string;
    const idx = db.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "員工不存在" }, { status: 404 });
    }
    db.employees.splice(idx, 1);
    // 解除被刪員工被指派的車輛
    db.vehicles.forEach((v) => {
      if (v.assignedTo === id) v.assignedTo = null;
    });
    persist();
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
];
