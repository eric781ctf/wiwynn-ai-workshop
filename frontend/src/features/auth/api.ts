import { api } from "@/lib/api-client";

export type Role = "admin" | "user";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function login(username: string, password: string) {
  return api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export function logout() {
  return api<void>("/api/auth/logout", { method: "POST" });
}
